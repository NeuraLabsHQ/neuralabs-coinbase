// src/components/chat_interface/StreamingChatInterface.jsx
import {
    Box,
    Button,
    Divider,
    Flex,
    HStack,
    IconButton,
    Text,
    Textarea,
    Tooltip,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Badge,
    Spinner
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from 'react';
import {
    FiArrowUp,
    FiPaperclip,
    FiThumbsDown,
    FiThumbsUp,
    FiCode,
    FiWifi,
    FiWifiOff
} from "react-icons/fi";

import MarkdownRenderer from "./MarkdownRenderer";
import { useFlowExecution } from "../../utils/flow-execution-api";
import { useColorModeValue } from "@chakra-ui/react";
import colors from "../../color";

const Message = ({ message, isStreaming = false, streamingContent = "" }) => {
  const isUser = message.type === "user";
  const userMessageBg = useColorModeValue(colors.chat.userMessageBg.light, colors.chat.userMessageBg.dark);
  const assistantMessageBg = useColorModeValue(colors.chat.assistantMessageBg.light, colors.chat.assistantMessageBg.dark);
  const textColor = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const iconColor = useColorModeValue(colors.chat.iconColor.light, colors.chat.iconColor.dark);

  const content = isStreaming ? streamingContent : message.content;

  return (
    <Flex w="100%" maxW="900px" mx="auto" direction="column" mb={8}>
      <Flex justify={isUser ? "flex-end" : "flex-start"}>
        <Box
          maxW={isUser ? "300px" : "70%"}
          p={3}
          borderRadius="lg"
          bg={isUser ? userMessageBg : assistantMessageBg}
          color={textColor}
        >
          {isUser ? (
            <Text>{content}</Text>
          ) : (
            <Box>
              <MarkdownRenderer content={content} textColor={textColor} />
              {isStreaming && (
                <Box display="inline-block" ml={1}>
                  <Text as="span" opacity={0.7} animation="pulse 1.5s infinite">▌</Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Flex>

      {!isUser && !isStreaming && (
        <HStack mt={2} spacing={2}>
          <IconButton
            icon={<FiThumbsUp />}
            aria-label="Thumbs up"
            size="sm"
            variant="ghost"
            color={iconColor}
            _hover={{ color: textColor }}
          />
          <IconButton
            icon={<FiThumbsDown />}
            aria-label="Thumbs down"
            size="sm"
            variant="ghost"
            color={iconColor}
            _hover={{ color: textColor }}
          />
          <IconButton
            icon={<FiCode />}
            aria-label="Copy code"
            size="sm"
            variant="ghost"
            color={iconColor}
            _hover={{ color: textColor }}
          />
          <IconButton
            icon={<FiPaperclip />}
            aria-label="Save"
            size="sm"
            variant="ghost"
            color={iconColor}
            _hover={{ color: textColor }}
          />
        </HStack>
      )}
    </Flex>
  );
};

const ConnectionStatus = ({ isExecuting, status, error }) => {
  const bgColor = useColorModeValue(colors.chat.bgSecondary.light, colors.chat.bgSecondary.dark);
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);

  if (error) {
    return (
      <Alert status="error" borderRadius="lg" mx="auto" maxW="900px" mb={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  if (isExecuting) {
    return (
      <Flex
        align="center"
        justify="center"
        p={3}
        bg={bgColor}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        mx="auto"
        maxW="900px"
        mb={4}
      >
        <Spinner size="sm" mr={2} />
        <Text fontSize="sm">{status || "Processing..."}</Text>
      </Flex>
    );
  }

  return null;
};

const StreamingChatInterface = ({ agentId, userId, agentData, isLanding = false }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    executeFlow,
    disconnect,
    isConnected,
    isExecuting,
    error,
    status,
    messages,
    currentResponse,
    clearMessages,
    clearError
  } = useFlowExecution(agentId);

  const bgPrimary = useColorModeValue(colors.chat.bgPrimary.light, colors.chat.bgPrimary.dark);
  const bgInput = useColorModeValue(colors.chat.bgInput.light, colors.chat.bgInput.dark);
  const textPrimary = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const textSecondary = useColorModeValue(colors.chat.textSecondary.light, colors.chat.textSecondary.dark);
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);
  const iconColor = useColorModeValue(colors.chat.iconColor.light, colors.chat.iconColor.dark);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  useEffect(() => {
    // Initialize textarea height on mount
    if (inputRef.current) {
      inputRef.current.style.height = '60px';
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize textarea based on content
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.max(60, Math.min(scrollHeight, 200))}px`;
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === "" || isExecuting) return;

    const message = input.trim();
    setInput("");
    
    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = '60px';
    }

    try {
      await executeFlow(userId, message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearError = () => {
    clearError();
  };

  const handleClearChat = () => {
    clearMessages();
    disconnect();
  };

  return (
    <Flex
      direction="column"
      h={messages.length > 0 || isExecuting ? "100%" : "auto"}
      bg={bgPrimary}
      color={textPrimary}
      transition="height 0.3s ease"
    >
      {/* Header with agent info and connection status */}
      <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="lg" fontWeight="semibold">
              {agentData?.name || `Agent ${agentId}`}
            </Text>
            <Text fontSize="sm" color={textSecondary}>
              {agentData?.description || "AI Assistant"}
            </Text>
          </Box>
          <HStack spacing={2}>
            <Badge 
              colorScheme={isConnected ? "green" : "gray"} 
              variant="subtle"
              display="flex"
              alignItems="center"
            >
              {isConnected ? <FiWifi /> : <FiWifiOff />}
              <Text ml={1}>{isConnected ? "Connected" : "Disconnected"}</Text>
            </Badge>
            {messages.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearChat}>
                Clear Chat
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Landing state */}
      {isLanding && messages.length === 0 && !isExecuting ? (
        <Flex
          flex="1"
          direction="column"
          justify="center"
          align="center"
          px={4}
        >
          <Text fontSize="2xl" fontWeight="medium">
            Hello! I'm {agentData?.name || "your AI assistant"}.
          </Text>
          <Text fontSize="xl" color={textSecondary}>
            How can I help you today?
          </Text>
        </Flex>
      ) : (
        <Box flex="1" overflowY="auto" px={6} py={4}>
          {/* Connection status */}
          <ConnectionStatus
            isExecuting={isExecuting}
            status={status}
            error={error}
          />

          {/* Messages */}
          {messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}

          {/* Current streaming response */}
          {currentResponse && (
            <Message
              message={{ type: "assistant", content: "" }}
              isStreaming={true}
              streamingContent={currentResponse}
            />
          )}

          <div ref={messagesEndRef} />
        </Box>
      )}

      {/* Input section */}
      <Box p={5} pb={10}>
        <Flex
          direction="column"
          borderRadius="lg"
          bg={bgInput}
          border="1px solid"
          borderColor={borderColor}
          p={2}
          maxW={isLanding ? "600px" : "900px"}
          mx="auto"
          boxShadow="sm"
        >
          {error && (
            <Alert status="error" borderRadius="md" mb={2}>
              <AlertIcon />
              <Box flex="1">
                <AlertDescription fontSize="sm">{error}</AlertDescription>
              </Box>
              <Button size="xs" variant="ghost" onClick={handleClearError}>
                ×
              </Button>
            </Alert>
          )}

          <Textarea
            placeholder={
              isLanding ? "Ask me anything..." : `Message ${agentData?.name || "Assistant"}...`
            }
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            size="md"
            bg="transparent"
            border="none"
            _focus={{ border: "none", boxShadow: "none" }}
            resize="none"
            minH="60px"
            maxH="200px"
            overflowY="auto"
            ref={inputRef}
            transition="height 0.1s ease"
            style={{ height: '60px' }}
            isDisabled={isExecuting}
            sx={{
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              '-ms-overflow-style': 'none',
              'scrollbarWidth': 'none',
            }}
          />

          <Divider my={2} borderColor={borderColor} />

          <Flex justify="space-between" align="center">
            <HStack spacing={2}>
              <IconButton
                icon={<FiPaperclip />}
                aria-label="Attach file"
                variant="ghost"
                size="sm"
                color={iconColor}
                isDisabled={isExecuting}
              />
            </HStack>

            <HStack>
              <Tooltip label={isExecuting ? "Processing..." : "Send message"}>
                <IconButton
                  icon={isExecuting ? <Spinner size="sm" /> : <FiArrowUp />}
                  aria-label="Send message"
                  colorScheme="blue"
                  size="sm"
                  isRound
                  isDisabled={input.trim() === "" || isExecuting}
                  onClick={handleSendMessage}
                />
              </Tooltip>
            </HStack>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
};

export default StreamingChatInterface;