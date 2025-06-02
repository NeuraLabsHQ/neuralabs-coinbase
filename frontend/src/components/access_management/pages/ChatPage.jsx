// src/components/access_management/pages/ChatPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatPage = ({ agentData }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to chat interface with agent ID
    navigate(`/chat/${agentData.agent_id}`);
  }, [agentData, navigate]);
  
  return null;
};

export default ChatPage;