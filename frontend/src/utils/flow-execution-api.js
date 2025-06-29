/**
 * WebSocket API for streaming flow execution
 * Connects to NeuraLabs backend which acts as intermediary to HPC execution engine
 */
import { useState, useEffect } from 'react';
import { createX402WalletClient } from './x402-payment-handler';
import { withPaymentInterceptor, decodeXPaymentResponse } from 'x402-axios';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
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
    // First, initiate payment flow via HTTP
    try {
      // Get private key from session storage
      const privateKey = sessionStorage.getItem('agent_private_key');
      console.log('Agent private key from sessionStorage:', privateKey ? 'Found' : 'Not found');
      
      if (!privateKey) {
        // Log what's in sessionStorage for debugging
        console.log('SessionStorage contents:');
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          console.log(`  ${key}: ${key.includes('private') ? '***' : sessionStorage.getItem(key)}`);
        }
        throw new Error('Agent wallet private key not found. Please reconnect your wallet.');
      }
      
      // Create x402-compatible wallet client
      const walletClient = createX402WalletClient(privateKey);
      console.log('Created wallet client for address:', walletClient.account.address);
      
      // Get auth token from sessionStorage
      const authToken = sessionStorage.getItem('wallet_auth_token');
      
      // Create axios instance with auth header
      const axiosInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Add payment interceptor
      console.log('Adding payment interceptor...');
      
      // Use withPaymentInterceptor exactly like the x402-pay example
      const x402Client = withPaymentInterceptor(axiosInstance, walletClient);
      console.log('Payment interceptor added successfully');
      
      // Add request/response interceptors for debugging
      x402Client.interceptors.request.use(
        (config) => {
          console.log('x402 Request:', config.method?.toUpperCase(), config.url);
          console.log('x402 Request headers:', config.headers);
          return config;
        },
        (error) => {
          console.error('x402 Request error:', error);
          return Promise.reject(error);
        }
      );
      
      x402Client.interceptors.response.use(
        (response) => {
          console.log('x402 Response:', response.status, response.statusText);
          console.log('x402 Response headers:', response.headers);
          console.log('x402 Response data:', response.data);
          
          // Log all headers to see what x402 returns
          if (response.headers) {
            const allHeaders = {};
            // Different ways to access headers depending on axios version
            if (typeof response.headers.entries === 'function') {
              for (const [key, value] of response.headers.entries()) {
                allHeaders[key] = value;
              }
            } else if (typeof response.headers === 'object') {
              Object.keys(response.headers).forEach(key => {
                allHeaders[key] = response.headers[key];
              });
            }
            console.log('All response headers:', allHeaders);
          }
          
          return response;
        },
        (error) => {
          console.log('x402 Response error:', error.response?.status, error.response?.statusText);
          console.log('x402 Error response headers:', error.response?.headers);
          console.log('x402 Error response data:', error.response?.data);
          
          // Log 402 payment required details
          if (error.response?.status === 402) {
            console.log('402 Payment Required - Full error:', error);
            console.log('402 Payment Required - Headers:', error.response.headers);
            console.log('402 Payment Required - Data:', error.response.data);
            
            // Log the actual payment requirements
            if (error.response.data) {
              console.log('402 Payment Requirements:', JSON.stringify(error.response.data, null, 2));
            }
            
            const paymentHeaders = {};
            if (error.response.headers) {
              Object.keys(error.response.headers).forEach(key => {
                if (key.toLowerCase().startsWith('x-payment-')) {
                  paymentHeaders[key] = error.response.headers[key];
                }
              });
            }
            console.log('402 Payment headers:', paymentHeaders);
          }
          
          // Don't reject here, let x402-axios handle the 402
          return Promise.reject(error);
        }
      );
      
      // Emit payment required status
      this.emit('status', { message: 'Initiating payment...' });
      this.emit('paymentRequired', { amount: '0.01', currency: 'USDC' });
      
      // Make initial HTTP request to initiate chat
      // x402-axios will automatically handle 402 responses and payment signing
      let sessionData;
      try {
        console.log('Making request to:', `/api/chat/initiate/${agentId}`);
        console.log('x402Client before post:', x402Client);
        console.log('x402Client.post type:', typeof x402Client.post);
        
        const response = await x402Client.post(
          `/api/chat/initiate/${agentId}`,
          {}
        );
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Decode payment details from x-payment-response header
        let paymentDetails = null;
        let transactionHash = '';
        
        // Try different case variations of the header
        const paymentResponseHeader = response.headers['x-payment-response'] || 
                                    response.headers['X-Payment-Response'] ||
                                    response.headers['x-Payment-Response'];
        console.log('Payment response header:', paymentResponseHeader);
        
        // Also log all headers that start with payment
        const paymentRelatedHeaders = {};
        Object.keys(response.headers).forEach(key => {
          if (key.toLowerCase().includes('payment')) {
            paymentRelatedHeaders[key] = response.headers[key];
          }
        });
        console.log('All payment-related headers:', paymentRelatedHeaders);
        
        if (paymentResponseHeader) {
          try {
            paymentDetails = decodeXPaymentResponse(paymentResponseHeader);
            console.log('Decoded payment details:', paymentDetails);
            // Extract transaction hash from payment details
            transactionHash = paymentDetails?.transaction || paymentDetails?.txHash || paymentDetails?.transactionHash || '';
          } catch (err) {
            console.warn('Failed to decode payment response:', err);
          }
        }
        
        sessionData = response.data;
        console.log('Payment verified:', sessionData);
        
        // Get transaction hash from payment details or response data
        if (!transactionHash) {
          transactionHash = sessionData.transaction_hash || '';
        }
        
        this.emit('paymentVerified', {
          sessionId: sessionData.session_id,
          transactionHash: transactionHash,
          paymentDetails: paymentDetails
        });
        
        // Store session info
        this.sessionId = sessionData.session_id;
        this.transactionHash = transactionHash;
        
      } catch (error) {
        console.error('Error during payment request:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.response && error.response.status === 402) {
          // This shouldn't happen as x402-axios should handle it
          throw new Error('Payment required but not handled by x402-axios');
        }
        throw error;
      }
      
      // Connect to WebSocket
      return new Promise((resolve, reject) => {
        try {
          const wsUrl = `${WS_BASE_URL}/api/chat/execute/${agentId}`;
          console.log('Connecting to WebSocket:', wsUrl);
          
          this.websocket = new WebSocket(wsUrl);
          
          this.websocket.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            
            // Send initial data with session ID if available
            const initialData = {
              user_id: userId,
              message: message,
              initial_inputs: options.initialInputs || {},
              session_id: this.sessionId,
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
    } catch (error) {
      console.error('Error in payment flow:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
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
  
  // Payment states
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  
  useEffect(() => {
    // Set up event listeners
    api.on('status', (data) => {
      setStatus(data.message || '');
    });
    
    api.on('error', (data) => {
      setError(data.error || 'Unknown error');
      setIsExecuting(false);
    });
    
    api.on('paymentRequired', (data) => {
      setIsPaymentRequired(true);
      setPaymentInfo(data);
    });
    
    api.on('paymentVerified', (data) => {
      setIsPaymentRequired(false);
      setIsPaymentVerified(true);
      setPaymentInfo(prev => ({ ...prev, ...data }));
    });
    
    api.on('payment_info', (data) => {
      setPaymentInfo(prev => ({ ...prev, ...data.data }));
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
    clearError: () => setError(null),
    // Payment states
    paymentInfo,
    isPaymentRequired,
    isPaymentVerified
  };
};

