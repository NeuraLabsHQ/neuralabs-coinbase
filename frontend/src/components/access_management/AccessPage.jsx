// src/components/access_management/AccessPage.jsx
import { Flex, useToast, useBreakpointValue, useDisclosure, IconButton, Box, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiKey } from 'react-icons/fi';
import { accessManagementApi } from '../../utils/access-api';
import AccessDetailPanel from './AccessDetailPanel';
import AccessHomePage from './AccessHomePage';
import AccessMainContent from './AccessMainContent';
import AccessSidebar from './AccessSidebar';
import SwapPage from './pages/SwapPage';

const AccessPage = () => {
  const [view, setView] = useState('home'); // Default to home view
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [flowAccessDetails, setFlowAccessDetails] = useState(null);
  const toast = useToast();
  
  // Responsive values
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Add loading state to prevent layout flash
  const [isBreakpointReady, setIsBreakpointReady] = useState(false);
  
  useEffect(() => {
    // Set ready state once breakpoint value is determined
    if (isMobile !== undefined) {
      setIsBreakpointReady(true);
    }
  }, [isMobile]);

  // Handle view change from sidebar
  const handleViewChange = (newView) => {
    setView(newView);
    setDetailPanelOpen(false);
    setSelectedFlow(null);
    // Close drawer on mobile after navigation
    if (isMobile) {
      onClose();
    }
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

  // Prevent render until breakpoint is determined to avoid layout flash
  if (!isBreakpointReady) {
    return (
      <Flex h="100%" w="100%" overflow="hidden" />
    );
  }

  return (
    <Flex h="100%" w="100%" overflow="hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AccessSidebar 
          onViewChange={handleViewChange}
          currentView={view}
          isMobile={false}
        />
      )}
      
      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Drawer
          isOpen={isOpen}
          placement="right"
          onClose={onClose}
          size="xs"
        >
          <DrawerOverlay />
          <DrawerContent maxW="280px">
            <DrawerCloseButton />
            <AccessSidebar 
              onViewChange={handleViewChange}
              currentView={view}
              isMobile={true}
              onClose={onClose}
            />
          </DrawerContent>
        </Drawer>
      )}
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <Box 
          position="fixed" 
          top={4} 
          right={4} 
          zIndex={10}
        >
          <IconButton
            icon={<FiKey size={24} />}
            onClick={onOpen}
            variant="ghost"
            aria-label="Open access menu"
            colorScheme="gray"
            size="lg"
          />
        </Box>
      )}
      
      {detailPanelOpen ? (
        <AccessDetailPanel 
          flowDetails={flowAccessDetails}
          onClose={handleCloseDetailPanel}
        />
      ) : view === 'home' ? (
        <AccessHomePage onSelectFlow={handleFlowSelect} />
      ) : view === 'swap' ? (
        <SwapPage />
      ) : (
        <AccessMainContent 
          currentView={view}
        />
      )}
    </Flex>
  );
};

export default AccessPage;