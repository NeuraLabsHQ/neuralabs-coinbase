// frontend/src/contexts/WalletContextProvider.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getAccount, 
  watchAccount,
  connect as wagmiConnect,
  disconnect as wagmiDisconnect,
  getBalance,
  switchChain,
  getChainId,
  reconnect,
  readContract
} from '@wagmi/core';
import { config } from '../config/wagmi';
import { formatEther, formatUnits } from 'viem';
import { useToast } from '@chakra-ui/react';
import { 
  authenticateWallet, 
  logout as authLogout, 
  getStoredAuthToken, 
  getStoredUserId,
  isAuthenticated as checkIsAuthenticated 
} from '../components/auth/WalletSignatureService.js';

// USDC Contract on Base Sepolia
const USDC_BASE_SEPOLIA = {
  address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  abi: [
    {
      "inputs": [{"name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function",
      "stateMutability": "view"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [{"name": "", "type": "uint8"}],
      "type": "function",
      "stateMutability": "view"
    }
  ]
};

// Create the context
const WalletContext = createContext(null);

// Provider component
export const WalletContextProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
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

  // Update USDC balance
  const updateUsdcBalance = useCallback(async (address) => {
    if (!address) return;
    
    try {
      const usdcBalanceRaw = await readContract(config, {
        address: USDC_BASE_SEPOLIA.address,
        abi: USDC_BASE_SEPOLIA.abi,
        functionName: 'balanceOf',
        args: [address],
      });
      
      // USDC has 6 decimals
      const formattedBalance = formatUnits(usdcBalanceRaw, 6);
      setUsdcBalance({
        value: usdcBalanceRaw,
        formatted: formattedBalance,
        decimals: 6,
        symbol: 'USDC'
      });
    } catch (err) {
      console.error('Error fetching USDC balance:', err);
      setUsdcBalance(null);
    }
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(() => {
    const token = getStoredAuthToken();
    const storedUserId = getStoredUserId();
    const authenticated = checkIsAuthenticated();
    
    setAuthToken(token);
    setUserId(storedUserId);
    setIsAuthenticated(authenticated);
    
    return authenticated;
  }, []);

  // Initialize and watch account changes
  useEffect(() => {
    // Check initial connection and auth
    const checkConnection = async () => {
      // First, try to reconnect if there's a stored connection
      try {
        await reconnect(config);
      } catch (err) {
        console.log('No previous connection to restore:', err);
      }
      
      const accountData = getAccount(config);
      
      if (accountData && accountData.address && accountData.isConnected) {
        setAccount(accountData);
        setIsConnected(true);
        setChainId(getChainId(config));
        await updateBalance(accountData.address);
        await updateUsdcBalance(accountData.address);
        
        // Check if already authenticated
        checkAuthStatus();
      } else {
        setAccount(null);
        setIsConnected(false);
        setBalance(null);
        setUsdcBalance(null);
        setChainId(null);
        setIsAuthenticated(false);
        setAuthToken(null);
        setUserId(null);
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
          await updateUsdcBalance(newAccount.address);
          
          // Check auth status on account change
          checkAuthStatus();
        } else {
          // Clear all state when disconnected
          setAccount(null);
          setIsConnected(false);
          setBalance(null);
          setUsdcBalance(null);
          setChainId(null);
          setIsAuthenticated(false);
          setAuthToken(null);
          setUserId(null);
        }
      },
    });

    return () => unwatch();
  }, [updateBalance, updateUsdcBalance, checkAuthStatus]);

  // Connect wallet and authenticate
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

      // Step 1: Connect wallet
      const result = await wagmiConnect(config, {
        connector: coinbaseConnector
      });

      if (!result.accounts || result.accounts.length === 0) {
        throw new Error('No accounts returned from wallet connection');
      }

      // Update state
      const currentChainId = getChainId(config);
      const walletAddress = result.accounts[0];
      
      setAccount({ 
        address: walletAddress, 
        isConnected: true,
        chainId: currentChainId 
      });
      setIsConnected(true);
      setChainId(currentChainId);
      await updateBalance(walletAddress);
      await updateUsdcBalance(walletAddress);

      toast({
        title: 'Wallet Connected',
        description: 'Now authenticating with backend...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });

      // Step 2: Authenticate with backend
      setIsAuthenticating(true);
      try {
        const authResult = await authenticateWallet(walletAddress);
        
        setAuthToken(authResult.access_token);
        setUserId(authResult.user_id);
        setIsAuthenticated(true);
        
        toast({
          title: 'Authentication Successful',
          description: 'You are now logged in',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (authError) {
        console.error('Authentication failed:', authError);
        
        // Show warning but don't disconnect wallet
        toast({
          title: 'Authentication Warning',
          description: 'Wallet connected but authentication failed. Some features may be limited.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsAuthenticating(false);
      }

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

  // Disconnect wallet and logout
  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    
    try {
      // Step 1: Logout from backend
      if (isAuthenticated) {
        authLogout();
      }
      
      // Step 2: Disconnect wallet
      await wagmiDisconnect(config);
      
      // Clear all state
      setAccount(null);
      setIsConnected(false);
      setBalance(null);
      setChainId(null);
      setIsAuthenticated(false);
      setAuthToken(null);
      setUserId(null);
      
      toast({
        title: 'Disconnected',
        description: 'Wallet disconnected and logged out',
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
      setUsdcBalance(null);
      setChainId(null);
      setIsAuthenticated(false);
      setAuthToken(null);
      setUserId(null);
      
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
  }, [toast, isAuthenticated]);

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
    usdcBalance,
    chainId,
    isConnecting,
    isDisconnecting,
    isConnected,
    isAuthenticating,
    isAuthenticated,
    authToken,
    userId,
    
    // Actions
    connect,
    disconnect,
    updateBalance,
    updateUsdcBalance,
    switchChain: handleSwitchChain,
    
    // Computed values
    address: account?.address || '',
    formattedAddress: account?.address 
      ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` 
      : '',
    formattedBalance: balance 
      ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` 
      : null,
    formattedUsdcBalance: usdcBalance 
      ? `${parseFloat(usdcBalance.formatted).toFixed(2)} ${usdcBalance.symbol}` 
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