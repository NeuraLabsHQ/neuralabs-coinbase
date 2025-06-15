import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Flex,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { useWallet } from '../../../contexts/WalletContext';

const WalletModal = ({ isOpen, onClose }) => {
  const { connect, wallets, connecting, connected, disconnect } = useWallet();
  const [connectingWalletName, setConnectingWalletName] = useState(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', '#18191b');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverColor = useColorModeValue('gray.50', 'gray.700');
  
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
        // Add a small delay to ensure previous state is cleared
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
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
            <Alert status="warning" bg={bgColor} color={textColor}>
              <AlertIcon />
              <Box>
                <AlertTitle>No wallets detected!</AlertTitle>
                <AlertDescription>
                  Please install a wallet extension to continue.
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <VStack spacing={3} align="stretch">
              {sortedWallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  onClick={() => handleConnectWallet(wallet.name)}
                  variant="outline"
                  borderColor={borderColor}
                  _hover={{ bg: hoverColor }}
                  justifyContent="space-between"
                  h="60px"
                  px={4}
                  isLoading={connectingWalletName === wallet.name || (connecting && connectingWalletName === null)}
                  loadingText="Connecting..."
                  isDisabled={connecting}
                >
                  <Flex align="center" gap={3}>
                    <Image 
                      src={wallet.icon} 
                      alt={wallet.name} 
                      boxSize="32px"
                      borderRadius="md"
                    />
                    <Text fontWeight="medium">{wallet.name}</Text>
                  </Flex>
                  
                  {connecting && connectingWalletName === wallet.name ? (
                    <Spinner size="sm" />
                  ) : (
                    <ExternalLinkIcon />
                  )}
                </Button>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WalletModal;