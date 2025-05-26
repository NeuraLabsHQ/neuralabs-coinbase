// src/components/access_management/AccessPage.jsx
import { Flex, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { accessManagementApi } from '../../utils/access-api';
import AccessDetailPanel from './AccessDetailPanel';
import AccessHomePage from './AccessHomePage';
import AccessMainContent from './AccessMainContent';
import AccessSidebar from './AccessSidebar';

const AccessPage = () => {
  const [view, setView] = useState('home'); // Default to home view
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [flowAccessDetails, setFlowAccessDetails] = useState(null);
  const toast = useToast();

  // Handle view change from sidebar
  const handleViewChange = (newView) => {
    setView(newView);
    setDetailPanelOpen(false);
    setSelectedFlow(null);
  };
    
  // Handle selection of a flow in the main content or home page
  const handleFlowSelect = async (flowId) => {
    try {
      // If we receive a flow object instead of just an ID (from AccessHomePage)
      const id = typeof flowId === 'object' ? flowId.id : flowId;
      
      const response = await accessManagementApi.getFlowAccess(id);
      setFlowAccessDetails(response.data);
      setSelectedFlow(id);
      setDetailPanelOpen(true);
    } catch (err) {
      console.error('Error fetching flow access details:', err);
      toast({
        title: "Error",
        description: "Failed to load flow access details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle closing the detail panel
  const handleCloseDetailPanel = () => {
    setDetailPanelOpen(false);
    setSelectedFlow(null);
  };

  return (
    <Flex h="100%" w="100%" overflow="hidden">
      <AccessSidebar 
        onViewChange={handleViewChange}
        currentView={view}
      />
      
      {detailPanelOpen ? (
        <AccessDetailPanel 
          flowDetails={flowAccessDetails}
          onClose={handleCloseDetailPanel}
        />
      ) : view === 'home' ? (
        <AccessHomePage onSelectFlow={handleFlowSelect} />
      ) : (
        <AccessMainContent 
          currentView={view}
        />
      )}
    </Flex>
  );
};

export default AccessPage;