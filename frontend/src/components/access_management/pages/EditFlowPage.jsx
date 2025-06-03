// src/components/access_management/pages/EditFlowPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

const EditFlowPage = ({ agentData }) => {
  const navigate = useNavigate();
  const toast = useToast();
  
  useEffect(() => {
    if (agentData) {
      // Check if mobile (screen width less than 1024px)
      const isMobile = window.innerWidth < 1024;
      
      if (isMobile) {
        toast({
          title: "Desktop Only",
          description: "The Flow Editor requires a desktop or laptop computer for the best experience. Please access this page from a larger screen.",
          status: "info",
          duration: 4000,
          isClosable: true,
          position: "top"
        });
        return;
      }
      
      // Redirect to flow-builder on desktop
      navigate(`/flow-builder/${agentData.agent_id}?mode=edit`, { 
        state: { 
          flowData: agentData,
          viewOnly: false // Allow editing
        } 
      });
    }
  }, [agentData, navigate, toast]);
  
  return null;
};

export default EditFlowPage;