// src/components/chat_interface/ChatInterface.jsx
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
    VStack
} from "@chakra-ui/react";
import { useEffect, useRef, useState,Fragment } from 'react';
import {
    FiArrowUp,
    FiCode,
    FiPaperclip,
    FiThumbsDown,
    FiThumbsUp
} from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";

// Import the separate ThinkingUI component
import ThinkingUI from "./ThinkingUI/ThinkingUI.jsx";
import MarkdownRenderer from "./MarkdownRenderer";
import TransactionButton from "../transaction/TransactionButton";
import SlashCommandDropdown from "./SlashCommandDropdown/SlashCommandDropdown";
import AgentSelectionModal from "./AgentSelectionModal/AgentSelectionModal";

// Import colors
import { useColorModeValue } from "@chakra-ui/react";
import colors from "../../color";
import { FiX } from "react-icons/fi";

// const TOOLS = [
//   { id: 'jfk-files', name: 'JFK Files', icon: FiSearch },
//   { id: 'research', name: 'Research', icon: FiSearch },
//   { id: 'create-images', name: 'Create Images', icon: FiImage },
//   { id: 'how-to', name: 'How to', icon: FiCode },
//   { id: 'analyze', name: 'Analyze', icon: FiSearch },
//   { id: 'code', name: 'Code', icon: FiCode }
// ];

const Message = ({ message, isMobile, transaction }) => {
  const isUser = message.role === "user";
  
  const userMessageBg = useColorModeValue(colors.chat.userMessageBg.light, colors.chat.userMessageBg.dark);
  const assistantMessageBg = useColorModeValue(colors.chat.assistantMessageBg.light, colors.chat.assistantMessageBg.dark);
  const textColor = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const iconColor = useColorModeValue(colors.chat.iconColor.light, colors.chat.iconColor.dark);

  console.log("transaction in Message component:", transaction);

  return (
    <Flex 
      w="100%" 
      maxW={isMobile ? "100%" : "900px"} 
      mx="auto" 
      direction="column" 
      mb={isMobile ? 4 : 8}
      id={`message-${message.id}`}
    >
      <Flex justify={isUser ? "flex-end" : "flex-start"}>
        <Box
          maxW={isUser ? (isMobile ? "80%" : "300px") : (isMobile ? "90%" : "70%")}
          p={3}
          borderRadius="lg"
          bg={isUser ? userMessageBg : assistantMessageBg}
          color={textColor}
        >
          {isUser ? (
            <Text>{message.content}</Text>
          ) : (
            <MarkdownRenderer content={message.content} textColor={textColor} />
          )}
        </Box>
      </Flex>

      {!isUser && (
        <VStack align="start" mt={2} spacing={2}>
          <HStack spacing={2}>
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
              color=  {iconColor}
              _hover={{ color: textColor }}
            />
            <IconButton
              icon={<FiPaperclip />}
              aria-label="Save"
              size="sm"
              variant="ghost"
              color=  {iconColor}
              _hover={{ color: textColor }}
            />
          </HStack>
          
          {/* Transaction Button */}
          {transaction && (
            <Box mt={2}>
              <TransactionButton 
                transaction={transaction}
                onSuccess={(result) => {
                  console.log('Transaction successful:', result);
                }}
                onError={(error) => {
                  console.error('Transaction failed:', error);
                }}
              />
            </Box>
          )}
        </VStack>
      )}
    </Flex>
  );
};

