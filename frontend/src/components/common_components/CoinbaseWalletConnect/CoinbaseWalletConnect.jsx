import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  useColorModeValue,
  Flex,
  Tooltip,
  useColorMode,
  Alert,
  AlertIcon,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputRightAddon,
  useToast,
  ButtonGroup
} from '@chakra-ui/react';
import { FiExternalLink, FiCopy, FiCheckCircle, FiAlertCircle, FiSend, FiRefreshCw } from 'react-icons/fi';

// Import wallet context to get wallet state and actions
import { useWallet } from '../../../contexts/WalletContextProvider';
import { getPublicClient, getWalletClient } from '@wagmi/core';
import { config } from '../../../config/wagmi';
import { getOrCreateAgentWallet, getAgentWalletDetails, getAgentBalance, transferUsdcToAgent, formatBalance } from '../../../utils/agent-wallet-api';

import coinbaseConnected from '../../../assets/icons/coinbase-connected.svg';
import coinbaseLight from '../../../assets/icons/coinbase-light.svg';
import coinbaseDark from '../../../assets/icons/coinbase-dark.svg';
import ethereumIcon from '../../../assets/icons/ethereum.svg';
import usdcIcon from '../../../assets/icons/usdc.svg';

export default function CoinbaseWalletConnect({ 
  viewOnlyMode = false,
  onClose = null
}) {
  // Get wallet state and actions from context first
  const {
    isConnected,
    isConnecting,
    isDisconnecting,
    isAuthenticating,
    isAuthenticated,
    account,
    formattedAddress,
    formattedBalance,
    formattedUsdcBalance,
    chainId,
    userId,
    connect,
    disconnect,
    updateBalance,
    updateUsdcBalance
  } = useWallet();
  
  // State for agent wallet
  const [agentWallet, setAgentWallet] = useState(null);
  const [agentBalance, setAgentBalance] = useState({ eth: null, usdc: null });
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [fundingCurrency, setFundingCurrency] = useState('USDC'); // 'USDC' or 'ETH'
  const [isRefreshingUserBalance, setIsRefreshingUserBalance] = useState(false);
  const [isRefreshingAgentBalance, setIsRefreshingAgentBalance] = useState(false);
  
  // Hooks for blockchain interaction
  const [publicClient, setPublicClient] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const [tabIndex, setTabIndex] = useState(0);
  
  // Initialize clients when connected
  useEffect(() => {
    if (isConnected) {
      const initClients = async () => {
        try {
          const pubClient = getPublicClient(config);
          setPublicClient(pubClient);
          
          const walClient = await getWalletClient(config);
          setWalletClient(walClient);
        } catch (error) {
          console.error('Failed to initialize clients:', error);
        }
      };
      initClients();
    }
  }, [isConnected]);

  // Color mode values
  const bgColor = useColorModeValue('white', '#18191b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textMutedColor = useColorModeValue('gray.600', 'gray.400');

  const handleConnect = async () => {
    if (viewOnlyMode) {
      return;
    }
    
    try {
      await connect();
    } catch (err) {
      // Error is handled in the context
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Clear stored agent wallet keys
      sessionStorage.removeItem('agent_private_key');
      sessionStorage.removeItem('agent_public_key');
      console.log('Agent wallet keys cleared from session storage');
    } catch (err) {
      // Error is handled in the context
    }
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
    }
  };

  const openExplorer = () => {
    if (account?.address) {
      // Base Sepolia explorer
      const explorerUrl = `https://sepolia.basescan.org/address/${account.address}`;
      window.open(explorerUrl, '_blank');
    }
  };

  const getCoinbaseIcon = () => {
    if (isConnected) {
      return coinbaseConnected;
    } else {
      return colorMode === 'light' ? coinbaseLight : coinbaseDark;
    }
  };

  // Load agent wallet when authenticated
  useEffect(() => {
    console.log('isAuthenticated:', isAuthenticated);
    if (isAuthenticated && !agentWallet && !isLoadingAgent) {
      console.log('Loading agent wallet...');
      loadAgentWallet();
    }
  }, [isAuthenticated]);

  // Load agent balance when agent wallet is available
  useEffect(() => {
    if (agentWallet?.agent_public_key && publicClient) {
      loadAgentBalance();
    }
  }, [agentWallet, publicClient]);

  const loadAgentWallet = async () => {
    setIsLoadingAgent(true);
    
    try {
      const result = await getOrCreateAgentWallet();
      setAgentWallet(result);
      
      // Fetch wallet details including private key
      const walletDetails = await getAgentWalletDetails(true); // true to include private key
      console.log('Agent wallet details loaded:', walletDetails);
      if (walletDetails.agent_private_key) {
        // Store private key in sessionStorage
        sessionStorage.setItem('agent_private_key', walletDetails.agent_private_key);
        sessionStorage.setItem('agent_public_key', walletDetails.agent_public_key);
        console.log('Agent wallet keys stored in session storage');
      }
      
      // Only show toast if a new wallet was created
      if (result.created) {
        toast({
          title: 'Agent Wallet Created',
          description: 'Your agent wallet has been created successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Failed to load agent wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agent wallet. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAgent(false);
    }
  };

  const loadAgentBalance = async () => {
    try {
      const balance = await getAgentBalance(agentWallet.agent_public_key, publicClient);
      setAgentBalance(balance);
    } catch (error) {
      console.error('Failed to load agent balance:', error);
    }
  };

  const handleFundAgent = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: `Please enter a valid ${fundingCurrency} amount to fund.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsFunding(true);
    try {
      let txHash;
      
      if (fundingCurrency === 'USDC') {
        txHash = await transferUsdcToAgent({
          agentAddress: agentWallet.agent_public_key,
          amount: fundAmount,
          walletClient
        });
      } else {
        // ETH transfer
        const amountInWei = BigInt(Math.floor(parseFloat(fundAmount) * 10 ** 18));
        txHash = await walletClient.sendTransaction({
          to: agentWallet.agent_public_key,
          value: amountInWei,
        });
      }

      toast({
        title: `${fundingCurrency} Transaction Sent`,
        description: `Transaction sent. Hash: ${txHash.slice(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear input and reload balance after a delay
      setFundAmount('');
      setTimeout(() => loadAgentBalance(), 5000);
    } catch (error) {
      console.error(`Failed to fund agent with ${fundingCurrency}:`, error);
      toast({
        title: `${fundingCurrency} Transaction Failed`,
        description: error.message || `Failed to send ${fundingCurrency} to agent wallet.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFunding(false);
    }
  };

  const copyAgentAddress = () => {
    if (agentWallet?.agent_public_key) {
      navigator.clipboard.writeText(agentWallet.agent_public_key);
      toast({
        title: 'Copied',
        description: 'Agent address copied to clipboard',
        status: 'success',
        duration: 2000,
      });
    }
  };

  const openAgentExplorer = () => {
    if (agentWallet?.agent_public_key) {
      const explorerUrl = `https://sepolia.basescan.org/address/${agentWallet.agent_public_key}`;
      window.open(explorerUrl, '_blank');
    }
  };

  const refreshUserBalance = async () => {
    if (!account?.address) return;
    
    setIsRefreshingUserBalance(true);
    try {
      await Promise.all([
        updateBalance(account.address),
        updateUsdcBalance(account.address)
      ]);
      toast({
        title: 'Balance Updated',
        description: 'Your wallet balance has been refreshed.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to refresh user balance:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to update balance. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshingUserBalance(false);
    }
  };

  const refreshAgentBalance = async () => {
    if (!agentWallet?.agent_public_key || !publicClient) return;
    
    setIsRefreshingAgentBalance(true);
    try {
      await loadAgentBalance();
      toast({
        title: 'Balance Updated',
        description: 'Agent wallet balance has been refreshed.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to refresh agent balance:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to update agent balance. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshingAgentBalance(false);
    }
  };

  // Show connect button if not connected
  if (!isConnected) {
    return (
      <Button 
        onClick={handleConnect}
        isLoading={isConnecting}
        loadingText="Connecting..."
        colorScheme="blue"
        size="lg"
        width="100%"
        leftIcon={!isConnecting && <img src={getCoinbaseIcon()} alt="Coinbase" width="24" height="24" />}
        disabled={viewOnlyMode}
      >
        Connect Coinbase Smart Wallet
      </Button>
    );
  }

  // Show wallet info if connected
  return (
    <Box width="100%" minWidth="400px" maxWidth="450px">
      <Tabs index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>User Wallet</Tab>
          <Tab>Agent Wallet</Tab>
        </TabList>
        
        <TabPanels minHeight="450px">
          {/* User Wallet Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {/* Connection Status */}
              <Flex justify="space-between" align="center">
                <HStack>
                  <img src={getCoinbaseIcon()} alt="Coinbase" width="24" height="24" />
                  <Text fontWeight="bold">Coinbase Smart Wallet</Text>
                </HStack>
                <Badge colorScheme="green">Connected</Badge>
              </Flex>
        
        {/* Authentication Status */}
        {isAuthenticating || (isAuthenticated && isLoadingAgent && !agentWallet) ? (
          <Alert status="info" borderRadius="md">
            <Spinner size="sm" mr={2} />
            <AlertDescription>
              {isAuthenticating ? 'Authenticating with backend...' : 'Setting up agent wallet...'}
            </AlertDescription>
          </Alert>
        ) : isAuthenticated ? (
          <Alert status="success" borderRadius="md">
            <AlertIcon as={FiCheckCircle} />
            <AlertDescription>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">Authenticated</Text>
                {userId && (
                  <Text fontSize="xs" color={textMutedColor}>User ID: {userId}</Text>
                )}
              </VStack>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert status="warning" borderRadius="md">
            <AlertIcon as={FiAlertCircle} />
            <AlertDescription fontSize="sm">
              Wallet connected but not authenticated. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Wallet Address */}
        <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
          <VStack align="stretch" spacing={2}>
            <Flex justify="space-between">
              <Text fontSize="sm" color={textMutedColor}>Address</Text>
              <HStack spacing={2}>
                <Tooltip label="Copy address">
                  <Button size="xs" variant="ghost" onClick={copyAddress}>
                    <FiCopy />
                  </Button>
                </Tooltip>
                <Tooltip label="View on explorer">
                  <Button size="xs" variant="ghost" onClick={openExplorer}>
                    <FiExternalLink />
                  </Button>
                </Tooltip>
              </HStack>
            </Flex>
            <Text fontFamily="mono">{formattedAddress}</Text>
          </VStack>
        </Box>
        
        {/* Balances */}
        {(formattedBalance || formattedUsdcBalance) && (
          <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
            <Flex justify="space-between" align="flex-start" mb={2}>
              <Text fontSize="sm" fontWeight="bold">Balances</Text>
              <Tooltip label="Refresh balance">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={refreshUserBalance}
                  isLoading={isRefreshingUserBalance}
                >
                  <FiRefreshCw />
                </Button>
              </Tooltip>
            </Flex>
            <VStack align="stretch" spacing={3}>
              {formattedBalance && (
                <VStack align="stretch" spacing={1}>
                  <Text fontSize="sm" color={textMutedColor}>ETH Balance</Text>
                  <HStack spacing={2}>
                    <div style={{ display: 'flex', alignItems: 'center',gap: '15px' }}>
                    <img src={ethereumIcon} alt="ETH" width="15" height="15" />
                    <Text fontWeight="bold">{formattedBalance}</Text>
                    </div>
                  </HStack>
                </VStack>
              )}
              {formattedUsdcBalance && (
                <VStack align="stretch" spacing={1}>
                  <Text fontSize="sm" color={textMutedColor}>USDC Balance</Text>
                  <HStack spacing={2}>
                    <div style={{ display: 'flex', alignItems: 'center',gap: '10px' }}>
                    <img src={usdcIcon} alt="USDC" width="20" height="20" />
          
                    <Text fontWeight="bold">{formattedUsdcBalance}</Text>
                    </div>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </Box>
        )}
        
        {/* Network */}
        <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm" color={textMutedColor}>Network</Text>
            <HStack>
              <Badge colorScheme="purple">Base Sepolia</Badge>
              <Text fontSize="xs" color={textMutedColor}>Chain ID: {chainId || 84532}</Text>
            </HStack>
          </VStack>
              </Box>
            </VStack>
            
            {/* Disconnect Button */}
            <Button 
              onClick={handleDisconnect}
              colorScheme="red" 
              variant="outline" 
              size="sm" 
              width="100%"
              mt={4}
              isLoading={isDisconnecting}
              loadingText="Disconnecting..."
            >
              Disconnect & Logout
            </Button>
          </TabPanel>
          
          {/* Agent Wallet Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {isLoadingAgent ? (
                <Flex justify="center" align="center" minH="200px">
                  <VStack>
                    <Spinner size="lg" />
                    <Text color={textMutedColor}>Loading agent wallet...</Text>
                  </VStack>
                </Flex>
              ) : agentWallet ? (
                <>
                  {/* Agent Wallet Info */}
                  <Flex justify="space-between" align="center">
                    <HStack>
                      <img src={getCoinbaseIcon()} alt="Agent" width="24" height="24" />
                      <Text fontWeight="bold">Agent Wallet</Text>
                    </HStack>
                    <Badge colorScheme="purple">Active</Badge>
                  </Flex>
                  
                  {/* Agent Address */}
                  <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <VStack align="stretch" spacing={2}>
                      <Flex justify="space-between">
                        <Text fontSize="sm" color={textMutedColor}>Agent Address</Text>
                        <HStack spacing={2}>
                          <Tooltip label="Copy address">
                            <Button size="xs" variant="ghost" onClick={copyAgentAddress}>
                              <FiCopy />
                            </Button>
                          </Tooltip>
                          <Tooltip label="View on explorer">
                            <Button size="xs" variant="ghost" onClick={openAgentExplorer}>
                              <FiExternalLink />
                            </Button>
                          </Tooltip>
                        </HStack>
                      </Flex>
                      <Text fontFamily="mono" fontSize="sm">
                        {agentWallet.agent_public_key.slice(0, 6)}...{agentWallet.agent_public_key.slice(-4)}
                      </Text>
                    </VStack>
                  </Box>
                  
                  {/* Agent Balances */}
                  <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color={textMutedColor} fontWeight="bold">Agent Balances</Text>
                        <Tooltip label="Refresh balance">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={refreshAgentBalance}
                            isLoading={isRefreshingAgentBalance}
                          >
                            <FiRefreshCw />
                          </Button>
                        </Tooltip>
                      </Flex>
                      
                      {/* ETH Balance */}
                      <VStack align="stretch" spacing={1}>
                        <Text fontSize="sm" color={textMutedColor}>ETH Balance</Text>
                        <HStack spacing={2}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <img src={ethereumIcon} alt="ETH" width="15" height="15" />
                            <Text fontWeight="bold">
                              {agentBalance.eth ? formatBalance(agentBalance.eth, 18) : '0.0000'} ETH
                            </Text>
                          </div>
                        </HStack>
                      </VStack>
                      
                      {/* USDC Balance */}
                      <VStack align="stretch" spacing={1}>
                        <Text fontSize="sm" color={textMutedColor}>USDC Balance</Text>
                        <HStack spacing={2}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={usdcIcon} alt="USDC" width="20" height="20" />
                            <Text fontWeight="bold">
                              {agentBalance.usdc ? formatBalance(agentBalance.usdc, 6) : '0.00'} USDC
                            </Text>
                          </div>
                        </HStack>
                      </VStack>
                    </VStack>
                  </Box>
                  
                  {/* Fund Agent */}
                  <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
                    <VStack align="stretch" spacing={3}>
                      <Text fontSize="sm" fontWeight="bold">Fund Agent Wallet</Text>
                      
                      {/* Currency Toggle */}
                      <ButtonGroup size="sm" isAttached variant="outline" width="100%">
                        <Button
                          width="50%"
                          onClick={() => setFundingCurrency('USDC')}
                          isActive={fundingCurrency === 'USDC'}
                          colorScheme={fundingCurrency === 'USDC' ? 'blue' : 'gray'}
                          variant={fundingCurrency === 'USDC' ? 'solid' : 'outline'}
                        >
                          USDC
                        </Button>
                        <Button
                          width="50%"
                          onClick={() => setFundingCurrency('ETH')}
                          isActive={fundingCurrency === 'ETH'}
                          colorScheme={fundingCurrency === 'ETH' ? 'purple' : 'gray'}
                          variant={fundingCurrency === 'ETH' ? 'solid' : 'outline'}
                        >
                          ETH
                        </Button>
                      </ButtonGroup>
                      
                      {/* Amount Input */}
                      <InputGroup size="md">
                        <Input
                          placeholder="Amount"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          type="number"
                          min="0"
                          step={fundingCurrency === 'USDC' ? '0.01' : '0.001'}
                        />
                        <InputRightAddon>{fundingCurrency}</InputRightAddon>
                      </InputGroup>
                      
                      {/* Send Button */}
                      <Button
                        colorScheme={fundingCurrency === 'USDC' ? 'blue' : 'purple'}
                        onClick={handleFundAgent}
                        isLoading={isFunding}
                        loadingText="Sending..."
                        leftIcon={<FiSend />}
                        isDisabled={!walletClient || !fundAmount || parseFloat(fundAmount) <= 0}
                      >
                        Send {fundingCurrency}
                      </Button>
                      
                      <Text fontSize="xs" color={textMutedColor}>
                        Transfer {fundingCurrency} from your wallet to the agent wallet
                      </Text>
                    </VStack>
                  </Box>
                </>
              ) : (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    Please authenticate with your wallet first to view agent wallet details.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}