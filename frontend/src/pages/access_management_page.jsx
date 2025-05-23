// src/pages/access_management_page.jsx
import React from 'react';
import { Box } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import AccessPage from '../components/access_management/AccessPage';
import AgentDetailPage from '../components/access_management/AgentDetailPage';

/**
 * Access Management Page
 * 
 * This page wraps the AccessPage component and handles routing.
 * If an agentId is present in the URL, it shows the agent detail page.
 */
const AccessManagementPage = () => {
  const { agentId } = useParams();

  return (
    <Box w="100%" h="100%" overflow="hidden">
      {agentId ? <AgentDetailPage /> : <AccessPage />}
    </Box>
  );
};

export default AccessManagementPage;