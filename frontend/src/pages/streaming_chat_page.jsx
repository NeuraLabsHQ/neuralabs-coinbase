// src/pages/streaming_chat_page.jsx
import { Box, Flex, Text } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StreamingChatInterface from '../components/chat_interface/StreamingChatInterface';
import ChatHistoryPanel from '../components/chat_interface/ChatHistoryPanel/ChatHistoryPanel';
import { useDisclosure } from '@chakra-ui/react';
import { agentAPI } from '../utils/agent-api';
import useUiColors from '../utils/uiColors';

/**
 * Streaming Chat Page
 * 
 * This page uses the new streaming chat interface that connects through
 * NeuraLabs backend to the HPC execution engine for real-time flow execution.
 */
const StreamingChatPage = () => {
  const { agentId } = useParams();
  const [agentData, setAgentData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const colors = useUiColors();

  // Get user ID from localStorage or JWT token
  useEffect(() => {
    // For now, using a dummy user ID - replace with actual auth
    setUserId('user-123');
    
    // Load initial chats
    const initialChats = [
      { id: '1', title: 'New Conversation' },
    ];
    setChats(initialChats);
  }, []);

  // Load agent data if agentId is provided
  useEffect(() => {
    const loadAgentData = async () => {
      if (agentId && userId) {
        try {
          const agent = await agentAPI.getAgentById(agentId);
          setAgentData(agent);
        } catch (error) {
          console.error('Error loading agent data:', error);
        }
      }
    };
    
    loadAgentData();
  }, [agentId, userId]);

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = { 
      id: newChatId, 
      title: `Chat with ${agentData?.name || 'Assistant'}` 
    };
    setChats([newChat, ...chats]);
    setSelectedChatId(newChatId);
  };

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleDeleteChat = (chatId) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  };

  const handleEditChatTitle = (chatId, title) => {
    setChats(chats.map(chat => chat.id === chatId ? { ...chat, title } : chat));
    setEditingChatId(null);
  };

  // If no agentId is provided, show error or redirect
  if (!agentId) {
    return (
      <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text>Please select an agent to start chatting.</Text>
      </Box>
    );
  }

  // If no userId, show loading or login prompt
  if (!userId) {
    return (
      <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text>Loading...</Text>
      </Box>
    );
  }

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
      <Flex flex="1" direction="column" h="100%" position="relative">
        <StreamingChatInterface
          agentId={agentId}
          userId={userId}
          agentData={agentData}
          isLanding={!selectedChatId}
        />
      </Flex>
    </Flex>
  );
};

export default StreamingChatPage;