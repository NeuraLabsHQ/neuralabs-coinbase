import { Flex, useColorMode, useDisclosure } from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import simpleAiFlow from '../../../utils/simple-ai-flow.json';
import useUiColors from '../../../utils/uiColors';
import ChatHistoryPanel from '../ChatHistoryPanel/ChatHistoryPanel';
import ChatInterface from '../ChatInterface';

const ChatPage = () => {
  const colors = useUiColors();
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isLanding, setIsLanding] = useState(true);
  
  const [thinkingState, setThinkingState] = useState({
    isThinking: false,
    steps: [],
    currentStep: null,
    searchResults: [],
    timeElapsed: 0,
    onTypingComplete: null, // Explicitly add callback to state
    executionSteps: [] // New field for backend execution steps
  });
  
  // Store thinking states for each message
  const [messageThinkingStates, setMessageThinkingStates] = useState({});
  const [activeMessageId, setActiveMessageId] = useState(null);
  
  const websocketRef = useRef(null);
  const timerRef = useRef(null);
  const streamBufferRef = useRef('');
  const messageStreamBuffers = useRef({});

  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const { colorMode, toggleColorMode } = useColorMode();
  
  useEffect(() => {
    const initialChats = [
      { id: '1', title: 'Welcome to Neural Chat' },
      { id: '2', title: 'Travel Planning' },
      { id: '3', title: 'Code Review Help' },
      { id: '4', title: 'Research on Machine Learning' },
    ];
    setChats(initialChats);
  }, []);

  // Cleanup function for WebSocket
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const connectToBackend = (flowId, flowDefinition, initialInputs, messageId) => {
    console.log('Connecting to backend with flow:', flowId);
    console.log('Flow definition:', flowDefinition);
    console.log('Initial inputs:', initialInputs);
    console.log('Message ID:', messageId);
    
    // Set active message ID
    setActiveMessageId(messageId);
    
    // Initialize thinking state for this specific message
    const initialThinkingState = {
      isThinking: true,
      steps: [],
      currentStep: null,
      searchResults: [],
      timeElapsed: 0,
      onTypingComplete: null,
      executionSteps: [],
      messageId: messageId
    };
    
    console.log('Setting initial thinking state for message:', messageId);
    
    // Update both current and message-specific thinking state
    setThinkingState(initialThinkingState);
    setMessageThinkingStates(prev => {
      const newState = {
        ...prev,
        [messageId]: initialThinkingState
      };
      console.log('New message thinking states:', newState);
      return newState;
    });

    // Clear stream buffer and initialize message-specific buffer
    streamBufferRef.current = '';
    messageStreamBuffers.current[messageId] = '';

    // Start timer for this specific message
    timerRef.current = setInterval(() => {
      // Only update the active message's time
      setMessageThinkingStates(prev => {
        if (!prev[messageId]) return prev;
        
        return {
          ...prev,
          [messageId]: {
            ...prev[messageId],
            timeElapsed: (prev[messageId].timeElapsed || 0) + 1
          }
        };
      });
      
      // Also update current state if this is the active message
      setThinkingState(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1
      }));
    }, 1000);

    // Connect to WebSocket using environment variable
    const baseUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8000';
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + `/ws/execute/${flowId}`;
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;
    
    // Store the message ID this WebSocket is handling
    ws.messageId = messageId;

    ws.onopen = () => {
      console.log('✅ WebSocket connected to backend');
    };

    ws.onmessage = (event) => {
      console.log('📨 WebSocket message received:', event.data);
      const message = JSON.parse(event.data);
      
      if (message.status === 'ready') {
        console.log('→ Sending flow definition');
        ws.send(JSON.stringify(flowDefinition));
      } else if (message.status === 'received_flow') {
        console.log('→ Sending initial inputs');
        ws.send(JSON.stringify(initialInputs));
      } else if (message.status === 'received_inputs') {
        console.log('→ Sending config (null)');
        ws.send('null');
      } else if (message.type) {
        console.log('→ Handling execution event:', message.type, 'for message:', messageId);
        handleExecutionEvent(message, messageId);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      // Stop thinking UI on error
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setThinkingState(prev => ({
        ...prev,
        isThinking: false
      }));
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect to the backend server. Please make sure the HPC execution backend is running on port 8000.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      // If connection was not established properly, it might be because backend is not running
      if (event.code === 1006) {
        console.error('WebSocket connection failed. Is the backend running on port 8000?');
      }
    };
  };

  const handleExecutionEvent = (event, messageId) => {
    const { type, data } = event;

    // Update function that updates both current state and message-specific state
    const updateStates = (updater) => {
      console.log('Updating states for message:', messageId, 'event type:', type);
      setThinkingState(updater);
      if (messageId) {
        setMessageThinkingStates(prev => {
          const currentState = prev[messageId] || {};
          const newState = updater(currentState);
          console.log('Message state update:', messageId, 'new state:', newState);
          return {
            ...prev,
            [messageId]: newState
          };
        });
      }
    };

    // Handle any type of event generically
    if (type === 'element_started') {
      // Add a new step when an element starts
      updateStates(prev => ({
        ...prev,
        executionSteps: [...(prev.executionSteps || []), {
          elementId: data.element_id,
          elementName: data.element_name || data.element_id,
          elementType: data.element_type,
          description: data.description || `Processing ${data.element_name || data.element_id}`,
          status: 'running',
          outputs: {},
          backtracking: data.backtracking || false,
          executionTime: null
        }]
      }));
    } else if (type === 'element_completed') {
      // Update the step when it completes
      updateStates(prev => ({
        ...prev,
        executionSteps: (prev.executionSteps || []).map(step =>
          step.elementId === data.element_id
            ? {
                ...step,
                status: 'completed',
                outputs: data.outputs || {},
                executionTime: data.execution_time || null,
                description: data.description || step.description
              }
            : step
        )
      }));
    } else if (type === 'llm_chunk') {
      // Accumulate LLM chunks in message-specific buffer
      if (data.content && messageId) {
        messageStreamBuffers.current[messageId] = (messageStreamBuffers.current[messageId] || '') + data.content;
        console.log('LLM chunk for message:', messageId, 'total length:', messageStreamBuffers.current[messageId].length);
      }
    } else if (type === 'final_output') {
      // Extract answer from final output using message-specific buffer
      const messageBuffer = messageStreamBuffers.current[messageId] || '';
      const finalText = data.text_output || messageBuffer;
      console.log('Final output for message:', messageId, 'using buffer:', finalText.substring(0, 100) + '...');
      
      const answerMatch = finalText.match(/<answer>([\s\S]*?)<\/answer>/);
      
      if (answerMatch) {
        const answerContent = answerMatch[1].trim();
        
        // Add assistant message
        const assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: answerContent,
          timestamp: new Date(),
          parentMessageId: messageId // Link to the user message
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (finalText) {
        // If no answer tags, use the entire text
        const assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: finalText,
          timestamp: new Date(),
          parentMessageId: messageId // Link to the user message
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } else if (type === 'flow_completed' || type === 'flow_error') {
      // Stop timer and thinking UI for flow completion or error
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Update thinking state
      updateStates(prev => ({
        ...prev,
        isThinking: false
      }));

      // Clear stream buffers
      streamBufferRef.current = '';
      if (messageId && messageStreamBuffers.current[messageId]) {
        delete messageStreamBuffers.current[messageId];
      }
      
      // Close WebSocket
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      
      // Clear active message ID
      setActiveMessageId(null);
      
      if (type === 'flow_error') {
        console.error('Flow error:', data.error || 'Unknown error');
      }
    }
    // For any other event types, we can add them to execution steps if needed
    else if (data && type !== 'flow_started') {
      // Optionally log or handle other event types
      console.log('Received event:', type, data);
    }
  };

  const simulateThinking = (query, _modelId, messageId) => {
    console.log('🚀 simulateThinking called with query:', query);
    console.log('📋 Message ID for thinking:', messageId);
    
    // Use the imported flow definition
    const flowDefinition = simpleAiFlow.flow_definition;
    
    // Create initial inputs with the current query and conversation history
    const initialInputs = {
      chat_input: {
        chat_input: query
      },
      context_history: {
        context_history: messages
          .filter(m => m.role !== 'system')
          .slice(-5) // Keep last 5 messages for context
          .map(m => `${m.role}: ${m.content}`)
      }
    };

    console.log('📋 Flow ID:', simpleAiFlow.flow_id);
    console.log('📋 Messages for context:', messages.length);
    
    // Connect to backend with message ID
    connectToBackend(simpleAiFlow.flow_id, flowDefinition, initialInputs, messageId);
  };


  const handleNewChat = () => {
    setIsLanding(true);
    setSelectedChatId(null);
    setMessages([]);
  };

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
    setIsLanding(false);

    if (chatId === '1') {
      setMessages([
        { id: '1', role: 'assistant', content: 'Hello! Welcome to Neural Chat. How can I assist you today?', timestamp: new Date() },
      ]);
    } else if (chatId === '2') {
      setMessages([
        { id: '1', role: 'assistant', content: 'Hello! Where would you like to travel to?', timestamp: new Date(Date.now() - 86400000) },
        { id: '2', role: 'user', content: 'I\'m thinking about going to Japan next spring.', timestamp: new Date(Date.now() - 86300000) },
        { id: '3', role: 'assistant', content: 'Japan in spring is beautiful, especially during cherry blossom season! Would you like some recommendations for places to visit?', timestamp: new Date(Date.now() - 86200000) },
      ]);
    } else if (chatId === '3') {
      setMessages([
        { id: '1', role: 'assistant', content: 'Hi there! I\'d be happy to help with code review. What code would you like me to look at?', timestamp: new Date(Date.now() - 172800000) },
        { id: '2', role: 'user', content: 'I\'m having trouble with a React component that\'s not rendering properly.', model: 'coder', timestamp: new Date(Date.now() - 172700000) },
        { id: '3', role: 'assistant', content: 'I\'d be happy to help. Could you share the component code?', timestamp: new Date(Date.now() - 172600000) },
      ]);
    } else {
      setMessages([
        { id: '1', role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date() },
      ]);
    }
  };

  const handleDeleteChat = (chatId) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setIsLanding(true);
      setSelectedChatId(null);
      setMessages([]);
    }
  };

  const handleEditChatTitle = (chatId, title) => {
    setChats(chats.map(chat => chat.id === chatId ? { ...chat, title } : chat));
    setEditingChatId(null);
  };

  const handleSendMessage = (content, modelId) => {
    // First, close any existing WebSocket connection and stop thinking UI
    if (websocketRef.current) {
      console.log('Closing existing WebSocket connection');
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clear all stream buffers
    streamBufferRef.current = '';
    Object.keys(messageStreamBuffers.current).forEach(key => {
      delete messageStreamBuffers.current[key];
    });
    
    // Reset thinking state and clear active message
    setActiveMessageId(null);
    setThinkingState({
      isThinking: false,
      steps: [],
      currentStep: null,
      searchResults: [],
      timeElapsed: 0,
      onTypingComplete: null,
      executionSteps: []
    });
    
    if (isLanding) {
      const newChatId = Date.now().toString();
      const truncatedTitle = content.length > 30 ? content.substring(0, 27) + '...' : content;
      const newChat = { id: newChatId, title: truncatedTitle };
      setChats([newChat, ...chats]);
      setSelectedChatId(newChatId);
      setIsLanding(false);
    }

    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content,
      model: modelId,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Small delay to ensure WebSocket is fully closed before starting new connection
    setTimeout(() => {
      // Always call the backend for every user input with the message ID
      simulateThinking(content, modelId, userMessageId);
    }, 100);
  };

  return (
    <Flex h="100%" w="100%" overflow="hidden" bg={colors.bgPrimary}>
      <ChatHistoryPanel
        isOpen={isOpen}
        chats={chats}
        selectedChatId={selectedChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onEditChatTitle={handleEditChatTitle}
        onToggleSidebar={onToggle}
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
      />
      <Flex flex="1" direction="column" h="100%" position="relative" justifyContent="center">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLanding={isLanding}
          thinkingState={thinkingState}
          messageThinkingStates={messageThinkingStates}
          onToggleColorMode={toggleColorMode}
        />
      </Flex>
    </Flex>
  );
};

export default ChatPage;