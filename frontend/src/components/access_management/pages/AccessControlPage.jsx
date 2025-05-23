// src/components/access_management/pages/AccessControlPage.jsx
import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  HStack,
  Text, 
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Alert,
  AlertIcon,
  Heading,
  Divider
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiExternalLink } from 'react-icons/fi';
import colors from '../../../color';

const AccessControlPage = ({ agentData }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccessAddress, setNewAccessAddress] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState('1');
  const [accessList, setAccessList] = useState(agentData.access_list || []);
  
  const toast = useToast();
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBg = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.flowCard.border.light, colors.accessManagement.flowCard.border.dark);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const mutedColor = useColorModeValue(colors.gray[600], colors.gray[400]);
  
  const isPublished = agentData.status === 'Active';
  
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
      // TODO: API call to grant access
      const newAccess = {
        address: newAccessAddress,
        level: newAccessLevel,
        granted_date: new Date().toISOString()
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
      toast({
        title: 'Error',
        description: 'Failed to grant access',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };
  
  const handleRevokeAccess = async (address) => {
    try {
      // TODO: API call to revoke access
      setAccessList(accessList.filter(item => item.address !== address));
      
      toast({
        title: 'Access Revoked',
        description: `Successfully revoked access for ${address}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke access',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} bg={bgColor} h="100%" overflow="auto">
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Heading size="lg" color={textColor}>
            Blockchain Access Control
          </Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="sm"
            onClick={handleAddAccess}
          >
            Add Access
          </Button>
        </HStack>
        
        {!isPublished && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Text>
              This agent is not published yet. Please publish it first to manage access permissions.
            </Text>
          </Alert>
        )}
        
        {/* Blockchain Details */}
        <Box bg={cardBg} p={4} borderRadius="md" border="1px" borderColor={borderColor}>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text fontWeight="medium" color={mutedColor}>Chain:</Text>
              <Text color={textColor}>SUI Testnet</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontWeight="medium" color={mutedColor}>Contract Address:</Text>
              <HStack>
                <Text color={textColor} fontSize="sm" isTruncated maxW="300px">
                  {agentData.contract_id || 'Not deployed'}
                </Text>
                {agentData.contract_id && (
                  <IconButton
                    icon={<FiExternalLink />}
                    size="xs"
                    variant="ghost"
                    onClick={() => window.open(`https://explorer.sui.io/address/${agentData.contract_id}?network=testnet`, '_blank')}
                  />
                )}
              </HStack>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontWeight="medium" color={mutedColor}>Chain ID:</Text>
              <Text color={textColor}>0x1</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontWeight="medium" color={mutedColor}>Deployment Status:</Text>
              <Badge colorScheme={isPublished ? 'green' : 'orange'}>
                {isPublished ? 'Active' : 'Not Published'}
              </Badge>
            </HStack>
          </VStack>
        </Box>
        
        {/* Access List */}
        <Box>
          <Heading size="md" mb={4} color={textColor}>
            Access Permissions
          </Heading>
          <Box bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor} overflow="hidden">
            <Table variant="simple">
              <Thead bg={useColorModeValue(colors.gray[50], colors.gray[800])}>
                <Tr>
                  <Th>Address</Th>
                  <Th>Access Level</Th>
                  <Th>Granted Date</Th>
                  <Th width="100px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {accessList.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={8}>
                      <Text color={mutedColor}>No access permissions granted yet</Text>
                    </Td>
                  </Tr>
                ) : (
                  accessList.map((access, index) => (
                    <Tr key={index}>
                      <Td>
                        <HStack>
                          <Text fontSize="sm" isTruncated maxW="300px">{access.address}</Text>
                          <IconButton
                            icon={<FiExternalLink />}
                            size="xs"
                            variant="ghost"
                            onClick={() => window.open(`https://explorer.sui.io/address/${access.address}?network=testnet`, '_blank')}
                          />
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue">Level {access.level}</Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color={mutedColor}>
                          {new Date(access.granted_date).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td>
                        <IconButton
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleRevokeAccess(access.address)}
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
      
      {/* Add Access Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
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
              isDisabled={!newAccessAddress}
            >
              Grant Access
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AccessControlPage;