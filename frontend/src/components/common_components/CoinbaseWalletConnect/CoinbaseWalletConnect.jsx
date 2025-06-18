import React from 'react';
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
  AlertDescription
} from '@chakra-ui/react';
import { FiExternalLink, FiCopy, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Import wallet context to get wallet state and actions
import { useWallet } from '../../../contexts/WalletContextProvider';


import coinbaseConnected from '../../../assets/icons/coinbase-connected.svg';
import coinbaseLight from '../../../assets/icons/coinbase-light.svg';
import coinbaseDark from '../../../assets/icons/coinbase-dark.svg';

export default function CoinbaseWalletConnect({ 
  viewOnlyMode = false,
  onClose = null
}) {
  const { colorMode } = useColorMode();
  
  // Get wallet state and actions from context
  const {
    isConnected,
    isConnecting,
    isDisconnecting,
    isAuthenticating,
    isAuthenticated,
    account,
    formattedAddress,
    formattedBalance,
    chainId,
    userId,
    connect,
    disconnect
  } = useWallet();
  
  // Color mode values
  const bgColor = useColorModeValue('white', '#18191b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const textMutedColor = useColorModeValue('gray.600', 'gray.400');

  const handleConnect = async () => {
    if (viewOnlyMode) {
      return;
    }
    
    try {
      await connect();
      // Close modal on successful connection and authentication
      if (onClose) {
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      // Error is handled in the context
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Close modal after disconnect
      if (onClose) {
        setTimeout(() => onClose(), 500);
      }
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
      // Sepolia explorer
      const explorerUrl = `https://sepolia.etherscan.io/address/${account.address}`;
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
    <Box width="100%">
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
        {isAuthenticating ? (
          <Alert status="info" borderRadius="md">
            <Spinner size="sm" mr={2} />
            <AlertDescription>Authenticating with backend...</AlertDescription>
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
        
        {/* Balance */}
        {formattedBalance && (
          <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm" color={textMutedColor}>Balance</Text>
              <Text fontWeight="bold">{formattedBalance}</Text>
            </VStack>
          </Box>
        )}
        
        {/* Network */}
        <Box p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm" color={textMutedColor}>Network</Text>
            <HStack>
              <Badge colorScheme="purple">Sepolia Testnet</Badge>
              <Text fontSize="xs" color={textMutedColor}>Chain ID: {chainId || 11155111}</Text>
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
    </Box>
  );
}