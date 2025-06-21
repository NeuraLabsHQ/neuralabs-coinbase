import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  VStack,
  Box,
  Text,
  Flex,
  useColorModeValue,
  Kbd,
  HStack,
  Icon,
  Spinner,
  Center,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { FiSearch, FiMessageCircle, FiClock, FiUser } from 'react-icons/fi';
import { SiOpenai } from 'react-icons/si';
import colors from '../../../color';
import chatService from '../../../services/chatServiceV2';
import ThinkingUI from '../ThinkingUI/ThinkingUI';
import MarkdownRenderer from '../MarkdownRenderer';
import TransactionButton from '../../transaction/TransactionButton';

const SearchModal = ({ 
  isOpen, 
  onClose, 
  conversations = [], 
  onSelectMessage,
  isLoading = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredConversationId, setHoveredConversationId] = useState(null);
  const [previewConversation, setPreviewConversation] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [conversationCache, setConversationCache] = useState({});
  
  const searchInputRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Color scheme
  const bgPrimary = useColorModeValue(colors.chat.bgPrimary.light, colors.chat.bgPrimary.dark);
  const bgSecondary = useColorModeValue(colors.chat.bgSecondary.light, colors.chat.bgSecondary.dark);
  const bgHover = useColorModeValue(colors.chat.bgHover.light, colors.chat.bgHover.dark);
  const bgSelected = useColorModeValue(colors.chat.bgSelected.light, colors.chat.bgSelected.dark);
  const textPrimary = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const textSecondary = useColorModeValue(colors.chat.textSecondary.light, colors.chat.textSecondary.dark);
  const textMuted = useColorModeValue(colors.chat.textMuted.light, colors.chat.textMuted.dark);
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);
  const iconColor = useColorModeValue(colors.chat.iconColor.light, colors.chat.iconColor.dark);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(query) ||
      (conv.messages && conv.messages.some(msg => 
        msg.content.toLowerCase().includes(query)
      ))
    );
  }, [searchQuery, conversations]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Load conversation preview on hover
  const loadConversationPreview = async (conversationId) => {
    // Check cache first
    if (conversationCache[conversationId]) {
      setPreviewConversation(conversationCache[conversationId]);
      return;
    }

    setIsLoadingPreview(true);
    try {
      const conversation = await chatService.getConversation(conversationId);
      // Update cache
      setConversationCache(prev => ({
        ...prev,
        [conversationId]: conversation
      }));
      setPreviewConversation(conversation);
    } catch (error) {
      console.error('Error loading conversation preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle hover with debounce
  const handleConversationHover = (conversationId) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set new timeout
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredConversationId(conversationId);
      loadConversationPreview(conversationId);
    }, 300); // 300ms debounce
  };

  const handleConversationLeave = () => {
    // Clear timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredConversations.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredConversations[selectedIndex]) {
        e.preventDefault();
        const selectedConv = filteredConversations[selectedIndex];
        if (selectedConv.messages && selectedConv.messages.length > 0) {
          onSelectMessage(selectedConv.id, selectedConv.messages[0].id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredConversations, onSelectMessage, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setHoveredConversationId(null);
      setPreviewConversation(null);
      setSelectedIndex(0);
      // Clear cache on close to prevent stale data
      setConversationCache({});
    }
  }, [isOpen]);

  // Update hover when keyboard navigation changes selection
  useEffect(() => {
    if (filteredConversations[selectedIndex]) {
      handleConversationHover(filteredConversations[selectedIndex].id);
    }
  }, [selectedIndex]);

  const handleConversationClick = (conversationId) => {
    // Find the first message in the conversation
    const conversation = filteredConversations.find(c => c.id === conversationId);
    console.log('Selected conversation:', conversation);
    if (conversation && conversation.messages && conversation.messages.length > 0) {
      onSelectMessage(conversationId, conversation.messages[0].id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
      <ModalContent 
        bg={bgPrimary} 
        borderColor={borderColor} 
        mx={4}
        maxW="1400px"
        w="90vw"
        maxH="85vh"
        h="85vh"
        overflow="hidden"
        borderRadius="xl"
      >
        <ModalHeader pb={2}>
          <Flex align="center" justify="space-between">
            <HStack spacing={3}>
              {/* <Icon as={FiSearch} color={iconColor} /> */}
              <Text color={textPrimary}>Search Conversations</Text>
            </HStack>
            <HStack spacing={2} mr={8}>
              <Kbd bg={bgSecondary} color={textSecondary} size="sm">↑↓</Kbd>
              <Text fontSize="xs" color={textMuted}>navigate</Text>
              <Kbd bg={bgSecondary} color={textSecondary} size="sm">↵</Kbd>
              <Text fontSize="xs" color={textMuted}>select</Text>
              <Kbd bg={bgSecondary} color={textSecondary} size="sm">esc</Kbd>
              <Text fontSize="xs" color={textMuted}>close</Text>
            </HStack>
          </Flex>
        </ModalHeader>
        {/* <ModalCloseButton color={iconColor} /> */}
        
        <ModalBody p={0} h="calc(100% - 60px)" overflow="hidden">
          <Flex h="full">
            {/* Left Panel - Chat List */}
            <Box 
              w="30%" 
              minW="300px"
              maxW="400px"
              borderRight="1px solid" 
              borderColor={borderColor}
              h="full"
              display="flex"
              flexDirection="column"
            >
              {/* Search Input */}
              <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color={iconColor} />
                  </InputLeftElement>
                  <Input
                    ref={searchInputRef}
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg={bgSecondary}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    color={textPrimary}
                    _placeholder={{ color: textMuted }}
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)'
                    }}
                  />
                </InputGroup>
              </Box>

              {/* Chat List */}
              <Box 
                flex="1" 
                overflowY="auto"
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    bg: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bg: borderColor,
                    borderRadius: '3px',
                  },
                }}
              >
                {isLoading ? (
                  <Center py={8}>
                    <Spinner color={iconColor} />
                  </Center>
                ) : filteredConversations.length === 0 ? (
                  <Center py={8} px={4}>
                    <VStack spacing={2}>
                      <Icon as={FiMessageCircle} fontSize="2xl" color={textMuted} />
                      <Text color={textMuted} textAlign="center">
                        {searchQuery ? `No results found for "${searchQuery}"` : 'No conversations yet'}
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={0} align="stretch">
                    {filteredConversations.map((conversation, index) => (
                      <Box
                        key={conversation.id}
                        p={4}
                        mx={2}
                        mb={1}
                        borderRadius="md"
                        bg={
                          hoveredConversationId === conversation.id
                            ? bgSelected
                            : index === selectedIndex
                            ? bgHover
                            : 'transparent'
                        }
                        _hover={{ 
                          bg: bgSelected,
                          transform: 'translateX(4px)',
                          transition: 'all 0.2s ease'
                        }}
                        cursor="pointer"
                        onClick={() => handleConversationClick(conversation.id)}
                        onMouseEnter={() => handleConversationHover(conversation.id)}
                        onMouseLeave={handleConversationLeave}
                        transition="all 0.2s ease"
                      >
                        <Flex justify="space-between" align="start">
                          <VStack align="stretch" spacing={1} flex="1">
                            <Text 
                              fontSize="sm" 
                              color={textPrimary}
                              fontWeight="medium"
                              noOfLines={1}
                            >
                              {conversation.title}
                            </Text>
                            <Text 
                              fontSize="xs" 
                              color={textMuted}
                              noOfLines={1}
                            >
                              {conversation.message_count || 0} messages
                            </Text>
                          </VStack>
                          <HStack spacing={1}>
                            <Icon as={FiClock} color={textMuted} fontSize="xs" />
                            <Text fontSize="xs" color={textMuted}>
                              {formatTimestamp(conversation.created_at)}
                            </Text>
                          </HStack>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>

            {/* Right Panel - Conversation Preview */}
            <Box 
              flex="1"
              h="full"
              bg={bgSecondary}
              display="flex"
              flexDirection="column"
            >
              {isLoadingPreview ? (
                <Center h="full">
                  <Spinner color={iconColor} />
                </Center>
              ) : previewConversation ? (
                <>
                  {/* Conversation Header */}
                  {/* <Box p={5} borderBottom="1px solid" borderColor={borderColor} bg={bgPrimary}>
                    <Text 
                      fontSize="xl" 
                      fontWeight="semibold" 
                      color={textPrimary}
                      noOfLines={1}
                      mb={1}
                    >
                      {previewConversation.title}
                    </Text>
                    <Text fontSize="sm" color={textMuted}>
                      {previewConversation.messages?.length || 0} messages
                    </Text>
                  </Box> */}

                  {/* Messages */}
                  <Box 
                    flex="1" 
                    overflowY="auto"
                    p={4}
                    sx={{
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        bg: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        bg: borderColor,
                        borderRadius: '3px',
                      },
                    }}
                  >
                    <VStack spacing={4} align="stretch">
                      {previewConversation.messages?.map((message, index) => {
                        const isUser = message.role === 'user';
                        const userMessageBg = useColorModeValue(colors.chat.userMessageBg.light, colors.chat.userMessageBg.dark);
                        const assistantMessageBg = useColorModeValue(colors.chat.assistantMessageBg.light, colors.chat.assistantMessageBg.dark);
                        
                        // Message element
                        const messageElement = (
                          <Flex 
                            key={message.id}
                            w="100%" 
                            direction="column" 
                            mb={6}
                            px={4}
                          >
                            <Flex justify={isUser ? "flex-end" : "flex-start"}>
                              <Box
                                maxW={isUser ? "45%" : "75%"}
                                p={4}
                                borderRadius="lg"
                                bg={isUser ? userMessageBg : assistantMessageBg}
                                color={textPrimary}
                                boxShadow="sm"
                              >
                                {isUser ? (
                                  <Text>{message.content}</Text>
                                ) : (
                                  <MarkdownRenderer content={message.content} textColor={textPrimary} />
                                )}
                              </Box>
                            </Flex>
                            
                            {/* Transaction button if available */}
                            {!isUser && message.transaction && (
                              <Box mt={2} ml={0}>
                                <TransactionButton 
                                  transaction={message.transaction} 
                                  messageId={message.id}
                                />
                              </Box>
                            )}
                          </Flex>
                        );
                        
                        // Check if this user message has thinking state
                        if (isUser && message.thinkingState) {
                          return (
                            <Fragment key={`fragment-${message.id}`}>
                              {messageElement}
                              <ThinkingUI 
                                thinkingState={message.thinkingState} 
                                query={message.content} 
                                shouldPersist={true}
                                isMobile={false}
                                onTransactionDetected={() => {}}
                              />
                            </Fragment>
                          );
                        }
                        
                        return messageElement;
                      })}
                    </VStack>
                  </Box>
                </>
              ) : (
                <Center h="full" px={8}>
                  <VStack spacing={4}>
                    <Box
                      p={4}
                      borderRadius="full"
                      bg={bgHover}
                    >
                      <Icon as={FiMessageCircle} fontSize="4xl" color={textMuted} />
                    </Box>
                    <VStack spacing={1}>
                      <Text color={textPrimary} fontSize="lg" fontWeight="medium">
                        No conversation selected
                      </Text>
                      <Text color={textMuted} textAlign="center" fontSize="sm">
                        Hover over a conversation to preview its contents
                      </Text>
                    </VStack>
                  </VStack>
                </Center>
              )}
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SearchModal;