// src/components/access_management/pages/SummaryPage.jsx
import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import FlowDetailComponent from '../FlowDetailComponent';
import colors from '../../../color';

const SummaryPage = ({ agentData }) => {
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  
  // Helper function to format socials
  const formatSocials = (socials) => {
    if (!socials || typeof socials !== 'object') return 'Not specified';
    const parts = [];
    if (socials.twitter) parts.push(`X: ${socials.twitter}`);
    if (socials.github) parts.push(`GitHub: ${socials.github}`);
    if (socials.linkedin) parts.push(`LinkedIn: ${socials.linkedin}`);
    if (socials.website) parts.push(`Website: ${socials.website}`);
    return parts.length > 0 ? parts.join(' | ') : 'Not specified';
  };
  
  // Transform agent data to flow details format expected by FlowDetailComponent
  const flowDetails = {
    name: agentData.name || 'Unnamed Agent',
    description: agentData.description || 'No description available',
    tags: Array.isArray(agentData.tags) ? agentData.tags : [],
    creationDate: agentData.created_at ? new Date(agentData.created_at).toLocaleString() : 'Unknown',
    owner: agentData.owner || 'Unknown',
    lastEdited: agentData.last_edited_time ? new Date(agentData.last_edited_time).toLocaleString() : 'Unknown',
    license: agentData.license || 'MIT',
    fork: agentData.fork || 'Original',
    socials: formatSocials(agentData.socials),
    actions: 'Edit | Chat | Visualize | Duplicate',
    deploymentStatus: agentData.status === 'Active' ? 'Active' : 'Not Published',
    md5: agentData.md5 || 'Not calculated',
    version: agentData.version || 'v0.1',
    publishedDate: agentData.published_date ? new Date(agentData.published_date).toLocaleString() : 'Not published',
    publishHash: agentData.published_hash || 'Agent not published',
    chain: 'SUI Testnet',
    chainId: '0x1',
    chainStatus: agentData.chain_status || 'Active',
    chainExplorer: 'https://suiscan.xyz/testnet/',
    contractName: agentData.contract_name || 'NeuraSynthesis',
    contractVersion: agentData.contract_version || 'v0.01',
    contractId: agentData.contract_id || 'Agent not published',
    nftId: agentData.nft_id || 'Agent not published',
    nftMintHash: agentData.nft_mint_hash || 'Agent not published',
    myAccess: agentData.access_level_name || 'Level 6',
    noOfAccess: agentData.access_count || '1',
    monetization: agentData.monetization || 'None',
  };

  return (
    <Box 
      p={6} 
      bg={bgColor} 
      h="100%" 
      overflow="auto"
    >
      <FlowDetailComponent 
        flowDetails={flowDetails}
      />
    </Box>
  );
};

export default SummaryPage;