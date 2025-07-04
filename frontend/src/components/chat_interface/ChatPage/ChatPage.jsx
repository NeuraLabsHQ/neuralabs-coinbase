import { Flex, useColorMode, useDisclosure, IconButton, Box, useBreakpointValue, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, useToast } from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import { FiList, FiSearch, FiMessageCircle } from 'react-icons/fi';
import { useWallet } from '../../../contexts/WalletContextProvider';
import useUiColors from '../../../utils/uiColors';
import ChatHistoryPanel from '../ChatHistoryPanel/ChatHistoryPanel';
import ChatInterface from '../ChatInterface';
import SearchModal from '../SearchModal/SearchModal';
import chatService from '../../../services/chatServiceV2';
import { FlowExecutionAPI } from '../../../utils/flow-execution-api';

const ChatPage = () => {
  const colors = useUiColors();
  
  // Wallet context
  const { address: walletAddress } = useWallet();
  
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isLanding, setIsLanding] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const toast = useToast();
  
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
  const [messageTransactions, setMessageTransactions] = useState({});
  
  const websocketRef = useRef(null);
  const timerRef = useRef(null);
  const streamBufferRef = useRef('');
  const messageStreamBuffers = useRef({});

  const { isOpen, onToggle, onClose } = useDisclosure({ defaultIsOpen: false });
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const { toggleColorMode } = useColorMode();
  
  // Responsive values
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const drawerPlacement = useBreakpointValue({ base: 'bottom', lg: 'left' });
  const drawerSize = useBreakpointValue({ base: 'sm', lg: 'xs' });
  
  // Add loading state to prevent layout flash
  const [isBreakpointReady, setIsBreakpointReady] = useState(false);
  
  useEffect(() => {
    // Set ready state once breakpoint value is determined
    if (isMobile !== undefined) {
      setIsBreakpointReady(true);
    }
  }, [isMobile]);
  
  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [walletAddress]);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchOpen]);

  const loadConversations = async () => {
    try {
      setIsLoadingChats(true);
      const conversations = await chatService.getConversations();
      setChats(conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Don't show error toast if it's just an auth issue (user not logged in)
      if (!error.message.includes('401') && !error.message.includes('Unauthorized')) {
        toast({
          title: 'Error loading conversations',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Cleanup function for WebSocket
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        // Check if it's a FlowExecutionAPI instance or WebSocket
        if (websocketRef.current.disconnect) {
          websocketRef.current.disconnect();
        } else if (websocketRef.current.close) {
          websocketRef.current.close();
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const connectToBackend = async (agentId, userMessage, messageId) => {
    console.log('Connecting to NeuraLabs backend with agent:', agentId);
    console.log('User message:', userMessage);
    console.log('Message ID:', messageId);
    console.log('Wallet address:', walletAddress || 'anonymous');
    
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

    // Create FlowExecutionAPI instance
    const flowApi = new FlowExecutionAPI();
    
    // Store the API instance and message ID
    websocketRef.current = flowApi;
    flowApi.messageId = messageId;
    
    // Set up event listeners
    flowApi.on('status', (data) => {
      console.log('→ Handling execution event: status for message:', messageId);
      handleExecutionEvent({ type: 'status', data }, messageId);
    });
    
    flowApi.on('error', (data) => {
      console.log('→ Handling execution event: error for message:', messageId);
      handleExecutionEvent({ type: 'error', data }, messageId);
      
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
        content: data.error || 'Sorry, an error occurred while processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    });
    
    flowApi.on('paymentRequired', (data) => {
      console.log('→ Payment required for message:', messageId);
      handleExecutionEvent({ type: 'paymentRequired', data }, messageId);
    });
    
    flowApi.on('paymentVerified', (data) => {
      console.log('→ Payment verified for message:', messageId);
      handleExecutionEvent({ type: 'paymentVerified', data }, messageId);
    });
    
    flowApi.on('flowStarted', (data) => {
      console.log('→ Handling execution event: flow_started for message:', messageId);
      handleExecutionEvent({ type: 'flow_started', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('elementStarted', (data) => {
      console.log('→ Handling execution event: element_started for message:', messageId);
      handleExecutionEvent({ type: 'element_started', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('processing', (data) => {
      console.log('→ Handling execution event: processing for message:', messageId);
      handleExecutionEvent({ type: 'processing', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('elementCompleted', (data) => {
      console.log('→ Handling execution event: element_completed for message:', messageId);
      handleExecutionEvent({ type: 'element_completed', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('llmPrompt', (data) => {
      console.log('→ Handling execution event: llm_prompt for message:', messageId);
      handleExecutionEvent({ type: 'llm_prompt', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('llmChunk', (data) => {
      console.log('→ Handling execution event: llm_chunk for message:', messageId);
      // Accumulate chunks in the message-specific buffer
      if (!messageStreamBuffers.current[messageId]) {
        messageStreamBuffers.current[messageId] = '';
      }
      messageStreamBuffers.current[messageId] += data.content || '';
      
      // Also update global buffer if this is the active message
      if (messageId === activeMessageId) {
        streamBufferRef.current += data.content || '';
      }
    });
    
    flowApi.on('finalOutput', (data) => {
      console.log('→ Handling execution event: final_output for message:', messageId);
      handleExecutionEvent({ type: 'final_output', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('flowCompleted', (data) => {
      console.log('→ Handling execution event: flow_completed for message:', messageId);
      handleExecutionEvent({ type: 'flow_completed', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('flowError', (data) => {
      console.log('→ Handling execution event: flow_error for message:', messageId);
      handleExecutionEvent({ type: 'flow_error', timestamp: Date.now() / 1000, data }, messageId);
    });
    
    flowApi.on('disconnected', (data) => {
      console.log('🔌 WebSocket closed:', data.code, data.reason);
    });
    
    // Get conversation history for this chat (excluding the current message)
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: {
        message_id: msg.id,
        model: msg.model || null
      }
    }));
    
    try {
      // Connect with payment flow
      await flowApi.connect(
        agentId,
        walletAddress || 'anonymous',
        userMessage,
        {
          conversation_history: conversationHistory
        }
      );
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      handleExecutionEvent({ type: 'error', data: { error: error.message } }, messageId);
    }
  };

  const handleExecutionEvent = async (event, messageId) => {
    const { type, data } = event;

    // Update function that updates both current state and message-specific state
    const updateStates = (updater) => {
      console.log('Updating states for message:', messageId, 'event type:', type);
      console.log('Current messageThinkingStates keys:', Object.keys(messageThinkingStates));
      setThinkingState(updater);
      if (messageId) {
        setMessageThinkingStates(prev => {
          const currentState = prev[messageId] || {};
          const newState = updater(currentState);
          console.log('Message state update:', messageId, 'new state:', newState);
          return {
            ...prev,
            [messageId]: { ...newState, messageId } // Ensure messageId is stored
          };
        });
      }
    };

    // Handle payment events
    if (type === 'paymentRequired') {
      // Add payment required step
      updateStates(prev => ({
        ...prev,
        executionSteps: [...(prev.executionSteps || []), {
          elementId: 'payment_required',
          elementName: 'Payment Required',
          elementType: 'payment',
          description: `Payment of ${data.amount || '0.01'} ${data.currency || 'USDC'} required`,
          status: 'running',
          outputs: { amount: data.amount, currency: data.currency },
          backtracking: false,
          executionTime: null
        }]
      }));
    } else if (type === 'paymentVerified' || type === 'payment_info') {
      // Extract payment details from the data
      const paymentInfo = data.paymentDetails || {};
      
      // Update payment step to completed with all payment details
      updateStates(prev => ({
        ...prev,
        executionSteps: (prev.executionSteps || []).map(step =>
          step.elementId === 'payment_required'
            ? {
                ...step,
                elementName: 'Payment Verified',
                status: 'completed',
                outputs: { 
                  ...step.outputs, 
                  transactionHash: data.transactionHash || data.transaction_hash || paymentInfo.transaction,
                  sessionId: data.sessionId,
                  amount: step.outputs.amount || '0.01',
                  currency: step.outputs.currency || 'USDC',
                  network: paymentInfo.network || 'base-sepolia',
                  timestamp: new Date().toISOString()
                },
                description: 'Payment verified successfully'
              }
            : step
        )
      }));
    }
    // Handle any type of event generically
    else if (type === 'element_started') {
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
      
      
      // First check for </think> tag and extract content after it
      let processedContent = finalText;
      const thinkEndMatch = finalText.match(/<\/think>\s*([\s\S]*)/);
      if (thinkEndMatch) {
        processedContent = thinkEndMatch[1].trim();
        console.log('Extracted content after </think>:', processedContent);
      }
      
      // Then check for answer tags in the processed content
      const answerMatch = processedContent.match(/<answer>([\s\S]*?)<\/answer>/);
      
      if (answerMatch || processedContent) {
        const answerContent = answerMatch ? answerMatch[1].trim() : processedContent;
        
        // Add assistant message
        const assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: answerContent,
          timestamp: new Date(),
          parentMessageId: messageId // Link to the user message
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save assistant message and thinking state to database
        const conversationId = simulateThinking.conversationId;
        if (conversationId) {
          try {
            // Get the final thinking state for this message
            const thinkingState = messageThinkingStates[messageId] || null;
            
            // Check for any proposed transaction in the execution steps
            let proposedTransaction = null;
            const endBlockWithTransaction = (thinkingState?.executionSteps || []).find(step => 
              step.elementType === 'end' && 
              step.status === 'completed' && 
              step.outputs?.proposed_transaction
            );
            
            if (endBlockWithTransaction) {
              proposedTransaction = endBlockWithTransaction.outputs.proposed_transaction;
            }
            
            const savedAssistantMessage = await chatService.addMessage(conversationId, {
              role: 'assistant',
              content: answerContent,
              parentMessageId: messageId,
              transaction: proposedTransaction
            });
            
            // If there's a proposed transaction, update the messageTransactions state
            if (proposedTransaction && savedAssistantMessage) {
              setMessageTransactions(prev => ({
                ...prev,
                [savedAssistantMessage.id]: proposedTransaction
              }));
            }
            
            // Also check if there's a transaction temporarily stored with the user message
            const userTransaction = messageTransactions[messageId];
            if (userTransaction && savedAssistantMessage) {
              setMessageTransactions(prev => ({
                ...prev,
                [savedAssistantMessage.id]: userTransaction,
                [messageId]: undefined // Clear it from the user message
              }));
            }
            
            // Update the message with the server-generated ID
            const tempAssistantId = assistantMessage.id;
            setMessages(prev => prev.map(msg => 
              msg.id === tempAssistantId ? { ...msg, id: savedAssistantMessage.id } : msg
            ));
            
            // Transfer any transaction from temp ID to permanent ID
            setMessageTransactions(prev => {
              const newTransactions = { ...prev };
              if (newTransactions[tempAssistantId]) {
                newTransactions[savedAssistantMessage.id] = newTransactions[tempAssistantId];
                delete newTransactions[tempAssistantId];
              }
              return newTransactions;
            });
            
            // If there's a proposed transaction, associate it with the saved message
            if (proposedTransaction) {
              handleTransactionDetected(savedAssistantMessage.id, proposedTransaction);
            }
            
          } catch (error) {
            console.error('Error saving assistant message:', error);
            // Continue even if save fails
          }
        }
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

      // Save the final thinking state to the user message
      const conversationId = simulateThinking.conversationId;
      if (conversationId && messageId) {
        console.log('Saving final thinking state for message:', messageId);
        
        // Small delay to ensure state updates are complete
        setTimeout(async () => {
          try {
            // Get the final thinking state for this message
            setMessageThinkingStates(prev => {
              const finalThinkingState = prev[messageId];
              console.log('All thinking states:', prev);
              console.log('Final thinking state for', messageId, ':', finalThinkingState);
              
              if (finalThinkingState && finalThinkingState.executionSteps && finalThinkingState.executionSteps.length > 0) {
                // Update the user message with thinking state
                chatService.updateMessageThinkingState(conversationId, messageId, finalThinkingState)
                  .then(() => console.log('Saved thinking state for message:', messageId))
                  .catch(error => console.error('Error saving thinking state:', error));
              }
              
              return prev; // Don't modify state
            });
          } catch (error) {
            console.error('Error in thinking state save:', error);
          }
        }, 100);
      }

      // Clear stream buffers
      streamBufferRef.current = '';
      if (messageId && messageStreamBuffers.current[messageId]) {
        delete messageStreamBuffers.current[messageId];
      }
      
      // Close WebSocket/FlowAPI connection
      if (websocketRef.current) {
        // Check if it's a FlowExecutionAPI instance or WebSocket
        if (websocketRef.current.disconnect) {
          websocketRef.current.disconnect();
        } else if (websocketRef.current.close) {
          websocketRef.current.close();
        }
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

  const simulateThinking = (query, modelId, messageId) => {
    console.log('🚀 simulateThinking called with query:', query);
    console.log('📋 Message ID for thinking:', messageId);
    console.log('📋 Model/Agent ID from input:', modelId);
    
    // Use the agent ID passed from the chat interface (selected via slash command)
    // If no agent selected, fall back to URL params or default
    let agentId = modelId;
    
    if (!agentId || agentId === 'default-agent') {
      const currentPath = window.location.pathname;
      const agentIdMatch = currentPath.match(/\/chat\/([^\/]+)/);
      agentId = agentIdMatch ? agentIdMatch[1] : 'default-agent';
    }
    
    console.log('📋 Final Agent ID:', agentId);
    console.log('📋 Messages for context:', messages.length);
    
    // Connect to NeuraLabs backend with agent ID and user message
    connectToBackend(agentId, query, messageId);
  };


  const handleNewChat = () => {
    setIsLanding(true);
    setSelectedChatId(null);
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleTransactionDetected = (messageId, transaction) => {
    console.log('Transaction detected for message:', messageId, transaction);
    setMessageTransactions(prev => ({
      ...prev,
      [messageId]: transaction
    }));
  };

  const handleSearchSelectMessage = async (conversationId, messageId) => {
    // First, load the conversation if it's not the current one
    if (conversationId !== currentConversationId) {
      await handleChatSelect(conversationId);
    }
    
    // Scroll to the specific message after a small delay to ensure rendering
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        messageElement.style.backgroundColor = 'var(--chakra-colors-yellow-200)';
        setTimeout(() => {
          messageElement.style.backgroundColor = '';
          messageElement.style.transition = 'background-color 0.5s ease';
        }, 1000);
      }
    }, 100);
  };

  const handleChatSelect = async (conversationId) => {
    setSelectedChatId(conversationId);
    setCurrentConversationId(conversationId);
    setIsLanding(false);

    try {
      const conversation = await chatService.getConversation(conversationId);
      
      // Transform messages to match component format
      const formattedMessages = conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        model: msg.model,
        parentMessageId: msg.parentMessageId,
        thinkingState: msg.thinkingState,
        transaction: msg.transaction
      }));
      
      setMessages(formattedMessages);
      
      // Restore thinking states and transactions
      const thinkingStates = {};
      const transactions = {};
      
      formattedMessages.forEach(msg => {
        if (msg.thinkingState) {
          thinkingStates[msg.id] = msg.thinkingState;
        }
        if (msg.transaction) {
          transactions[msg.id] = msg.transaction;
        }
      });
      
      setMessageThinkingStates(thinkingStates);
      setMessageTransactions(transactions);
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error loading conversation',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Fallback to empty conversation
      setMessages([]);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatService.deleteConversation(chatId);
      setChats(chats.filter(chat => chat.id !== chatId));
      
      if (selectedChatId === chatId) {
        setIsLanding(true);
        setSelectedChatId(null);
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      toast({
        title: 'Conversation deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error deleting conversation',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditChatTitle = async (chatId, title) => {
    try {
      await chatService.updateConversation(chatId, { title });
      setChats(chats.map(chat => chat.id === chatId ? { ...chat, title } : chat));
      setEditingChatId(null);
      
      toast({
        title: 'Conversation renamed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast({
        title: 'Error updating conversation',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSendMessage = async (content, modelId) => {
    // First, close any existing WebSocket/FlowAPI connection and stop thinking UI
    if (websocketRef.current) {
      console.log('Closing existing connection');
      // Check if it's a FlowExecutionAPI instance or WebSocket
      if (websocketRef.current.disconnect) {
        websocketRef.current.disconnect();
      } else if (websocketRef.current.close) {
        websocketRef.current.close();
      }
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
    
    let conversationId = currentConversationId;
    
    try {
      // Create new conversation if landing
      if (isLanding) {
        const truncatedTitle = content.length > 30 ? content.substring(0, 27) + '...' : content;
        
        // Get agent ID from URL if available
        const currentPath = window.location.pathname;
        const agentIdMatch = currentPath.match(/\/chat\/([^\/]+)/);
        const agentId = agentIdMatch ? agentIdMatch[1] : null;
        
        const newConversation = await chatService.createConversation(truncatedTitle, agentId);
        conversationId = newConversation.id;
        
        setCurrentConversationId(conversationId);
        setSelectedChatId(conversationId);
        setChats([newConversation, ...chats]);
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

      // Add message to UI immediately
      setMessages(prev => [...prev, userMessage]);

      // Save user message to database
      if (conversationId) {
        try {
          const savedMessage = await chatService.addMessage(conversationId, {
            role: 'user',
            content,
            model: modelId
          });
          
          // Update the message with the server-generated ID
          setMessages(prev => prev.map(msg => 
            msg.id === userMessageId ? { ...msg, id: savedMessage.id } : msg
          ));
          
          // Also update the thinking states if any exist for the old ID
          setMessageThinkingStates(prev => {
            if (prev[userMessageId]) {
              const { [userMessageId]: oldState, ...rest } = prev;
              return {
                ...rest,
                [savedMessage.id]: oldState
              };
            }
            return prev;
          });
          
          // Use the server ID for thinking state tracking
          userMessage.id = savedMessage.id;
        } catch (error) {
          console.error('Error saving user message:', error);
          // Continue even if save fails
        }
      }

      // Store conversation ID for the assistant response
      simulateThinking.conversationId = conversationId;

      // Small delay to ensure WebSocket is fully closed before starting new connection
      setTimeout(() => {
        // Always call the backend for every user input with the message ID
        simulateThinking(content, modelId, userMessage.id);
      }, 100);
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast({
        title: 'Error sending message',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Prevent render until breakpoint is determined to avoid layout flash
  if (!isBreakpointReady) {
    return (
      <Flex h="100%" w="100%" overflow="hidden" bg={colors.bgPrimary} />
    );
  }

  return (
    <Flex h="100%" w="100%" overflow="hidden" bg={colors.bgPrimary}>
      {/* Desktop Chat History Panel */}
      {!isMobile && (
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
          isMobile={false}
          onSearchOpen={onSearchOpen}
        />
      )}
      
      {/* Mobile Chat History Drawer */}
      {isMobile && (
        <Drawer
          isOpen={isOpen}
          placement={drawerPlacement}
          onClose={onClose}
          size={drawerSize}
        >
          <DrawerOverlay />
          <DrawerContent
            height={drawerPlacement === 'bottom' ? '60vh' : '100vh'}
            minH={drawerPlacement === 'bottom' ? '20vh' : '100vh'}
            maxH={drawerPlacement === 'bottom' ? '70vh' : '100vh'}
            borderTopRadius={drawerPlacement === 'bottom' ? 'xl' : '0'}
          >
            <DrawerCloseButton />
            <ChatHistoryPanel
              isOpen={true}
              chats={chats}
              selectedChatId={selectedChatId}
              onChatSelect={(chatId) => {
                handleChatSelect(chatId);
                onClose();
              }}
              onNewChat={() => {
                handleNewChat();
                onClose();
              }}
              onDeleteChat={handleDeleteChat}
              onEditChatTitle={handleEditChatTitle}
              onToggleSidebar={onToggle}
              editingChatId={editingChatId}
              setEditingChatId={setEditingChatId}
              newTitle={newTitle}
              setNewTitle={setNewTitle}
              isMobile={true}
              onSearchOpen={() => {
                onClose();
                onSearchOpen();
              }}
            />
          </DrawerContent>
        </Drawer>
      )}
      
      <Flex flex="1" direction="column" h="100%" position="relative" justifyContent="center">
        {/* Mobile Chat History and Search Buttons */}
        {isMobile && (
          <Flex
            position="fixed" 
            top={4} 
            right={4} 
            zIndex={10}
            gap={2}
          >
            {/* <IconButton
              icon={<FiSearch size={24} />}
              onClick={onSearchOpen}
              variant="ghost"
              aria-label="Search conversations"
              colorScheme="gray"
              size="lg"
            /> */}
            <IconButton
              icon={<FiMessageCircle size={24} />}
              onClick={onToggle}
              variant="ghost"
              aria-label="Open chat history"
              colorScheme="gray"
              size="lg"
            />
          </Flex>
        )}
        
        {/* Desktop Search Button */}
        {/* {!isMobile && (
          <Box 
            position="absolute" 
            top={4} 
            right={4} 
            zIndex={10}
          >
            <IconButton
              icon={<FiSearch size={20} />}
              onClick={onSearchOpen}
              variant="ghost"
              aria-label="Search conversations (Ctrl+K)"
              colorScheme="gray"
              size="md"
            />
          </Box>
        )} */}
        
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLanding={isLanding}
          thinkingState={thinkingState}
          messageThinkingStates={messageThinkingStates}
          messageTransactions={messageTransactions}
          onTransactionDetected={handleTransactionDetected}
          onToggleColorMode={toggleColorMode}
          isMobile={isMobile}
        />
      </Flex>
      
      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={onSearchClose}
        conversations={chats}
        onSelectMessage={handleSearchSelectMessage}
        isLoading={isLoadingChats}
      />
    </Flex>
  );
};

export default ChatPage;