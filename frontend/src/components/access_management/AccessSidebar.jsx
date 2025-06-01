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
    HStack,
    Button
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiHome, FiList, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { RiExchangeLine } from 'react-icons/ri';
import colors from '../../color';
import { accessManagementApi } from '../../utils/access-api'; // Updated import path
import SidebarItem from './SidebarItem';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { getSuiBalance, getWalBalance, formatBalance } from '../../lib/blockchain_module/exchange';


const AccessSidebar = ({ selectedFlow, onSelectFlow, onViewChange, loading = false }) => {
  const [myFlows, setMyFlows] = useState([]);
  const [otherFlows, setOtherFlows] = useState({});
  const [publishedFlows, setPublishedFlows] = useState([]);
  const [underDevelopmentFlows, setUnderDevelopmentFlows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    myFlows: true,
    otherFlows: true
  });
  const [expandedLevels, setExpandedLevels] = useState({});
  const [view, setView] = useState('home'); // 'home', 'all', 'myFlows', 'otherFlows', etc.
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [suiBalance, setSuiBalance] = useState('0');
  const [walBalance, setWalBalance] = useState('0');
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  const account = useCurrentAccount();
  const client = useSuiClient();
  
  // WAL Token configuration  
  const WAL_TOKEN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';

  const bgColor = useColorModeValue(colors.accessManagement.sidebar.bg.light, colors.accessManagement.sidebar.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.sidebar.border.light, colors.accessManagement.sidebar.border.dark);
  const hoverBgColor = useColorModeValue(colors.accessManagement.sidebar.itemHover.light, colors.accessManagement.sidebar.itemHover.dark);
  const balanceBoxBg = useColorModeValue(colors.gray[50], colors.gray[800]);
  const balanceTextColor = useColorModeValue(colors.gray[700], colors.gray[200]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('wallet_auth_token') || sessionStorage.getItem('zklogin_jwt_token');
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
          
          // Initialize expanded state for levels
          const initialExpandedLevels = {};
          Object.keys(data.other_flows).forEach(level => {
            initialExpandedLevels[level] = false;
          });
          setExpandedLevels(initialExpandedLevels);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated]);
  
  // Load balances
  const loadBalances = async () => {
    if (!account || !client) return;
    
    setLoadingBalances(true);
    try {
      // Get SUI balance
      const suiBalanceData = await getSuiBalance(client, account.address);
      setSuiBalance(formatBalance(suiBalanceData.totalBalance, 9));
      
      // Get WAL balance
      const walBalanceData = await getWalBalance(client, account.address, WAL_TOKEN_TYPE);
      setWalBalance(formatBalance(walBalanceData.totalBalance, 9));
    } catch (error) {
      console.error('Error loading balances:', error);
    } finally {
      setLoadingBalances(false);
    }
  };
  
  // Load balances on mount and when account changes
  useEffect(() => {
    if (account && client) {
      loadBalances();
    }
  }, [account, client]);

  // Filter flows by search query
  const filterFlows = (flows) => {
    if (!searchQuery) return flows;
    return flows.filter(flow => 
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Apply search filter to all flows
  const filteredMyFlows = filterFlows(myFlows);
  const filteredPublishedFlows = filterFlows(publishedFlows);
  const filteredUnderDevelopmentFlows = filterFlows(underDevelopmentFlows);
  
  const filteredOtherFlows = {};
  Object.entries(otherFlows).forEach(([level, flows]) => {
    const filtered = filterFlows(flows);
    if (filtered.length > 0) {
      filteredOtherFlows[level] = filtered;
    }
  });
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle level expansion
  const toggleLevel = (levelId) => {
    setExpandedLevels(prev => ({
      ...prev,
      [levelId]: !prev[levelId]
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
  
  // Handle flow selection
  const handleSelectFlow = (flow) => {
    if (onSelectFlow) {
      onSelectFlow(flow);
    }
  };

  return (
    <Box 
      // w="280px"
      minWidth={"280px"} 
      h="100%" 
      bg={bgColor} 
      borderRight="1px" 
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
            isActive={view === 'home'} 
            onClick={() => handleViewChange('home')}
            icon={FiHome}
          />
          
          {/* All Flows */}
          <SidebarItem 
            label="All Flows" 
            isActive={view === 'all'} 
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
                isActive={view === 'myFlows-made'}
                onClick={() => handleViewChange('myFlows-made')}
              />
              <SidebarItem 
                label="Under Development" 
                indentLevel={1}
                isActive={view === 'myFlows-dev'}
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
                isActive={view === 'level-Access Level 6'}
                onClick={() => handleViewChange('level-Access Level 6')}
              />
              <SidebarItem 
                label="Access Level 5"
                indentLevel={1}
                isActive={view === 'level-Access Level 5'}
                onClick={() => handleViewChange('level-Access Level 5')}
              />
              <SidebarItem 
                label="Access Level 4"
                indentLevel={1}
                isActive={view === 'level-Access Level 4'}
                onClick={() => handleViewChange('level-Access Level 4')}
              />
              <SidebarItem 
                label="Access Level 3"
                indentLevel={1}
                isActive={view === 'level-Access Level 3'}
                onClick={() => handleViewChange('level-Access Level 3')}
              />
              <SidebarItem 
                label="Access Level 2"
                indentLevel={1}
                isActive={view === 'level-Access Level 2'}
                onClick={() => handleViewChange('level-Access Level 2')}
              />
              <SidebarItem 
                label="Access Level 1"
                indentLevel={1}
                isActive={view === 'level-Access Level 1'}
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
      
      {/* Balance Box and Swap Button - fixed at bottom */}
      <Box 
        p={4} 
        borderTop="1px"
        borderColor={borderColor} 
        bg={bgColor}
      >
        <Box
          p={3}
          bg={balanceBoxBg}
          borderRadius="md"
          border="1px"
          borderColor={borderColor}
          mb={3}
        >
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium" color={balanceTextColor}>
              Wallet Balances
            </Text>
            <Icon
              as={FiRefreshCw}
              fontSize="sm"
              color={colors.gray[500]}
              cursor="pointer"
              onClick={loadBalances}
              className={loadingBalances ? 'animate-spin' : ''}
              _hover={{ color: colors.blue[500] }}
            />
          </HStack>
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text fontSize="xs" color={colors.gray[500]}>SUI</Text>
              <Text fontSize="sm" fontWeight="semibold" color={balanceTextColor}>
                {loadingBalances ? '...' : suiBalance}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color={colors.gray[500]}>WAL</Text>
              <Text fontSize="sm" fontWeight="semibold" color={balanceTextColor}>
                {loadingBalances ? '...' : walBalance}
              </Text>
            </HStack>
          </VStack>
        </Box>
        
        <Button
          leftIcon={<RiExchangeLine />}
          size="sm"
          w="100%"
          variant="outline"
          colorScheme="blue"
          onClick={() => handleViewChange('swap')}
          isDisabled={!account}
        >
          Swap SUI to WAL
        </Button>
      </Box>
    </Box>
  );
};

export default AccessSidebar;