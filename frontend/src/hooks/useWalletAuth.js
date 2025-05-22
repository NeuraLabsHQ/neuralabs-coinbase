// frontend/src/hooks/useWalletAuth.js

import { useState, useEffect } from 'react';
import { useSignPersonalMessage, useCurrentAccount } from '@mysten/dapp-kit';
import { useToast } from '@chakra-ui/react';
import * as WalletAuth from '../components/auth/WalletSignatureService';

export const useWalletAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
  
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const currentAccount = useCurrentAccount();
  const toast = useToast();

  // Check for existing authentication on mount
  useEffect(() => {
    const token = WalletAuth.getStoredAuthToken();
    const storedUserId = WalletAuth.getStoredUserId();
    
    if (token && storedUserId) {
      setIsAuthenticated(true);
      setAuthToken(token);
      setUserId(storedUserId);
    }
  }, []);

  // Check if wallet connection changed
  useEffect(() => {
    if (!currentAccount) {
      setIsAuthenticated(false);
    } else {
      const storedUserId = WalletAuth.getStoredUserId();
      if (storedUserId === currentAccount.address) {
        const token = WalletAuth.getStoredAuthToken();
        if (token) {
          setIsAuthenticated(true);
          setAuthToken(token);
          setUserId(storedUserId);
        }
      }
    }
  }, [currentAccount]);

  /**
   * Authenticate with connected wallet
   */
  const authenticateWallet = async () => {
    if (!currentAccount) {
      toast({
        title: 'No Wallet Connected',
        description: 'Please connect your wallet first',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return { success: false, error: 'No wallet connected' };
    }

    if (isAuthenticating) {
      return { success: false, error: 'Authentication in progress' };
    }

    setIsAuthenticating(true);

    try {
      console.log('Starting wallet authentication...');
      
      const result = await WalletAuth.authenticateWallet(
        currentAccount.address,
        signPersonalMessage
      );

      console.log('Authentication result:', result);

      if (result.access_token) {
        setIsAuthenticated(true);
        setAuthToken(result.access_token);
        setUserId(result.user_id);

        toast({
          title: 'Authentication Successful',
          description: 'You are now logged in with your wallet',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        return { success: true, result };
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Wallet authentication error:', error);
      
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Failed to authenticate with wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return { success: false, error: error.message };
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Make authenticated API call
   */
  const makeAuthenticatedRequest = async (url, options = {}) => {
    try {
      return await WalletAuth.makeAuthenticatedRequest(url, options);
    } catch (error) {
      if (error.message.includes('expired')) {
        logout();
        toast({
          title: 'Session Expired',
          description: 'Please authenticate again',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
      throw error;
    }
  };

  /**
   * Validate current token
   */
  const validateToken = async () => {
    try {
      const response = await WalletAuth.makeAuthenticatedRequest(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/validate-token`
      );
      
      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const result = await response.json();
      return { valid: true, userData: result };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: error.message };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      if (authToken) {
        try {
          await WalletAuth.makeAuthenticatedRequest(
            `${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`,
            { method: 'POST' }
          );
        } catch (err) {
          console.warn('Backend logout failed:', err);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      WalletAuth.logout();
      setIsAuthenticated(false);
      setAuthToken(null);
      setUserId(null);
      
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return {
    isAuthenticating,
    isAuthenticated,
    authToken,
    userId,
    currentAccount,
    authenticateWallet,
    makeAuthenticatedRequest,
    validateToken,
    logout
  };
};