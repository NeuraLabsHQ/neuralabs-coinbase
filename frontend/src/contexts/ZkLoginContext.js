// frontend/src/contexts/ZkLoginContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import ZkLoginService from '../components/auth/ZkLoginService';

// Create context for zkLogin-related state
const ZkLoginContext = createContext(null);

// Create provider component
export const ZkLoginContextProvider = ({ children, googleClientId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [zkLoginAddress, setZkLoginAddress] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set client ID when provided
  useEffect(() => {
    if (googleClientId) {
      ZkLoginService.setClientId(googleClientId);
    }
  }, [googleClientId]);

  // Check for an existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const savedAddress = sessionStorage.getItem('zkLoginAddress');
      const savedJwt = sessionStorage.getItem('zkLoginJwt');
      
      if (savedAddress && savedJwt) {
        try {
          // Decode JWT to get user info
          const { jwtDecode } = require('jwt-decode');
          const decodedJwt = jwtDecode(savedJwt);
          
          setIsAuthenticated(true);
          setZkLoginAddress(savedAddress);
          setUserInfo({
            sub: decodedJwt.sub,
            email: decodedJwt.email,
            name: decodedJwt.name,
            picture: decodedJwt.picture
          });
        } catch (err) {
          console.error('Failed to restore zkLogin session:', err);
          sessionStorage.removeItem('zkLoginAddress');
          sessionStorage.removeItem('zkLoginJwt');
        }
      }
    };
    
    checkExistingSession();
  }, []);

  // Start the zkLogin process
  const startZkLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize zkLogin flow
      const { loginUrl } = await ZkLoginService.beginLogin();
      
      // Open the Google OAuth login window
      window.location.href = loginUrl;
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to start zkLogin process');
      console.error('zkLogin start error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Complete the zkLogin process after OAuth callback
  const completeZkLogin = async (jwt) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ZkLoginService.completeLogin(jwt);
      
      if (result.success) {
        // Store the address and JWT for future use
        sessionStorage.setItem('zkLoginAddress', result.address);
        sessionStorage.setItem('zkLoginJwt', jwt);
        
        // Update state
        setIsAuthenticated(true);
        setZkLoginAddress(result.address);
        
        // Extract user info from JWT
        const { decodedJwt } = result;
        setUserInfo({
          sub: decodedJwt.sub,
          email: decodedJwt.email,
          name: decodedJwt.name,
          picture: decodedJwt.picture
        });
        
        return result;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete zkLogin process');
      console.error('zkLogin completion error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign a transaction with zkLogin
  const signTransaction = async (transactionBlock) => {
    try {
      setIsLoading(true);
      return await ZkLoginService.signTransaction(transactionBlock);
    } catch (err) {
      setError(err.message || 'Failed to sign transaction');
      console.error('zkLogin sign transaction error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    ZkLoginService.logout();
    
    // Clear state
    setIsAuthenticated(false);
    setZkLoginAddress(null);
    setUserInfo(null);
    
    // Remove from sessionStorage
    sessionStorage.removeItem('zkLoginAddress');
    sessionStorage.removeItem('zkLoginJwt');
  };

  // Context value
  const contextValue = {
    isAuthenticated,
    zkLoginAddress,
    userInfo,
    isLoading,
    error,
    startZkLogin,
    completeZkLogin,
    signTransaction,
    logout
  };

  return (
    <ZkLoginContext.Provider value={contextValue}>
      {children}
    </ZkLoginContext.Provider>
  );
};

// Custom hook to use zkLogin context
export const useZkLogin = () => {
  const context = useContext(ZkLoginContext);
  if (context === null) {
    throw new Error('useZkLogin must be used within a ZkLoginContextProvider');
  }
  return context;
};

export default ZkLoginContext;