// frontend/src/components/common_components/WalletMethodSelector/WalletMethodSelector.jsx

import React, { useState } from 'react';
import {
  Box,
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
  useColorModeValue,
  Divider,
  useToast

} from '@chakra-ui/react';
import { 
  ConnectModal
} from '@mysten/dapp-kit';
import { FaGoogle } from 'react-icons/fa';
import { useZkLogin } from '../../../contexts/ZkLoginContext';

const WalletMethodSelector = ({ isOpen, onClose }) => {
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const { startZkLogin, isLoading } = useZkLogin();
  const toast = useToast();
  
  const bgColor     = useColorModeValue('white', '#18191b');
  const textColor   = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverColor  = useColorModeValue('gray.50', 'gray.700');

  const handleWalletConnect = () => {
    // Close this modal and open the wallet connect modal
    onClose();
    setConnectModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    try {
      // Begin zkLogin process
      const result = await startZkLogin();
      
      if (!result.success) {
        toast({
          title: "Login Error",
          description: result.error || "Failed to start Google login",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      
      // The startZkLogin redirects to Google auth, so we only reach here if there was an error
      onClose();
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Login Error",
        description: error.message || "Failed to initialize Google login",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} color={textColor} borderRadius="lg">
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>Connect to Neura</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            <VStack spacing={4} align="stretch">
              {/* Google zkLogin Button */}
              <Button 
                leftIcon={<FaGoogle />}
                colorScheme="blue"
                variant="solid" 
                width="100%"
                height="60px"
                onClick={handleGoogleLogin}
                isLoading={isLoading}
                loadingText="Connecting with Google"
                fontSize="md"
              >
                Sign in with Google (zkLogin)
              </Button>
              
              {/* Divider with text */}
              <Flex align="center" my={4}>
                <Box flex="1">
                  <Divider />
                </Box>
                <Text px={3} color="gray.500" fontSize="sm">OR</Text>
                <Box flex="1">
                  <Divider />
                </Box>
              </Flex>
              
              {/* Wallet Connect Button */}
              <Button 
                onClick={handleWalletConnect}
                variant="outline"
                width="100%"
                height="60px"
                borderColor={borderColor}
                _hover={{ bg: hoverColor }}
                fontSize="md"
              >
                <Flex align="center" width="100%" justifyContent="center">
                  <Text>Connect Sui Wallet</Text>
                </Flex>
              </Button>
              <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">
                Connect with Slush, Suiet or other Sui wallets
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* The ConnectModal from dApp Kit */}
      <ConnectModal
        open={connectModalOpen}
        onOpenChange={(isOpen) => setConnectModalOpen(isOpen)}
      />
    </>
  );
};

export default WalletMethodSelector;