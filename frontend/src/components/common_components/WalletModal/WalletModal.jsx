import React from 'react';
import { ConnectModal } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Button, useColorModeValue } from '@chakra-ui/react';

const WalletConnectModal = () => {
  const currentAccount = useCurrentAccount();
  const buttonBg = useColorModeValue('blue.500', 'blue.400');
  const buttonHoverBg = useColorModeValue('blue.600', 'blue.500');
  
  // Filter function to prioritize Slush wallet
  const walletFilter = (wallet) => {
    // You can use this to filter out specific wallets if needed
    return true; // By default, show all available wallets
  };
  
  return (
    <ConnectModal
      trigger={
        <Button
          bg={buttonBg}
          color="white"
          _hover={{ bg: buttonHoverBg }}
          size="md"
          borderRadius="md"
          disabled={!!currentAccount}
        >
          {currentAccount ? 'Connected' : 'Connect Wallet'}
        </Button>
      }
      walletFilter={walletFilter}
    />
  );
};

export default WalletConnectModal;