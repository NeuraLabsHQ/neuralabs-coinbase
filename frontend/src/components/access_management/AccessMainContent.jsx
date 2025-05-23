// src/components/access_management/AccessMainContent.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Button,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiMoreHorizontal, FiFile } from 'react-icons/fi';
import { accessManagementApi } from '../../utils/access-api';
import { useNavigate } from 'react-router-dom';
import colors from '../../color';

const AccessMainContent = ({ currentView }) => {
  const [flowsData, setFlowsData] = useState({ my_flows: [], other_flows: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.sidebar.border.light, colors.accessManagement.sidebar.border.dark);
  const headingColor = useColorModeValue(colors.accessManagement.mainContent.heading.light, colors.accessManagement.mainContent.heading.dark);
  const textColor = useColorModeValue(colors.gray[600], colors.gray[300]);
  const tableHeaderBg = useColorModeValue(colors.gray[50], colors.gray[900]);
  const hoverBg = useColorModeValue(colors.gray[50], colors.gray[800]);
  const inputbgcolor = useColorModeValue('white', '#1f1f1f');
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('wallet_auth_token') || sessionStorage.getItem('zklogin_jwt_token');
      setIsAuthenticated(!!token);
      
      // Clear flows data if not authenticated
      if (!token) {
        setFlowsData({ my_flows: [], other_flows: {} });
      }
    };
    
    checkAuth();
    
    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'wallet_auth_token' || e.key === 'zklogin_jwt_token') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of programmatic token removal
    const interval = setInterval(checkAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch flows data
  useEffect(() => {
    const fetchFlowsData = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        const response = await accessManagementApi.getAllFlowsData();
        console.log('Fetched flows data:', response.data);
        setFlowsData(response.data);
      } catch (error) {
        console.error('Error fetching flows:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFlowsData();
  }, [isAuthenticated]);

  // Handle flow click - navigate to agent detail page
  const handleFlowClick = (flow) => {
    console.log('Selected flow:', flow);
    
    // Navigate to agent detail page with the agent ID
    navigate(`/access-management/${flow.agent_id}`);
  };

  // Get flows to display based on current view
  const getFlowsToDisplay = () => {
    if (!isAuthenticated) return [];
    
    switch (currentView) {
      case 'all':
        const allFlows = [...flowsData.my_flows];
        Object.values(flowsData.other_flows).forEach(levelFlows => {
          allFlows.push(...levelFlows);
        });
        return allFlows;
      case 'myFlows-made':
        return flowsData.my_flows.filter(flow => flow.status === 'Active');
      case 'myFlows-dev':
        return flowsData.my_flows.filter(flow => flow.status !== 'Active');
      default:
        if (currentView.startsWith('level-')) {
          const levelName = currentView.replace('level-', '');
          return flowsData.other_flows[levelName] || [];
        }
        return flowsData.my_flows;
    }
  };

  // Get heading text based on current view
  const getHeadingText = () => {
    switch (currentView) {
      case 'all':
        return 'All Flows';
      case 'myFlows-made':
        return 'Made by Me';
      case 'myFlows-dev':
        return 'Under Development';
      default:
        if (currentView.startsWith('level-')) {
          return currentView.replace('level-', '');
        }
        return 'My Flows';
    }
  };

  const flowsToDisplay = getFlowsToDisplay();
  
  // Filter flows by search query
  const filteredFlows = flowsToDisplay.filter(flow => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      flow.name?.toLowerCase().includes(searchLower) ||
      flow.description?.toLowerCase().includes(searchLower) ||
      flow.access_level_name?.toLowerCase().includes(searchLower)
    );
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'green';
      case 'published':
        return 'green';
      case 'not published':
        return 'orange';
      case 'draft':
        return 'gray';
      default:
        return 'gray';
    }
  };
  
  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Box 
        flex="1" 
        h="100%" 
        bg={bgColor} 
        p={6}
      >
        <Center h="100%">
          <VStack spacing={6}>
            <Alert status="info" borderRadius="lg" maxW="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Login Required</AlertTitle>
                <AlertDescription>
                  Please log in to view and create flows.
                </AlertDescription>
              </Box>
            </Alert>
            {/* <Button colorScheme="blue" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button> */}
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box 
      flex="1" 
      h="100%" 
      bg={bgColor}
      display="flex"
      flexDirection="column"
    >
      {/* Header Section */}
      <Flex 
        justify="space-between" 
        align="center" 
        p={6}
        borderBottom="1px"
        borderColor={borderColor}
      >
        <Heading 
          as="h1" 
          size="lg" 
          color={headingColor}
        >
          {getHeadingText()}
        </Heading>
        
        <HStack spacing={4}>
          {/* Search Input */}
          <InputGroup size="md" maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color={colors.gray[500]} />
            </InputLeftElement>
            <Input
              placeholder="Search my files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={inputbgcolor}
              borderColor={borderColor}
              _placeholder={{ color: colors.gray[500] }}
            />
          </InputGroup>
          
          {/* Filter Button */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiFilter />}
              variant="outline"
              aria-label="Filter"
            />
            <MenuList>
              <MenuItem>All Flows</MenuItem>
              <MenuItem>Published</MenuItem>
              <MenuItem>Draft</MenuItem>
              <MenuItem>Recently Modified</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Table Section */}
      <Box flex="1" overflowY="auto" p={6}>
        {/* Loading State */}
        {isLoading && (
          <Center h="full" py={10}>
            <VStack spacing={4}>
              <Spinner size="lg" color={colors.blue[500]} />
              <Text color={textColor}>Loading flows...</Text>
            </VStack>
          </Center>
        )}

        {/* Empty State */}
        {!isLoading && filteredFlows.length === 0 && (
          <Center h="full" py={20}>
            <VStack spacing={4}>
              <Text fontSize="lg" color={textColor}>
                {searchQuery ? 'No flows match your search' : 'No flows found'}
              </Text>
              <Text fontSize="sm" color={textColor}>
                {currentView === 'myFlows-dev' ? 
                  'You don\'t have any flows under development.' :
                  searchQuery ? 'Try adjusting your search terms.' :
                  'No flows are available for this view.'
                }
              </Text>
              {!searchQuery && (currentView === 'myFlows-made' || currentView === 'myFlows-dev') && (
                <Button colorScheme="blue" size="sm" onClick={() => navigate('/flow-builder')}>
                  Create New Flow
                </Button>
              )}
            </VStack>
          </Center>
        )}

        {/* Table Container with Border */}
        {!isLoading && filteredFlows.length > 0 && (
          <Box
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            overflow="hidden"
          >
            <Table variant="simple" size="md">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th color={textColor}>Name</Th>
                  <Th color={textColor}>Description</Th>
                  <Th color={textColor}>Access Level</Th>
                  <Th color={textColor}>Date Created</Th>
                  <Th color={textColor}>Status</Th>
                  <Th width="50px"></Th>
                </Tr>
              </Thead>
              <Tbody>
              {filteredFlows.map((flow) => (
                <Tr 
                  key={flow.agent_id}
                  _hover={{ bg: hoverBg, cursor: 'pointer' }}
                  onClick={() => handleFlowClick(flow)}
                >
                  <Td>
                    <HStack spacing={3}>
                      <Box
                        as={FiFile}
                        color="blue.500"
                        fontSize="20px"
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" color={headingColor}>
                          {flow.name || 'Unnamed Flow'}
                        </Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm" color={textColor} noOfLines={1}>
                      {flow.description || '-'}
                    </Text>
                  </Td>
                  <Td>
                    {flow.access_level_name ? (
                      <Badge size="sm" colorScheme="blue">
                        {flow.access_level_name}
                      </Badge>
                    ) : (
                      <Text fontSize="sm" color={textColor}>-</Text>
                    )}
                  </Td>
                  <Td>
                    <Text fontSize="sm" color={textColor}>
                      {formatDate(flow.creation_date)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge 
                      colorScheme={getStatusColor(flow.status)}
                      size="sm"
                    >
                      {flow.status === 'Active' ? 'Published' : flow.status || 'Draft'}
                    </Badge>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreHorizontal />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        <MenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleFlowClick(flow);
                        }}>
                          View Details
                        </MenuItem>
                        <MenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/access-management/${flow.agent_id}?page=edit-flow`);
                        }}>
                          Edit Flow
                        </MenuItem>
                        <MenuItem onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement share functionality
                        }}>
                          Share
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AccessMainContent;