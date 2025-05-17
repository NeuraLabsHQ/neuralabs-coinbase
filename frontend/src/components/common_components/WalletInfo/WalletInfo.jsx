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
  HStack
} from '@chakra-ui/react';
import { FiExternalLink, FiCopy, FiLogOut } from 'react-icons/fi';
import { 
  useCurrentAccount, 
  useCurrentWallet, 
  useDisconnectWallet,
  useSuiClientQuery
} from '@mysten/dapp-kit';

const WalletInfo = () => {
  const currentAccount = useCurrentAccount();
  const { wallet } = useCurrentWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  
  const bgColor = useColorModeValue('white', '#18191b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const textMutedColor = useColorModeValue('gray.600', 'gray.400');
  
  // Get wallet address
  const walletAddress = currentAccount?.address || '';
  
  // Get wallet balance
  const { data: balanceData, isPending } = useSuiClientQuery(
    'getBalance',
    {
      owner: walletAddress,
      coinType: '0x2::sui::SUI'
    },
    {
      enabled: !!walletAddress
    }
  );
  
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
    // Explorer for Sui
    const baseUrl = 'https://suiscan.xyz/testnet/account/';
    
    if (walletAddress) {
      window.open(`${baseUrl}${walletAddress}`, '_blank');
    }
  };

  // Format balance for display
  const balance = balanceData ? Number(balanceData.totalBalance) / 1000000000 : null;
  const formattedBalance = balance !== null 
    ? `${balance.toFixed(4)} SUI` 
    : isPending ? 'Loading...' : '0 SUI';

  // If no wallet is connected, don't render
  if (!currentAccount) {
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
          <Text fontWeight="bold" color={textColor}>
            {wallet?.name || 'Sui Wallet'}
          </Text>
        </HStack>
        
        <Badge colorScheme="purple">
          Testnet
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
        onClick={() => disconnect()}
      >
        Disconnect
      </Button>
    </Box>
  );
};

export default WalletInfo;