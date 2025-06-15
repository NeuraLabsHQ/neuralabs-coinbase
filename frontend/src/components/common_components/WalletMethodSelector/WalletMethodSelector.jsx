// frontend/src/components/common_components/WalletMethodSelector/WalletMethodSelector.jsx

import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getAccount, watchAccount } from '@wagmi/core';
import { config } from '../../../config/wagmi';
import CoinbaseWalletConnect from '../CoinbaseWalletConnect/CoinbaseWalletConnect';

const WalletMethodSelector = ({ isOpen, onClose }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const toast = useToast();
  
  const bgColor = useColorModeValue('white', '#18191b');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Check wallet connection status
  useEffect(() => {
    const checkConnection = () => {
      const account = getAccount(config);
      if (account.address) {
        setIsWalletConnected(true);
      } else {
        setIsWalletConnected(false);
      }
    };
    
    checkConnection();
    
    // Watch for account changes
    const unwatch = watchAccount(config, {
      onChange: (account) => {
        if (account.address) {
          setIsWalletConnected(true);
          
          // Close modal on successful connection
          onClose();
          
          toast({
            title: 'Wallet Connected',
            description: 'Successfully connected to Coinbase Smart Wallet',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          setIsWalletConnected(false);
        }
      },
    });
    
    return () => unwatch();
  }, [onClose, toast]);

  const isConnected = isWalletConnected;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={bgColor} color={textColor} borderRadius="lg">
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
            {isConnected ? 'Wallet Connected' : 'Connect to NeuraLabs'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            {isConnected ? (
              <VStack spacing={4}>
                <Text fontSize="sm" color={textColor}>
                  You are connected with Coinbase Smart Wallet
                </Text>
                <CoinbaseWalletConnect />
              </VStack>
            ) : (
              <CoinbaseWalletConnect />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default WalletMethodSelector;