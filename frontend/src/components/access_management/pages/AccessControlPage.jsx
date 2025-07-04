// src/components/access_management/pages/AccessControlPage.jsx
import ComingSoonPage from './ComingSoonPage';

// Original imports preserved for future use
/*
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
  Flex
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import colors from '../../../color';
import { agentAPI } from '../../../utils/agent-api';
import { grantAccessToUser, revokeUserAccess, createAccessCap, getAccessCaps } from '../../../utils/blockchain';
import { useWallet } from '../../../contexts/WalletContextProvider';
*/


// Temporarily disabled - showing coming soon page
const AccessControlPage = ({ agentData }) => {
  return <ComingSoonPage title="Access Control" />;
};

// Original component preserved for future use
/*
const AccessControlPage = ({ agentData }) => {
  const [isAddModalOpen,    setIsAddModalOpen]    = useState(false);
  const [newAccessAddress,  setNewAccessAddress]  = useState('');
  const [newAccessLevel,    setNewAccessLevel]    = useState('1');
  const [accessList,        setAccessList]        = useState([]);
  const [isLoading,         setIsLoading]         = useState(false);
  const [accessCapId,       setAccessCapId]       = useState(null);
  const [isRefreshing,      setIsRefreshing]      = useState(false);
  
  const { address: walletAddress } = useWallet();
  
  const toast                                     = useToast();
  
  const bgColor     = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBg      = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.flowCard.border.light, colors.accessManagement.flowCard.border.dark);
  const textColor   = useColorModeValue(colors.gray[800], colors.gray[100]);
  const mutedColor  = useColorModeValue(colors.gray[600], colors.gray[400]);
  
  const isPublished = agentData.status === 'Active';
  const nftId       = agentData.nft_id || agentData.blockchain_data?.nft_id;
  
  // State for mobile detection with resize listener
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const checkMobile = () => window.innerWidth < 768;
      setIsMobile(checkMobile());
      
      const handleResize = () => setIsMobile(checkMobile());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Fetch existing access caps and access list on component mount
  useEffect(() => {
    const fetchAccessData = async () => {
      if (currentAccount && nftId && isPublished) {
        try {
          // Set global blockchain references
          window.suiClient      = suiClient;
          window.signAndExecute = signAndExecuteTransaction;
          window.currentAccount = currentAccount;
          window.config = {
            PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID,
            REGISTRY_ID: import.meta.env.VITE_REGISTRY_ID || import.meta.env.VITE_ACCESS_REGISTRY_ID,
            ACCESS_REGISTRY_ID : import.meta.env.VITE_ACCESS_REGISTRY_ID,
            // Add other required blockchain configuration
            WALRUS_PUBLISHER: import.meta.env.VITE_WALRUS_PUBLISHER_URL,
            WALRUS_AGGREGATOR: import.meta.env.VITE_WALRUS_AGGREGATOR_URL
          };
          
          // Fetch access caps
          const caps = await getAccessCaps(suiClient, window.config, currentAccount.address);
          // Find the access cap for this NFT
          const nftCap = caps.find(cap => cap.nft_id === nftId);
          if (nftCap) {
            setAccessCapId(nftCap.id);
          }
          
          // Fetch access list from backend
          try {
            const accessData = await agentAPI.getNFTAccessList(nftId);
            if (accessData && Array.isArray(accessData)) {
              setAccessList(accessData);
            }
          } catch (accessListError) {
            console.error('Error fetching access list:', accessListError);
            // Access list might be empty or user might not have permission
            // This is not critical, so we don't show an error toast
          }
        } catch (error) {
          console.error('Error fetching access data:', error);
        }
      }
    };
    
    fetchAccessData();
  }, [currentAccount, nftId, isPublished, suiClient, signAndExecuteTransaction]);
  
  const handleAddAccess = () => {
    if (!isPublished) {
      toast({
        title: 'Agent Not Published',
        description: 'Please publish the agent first before managing access.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setIsAddModalOpen(true);
  };
  
  const handleGrantAccess = async () => {
    try {
      setIsLoading(true);
      
      if (!nftId) {
        throw new Error('NFT ID not found. Please ensure the agent is published.');
      }
      
      if (!currentAccount) {
        throw new Error('Please connect your wallet first.');
      }
      
      // Step 1: Create access cap on blockchain if not exists
      let currentAccessCapId = accessCapId;
      if (!currentAccessCapId) {
        toast({
          title: 'Creating Access Cap',
          description: 'Initializing blockchain access control...',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        
        try {
          const accessCapResult = await createAccessCap(nftId, currentAccount.address);
          currentAccessCapId = accessCapResult.accessCapId;
          setAccessCapId(currentAccessCapId);
        } catch (capError) {
          console.error('Access cap creation error:', capError);
          throw new Error('Failed to create access cap. Please try again.');
        }
      }
      
      // Step 2: Grant access on blockchain
      toast({
        title: 'Granting Access',
        description: 'Processing blockchain transaction...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      const params = {
        nftId: nftId,
        userAddress: newAccessAddress,
        accessLevel: parseInt(newAccessLevel),
        accessCapId: currentAccessCapId
      }

          
      const blockchainResult = await grantAccessToUser(params);

      // Step 3: Update backend
      await agentAPI.grantNFTAccess(nftId, newAccessAddress, parseInt(newAccessLevel));
      
      // Update local state
      const newAccess = {
        address: newAccessAddress,
        level: newAccessLevel,
        granted_date: new Date().toISOString(),
        tx_digest: blockchainResult.digest
      };
      
      setAccessList([...accessList, newAccess]);
      setIsAddModalOpen(false);
      setNewAccessAddress('');
      setNewAccessLevel('1');
      
      toast({
        title: 'Access Granted',
        description: `Successfully granted Level ${newAccessLevel} access to ${newAccessAddress}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Grant access error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant access',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRevokeAccess = async (address) => {
    try {
      setIsLoading(true);
      
      if (!nftId) {
        throw new Error('NFT ID not found. Please ensure the agent is published.');
      }
      
      if (!currentAccount) {
        throw new Error('Please connect your wallet first.');
      }
      
      if (!accessCapId) {
        throw new Error('Access cap not found. Please initialize access control first.');
      }
      
      // Step 1: Revoke access on blockchain
      toast({
        title: 'Revoking Access',
        description: 'Processing blockchain transaction...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      await revokeUserAccess({
        client: suiClient,
        signAndExecute: signAndExecuteTransaction,
        currentAccount,
        nftId: nftId,
        userAddress: address,
        accessCapId: accessCapId
      });
      
      // Step 2: Update backend
      await agentAPI.revokeNFTAccess(nftId, address);
      
      // Update local state
      setAccessList(accessList.filter(item => item.address !== address));
      
      toast({
        title: 'Access Revoked',
        description: `Successfully revoked access for ${address}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Revoke access error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke access',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={isMobile ? 4 : 6} bg={bgColor} h="100%" overflow="auto">
      <VStack align="stretch" spacing={isMobile ? 4 : 6}>
        <Flex 
          justify="space-between" 
          direction={isMobile ? "column" : "row"}
          gap={isMobile ? 3 : 0}
        >
          <VStack align="start" spacing={0}>
            <Heading size={isMobile ? "md" : "lg"} color={textColor}>
              Blockchain Access Control
            </Heading>
            {nftId && (
              <Text fontSize="sm" color={mutedColor} wordBreak="break-all">
                NFT ID: {nftId.slice(0, 8)}...{nftId.slice(-6)}
              </Text>
            )}
          </VStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="sm"
            onClick={handleAddAccess}
            alignSelf={isMobile ? "stretch" : "auto"}
          >
            Add Access
          </Button>
        </Flex>
        
        {!isPublished && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Text>
              This agent is not published yet. Please publish it first to manage access permissions.
            </Text>
          </Alert>
        )}
        
        {/* Blockchain Details *\/}
        <Box bg={cardBg} p={isMobile ? 3 : 4} borderRadius="md" border="1px" borderColor={borderColor}>
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" direction={isMobile ? "column" : "row"} gap={isMobile ? 1 : 0}>
              <Text fontWeight="medium" color={mutedColor} fontSize={isMobile ? "sm" : "md"}>Chain:</Text>
              <Text color={textColor} fontSize={isMobile ? "sm" : "md"}>Base Sepolia Testnet</Text>
            </Flex>
            <Divider />
            <Flex justify="space-between" direction={isMobile ? "column" : "row"} gap={isMobile ? 1 : 0}>
              <Text fontWeight="medium" color={mutedColor} fontSize={isMobile ? "sm" : "md"}>Contract Address:</Text>
              <HStack spacing={2} w={isMobile ? "100%" : "auto"}>
                <Text 
                  color={textColor} 
                  fontSize="sm" 
                  wordBreak="break-all"
                  flex="1"
                >
                  {agentData.contract_id || agentData.blockchain_data?.contract_id || 'Not deployed'}
                </Text>
                {(agentData.contract_id || agentData.blockchain_data?.contract_id) && (
                  <IconButton
                    icon={<FiExternalLink />}
                    size="xs"
                    variant="ghost"
                    onClick={() => window.open(`https://testnet.suivision.xyz/package/${agentData.contract_id || agentData.blockchain_data?.contract_id}?network=testnet`, '_blank')}
                  />
                )}
              </HStack>
            </Flex>
            <Divider />
            <Flex justify="space-between" direction={isMobile ? "column" : "row"} gap={isMobile ? 1 : 0}>
              <Text fontWeight="medium" color={mutedColor} fontSize={isMobile ? "sm" : "md"}>Chain ID:</Text>
              <Text color={textColor} fontSize={isMobile ? "sm" : "md"}>0x1</Text>
            </Flex>
            <Divider />
            <Flex justify="space-between" direction={isMobile ? "column" : "row"} gap={isMobile ? 1 : 0}>
              <Text fontWeight="medium" color={mutedColor} fontSize={isMobile ? "sm" : "md"}>Deployment Status:</Text>
              <Badge colorScheme={isPublished ? 'green' : 'orange'} fontSize={isMobile ? "xs" : "sm"}>
                {isPublished ? 'Active' : 'Not Published'}
              </Badge>
            </Flex>
            <Divider />
            <Flex justify="space-between" direction={isMobile ? "column" : "row"} gap={isMobile ? 1 : 0}>
              <Text fontWeight="medium" color={mutedColor} fontSize={isMobile ? "sm" : "md"}>Access Cap:</Text>
              <Text color={textColor} fontSize="sm" wordBreak="break-all">
                {accessCapId || 'Not initialized'}
              </Text>
            </Flex>
          </VStack>
        </Box>
        
        {/* Access List *\/}
        <Box>
          <Flex justify="space-between" mb={4} direction={isMobile ? "column" : "row"} gap={isMobile ? 2 : 0}>
            <Heading size={isMobile ? "sm" : "md"} color={textColor}>
              Access Permissions
            </Heading>
            {isPublished && nftId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    // Refresh access list from backend
                    const accessData = await agentAPI.getNFTAccessList(nftId);
                    if (accessData && Array.isArray(accessData)) {
                      setAccessList(accessData);
                    }
                  } catch (error) {
                    console.error('Error refreshing access list:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to refresh access list',
                      status: 'error',
                      duration: 3000,
                      isClosable: true,
                    });
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                isLoading={isRefreshing}
                loadingText="Refreshing..."
              >
                Refresh
              </Button>
            )}
          </Flex>
          <Box bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor} overflow={isMobile ? "auto" : "hidden"}>
            <Table variant="simple" size={isMobile ? "sm" : "md"}>
              <Thead bg={useColorModeValue(colors.gray[50], colors.gray[800])}>
                <Tr>
                  <Th fontSize={isMobile ? "xs" : "sm"}>Address</Th>
                  <Th fontSize={isMobile ? "xs" : "sm"} display={{ base: "none", sm: "table-cell" }}>Access Level</Th>
                  <Th fontSize={isMobile ? "xs" : "sm"} display={{ base: "none", md: "table-cell" }}>Granted Date</Th>
                  <Th fontSize={isMobile ? "xs" : "sm"} width="100px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {accessList.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={8}>
                      <Text color={mutedColor} fontSize={isMobile ? "sm" : "md"}>No access permissions granted yet</Text>
                    </Td>
                  </Tr>
                ) : (
                  accessList.map((access, index) => (
                    <Tr key={index}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontSize={isMobile ? "xs" : "sm"} wordBreak="break-all">
                              {isMobile ? `${access.address.slice(0, 10)}...${access.address.slice(-8)}` : access.address}
                            </Text>
                            <IconButton
                              icon={<FiExternalLink />}
                              size="xs"
                              variant="ghost"
                              onClick={() => window.open(`https://explorer.sui.io/address/${access.address}?network=testnet`, '_blank')}
                            />
                          </HStack>
                          {isMobile && (
                            <Badge colorScheme="blue" size="sm">Level {access.level}</Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td display={{ base: "none", sm: "table-cell" }}>
                        <Badge colorScheme="blue">Level {access.level}</Badge>
                      </Td>
                      <Td display={{ base: "none", md: "table-cell" }}>
                        <Text fontSize="sm" color={mutedColor}>
                          {new Date(access.granted_date).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td>
                        <IconButton
                          icon={<FiTrash2 />}
                          size={isMobile ? "xs" : "sm"}
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleRevokeAccess(access.address)}
                          isDisabled={isLoading}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>
      
      {/* Add Access Modal *\/}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        size={isMobile ? "full" : "md"}
      >
        <ModalOverlay />
        <ModalContent 
          margin={isMobile ? 0 : undefined}
          borderRadius={isMobile ? "none" : "md"}
        >
          <ModalHeader>Grant Access Permission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Wallet Address</FormLabel>
                <Input
                  placeholder="0x..."
                  value={newAccessAddress}
                  onChange={(e) => setNewAccessAddress(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Access Level</FormLabel>
                <Select value={newAccessLevel} onChange={(e) => setNewAccessLevel(e.target.value)}>
                  <option value="1">Level 1 - Read Only</option>
                  <option value="2">Level 2 - Basic Access</option>
                  <option value="3">Level 3 - Enhanced Access</option>
                  <option value="4">Level 4 - Advanced Access</option>
                  <option value="5">Level 5 - Premium Access</option>
                  <option value="6">Level 6 - Full Access</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleGrantAccess}
              isDisabled={!newAccessAddress || isLoading}
              isLoading={isLoading}
              loadingText="Granting..."
            >
              Grant Access
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
*/

export default AccessControlPage;