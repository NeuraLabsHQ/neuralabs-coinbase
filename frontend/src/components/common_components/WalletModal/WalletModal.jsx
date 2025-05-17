
import React, { useState, useEffect } from 'react';
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
  AlertDescription,
  Link,
  Center
} from '@chakra-ui/react';
import { useWallet } from '../../../contexts/WalletContext';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const WalletModal = ({ isOpen, onClose }) => {
  const { connect, wallets, connecting, connected, disconnect } = useWallet();
  const [connectingWalletName, setConnectingWalletName] = useState(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', '#18191b');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverColor = useColorModeValue('gray.50', 'gray.700');

  // Check if Slush wallet is available
  const slushWallet = wallets?.find(wallet => 
    wallet.name.toLowerCase() === 'slush' || 
    wallet.name.toLowerCase().includes('slush')
  );
  
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
      
      // Attempt to connect
      await connect(walletName);
      
      console.log("Connected to wallet:", walletName);
      
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

  // Sort wallets to prioritize Slush wallet
  const sortedWallets = [...(wallets || [])].sort((a, b) => {
    if (a.name.toLowerCase().includes('slush')) return -1;
    if (b.name.toLowerCase().includes('slush')) return 1;
    return 0;
  });

  // No wallets detected
  const noWalletsDetected = !wallets || wallets.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor}>
        <ModalHeader>Connect Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {noWalletsDetected ? (
            <Alert 
              status="warning" 
              borderRadius="md" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              textAlign="center" 
              py={4}
            >
              <AlertIcon boxSize="40px" mr={0} mb={4} />
              <AlertTitle mb={2}>No Sui Wallets Detected</AlertTitle>
              <AlertDescription>
                Please install Slush Wallet to connect to this application.
                <Center mt={4}>
                  <Button
                    as="a"
                    href="https://chrome.google.com/webstore/detail/slush-wallet/hjpmkbbhhagghchepgemnkh"
                    target="_blank"
                    rightIcon={<ExternalLinkIcon />}
                    colorScheme="blue"
                    size="md"
                  >
                    Install Slush Wallet
                  </Button>
                </Center>
              </AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch" pb={4}>
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
                          {slushWallet.name.charAt(0)}
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
              
              <Text fontSize="sm" color="gray.500" mt={2}>
                {wallets && wallets.length > 0 ? 
                  "If you don't see your preferred wallet, make sure it's installed and reload the page." :
                  "Please install a Sui compatible wallet to connect to this application."
                }
              </Text>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WalletModal;