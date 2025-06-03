import { Box, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FlowBuilder from '../components/flow_builder/flow_builder';
import { agentAPI } from '../utils/agent-api';

/**
 * Flow Builder Page
 * 
 * This page wraps the FlowBuilder component and can be used
 * to add page-specific logic, headers, or additional UI elements
 * surrounding the flow builder.
 */
const FlowBuilderPage = ({ 
  sidebarOpen, 
  marketplacePanelOpen,
  toggleSidebar,
  toggleMarketplacePanel 
}) => {
  const { agentId } = useParams();
  const [agentData, setAgentData] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchAgentData = async () => {
      if (agentId) {
        try {
          const data = await agentAPI.getAgent(agentId);
          setAgentData(data);
        } catch (error) {
          console.error('Error fetching agent data:', error);
          toast({
            title: 'Error loading agent',
            description: 'Failed to load agent data. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    fetchAgentData();
  }, [agentId, toast]);

  return (
    <Box w="100%" h="100%" overflow="hidden">
      <FlowBuilder 
        sidebarOpen={sidebarOpen} 
        marketplacePanelOpen={marketplacePanelOpen}
        toggleSidebar={toggleSidebar}
        toggleMarketplacePanel={toggleMarketplacePanel}
        agentId={agentId}
        agentData={agentData}
      />
    </Box>
  );
};

export default FlowBuilderPage;