import {
    Box,
    Flex,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Spinner,
    Text,
    Tooltip,
    useColorModeValue,
    VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiHome, FiList, FiSearch } from 'react-icons/fi';
import colors from '../../color';
import { accessManagementApi } from '../../utils/access-api'; // Updated import path
import SidebarItem from './SidebarItem';
import { useWallet } from '../../contexts/WalletContextProvider';


const AccessSidebar = ({ onViewChange, loading = false, isMobile = false }) => {
  const [myFlows, setMyFlows] = useState([]);
  const [otherFlows, setOtherFlows] = useState({});
  const [publishedFlows, setPublishedFlows] = useState([]);
  const [underDevelopmentFlows, setUnderDevelopmentFlows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    myFlows: true,
    otherFlows: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { address: walletAddress } = useWallet();

  const bgColor = useColorModeValue(colors.accessManagement.sidebar.bg.light, colors.accessManagement.sidebar.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.sidebar.border.light, colors.accessManagement.sidebar.border.dark);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('wallet_auth_token');
      setIsAuthenticated(!!token);
      
      // Clear flows data if not authenticated
      if (!token) {
        setMyFlows([]);
        setOtherFlows({});
        setPublishedFlows([]);
        setUnderDevelopmentFlows([]);
      }
    };
    
    checkAuth();
    
    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'wallet_auth_token') {
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
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        // Fetch all flows data
        const response = await accessManagementApi.getAllFlowsData();
        const data = response.data;
        
        // Set my flows
        if (data.my_flows) {
          setMyFlows(data.my_flows);
          
          // Separate published and under development flows
          const published = data.my_flows.filter(flow => flow.status === 'Active');
          const underDev = data.my_flows.filter(flow => flow.status !== 'Active');
          setPublishedFlows(published);
          setUnderDevelopmentFlows(underDev);
        }
        
        // Set other flows
        if (data.other_flows) {
          setOtherFlows(data.other_flows);
          
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated]);

  // Filter flows by search query
  const filterFlows = (flows) => {
    if (!searchQuery) return flows;
    return flows.filter(flow => 
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle view change
  // Handle view change
  const handleViewChange = (newView) => {
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  return (
    <Box 
      w={isMobile ? "100%" : "280px"}
      minWidth={isMobile ? "unset" : "280px"} 
      h="100%" 
      bg={bgColor} 
      borderRight={!isMobile ? "1px" : "none"} 
      borderColor={borderColor}
      position="relative"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <Text fontWeight="bold" fontSize="xl">My Flows</Text>
        <InputGroup size="sm" mt={3}>
        <InputLeftElement pointerEvents="none" height="100%" pl={1}>
          <Icon as={FiSearch} color={colors.gray[500]} fontSize="14px" />
        </InputLeftElement>
        <Input 
          placeholder="Search..." 
          value={searchQuery}
          onChange={handleSearchChange}
          borderRadius="md"
          bg={useColorModeValue(colors.accessManagement.sidebar.bg.light, colors.gray[800])}
          _placeholder={{ color: colors.gray[500], fontSize: "13px" }}
          _focus={{ 
            borderColor: colors.blue[300], 
            boxShadow: `0 0 0 1px ${colors.blue[300]}` 
          }}
        />
      </InputGroup>
      </Box>
      
      {/* Navigation Items - wrap in a scrollable container */}
      <Box flex="1" overflow="auto">
        <VStack align="stretch" spacing={0}>
          {/* Home */}
          <SidebarItem 
            label="Home" 
            isActive={false} 
            onClick={() => handleViewChange('home')}
            icon={FiHome}
          />
          
          {/* All Flows */}
          <SidebarItem 
            label="All Flows" 
            isActive={false} 
            onClick={() => handleViewChange('all')}
            icon={FiList}
          />
          
          {/* My Flows Section */}
          <SidebarItem 
            label="My Flows" 
            isSection 
            isExpanded={expandedSections.myFlows}
            onClick={() => toggleSection('myFlows')}
          />
          
          {expandedSections.myFlows && (
            <>
              <SidebarItem 
                label="Made by me" 
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('myFlows-made')}
              />
              <SidebarItem 
                label="Under Development" 
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('myFlows-dev')}
              />
            </>
          )}
          
          {/* Other Flows Section */}
          <SidebarItem 
            label="Other Flows" 
            isSection 
            isExpanded={expandedSections.otherFlows}
            onClick={() => toggleSection('otherFlows')}
          />
          
          {expandedSections.otherFlows && (
            <>
              <SidebarItem 
                label="Access Level 6"
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('level-Access Level 6')}
              />
              <SidebarItem 
                label="Access Level 5"
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('level-Access Level 5')}
              />
              <SidebarItem 
                label="Access Level 4"
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('level-Access Level 4')}
              />
              <SidebarItem 
                label="Access Level 3"
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('level-Access Level 3')}
              />
              <SidebarItem 
                label="Access Level 2"
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('level-Access Level 2')}
              />
              <SidebarItem 
                label="Access Level 1"
                indentLevel={1}
                isActive={false}
                onClick={() => handleViewChange('level-Access Level 1')}
              />
            </>
          )}
          
          {/* Projects Section - Coming Soon */}
          <Tooltip label="Coming Soon" placement="right" hasArrow>
            <Box>
              <SidebarItem 
                label="Projects" 
                isSection 
                isExpanded={false}
                onClick={() => {}} // Disabled for now
              />
            </Box>
          </Tooltip>
        </VStack>
        
        {/* Loading indicator */}
        {(isLoading || loading) && (
          <Flex justify="center" my={4}>
            <Spinner size="sm" color={colors.blue[500]} />
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default AccessSidebar;