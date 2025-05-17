import React from 'react';
import {
  Box,
  Text,
  Flex,
  Button,
  Divider,
  useColorModeValue,
  Badge,
  Tooltip,
  Image,
  HStack
} from '@chakra-ui/react';
import { FiExternalLink, FiCopy, FiLogOut } from 'react-icons/fi';
import { useWallet } from '../../../contexts/WalletContext';

const WalletInfo = () => {
  const { 
    wallet, 
    walletAddress, 
    balance, 
    disconnect, 
    network 
  } = useWallet();
  
  const bgColor = useColorModeValue('white', '#18191b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const textMutedColor = useColorModeValue('gray.600', 'gray.400');
  
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
    // Different explorers for different networks
    const baseUrl = network?.name?.toLowerCase().includes('mainnet')
      ? 'https://suiscan.xyz/mainnet/account/'
      : network?.name?.toLowerCase().includes('testnet')
        ? 'https://suiscan.xyz/testnet/account/'
        : 'https://suiscan.xyz/devnet/account/';
    
    if (walletAddress) {
      window.open(`${baseUrl}${walletAddress}`, '_blank');
    }
  };

  // Format balance for display with appropriate symbols
  const formattedBalance = balance !== null 
    ? `${balance.toFixed(4)} SUI` 
    : 'Loading...';

  // Get the network display name
  const getNetworkDisplayName = () => {
    if (!network?.name) return 'Unknown';
    
    const name = network.name.toLowerCase();
    if (name.includes('mainnet')) return 'Mainnet';
    if (name.includes('testnet')) return 'Testnet';
    if (name.includes('devnet')) return 'Devnet';
    return network.name;
  };

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
          {wallet?.icon ? (
            <Image 
              src={wallet.icon} 
              alt={`${wallet.name} icon`} 
              boxSize="24px" 
            />
          ) : (
            <Box 
              w="24px" 
              h="24px" 
              bg="gray.500" 
              color="white" 
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
            >
              {(wallet?.name || 'W').charAt(0)}
            </Box>
          )}
          <Text fontWeight="bold" color={textColor}>
            {wallet?.name || 'Sui Wallet'}
          </Text>
        </HStack>
        
        <Badge 
          colorScheme={
            getNetworkDisplayName() === 'Mainnet' ? 'green' : 
            getNetworkDisplayName() === 'Testnet' ? 'purple' : 'orange'
          }
        >
          {getNetworkDisplayName()}
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
        onClick={disconnect}
      >
        Disconnect
      </Button>
    </Box>
  );
};

export default WalletInfo;