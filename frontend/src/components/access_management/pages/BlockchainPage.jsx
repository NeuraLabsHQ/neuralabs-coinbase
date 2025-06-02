// src/components/access_management/pages/BlockchainPage.jsx
import { 
  Box, 
  VStack, 
  HStack,
  Text, 
  Heading,
  Divider,
  Badge,
  IconButton,
  useColorModeValue,
  Flex,
  Tooltip,
  Link
} from '@chakra-ui/react';
import { FiExternalLink, FiCopy, FiCheck } from 'react-icons/fi';
import colors from '../../../color';
import {useState,useEffect} from 'react';

const BlockchainPage = ({ agentData }) => {
  const [copiedField, setCopiedField] = useState(null);
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBg = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.flowCard.border.light, colors.accessManagement.flowCard.border.dark);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const labelColor = useColorModeValue(colors.gray[600], colors.gray[400]);
  
  const isPublished = agentData.status === 'Active';
  
  const handleCopy = (value, field) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Box p={6} bg={bgColor} h="100%" overflow="auto">
      <VStack align="stretch" spacing={6}>
        <Heading size="lg" color={textColor}>
          Blockchain Details
        </Heading>
        
        {!isPublished && (
          <Box bg={cardBg} p={4} borderRadius="md" border="1px" borderColor={borderColor}>
            <Text color={labelColor} textAlign="center">
              Agent not published to blockchain yet
            </Text>
          </Box>
        )}
        
        {/* Chain Details */}
        <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
          <Heading size="md" mb={4} color={textColor}>
            Chain Details
          </Heading>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="medium" color={labelColor}>Network:</Text>
              <Text color={textColor}>SUI Testnet</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontWeight="medium" color={labelColor}>Chain ID:</Text>
              <Text color={textColor} fontFamily="monospace">0x1</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontWeight="medium" color={labelColor}>RPC Endpoint:</Text>
              <Text color={textColor} fontSize="sm">https://fullnode.testnet.sui.io</Text>
            </HStack>
          </VStack>
        </Box>
        
        {/* Contract Address */}
        <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
          <Heading size="md" mb={4} color={textColor}>
            Contract Address
          </Heading>
          <HStack justify="space-between">
            <Text 
              color={textColor} 
              fontFamily="monospace" 
              fontSize="sm"
              wordBreak="break-all"
            >
              {agentData.contract_id || 'Not deployed'}
            </Text>
            {agentData.contract_id && (
              <HStack>
                <Tooltip label={copiedField === 'contract' ? 'Copied!' : 'Copy address'}>
                  <IconButton
                    icon={copiedField === 'contract' ? <FiCheck /> : <FiCopy />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(agentData.contract_id, 'contract')}
                    colorScheme={copiedField === 'contract' ? 'green' : 'gray'}
                  />
                </Tooltip>
              </HStack>
            )}
          </HStack>
        </Box>
        
        {/* Deployment Status */}
        <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
          <Heading size="md" mb={4} color={textColor}>
            Deployment Status
          </Heading>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="medium" color={labelColor}>Status:</Text>
              <Badge colorScheme={isPublished ? 'green' : 'orange'} fontSize="sm">
                {isPublished ? 'Deployed' : 'Not Deployed'}
              </Badge>
            </HStack>
            {isPublished && (
              <>
                <Divider />
                <HStack justify="space-between">
                  <Text fontWeight="medium" color={labelColor}>Deployed On:</Text>
                  <Text color={textColor} fontSize="sm">
                    {agentData.published_date ? new Date(agentData.published_date).toLocaleString() : 'Unknown'}
                  </Text>
                </HStack>
              </>
            )}
          </VStack>
        </Box>

        {/* NFT Details */}
        {isPublished && (
          <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} color={textColor}>
              NFT Details
            </Heading>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>NFT ID:</Text>
                <HStack>
                  <Text color={textColor} fontFamily="monospace" fontSize="sm">
                    {agentData.nft_id ? `${agentData.nft_id.slice(0, 10)}...${agentData.nft_id.slice(-8)}` : 'Not minted'}
                  </Text>
                  {agentData.nft_id && (
                    <Tooltip label={copiedField === 'nft' ? 'Copied!' : 'Copy NFT ID'}>
                      <IconButton
                        icon={copiedField === 'nft' ? <FiCheck /> : <FiCopy />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleCopy(agentData.nft_id, 'nft')}
                        colorScheme={copiedField === 'nft' ? 'green' : 'gray'}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>Access Cap ID:</Text>
                <HStack>
                  <Text color={textColor} fontFamily="monospace" fontSize="sm">
                    {agentData.other_data?.access_cap_id ? 
                      `${agentData.other_data.access_cap_id.slice(0, 10)}...${agentData.other_data.access_cap_id.slice(-8)}` 
                      : 'Not available'}
                  </Text>
                  {agentData.other_data?.access_cap_id && (
                    <Tooltip label={copiedField === 'accesscap' ? 'Copied!' : 'Copy Access Cap ID'}>
                      <IconButton
                        icon={copiedField === 'accesscap' ? <FiCheck /> : <FiCopy />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleCopy(agentData.other_data.access_cap_id, 'accesscap')}
                        colorScheme={copiedField === 'accesscap' ? 'green' : 'gray'}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Walrus Storage Details */}
        {isPublished && agentData.other_data && (
          <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} color={textColor}>
              Walrus Storage Details
            </Heading>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>Blob ID:</Text>
                <HStack>
                  <Text color={textColor} fontFamily="monospace" fontSize="sm">
                    {agentData.other_data.walrus_blob_id ? 
                      `${agentData.other_data.walrus_blob_id.slice(0, 10)}...` 
                      : 'Not available'}
                  </Text>
                  {agentData.other_data.walrus_blob_id && (
                    <Tooltip label={copiedField === 'blob' ? 'Copied!' : 'Copy Blob ID'}>
                      <IconButton
                        icon={copiedField === 'blob' ? <FiCheck /> : <FiCopy />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleCopy(agentData.other_data.walrus_blob_id, 'blob')}
                        colorScheme={copiedField === 'blob' ? 'green' : 'gray'}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>File Size:</Text>
                <Text color={textColor}>
                  {agentData.other_data.encryption_details?.file_size ? 
                    `${(agentData.other_data.encryption_details.file_size / 1024).toFixed(2)} KB` 
                    : 'Not available'}
                </Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>MIME Type:</Text>
                <Text color={textColor}>
                  {agentData.other_data.encryption_details?.mime_type || 'Not available'}
                </Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>Encrypted ID:</Text>
                <HStack>
                  <Text color={textColor} fontFamily="monospace" fontSize="xs">
                    {agentData.other_data.encryption_details?.encrypted_id ? 
                      `${agentData.other_data.encryption_details.encrypted_id.slice(0, 12)}...` 
                      : 'Not available'}
                  </Text>
                  {agentData.other_data.encryption_details?.encrypted_id && (
                    <Tooltip label={copiedField === 'encrypted' ? 'Copied!' : 'Copy Encrypted ID'}>
                      <IconButton
                        icon={copiedField === 'encrypted' ? <FiCheck /> : <FiCopy />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleCopy(agentData.other_data.encryption_details.encrypted_id, 'encrypted')}
                        colorScheme={copiedField === 'encrypted' ? 'green' : 'gray'}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </HStack>
            </VStack>
          </Box>
        )}
        
        {/* Explorer Links */}
        <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
          <Heading size="md" mb={4} color={textColor}>
            Explorer Links
          </Heading>
          <VStack align="stretch" spacing={3}>
            {agentData.contract_id && (
              <Link
                href={`https://suiexplorer.com/address/${agentData.contract_id}?network=testnet`}
                isExternal
                color="blue.400"
                _hover={{ textDecoration: 'underline' }}
              >
                <HStack>
                  <Text>View Contract on SUI Explorer</Text>
                  <FiExternalLink />
                </HStack>
              </Link>
            )}
            {agentData.nft_id && (
              <Link
                href={`https://suiexplorer.com/object/${agentData.nft_id}?network=testnet`}
                isExternal
                color="blue.400"
                _hover={{ textDecoration: 'underline' }}
              >
                <HStack>
                  <Text>View NFT on SUI Explorer</Text>
                  <FiExternalLink />
                </HStack>
              </Link>
            )}
            {agentData.other_data?.walrus_url && (
              <Link
                href={agentData.other_data.walrus_url}
                isExternal
                color="blue.400"
                _hover={{ textDecoration: 'underline' }}
              >
                <HStack>
                  <Text>View on Walrus Network</Text>
                  <FiExternalLink />
                </HStack>
              </Link>
            )}
            <Link
              href="https://suiscan.xyz/testnet/"
              isExternal
              color="blue.400"
              _hover={{ textDecoration: 'underline' }}
            >
              <HStack>
                <Text>SuiScan Explorer</Text>
                <FiExternalLink />
              </HStack>
            </Link>
            <Link
              href="https://faucet.sui.io"
              isExternal
              color="blue.400"
              _hover={{ textDecoration: 'underline' }}
            >
              <HStack>
                <Text>SUI Testnet Faucet</Text>
                <FiExternalLink />
              </HStack>
            </Link>
          </VStack>
        </Box>
        
        {/* Gas Fee Information (optional additional details) */}
        {isPublished && agentData.gas_fee && (
          <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} color={textColor}>
              Gas Fee Details
            </Heading>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>Total Gas Used:</Text>
                <Text color={textColor}>{agentData.gas_fee || '0.0'} SUI</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>Computation Cost:</Text>
                <Text color={textColor}>{agentData.computation_cost || '0.0'} SUI</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="medium" color={labelColor}>Storage Cost:</Text>
                <Text color={textColor}>{agentData.storage_cost || '0.0'} SUI</Text>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default BlockchainPage;