const ChatInterface = ({
  messages,
  onSendMessage,
  isLanding = false,
  thinkingState = { isThinking: false },
  messageThinkingStates = {},
  messageTransactions = {},
  onTransactionDetected,
  onToggleColorMode,
  isMobile = false,
}) => {
  const [input, setInput] = useState("");
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('below');
  const [toolSelectionMode, setToolSelectionMode] = useState("deepSearch");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const inputContainerRef = useRef(null);
  const [slashSearchTerm, setSlashSearchTerm] = useState("");
  const [lastQueryText, setLastQueryText] = useState(""); // State to store the last query




  const bgPrimary = useColorModeValue(colors.chat.bgPrimary.light, colors.chat.bgPrimary.dark);
  const bgSecondary = useColorModeValue(colors.chat.bgSecondary.light, colors.chat.bgSecondary.dark);
  const bgInput = useColorModeValue(colors.chat.bgInput.light, colors.chat.bgInput.dark);
  const bgHover = useColorModeValue(colors.chat.bgHover.light, colors.chat.bgHover.dark);
  const textPrimary = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const textSecondary = useColorModeValue(colors.chat.textSecondary.light, colors.chat.textSecondary.dark);
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);
  const iconColor = useColorModeValue(colors.chat.iconColor.light, colors.chat.iconColor.dark);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when thinking state changes (for real-time streaming)
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thinkingState.isThinking, thinkingState.executionSteps, messageThinkingStates]);

  useEffect(() => {
    // Initialize textarea height on mount
    if (inputRef.current) {
      inputRef.current.style.height = '60px';
    }
  }, []);

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (showSlashCommands && inputContainerRef.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If less than 200px below, show above
      if (spaceBelow < 200 && spaceAbove > 200) {
        setDropdownPosition('above');
      } else {
        setDropdownPosition('below');
      }
    }
  }, [showSlashCommands]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Auto-resize textarea based on content
    if (inputRef.current) {
      // Reset height to auto to get the accurate scrollHeight
      inputRef.current.style.height = 'auto';
      // Calculate the scroll height
      const scrollHeight = inputRef.current.scrollHeight;
      // Set height to scrollHeight, but respect min and max height
      inputRef.current.style.height = `${Math.max(60, Math.min(scrollHeight, 200))}px`;
    }
    
    // Check for slash commands at the beginning of input
    if (value.startsWith('/')) {
      setShowSlashCommands(true);
      // Extract the search term after the slash
      const searchTerm = value.substring(1).split(' ')[0];
      setSlashSearchTerm(searchTerm);
    } else {
      setShowSlashCommands(false);
      setSlashSearchTerm('');
    }
  };




