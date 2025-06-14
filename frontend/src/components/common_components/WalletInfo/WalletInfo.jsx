import {
  Box,
  Text,
  Flex,
  Button,
  Divider,
  useColorModeValue,
  Badge,
  Tooltip,
  HStack,
  useColorMode
} from '@chakra-ui/react';
import { FiExternalLink, FiCopy, FiLogOut } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { 
  getAccount, 
  getBalance, 
  disconnect,
  watchAccount,
  getChainId,
  getConnections
} from '@wagmi/core';
import { config } from '../../../config/wagmi';
import { formatEther } from 'viem';
import coinbaseConnected from '../../../assets/icons/coinbase-connected.svg';
import coinbaseLight from '../../../assets/icons/coinbase-light.svg';
import coinbaseDark from '../../../assets/icons/coinbase-dark.svg';

const WalletInfo = () => {
  const [walletAccount, setWalletAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { colorMode } = useColorMode();
  
  const bgColor = useColorModeValue('white', '#18191b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const textMutedColor = useColorModeValue('gray.600', 'gray.400');
  
  // Check wallet connection and get data
  useEffect(() => {
    const checkConnection = async () => {
      const account = getAccount(config);
      if (account.address) {
        setWalletAccount(account);
        setChainId(getChainId(config));
        await updateBalance(account.address);
      } else {
        setWalletAccount(null);
        setBalance(null);
        setChainId(null);
      }
    };
    
    checkConnection();
    
    // Watch for account changes
    const unwatch = watchAccount(config, {
      onChange: async (account) => {
        if (account.address) {
          setWalletAccount(account);
          setChainId(getChainId(config));
          await updateBalance(account.address);
        } else {
          setWalletAccount(null);
          setBalance(null);
          setChainId(null);
        }
      },
    });
    
    return () => unwatch();
  }, []);
  
  const updateBalance = async (address) => {
    try {
      setIsLoading(true);
      const balanceData = await getBalance(config, {
        address,
      });
      setBalance(balanceData);
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get wallet address
  const walletAddress = walletAccount?.address || '';
  
  // Format wallet address for display
  const formattedAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
    : '';
  
  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      // You could add a toast notification here
    }
  };
  
  // Open explorer link
  const openExplorer = () => {
    if (walletAddress && chainId) {
      let explorerUrl = '';
      switch (chainId) {
        case 1: // Mainnet
          explorerUrl = `https://etherscan.io/address/${walletAddress}`;
          break;
        case 137: // Polygon
          explorerUrl = `https://polygonscan.com/address/${walletAddress}`;
          break;
        case 8453: // Base
          explorerUrl = `https://basescan.org/address/${walletAddress}`;
          break;
        case 42161: // Arbitrum
          explorerUrl = `https://arbiscan.io/address/${walletAddress}`;
          break;
        default:
          explorerUrl = `https://etherscan.io/address/${walletAddress}`;
      }
      window.open(explorerUrl, '_blank');
    }
  };
  
  const getChainName = (id) => {
    switch (id) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 8453: return 'Base';
      case 42161: return 'Arbitrum';
      default: return 'Unknown';
    }
  };
  
  // Get Coinbase icon based on color mode and connection state
  const getCoinbaseIcon = () => {
    if (walletAccount) {
      return coinbaseConnected;
    } else {
      return colorMode === 'light' ? coinbaseLight : coinbaseDark;
    }
  };

  // Format balance for display
  const formattedBalance = balance 
    ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` 
    : isLoading ? 'Loading...' : '0 ETH';

  // Handle disconnect
  const handleDisconnect = async () => {
    console.log('WalletInfo - Starting disconnect...')
    
    // For now, just trigger a page refresh to clear the wallet connection
    // This is a temporary solution until we resolve the wagmi disconnect API issue
    window.location.reload()
  }

  // If no wallet is connected, don't render
  if (!walletAccount) {
    return null;
  }

  return (
    <Box 
      p={4} 
      bg={bgColor} 
      borderRadius="md" 
      border="1px solid" 
      borderColor={borderColor}
      width="100%"
      maxWidth="320px"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <HStack spacing={2}>
          <img 
            src={getCoinbaseIcon()} 
            alt="Coinbase" 
            width="24" 
            height="24" 
          />
          <Text fontWeight="bold" color={textColor}>
            Coinbase Smart Wallet
          </Text>
        </HStack>
        
        <Badge colorScheme="purple">
          {chainId ? getChainName(chainId) : 'Unknown'}
        </Badge>
      </Flex>
      
      <Box mb={3}>
        <Text fontSize="sm" color={textMutedColor} mb={1}>
          Address
        </Text>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontFamily="mono" fontSize="sm" color={textColor}>
            {formattedAddress}
          </Text>
          <HStack spacing={1}>
            <Tooltip label="Copy address" placement="top">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={copyAddressToClipboard}
                aria-label="Copy address"
              >
                <FiCopy size={14} />
              </Button>
            </Tooltip>
            <Tooltip label="View in explorer" placement="top">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={openExplorer}
                aria-label="View in explorer"
              >
                <FiExternalLink size={14} />
              </Button>
            </Tooltip>
          </HStack>
        </Flex>
      </Box>
      
      <Box mb={4}>
        <Text fontSize="sm" color={textMutedColor} mb={1}>
          Balance
        </Text>
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          {formattedBalance}
        </Text>
      </Box>
      
      <Divider mb={4} />
      
      <Button 
        leftIcon={<FiLogOut />} 
        colorScheme="red" 
        variant="outline" 
        size="sm" 
        width="100%"
        onClick={handleDisconnect}
        disabled={!walletAccount}
      >
        Disconnect
      </Button>
    </Box>
  );
};

export default WalletInfo;