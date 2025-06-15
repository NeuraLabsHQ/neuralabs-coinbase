// frontend/src/contexts/WalletContextProvider.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getAccount, 
  watchAccount,
  connect as wagmiConnect,
  disconnect as wagmiDisconnect,
  getBalance,
  switchChain,
  getChainId
} from '@wagmi/core';
import { config } from '../config/wagmi';
import { formatEther } from 'viem';
import { useToast } from '@chakra-ui/react';

// Create the context
const WalletContext = createContext(null);

// Provider component
export const WalletContextProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const toast = useToast();

  // Update balance
  const updateBalance = useCallback(async (address) => {
    if (!address) return;
    
    try {
      const balanceData = await getBalance(config, { address });
      setBalance(balanceData);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, []);

  // Initialize and watch account changes
  useEffect(() => {
    // Check initial connection
    const checkConnection = async () => {
      const accountData = getAccount(config);
      
      if (accountData && accountData.address && accountData.isConnected) {
        setAccount(accountData);
        setIsConnected(true);
        setChainId(getChainId(config));
        await updateBalance(accountData.address);
      } else {
        setAccount(null);
        setIsConnected(false);
        setBalance(null);
        setChainId(null);
      }
    };

    checkConnection();

    // Watch for account changes
    const unwatch = watchAccount(config, {
      onChange: async (newAccount) => {
        console.log('Wallet account changed:', newAccount);
        
        if (newAccount && newAccount.address && newAccount.isConnected) {
          setAccount(newAccount);
          setIsConnected(true);
          setChainId(getChainId(config));
          await updateBalance(newAccount.address);
        } else {
          // Clear all state when disconnected
          setAccount(null);
          setIsConnected(false);
          setBalance(null);
          setChainId(null);
        }
      },
    });

    return () => unwatch();
  }, [updateBalance]);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      // Get the Coinbase connector
      const coinbaseConnector = config.connectors.find(
        c => c.name === 'Coinbase Wallet' || c.id === 'coinbaseWalletSDK'
      );
      
      if (!coinbaseConnector) {
        throw new Error('Coinbase Wallet connector not found');
      }

      // Connect
      const result = await wagmiConnect(config, {
        connector: coinbaseConnector
      });

      if (!result.accounts || result.accounts.length === 0) {
        throw new Error('No accounts returned from wallet connection');
      }

      // Update state
      const currentChainId = getChainId(config);
      setAccount({ 
        address: result.accounts[0], 
        isConnected: true,
        chain: result.chain || { id: currentChainId } 
      });
      setIsConnected(true);
      setChainId(currentChainId);
      await updateBalance(result.accounts[0]);

      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to Coinbase Smart Wallet',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return result;
    } catch (err) {
      console.error('Connection error:', err);
      
      toast({
        title: 'Connection Failed',
        description: err.message || 'Failed to connect wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [toast, updateBalance]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    
    try {
      await wagmiDisconnect(config);
      
      // Clear all state
      setAccount(null);
      setIsConnected(false);
      setBalance(null);
      setChainId(null);
      
      toast({
        title: 'Wallet Disconnected',
        description: 'Successfully disconnected from wallet',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Disconnect error:', err);
      
      // Force clear state even if disconnect fails
      setAccount(null);
      setIsConnected(false);
      setBalance(null);
      setChainId(null);
      
      toast({
        title: 'Disconnected',
        description: 'Wallet disconnected (with warnings)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDisconnecting(false);
    }
  }, [toast]);

  // Switch chain (keeping for future use, but only Sepolia is available)
  const handleSwitchChain = useCallback(async (newChainId) => {
    try {
      await switchChain(config, { chainId: newChainId });
      setChainId(newChainId);
      
      toast({
        title: 'Chain Switched',
        description: `Switched to chain ${newChainId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error switching chain:', err);
      
      toast({
        title: 'Chain Switch Failed',
        description: err.message || 'Failed to switch chain',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const value = {
    // State
    account,
    balance,
    chainId,
    isConnecting,
    isDisconnecting,
    isConnected,
    
    // Actions
    connect,
    disconnect,
    updateBalance,
    switchChain: handleSwitchChain,
    
    // Computed values
    address: account?.address || '',
    formattedAddress: account?.address 
      ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` 
      : '',
    formattedBalance: balance 
      ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` 
      : null,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletContextProvider');
  }
  return context;
};