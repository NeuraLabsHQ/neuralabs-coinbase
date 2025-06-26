// frontend/src/components/common_components/CustomConnectButton/CustomConnectButton.jsx

import { useState } from 'react';
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
import { useWallet } from '../../../contexts/WalletContextProvider';
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
  // Get wallet state from context
  const { isConnected, formattedAddress, isDisconnecting } = useWallet();
  
  // Get color mode (light/dark)
  const { colorMode } = useColorMode();
  
  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  
  // Color mode values
  const bgColor = useColorModeValue('white', '#18191b');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Handle wallet button click
  const handleWalletAction = () => {
    setModalOpen(true);
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
  };
  
  // Set wallet tooltip text
  const walletTooltip = isConnected 
    ? `Connected: Coinbase (${formattedAddress})` 
    : "Connect Wallet";
  
  // Determine which icon to show based on connection state and color mode
  const getWalletIcon = () => {
    if (isConnected) {
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
      <Tooltip 
        label={walletTooltip}
        placement="right" 
        bg={useColorModeValue("gray.900", "gray.900")} 
        hasArrow
        isDisabled={isMobile}
      >
        <Button 
          {...buttonStyles}
          onClick={handleWalletAction}
          aria-label={isConnected ? "Manage Wallet" : "Connect Wallet"}
          disabled={viewOnlyMode || isDisconnecting}
          px={isMobile ? 4 : 0}
        >
          {isMobile ? (
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
          ) : (
            <>
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
            </>
          )}
          
          {isConnected && (
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
      
      {/* Wallet connection/management modal */}
      <Modal isOpen={modalOpen} onClose={handleModalClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} color={textColor} borderRadius="lg" minWidth="450px" maxWidth="500px">
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
            {isConnected ? 'Wallet Management' : 'Connect to NeuraLabs'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            <CoinbaseWalletConnect 
              viewOnlyMode={viewOnlyMode}
              isMobile={isMobile}
              iconColor={iconColor}
              hoverBgColor={hoverBgColor}
              onClose={handleModalClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CustomConnectButton;