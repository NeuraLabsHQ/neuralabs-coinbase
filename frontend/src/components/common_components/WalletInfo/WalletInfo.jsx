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
import { useWallet } from '../../../contexts/WalletContextProvider';
import coinbaseConnected from '../../../assets/icons/coinbase-connected.svg';
import coinbaseLight from '../../../assets/icons/coinbase-light.svg';
import coinbaseDark from '../../../assets/icons/coinbase-dark.svg';
import ethereumIcon from '../../../assets/icons/ethereum.svg';
import usdcIcon from '../../../assets/icons/usdc.svg';

const WalletInfo = () => {
  const { colorMode } = useColorMode();
  
  // Get wallet state from context
  const {
    isConnected,
    address,
    formattedAddress,
    formattedBalance,
    formattedUsdcBalance,
    chainId,
    disconnect
  } = useWallet();
  
  const bgColor = useColorModeValue('white', '#18191b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const textMutedColor = useColorModeValue('gray.600', 'gray.400');
  
  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };
  
  // Open explorer link
  const openExplorer = () => {
    if (address) {
      // Base Sepolia explorer
      const explorerUrl = `https://sepolia.basescan.org/address/${address}`;
      window.open(explorerUrl, '_blank');
    }
  };
  
  // Get Coinbase icon based on color mode and connection state
  const getCoinbaseIcon = () => {
    if (isConnected) {
      return coinbaseConnected;
    } else {
      return colorMode === 'light' ? coinbaseLight : coinbaseDark;
    }
  };

  // If no wallet is connected, don't render
  if (!isConnected) {
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
          Base Sepolia
        </Badge>
      </Flex>
      
      <Divider mb={3} />
      
      <Box mb={3}>
        <Text fontSize="sm" color={textMutedColor} mb={1}>
          Address
        </Text>
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontFamily="mono" fontSize="sm" color={textColor}>
            {formattedAddress}
          </Text>
          <HStack spacing={1}>
            <Tooltip label="Copy address">
              <Button size="xs" variant="ghost" onClick={copyAddressToClipboard}>
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
      </Box>
      
      {formattedBalance && (
        <Box mb={3}>
          <Text fontSize="sm" color={textMutedColor} mb={1}>
            ETH Balance
          </Text>
          <HStack spacing={2}>
            <img src={ethereumIcon} alt="ETH" width="20" height="20" />
            <Text fontWeight="semibold" fontSize="lg" color={textColor}>
              {formattedBalance}
            </Text>
          </HStack>
        </Box>
      )}
      
      {formattedUsdcBalance && (
        <Box mb={4}>
          <Text fontSize="sm" color={textMutedColor} mb={1}>
            USDC Balance
          </Text>
          <HStack spacing={2}>
            <img src={usdcIcon} alt="USDC" width="20" height="20" />
            <Text fontWeight="semibold" fontSize="lg" color={textColor}>
              {formattedUsdcBalance}
            </Text>
          </HStack>
        </Box>
      )}
      
      <Button 
        onClick={disconnect}
        leftIcon={<FiLogOut />}
        colorScheme="red" 
        variant="outline" 
        size="sm" 
        width="100%"
      >
        Disconnect
      </Button>
    </Box>
  );
};

export default WalletInfo;