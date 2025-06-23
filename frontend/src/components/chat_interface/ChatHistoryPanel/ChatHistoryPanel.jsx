
import { 
  Box, 
  VStack, 
  Button, 
  Text, 
  Flex, 
  IconButton, 
  Divider,
  useColorModeValue,
  Input,
  Tooltip,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiCheck, 
  FiX, 
  FiMessageCircle,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiSearch
} from 'react-icons/fi';
import { FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { useState } from 'react';
import colors from '../../../color';

const ChatHistoryPanel = ({ 
  isOpen, 
  chats = [], 
  selectedChatId, 
  onChatSelect, 
  onNewChat, 
  onDeleteChat, 
  onEditChatTitle,
  onToggleSidebar,
  editingChatId,
  setEditingChatId,
  newTitle,
  setNewTitle,
  isMobile = false,
  onSearchOpen
}) => {
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Colors that adapt to light/dark mode
  const bgColor = useColorModeValue(colors.chat.bgTertiary.light, colors.chat.bgTertiary.dark);
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);
  const textColor = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const mutedTextColor = useColorModeValue(colors.chat.textMuted.light, colors.chat.textMuted.dark);
  const selectedBgColor = useColorModeValue(colors.chat.bgSelected.light, colors.chat.bgSelected.dark);
  const hoverBgColor = useColorModeValue(colors.chat.bgHover.light, colors.gray[700]);
  const buttonBgColor = useColorModeValue(colors.chat.bgButton.light, colors.chat.bgButton.dark);
  const buttonHoverBgColor = useColorModeValue(colors.chat.bgButtonHover.light, colors.chat.bgButtonHover.dark);
  const iconColor = useColorModeValue(colors.chat.iconColor.light, colors.chat.iconColor.dark);
  
  // Filter chats based on search query
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleEditClick = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setNewTitle(currentTitle);
  };
  
  const handleSaveEdit = (chatId) => {
    if (newTitle.trim()) {
      onEditChatTitle(chatId, newTitle);
    }
    setEditingChatId(null);
  };
  
  const handleCancelEdit = () => {
    setEditingChatId(null);
  };

  // Collapsed sidebar view (not shown on mobile)
  if (!isOpen && !isMobile) {
    return (
      <Box
        w="56px"
        h="100%"
        bg={bgColor}
        borderRight="1px solid"
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        position="relative"
      >
        <VStack spacing={0} py={4}>
          {/* Logo / App icon */}
          {/* <Box w="40px" h="40px" display="flex" justifyContent="center" alignItems="center" mb={4}>
            <Box
              position="relative"
              w="36px"
              h="36px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="lg"
              bg={useColorModeValue('white', 'black')}
              border="2px solid"
              borderColor={useColorModeValue('black', 'white')}
              boxShadow={useColorModeValue(
                '2px 2px 0px 0px rgba(0,0,0,1)',
                '2px 2px 0px 0px rgba(255,255,255,1)'
              )}
              transition="all 0.2s ease"
              _hover={{
                transform: "translate(-2px, -2px)",
                boxShadow: useColorModeValue(
                  '4px 4px 0px 0px rgba(0,0,0,1)',
                  '4px 4px 0px 0px rgba(255,255,255,1)'
                )
              }}
              cursor="pointer"
            >
              <Text
                fontSize="xl"
                fontWeight="900"
                fontFamily="'Inter', system-ui, -apple-system, sans-serif"
                color={useColorModeValue('black', 'white')}
                letterSpacing="-0.05em"
                lineHeight="1"
                userSelect="none"
              >
                N
              </Text>
            </Box>
          </Box> */}
          
          {/* Expand sidebar button */}
          <Tooltip label="Expand sidebar" placement="right">
            <IconButton
              icon={<FaAngleDoubleRight size="16px" />}
              tel="Expand sidebar"
              variant="ghost"
              color={iconColor}
              _hover={{ color: textColor, bg: hoverBgColor }}
              onClick={onToggleSidebar}
              mb={4}
            />
          </Tooltip>
          
          {/* Search button */}
          <Tooltip label="Search conversations" placement="right">
            <IconButton
              icon={<FiSearch />}
              aria-label="Search conversations"
              variant="ghost"
              color={iconColor}
              _hover={{ color: textColor, bg: hoverBgColor }}
              onClick={onSearchOpen}
              mb={2}
            />
          </Tooltip>
          
          {/* New chat button */}
          <Tooltip label="New chat" placement="right">
            <IconButton
              icon={<FiPlus />}
              aria-label="New chat"
              variant="ghost"
              color={iconColor}
              _hover={{ color: textColor, bg: hoverBgColor }}
              onClick={onNewChat}
            />
          </Tooltip>
        </VStack>
      </Box>
    );
  }

  // Expanded sidebar view
  return (
    <Box
      w={isMobile ? "100%" : "280px"}
      minW={isMobile ? "100%" : "260px"}
      h="100%"
      borderRight={isMobile ? "none" : "1px solid"}
      borderColor={borderColor}
      bg={bgColor}
      transition="width 0.3s ease"
      overflow="hidden"
      position="relative"
      borderTopRadius={isMobile ? "xl" : "0"}
      display="flex"
      flexDirection="column"
      mb={0}
      pb={0}
    >
      <Flex direction="column" h="100%" minH="100%" overflow="hidden" bg={bgColor}>
        {/* Mobile drawer handle */}
        {isMobile && (
          <Flex justify="center" py={2}>
            <Box
              w="40px"
              h="4px"
              bg={borderColor}
              borderRadius="full"
              
            />
          </Flex>
        )}
        
        <Flex p={4} borderBottom="1px solid" borderColor={borderColor} align="center" justify="space-between">
          <Text fontWeight="bold" color={textColor}>Neural Chat</Text>
          {isMobile ? (
            <Button 
              leftIcon={<FiPlus />} 
              onClick={onNewChat} 
              size="sm"
              bg={buttonBgColor}
              color={textColor}
              _hover={{ bg: buttonHoverBgColor }}
              boxShadow="sm"
              borderRadius="md"
            >
              New Chat
            </Button>
          ) : (
            <IconButton
              icon={<FaAngleDoubleLeft size="16px" />}
              aria-label="Collapse sidebar"
              variant="ghost"
              size="sm"
              color={iconColor}
              _hover={{ color: textColor }}
              onClick={onToggleSidebar}
            />
          )}
        </Flex>
        
        <Box px={3} pt={3} pb={2}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color={iconColor} />
            </InputLeftElement>
            {isMobile ? (
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={buttonBgColor}
                border="1px solid"
                borderColor={borderColor}
                color={textColor}
                _placeholder={{ color: mutedTextColor }}
                _hover={{ bg: buttonHoverBgColor }}
                _focus={{ boxShadow: 'none', borderColor: borderColor }}
              />
            ) : (
              <Input
                placeholder="Search conversations..."
                onClick={onSearchOpen}
                readOnly
                cursor="pointer"
                bg={buttonBgColor}
                border="1px solid"
                borderColor={borderColor}
                color={textColor}
                _placeholder={{ color: mutedTextColor }}
                _hover={{ bg: buttonHoverBgColor }}
                _focus={{ boxShadow: 'none' }}
              />
            )}
          </InputGroup>
        </Box>
        
        {!isMobile && (
          <Box px={3} pb={3}>
            <Button 
              leftIcon={<FiPlus />} 
              onClick={onNewChat} 
              width="100%" 
              bg={buttonBgColor}
              color={textColor}
              _hover={{ bg: buttonHoverBgColor }}
              boxShadow="sm"
              borderRadius="md"
            >
              New Chat
            </Button>
          </Box>
        )}
        
        <Box px={3} py={2}>
          <Text fontSize="xs" fontWeight="medium" color={mutedTextColor} textTransform="uppercase">
            Recent chats
          </Text>
        </Box>
        
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          bg={bgColor}
          pb={0}
          sx={{
            '&::-webkit-scrollbar': {
              width: isMobile ? '4px' : '6px',
            },
            '&::-webkit-scrollbar-track': {
              bg: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bg: borderColor,
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              bg: mutedTextColor,
            },
            // Add webkit overflow scrolling for smooth scrolling on iOS
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <VStack 
            spacing={0} 
            align="stretch"
            minH="100%"
          >
          {(isMobile ? filteredChats : chats).map(chat => (
            <Box 
              key={chat.id} 
              role="group"
              borderRadius="md"
              mx={2}
              mb={1}
            >
              {editingChatId === chat.id ? (
                <Flex p={2} align="center">
                  <Input 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    size="sm"
                    autoFocus
                    color={textColor}
                    bg={buttonBgColor}
                    border="none"
                    _focus={{ boxShadow: "none" }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit(chat.id);
                      }
                    }}
                  />
                  <IconButton
                    icon={<FiCheck />}
                    aria-label="Save"
                    variant="ghost"
                    size="sm"
                    ml={1}
                    onClick={() => handleSaveEdit(chat.id)}
                  />
                  <IconButton
                    icon={<FiX />}
                    aria-label="Cancel"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                  />
                </Flex>
              ) : (
                <Flex
                  p={2}
                  bg={selectedChatId === chat.id ? selectedBgColor : "transparent"}
                  _hover={{ bg: selectedChatId === chat.id ? selectedBgColor : hoverBgColor }}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onChatSelect(chat.id)}
                  justify="space-between"
                  align="center"
                >
                  <Flex align="center">
                    <Box as={FiMessageCircle} mr={2} color={iconColor} />
                    <Text color={textColor} fontSize="sm" isTruncated maxW={isMobile ? "250px" : "180px"}>{chat.title}</Text>
                  </Flex>
                  <Flex 
                    visibility="hidden" 
                    _groupHover={{ visibility: "visible" }}
                  >
                    <IconButton
                      icon={<FiMoreVertical />}
                      aria-label="More options"
                      variant="ghost"
                      size="xs"
                      color={iconColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        // In a real app, this would open a dropdown with edit/delete options
                        handleEditClick(chat.id, chat.title);
                      }}
                    />
                  </Flex>
                </Flex>
              )}
            </Box>
          ))}
          
          {/* Show no results message on mobile when searching */}
          {isMobile && searchQuery && filteredChats.length === 0 && (
            <Text 
              textAlign="center" 
              color={mutedTextColor} 
              fontSize="sm" 
              mt={4}
              px={4}
            >
              No conversations found matching "{searchQuery}"
            </Text>
          )}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

export default ChatHistoryPanel;