// frontend/src/components/common_components/CustomConnectButton/CustomConnectButton.jsx

import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  useColorModeValue,
  Tooltip,
  useColorMode,
  HStack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { getAccount, watchAccount } from '@wagmi/core';
import { config } from '../../../config/wagmi';
import CoinbaseWalletConnect from '../CoinbaseWalletConnect/CoinbaseWalletConnect';
import coinbaseConnected from '../../../assets/icons/coinbase-connected.svg';
import coinbaseLight from '../../../assets/icons/coinbase-light.svg';
import coinbaseDark from '../../../assets/icons/coinbase-dark.svg';

const CustomConnectButton = ({ 
  iconColor, 
  hoverBgColor, 
  viewOnlyMode = false,
  isMobile = false
}) => {
  // State for wallet connection
  const [walletAccount, setWalletAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Get color mode (light/dark)
  const { colorMode } = useColorMode();
  
  // State for modals
  const [methodSelectorOpen, setMethodSelectorOpen] = useState(false);
  
  // Color mode values
  const bgColor = useColorModeValue('white', '#18191b');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Check wallet connection status
  useEffect(() => {
    const checkConnection = () => {
      const account = getAccount(config);
      console.log('CustomConnectButton - Current account:', account);
      
      // More robust connection check - account must exist, have address, and be connected
      const isWalletConnected = account && 
                               account.address && 
                               account.address.length > 0 && 
                               account.isConnected === true;
      
      if (isWalletConnected) {
        setWalletAccount(account);
        setIsConnected(true);
        console.log('CustomConnectButton - Wallet connected:', account.address);
      } else {
        setWalletAccount(null);
        setIsConnected(false);
        console.log('CustomConnectButton - Wallet disconnected');
      }
    };
    
    checkConnection();
    
    // Watch for account changes
    const unwatch = watchAccount(config, {
      onChange: (account) => {
        console.log('CustomConnectButton - Account changed:', account);
        
        // More robust connection check
        const isWalletConnected = account && 
                                 account.address && 
                                 account.address.length > 0 && 
                                 account.isConnected === true;
        
        if (isWalletConnected) {
          setWalletAccount(account);
          setIsConnected(true);
          console.log('CustomConnectButton - Wallet connected via onChange:', account.address);
        } else {
          setWalletAccount(null);
          setIsConnected(false);
          console.log('CustomConnectButton - Wallet disconnected via onChange');
        }
      },
    });
    
    return () => unwatch();
  }, []);
  
  // Check if wallet is connected (use actual wallet account presence)
  const connected = !!(walletAccount && walletAccount.address && walletAccount.isConnected);
  
  // Get wallet address
  const walletAddress = walletAccount?.address || '';
  
  // Handle wallet action
  const handleWalletAction = async () => {
    if (connected) {
      // Show the connection status/management modal
      setMethodSelectorOpen(true);
    } else {
      // Open the wallet connection modal
      setMethodSelectorOpen(true);
    }
  };
  
  // Format wallet address for tooltip
  const formattedAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
    : '';
    
  // Set wallet tooltip text
  const walletTooltip = connected 
    ? `Connected: Coinbase Smart Wallet (${formattedAddress})` 
    : "Connect Wallet";
    
  // Debug logging
  console.log('CustomConnectButton render - Connected:', connected, 'WalletAccount:', walletAccount, 'Address:', walletAddress);
  
  // Determine which icon to show based on connection state and color mode
  const getWalletIcon = () => {
    // Use walletAccount presence and connection status as the definitive check
    if (walletAccount && walletAccount.address && walletAccount.isConnected) {
      return coinbaseConnected;
    } else {
      return colorMode === 'light' ? coinbaseLight : coinbaseDark;
    }
  };
  
  // Button styles
  const buttonStyles = {
    w: "100%",
    h: isMobile ? "48px" : "56px",
    justifyContent: isMobile ? "flex-start" : "center",
    alignItems: "center",
    display: "flex",
    borderRadius: isMobile ? "md" : 0,
    bg: "transparent", 
    color: iconColor,
    _hover: { 
      bg: hoverBgColor,
      cursor: viewOnlyMode ? "not-allowed" : "pointer"
    }
  };

  return (
    <>
      {isMobile ? (
        <Button 
          {...buttonStyles}
          onClick={handleWalletAction}
          aria-label={connected ? "Disconnect Wallet" : "Connect Wallet"}
          disabled={viewOnlyMode || isDisconnecting}
          px={4}
        >
          <HStack spacing={3} w="100%">
            {isDisconnecting ? (
            <Box 
              position="relative" 
              w="20px" 
              h="20px" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
            >
              <Box 
                position="absolute"
                border="2px solid"
                borderColor={iconColor}
                borderRadius="full"
                width="20px"
                height="20px"
                borderBottomColor="transparent"
                animation="spin 1s linear infinite"
              />
            </Box>
          ) : (
            <img src={getWalletIcon()} alt="Wallet Icon" width="20px" height="20px" />
            )}
            <Text fontSize="md">Coinbase Wallet</Text>
          </HStack>
          
          {connected && (
            <Box 
              position="absolute"
              bottom="12px"
              right="12px"
              w="8px"
              h="8px"
              bg="green.400"
              borderRadius="full"
            />
          )}
        </Button>
      ) : (
        <Tooltip 
          label={walletTooltip}
          placement="right" 
          bg={useColorModeValue("gray.900", "gray.900")} 
          hasArrow
        >
          <Button 
            {...buttonStyles}
            onClick={handleWalletAction}
            aria-label={connected ? "Disconnect Wallet" : "Connect Wallet"}
            disabled={viewOnlyMode || isDisconnecting}
          >
            {isDisconnecting ? (
              <Box 
                position="relative" 
                w="24px" 
                h="24px" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Box 
                  position="absolute"
                  border="2px solid"
                  borderColor={iconColor}
                  borderRadius="full"
                  width="24px"
                  height="24px"
                  borderBottomColor="transparent"
                  animation="spin 1s linear infinite"
                />
              </Box>
            ) : (
              <img src={getWalletIcon()} alt="Wallet Icon" width="25px" height="25px" />
            )}
            
            {connected && (
              <Box 
                position="absolute"
                bottom="12px"
                right="12px"
                w="8px"
                h="8px"
                bg="green.400"
                borderRadius="full"
              />
            )}
          </Button>
        </Tooltip>
      )}
      
      {/* Custom wallet connection modal */}
      <Modal isOpen={methodSelectorOpen} onClose={() => setMethodSelectorOpen(false)} isCentered size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} color={textColor} borderRadius="lg">
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
            {connected ? 'Wallet Connected' : 'Connect to NeuraLabs'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            <CoinbaseWalletConnect 
              viewOnlyMode={viewOnlyMode}
              isMobile={isMobile}
              iconColor={iconColor}
              hoverBgColor={hoverBgColor}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CustomConnectButton;