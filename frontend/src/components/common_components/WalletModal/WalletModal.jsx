import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Flex,
  Image,
  useColorModeValue,
  Spinner,
  useToast,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { useWallet } from '../../../contexts/WalletContext';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const WalletModal = ({ isOpen, onClose }) => {
  const { connect, wallets, connecting, connected, disconnect } = useWallet();
  const [connectingWalletName, setConnectingWalletName] = useState(null);
  const toast = useToast();

  console.log("Wallets available:", wallets);

  
  const bgColor = useColorModeValue('white', '#18191b');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverColor = useColorModeValue('gray.50', 'gray.700');

  // Find Slush wallet specifically
  const slushWallet = wallets?.find(wallet => 
    wallet.name.toLowerCase() === 'slush' || 
    wallet.name.toLowerCase().includes('slush')
  );

  console.log("Wallets available:", wallets);
  
  // Move Slush wallet to the top if it exists
  const sortedWallets = [...(wallets || [])].sort((a, b) => {
    if (a.name.toLowerCase().includes('slush')) return -1;
    if (b.name.toLowerCase().includes('slush')) return 1;
    return 0;
  });

  const handleConnectWallet = async (walletName) => {
    setConnectingWalletName(walletName);
    
    try {
      // Disconnect from the current wallet if connected
      if (connected) {
        await disconnect();
        console.log("Disconnected from current wallet");
      }
      
      // Add a small delay to ensure previous state is cleared
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log("Connected to wallet:", walletName);
      // Attempt to connect
      await connect(walletName);
      
      
      
      // Close modal
      if (isOpen) onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setConnectingWalletName(null);
    }
  };

  // No wallets detected
  const noWalletsDetected = !wallets || wallets.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor}>
        <ModalHeader>Connect Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {noWalletsDetected ? (
            <Alert 
              status="warning" 
              variant="subtle"
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              textAlign="center" 
              height="200px"
              borderRadius="md"
            >
              <AlertIcon boxSize="40px" mr={0} mb={3} />
              <AlertTitle mb={1} fontSize="lg">No Sui Wallets Detected</AlertTitle>
              <AlertDescription maxWidth="sm">
                Please install a Sui wallet extension to connect to this application.
              </AlertDescription>
              <Button
                as="a"
                href="https://chrome.google.com/webstore/detail/slush-wallet/hjpmkbbhhagghchepgemnkh"
                target="_blank"
                colorScheme="blue"
                rightIcon={<ExternalLinkIcon />}
                mt={4}
              >
                Install Slush Wallet (Recommended)
              </Button>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {slushWallet && (
                <Button
                  key={slushWallet.name}
                  variant="solid"
                  colorScheme="blue"
                  onClick={() => handleConnectWallet(slushWallet.name)}
                  justifyContent="flex-start"
                  h="60px"
                  position="relative"
                  mb={2}
                  isDisabled={connecting}
                >
                  <Flex align="center" width="100%" justifyContent="space-between">
                    <Flex align="center">
                      {slushWallet.icon ? (
                        <Image 
                          src={slushWallet.icon} 
                          alt={`${slushWallet.name} icon`} 
                          boxSize="24px" 
                          mr={3}
                        />
                      ) : (
                        <Box 
                          bg="blue.500" 
                          borderRadius="full" 
                          w="24px" 
                          h="24px" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                          color="white"
                          fontWeight="bold"
                          mr={3}
                        >
                          S
                        </Box>
                      )}
                      <Text>{slushWallet.name}</Text>
                    </Flex>
                    {(connecting && connectingWalletName === slushWallet.name) && <Spinner size="sm" color="white" />}
                  </Flex>
                  <Text 
                    position="absolute" 
                    top="-2px" 
                    right="10px" 
                    fontSize="xs" 
                    color="white" 
                    bg="green.500" 
                    px={2} 
                    py={0.5} 
                    borderRadius="md"
                  >
                    Recommended
                  </Text>
                </Button>
              )}
              
              {sortedWallets
                .filter(wallet => !wallet.name.toLowerCase().includes('slush'))
                .map(wallet => (
                <Button
                  key={wallet.name}
                  variant="outline"
                  onClick={() => handleConnectWallet(wallet.name)}
                  justifyContent="flex-start"
                  h="60px"
                  borderColor={borderColor}
                  _hover={{ bg: hoverColor }}
                  isDisabled={connecting}
                >
                  <Flex align="center" width="100%" justifyContent="space-between">
                    <Flex align="center">
                      {wallet.icon ? (
                        <Image 
                          src={wallet.icon} 
                          alt={`${wallet.name} icon`} 
                          boxSize="24px" 
                          mr={3}
                        />
                      ) : (
                        <Box 
                          bg="gray.500" 
                          borderRadius="full" 
                          w="24px" 
                          h="24px" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                          color="white"
                          fontWeight="bold"
                          mr={3}
                        >
                          {wallet.name.charAt(0)}
                        </Box>
                      )}
                      <Text>{wallet.name}</Text>
                    </Flex>
                    {(connecting && connectingWalletName === wallet.name) && <Spinner size="sm" />}
                  </Flex>
                </Button>
              ))}
              
              {wallets && wallets.length > 0 && (
                <Text fontSize="sm" color="gray.500" mt={2}>
                  If you don't see your preferred wallet, make sure it's installed and reload the page.
                </Text>
              )}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WalletModal;