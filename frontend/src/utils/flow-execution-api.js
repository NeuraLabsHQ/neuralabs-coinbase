/**
 * WebSocket API for streaming flow execution
 * Connects to NeuraLabs backend which acts as intermediary to HPC execution engine
 */
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8001';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

export class FlowExecutionAPI {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to the flow execution WebSocket
   * @param {string} agentId - The agent ID to execute
   * @param {string} userId - The user ID for authentication
   * @param {string} message - Initial message/prompt for the flow
   * @param {Object} options - Additional options
   */
  async connect(agentId, userId, message = '', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${WS_BASE_URL}/api/chat/execute/${agentId}`;
        console.log('Connecting to WebSocket:', wsUrl);
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          
          // Send initial data
          const initialData = {
            user_id: userId,
            message: message,
            initial_inputs: options.initialInputs || {},
            ...options
          };
          
          this.websocket.send(JSON.stringify(initialData));
          resolve();
        };
        
        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };
        
        this.websocket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected', { code: event.code, reason: event.reason });
        };
        
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} data - The parsed message data
   */
  handleMessage(data) {
    const { type, data: eventData } = data;
    
    console.log('Received message:', type, eventData);
    
    switch (type) {
      case 'status':
        this.emit('status', eventData);
        break;
      case 'error':
        this.emit('error', eventData);
        break;
      case 'flow_started':
        this.emit('flowStarted', eventData);
        break;
      case 'element_started':
        this.emit('elementStarted', eventData);
        break;
      case 'processing':
        this.emit('processing', eventData);
        break;
      case 'llm_prompt':
        this.emit('llmPrompt', eventData);
        break;
      case 'llm_chunk':
        this.emit('llmChunk', eventData);
        break;
      case 'element_completed':
        this.emit('elementCompleted', eventData);
        break;
      case 'final_output':
        this.emit('finalOutput', eventData);
        break;
      case 'flow_completed':
        this.emit('flowCompleted', eventData);
        break;
      case 'flow_error':
        this.emit('flowError', eventData);
        break;
      default:
        console.log('Unknown message type:', type, eventData);
        this.emit('unknown', { type, data: eventData });
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Send message to the WebSocket
   * @param {Object} data - Data to send
   */
  send(data) {
    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   * @returns {boolean} - Whether the WebSocket is connected
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

/**
 * Hook for using flow execution in React components
 * @param {string} agentId - The agent ID
 * @returns {Object} - Flow execution utilities
 */
export const useFlowExecution = (agentId) => {
  const [api] = useState(() => new FlowExecutionAPI());
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  
  // Chat streaming states
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  
  useEffect(() => {
    // Set up event listeners
    api.on('status', (data) => {
      setStatus(data.message || '');
    });
    
    api.on('error', (data) => {
      setError(data.error || 'Unknown error');
      setIsExecuting(false);
    });
    
    api.on('flowStarted', () => {
      setIsExecuting(true);
      setError(null);
    });
    
    api.on('llmChunk', (data) => {
      setCurrentResponse(prev => prev + (data.content || ''));
    });
    
    api.on('finalOutput', (data) => {
      const response = data.text_output || currentResponse;
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }]);
      setCurrentResponse('');
    });
    
    api.on('flowCompleted', () => {
      setIsExecuting(false);
      setStatus('Flow completed successfully');
    });
    
    api.on('flowError', (data) => {
      setError(data.error || 'Flow execution error');
      setIsExecuting(false);
    });
    
    api.on('disconnected', () => {
      setIsConnected(false);
      setIsExecuting(false);
    });
    
    return () => {
      api.disconnect();
    };
  }, [api, currentResponse]);
  
  const executeFlow = async (userId, message, options = {}) => {
    try {
      setError(null);
      setStatus('Connecting...');
      
      // Add user message to chat
      setMessages(prev => [...prev, {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }]);
      
      await api.connect(agentId, userId, message, options);
      setIsConnected(true);
      
    } catch (error) {
      console.error('Error executing flow:', error);
      setError(error.message || 'Failed to execute flow');
      setIsExecuting(false);
    }
  };
  
  const disconnect = () => {
    api.disconnect();
    setIsConnected(false);
    setIsExecuting(false);
  };
  
  return {
    executeFlow,
    disconnect,
    isConnected,
    isExecuting,
    error,
    status,
    messages,
    currentResponse,
    clearMessages: () => setMessages([]),
    clearError: () => setError(null)
  };
};