const handleSendMessage = () => {
    const trimmedInput = input.trim();
    if (trimmedInput === "") return;

    // Don't send if it's just a slash command
    if (trimmedInput === '/' || (trimmedInput.startsWith('/') && !trimmedInput.includes(' '))) {
      return;
    }
    
    // Remove slash command from message if present
    let cleanMessage = trimmedInput;
    if (trimmedInput.startsWith('/')) {
      const spaceIndex = trimmedInput.indexOf(' ');
      if (spaceIndex > 0) {
        cleanMessage = trimmedInput.substring(spaceIndex + 1).trim();
      }
    }
    
    // Use selected agent if available
    const agentId = selectedAgent?.id || 'default-agent';
    const useThinkMode = toolSelectionMode === "think" || selectedAgent !== null;
    
    console.log("Original input:", trimmedInput);
    console.log("Clean message:", cleanMessage);
    console.log("Selected agent:", agentId);
    console.log("Using Think mode:", useThinkMode);

    setLastQueryText(cleanMessage);
    
    // Send the clean message with the selected agent
    onSendMessage(cleanMessage, agentId, useThinkMode);
    setInput("");
    setShowSlashCommands(false);
    
    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = '60px';
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSlashCommandSelect = (command) => {
    setShowSlashCommands(false);
    
    switch (command.action) {
      case 'select-agent':
        setShowAgentModal(true);
        setInput('');
        break;
      case 'clear-chat':
        // Clear chat logic here
        setInput('');
        if (window.confirm('Are you sure you want to clear this conversation?')) {
          // Add clear chat functionality
        }
        break;
      case 'show-help':
        setInput('');
        // Show help logic
        break;
      case 'open-settings':
        setInput('');
        // Open settings logic
        break;
      case 'export-chat':
        setInput('');
        // Export chat logic
        break;
      default:
        break;
    }
  };
  

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    setShowAgentModal(false);
  };

  const handleClearAgent = () => {
    setSelectedAgent(null);
  };

  return (
    <Flex
      direction="column"
      h="100%"
      bg={bgPrimary}
      color={textPrimary}
      justify={isLanding && !isMobile ? "center" : "flex-start"}
      transition="height 0.3s ease" // Smooth transition for height change
    >
      {isLanding ? (
        <Flex
          flex="1"
          direction="column"
          justify="center"
          align="center"
          px={4}
          pb={isMobile ? "200px" : 0}
        >
          <Text fontSize={isMobile ? "xl" : "2xl"} fontWeight="medium" textAlign="center">
            Welcome to NeuraLabs
          </Text>
          <Text fontSize={isMobile ? "lg" : "xl"} color={textSecondary} textAlign="center" mt={2} mb={isMobile ? 0 : 8}>
            How can I assist you?
          </Text>
          
          {/* Desktop input - integrated into the landing content */}
          {!isMobile && (
            <Flex
              direction="column"
              borderRadius="lg"
              bg={bgInput}
              border="1px solid"
              borderColor={borderColor}
              p={2}
              maxW="600px"
              w="100%"
              boxShadow="sm"
              position="relative"
              ref={inputContainerRef}
            >
              <Textarea
                placeholder="Ask me anything..."
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
                sx={{
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  '-ms-overflow-style': 'none',
                  'scrollbarWidth': 'none',
                }}
              />

              {/* Slash Command Dropdown for Desktop Landing */}
              <SlashCommandDropdown
                isOpen={showSlashCommands}
                onClose={() => setShowSlashCommands(false)}
                onSelect={handleSlashCommandSelect}
                position={dropdownPosition}
                width={inputContainerRef.current?.offsetWidth}
                searchTerm={slashSearchTerm}
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
                  />
                  <HStack spacing={1}>
                    <Tooltip label={selectedAgent ? "Change Agent" : "Select Agent"}>
                      <Button
                        leftIcon={<RiRobot2Line />}
                        aria-label="Select Agent"
                        variant={selectedAgent ? "solid" : "ghost"}
                        size="sm"
                        color={selectedAgent ? bgPrimary : iconColor}
                        bg={selectedAgent ? iconColor : "transparent"}
                        onClick={() => setShowAgentModal(true)}
                        _hover={{
                          bg: selectedAgent ? iconColor : bgHover
                        }}
                        px={selectedAgent ? 3 : 2}
                      >
                        {selectedAgent && selectedAgent.name}
                      </Button>
                    </Tooltip>
                    {selectedAgent && (
                      <Tooltip label="Clear selected agent">
                        <IconButton
                          icon={<FiX />}
                          size="xs"
                          variant="ghost"
                          aria-label="Clear agent"
                          onClick={handleClearAgent}
                          color={iconColor}
                        />
                      </Tooltip>
                    )}
                  </HStack>
                </HStack>

                <Tooltip label="Send message">
                  <IconButton
                    icon={<FiArrowUp />}
                    aria-label="Send message"
                    isDisabled={!input.trim()}
                    onClick={handleSendMessage}
                    variant="solid"
                    bg={input.trim() ? textPrimary : "transparent"}
                    color={input.trim() ? bgPrimary : iconColor}
                    _hover={{
                      bg: input.trim() ? textPrimary : "transparent",
                    }}
                    size="sm"
                    borderRadius="md"
                  />
                </Tooltip>
              </Flex>
            </Flex>
          )}
        </Flex>
      ) : (
<Box 
  flex="1" 
  overflowY="auto" 
  px={isMobile ? 4 : 6} 
  py={isMobile ? 16 : 10}
  pb={isMobile ? 140 : 10}
>
  {/* Render messages with ThinkingUI positioned after the last user message */}
  {messages.map((message, index) => {
    // First render the current message
    const messageElement = (
      <Message 
        key={message.id} 
        message={message} 
        isMobile={isMobile}
        transaction={messageTransactions[message.id]}
      />
    );
    
    // Check if this is the very last user message in the entire conversation
    const isLastUserMessage = 
      message.role === "user" && 
      index === messages.length - 1;
    
    // Check if this message has a thinking state (either active or completed)
    const messageThinkingState = messageThinkingStates[message.id];
    
    // Show thinking UI for user messages that have thinking state
    if (message.role === "user" && messageThinkingState) {
      return (
        <Fragment key={`fragment-${message.id}`}>
          {messageElement}
          <ThinkingUI 
            thinkingState={messageThinkingState} 
            query={message.content} 
            shouldPersist={true}
            isMobile={isMobile}
            onTransactionDetected={(transaction) => {
              // Find the assistant message that follows this user message
              const assistantMessageIndex = messages.findIndex((msg, idx) => 
                idx > index && msg.role === 'assistant'
              );
              
              if (assistantMessageIndex !== -1) {
                const assistantMessage = messages[assistantMessageIndex];
                onTransactionDetected(assistantMessage.id, transaction);
              } else {
                // If no assistant message exists yet, store it temporarily with the user message
                onTransactionDetected(message.id, transaction);
              }
            }}
          />
        </Fragment>
      );
    }
    
    // Otherwise just return the message
    return messageElement;
  })}

  <div ref={messagesEndRef} />
</Box>
      )
      
      }

      {/* Tools section */}
      {/* {isLanding && (
        <Center mb={5}>
          <HStack spacing={4} overflowX="auto" py={2} px={2}>
            {TOOLS.map((tool) => (
              <Button
                key={tool.id}
                leftIcon={<tool.icon />}
                size="md"
                variant="ghost"
                color={colors.textSecondary}
                _hover={{ bg: colors.bgHover }}
                onClick={() => handleToolSelect(tool.id)}
                borderRadius="md"
                minW="auto"
              >
                {tool.name}
              </Button>
            ))}
          </HStack>
        </Center>
      )} */}

      {/* Footer with input - Only show on mobile landing or always when not landing */}
      {(isMobile || !isLanding) && (
        <Box 
          p={isMobile ? 3 : 5} 
          pb={isMobile ? 3 : 10}
          position={(isMobile && isLanding) ? "fixed" : "relative"}
          bottom={(isMobile && isLanding) ? 0 : "auto"}
          left={(isMobile && isLanding) ? 0 : "auto"}
          right={(isMobile && isLanding) ? 0 : "auto"}
          bg={bgPrimary}
          borderTop={(isMobile && isLanding) ? "1px solid" : "none"}
          borderColor={borderColor}
          w="100%"
        >
        <Flex
          direction="column"
          borderRadius="lg"
          bg={bgInput}
          border="1px solid"
          borderColor={borderColor}
          p={2}
          maxW={isLanding ? (isMobile ? "100%" : "600px") : (isMobile ? "100%" : "900px")}
          mx="auto"
          boxShadow="sm"
          position="relative"
          ref={inputContainerRef}
        >
          <Textarea
            placeholder={
              isLanding ? "Ask me anything..." : "Type your message..."
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
            sx={{
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              '-ms-overflow-style': 'none',
              'scrollbarWidth': 'none',
            }}
          />

          {/* Slash Command Dropdown */}
          <SlashCommandDropdown
            isOpen={showSlashCommands}
            onClose={() => setShowSlashCommands(false)}
            onSelect={handleSlashCommandSelect}
            position={dropdownPosition}
            width={inputContainerRef.current?.offsetWidth}
            searchTerm={slashSearchTerm}
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
              />
              <HStack spacing={1}>
                <Tooltip label={selectedAgent ? "Change Agent" : "Select Agent"}>
                  <Button
                    leftIcon={<RiRobot2Line />}
                    aria-label="Select Agent"
                    variant={selectedAgent ? "solid" : "ghost"}
                    size="sm"
                    color={selectedAgent ? bgPrimary : iconColor}
                    bg={selectedAgent ? iconColor : "transparent"}
                    onClick={() => setShowAgentModal(true)}
                    _hover={{
                      bg: selectedAgent ? iconColor : bgHover
                    }}
                    px={selectedAgent ? 3 : 2}
                  >
                    {selectedAgent && selectedAgent.name}
                  </Button>
                </Tooltip>
                {selectedAgent && (
                  <Tooltip label="Clear selected agent">
                    <IconButton
                      icon={<FiX />}
                      size="xs"
                      variant="ghost"
                      aria-label="Clear agent"
                      onClick={handleClearAgent}
                      color={iconColor}
                    />
                  </Tooltip>
                )}
              </HStack>
            </HStack>

            <HStack>


              <Tooltip label="Send message">
                  <IconButton
                    icon={<FiArrowUp />}
                    aria-label="Send message"
                    isDisabled={!input.trim()}
                    onClick={handleSendMessage}
                    variant="solid"
                    bg={input.trim() ? textPrimary : "transparent"}
                    color={input.trim() ? bgPrimary : iconColor}
                    _hover={{
                      bg: input.trim() ? textPrimary : "transparent",
                    }}
                    size="sm"
                    borderRadius="md"
                  />
              </Tooltip>
            </HStack>
          </Flex>
        </Flex>
      </Box>
      )}
      
      {/* Agent Selection Modal */}
      <AgentSelectionModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onSelectAgent={handleAgentSelect}
      />
    </Flex>
  );
};

export default ChatInterface;
