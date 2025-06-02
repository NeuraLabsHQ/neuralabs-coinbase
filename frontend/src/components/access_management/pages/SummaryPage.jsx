// src/components/access_management/pages/SummaryPage.jsx
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
    if (socials.discord) parts.push(`Discord: ${socials.discord}`);
    if (socials.telegram) parts.push(`Telegram: ${socials.telegram}`);
    return parts.length > 0 ? parts.join(' | ') : 'Not specified';
  };
  
  // Helper function to convert tags object to array
  const tagsToArray = (tags) => {
    if (Array.isArray(tags)) {
      return tags;
    } else if (tags && typeof tags === 'object') {
      // Convert object to array, sorting by keys
      return Object.keys(tags).sort((a, b) => parseInt(a) - parseInt(b)).map(key => tags[key]);
    }
    return [];
  };

  // Transform agent data to flow details format expected by FlowDetailComponent
  const flowDetails = {
    name: agentData.name || 'Unnamed Agent',
    description: agentData.description || 'No description available',
    tags: tagsToArray(agentData.tags),
    creationDate: agentData.creation_date ? new Date(agentData.creation_date).toLocaleString() : 
                  agentData.workflow?.metadata?.created_at ? new Date(agentData.workflow.metadata.created_at).toLocaleString() : 'Unknown',
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
    myAccess: agentData.access_level_name || 'Level 6',
    noOfAccess: agentData.access_count || '1',
    // Walrus and encryption data from other_data
    walrusBlobId: agentData.other_data?.walrus_blob_id || 'Not available',
    walrusUrl: agentData.other_data?.walrus_url || 'Not available',
    accessCapId: agentData.other_data?.access_cap_id || 'Not available',
    encryptedId: agentData.other_data?.encryption_details?.encrypted_id || 'Not available',
    fileSize: agentData.other_data?.encryption_details?.file_size 
      ? `${(agentData.other_data.encryption_details.file_size / 1024).toFixed(2)} KB` 
      : 'Not available',
    mimeType: agentData.other_data?.encryption_details?.mime_type || 'Not available',
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