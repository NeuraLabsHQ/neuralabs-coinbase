// src/components/access_management/AgentDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  useToast,
  Spinner,
  Center,
  Text
} from '@chakra-ui/react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AccessSidebar from './AccessSidebar';
import FlowActionPanel from './FlowActionPanel';
import { accessManagementApi } from '../../utils/access-api';
import colors from '../../color';

// Import page components (to be created)
import SummaryPage from './pages/SummaryPage';
import ChatPage from './pages/ChatPage';
import AccessControlPage from './pages/AccessControlPage';
import EditFlowPage from './pages/EditFlowPage';
import FlowViewPage from './pages/FlowViewPage';
import SettingsPage from './pages/SettingsPage';
import MetadataPage from './pages/MetadataPage';
import VersionPage from './pages/VersionPage';
import PublishPage from './pages/PublishPage';
import BlockchainPage from './pages/BlockchainPage';
import DownloadPage from './pages/DownloadPage';
import ComingSoonPage from './pages/ComingSoonPage';

const AgentDetailPage = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(searchParams.get('page') || 'summary');
  const [agentData, setAgentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default
  const toast = useToast();

  // Fetch agent data
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setIsLoading(true);
        // Fetch agent details from API
        const response = await accessManagementApi.getAgentDetails(agentId);
        setAgentData(response.data);
      } catch (error) {
        console.error('Error fetching agent data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load agent details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        // Redirect back to access management if agent not found
        navigate('/access-management');
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId) {
      fetchAgentData();
    }
  }, [agentId]);

  // Update URL when page changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (currentPage !== 'summary') {
      newSearchParams.set('page', currentPage);
    } else {
      newSearchParams.delete('page');
    }
    const newSearch = newSearchParams.toString();
    const newUrl = `/access-management/${agentId}${newSearch ? `?${newSearch}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentPage, agentId]);

  const handlePageChange = (page) => {
    // Handle special cases
    if (page === 'chat') {
      // Redirect to chat page with agent ID
      navigate(`/chat/${agentId}`);
      return;
    }
    
    setCurrentPage(page);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Render the appropriate page component based on currentPage
  const renderPageContent = () => {
    if (isLoading) {
      return (
        <Center h="100%" w="100%">
          <Spinner size="xl" color={colors.blue[500]} />
        </Center>
      );
    }

    if (!agentData) {
      return (
        <Center h="100%" w="100%">
          <Text>Agent not found</Text>
        </Center>
      );
    }

    // Map of page components
    const pageComponents = {
      'summary': <SummaryPage agentData={agentData} />,
      'access': <AccessControlPage agentData={agentData} />,
      'edit-flow': <EditFlowPage agentData={agentData} />,
      'flow-view': <FlowViewPage agentData={agentData} />,
      'settings': <SettingsPage agentData={agentData} onUpdate={setAgentData} />,
      'metadata': <MetadataPage agentData={agentData} onUpdate={setAgentData} />,
      'version': <VersionPage agentData={agentData} />,
      'publish': <PublishPage agentData={agentData} onUpdate={setAgentData} />,
      'blockchain': <BlockchainPage agentData={agentData} />,
      'download': <DownloadPage agentData={agentData} />,
      // Coming soon pages
      'analytics': <ComingSoonPage title="Analytics" />,
      'cost-estimation': <ComingSoonPage title="Cost Estimation" />,
      'monetization': <ComingSoonPage title="Monetization" />,
      'dependencies': <ComingSoonPage title="Dependencies Management" />,
      'collaborators': <ComingSoonPage title="Collaborators Management" />
    };

    return pageComponents[currentPage] || <SummaryPage agentData={agentData} />;
  };

  return (
    <Flex h="100%" w="100%" overflow="hidden">
      {/* Sidebar - slides in from left */}
      {sidebarOpen && (
        <AccessSidebar 
          selectedFlow={agentData}
          onSelectFlow={() => {}} // Not needed in detail view
          onViewChange={() => navigate('/access-management')}
          loading={isLoading}
        />
      )}
      
      {/* Flow Action Panel - always visible */}
      <FlowActionPanel 
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
      
      {/* Main Content */}
      <Box flex="1" h="100%" overflow="auto">
        {renderPageContent()}
      </Box>
    </Flex>
  );
};

export default AgentDetailPage;