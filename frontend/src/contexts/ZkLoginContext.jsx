// frontend/src/contexts/ZkLoginContext.js

import { createContext, useContext, useState, useEffect } from 'react';
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
  const [jwtToken, setJwtToken] = useState(null);

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
      const savedAuthToken = ZkLoginService.getStoredAuthToken();
      
      if (savedAddress && savedJwt && savedAuthToken) {
        try {
          // Decode JWT to get user info
          const { jwtDecode } = require('jwt-decode');
          const decodedJwt = jwtDecode(savedJwt);
          
          setIsAuthenticated(true);
          setZkLoginAddress(savedAddress);
          setJwtToken(savedAuthToken);
          setUserInfo({
            sub: decodedJwt.sub,
            email: decodedJwt.email,
            name: decodedJwt.name,
            picture: decodedJwt.picture
          });
        } catch (err) {
          console.error('Failed to restore zkLogin session:', err);
          // Clear corrupted session data
          logout();
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
      
      // Redirect to Google OAuth login
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
  const completeZkLogin = async (jwt, shouldSign = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Complete the login process - this now includes authentication with backend
      const result = await ZkLoginService.completeLogin(jwt, shouldSign);
      
      if (result.success) {
        // Update state with authentication data
        setIsAuthenticated(true);
        setZkLoginAddress(result.address);
        setJwtToken(result.jwtToken);
        
        // Extract user info from JWT
        const { decodedJwt } = result;
        setUserInfo({
          sub: decodedJwt.sub,
          email: decodedJwt.email,
          name: decodedJwt.name,
          picture: decodedJwt.picture
        });
        
        console.log('zkLogin authentication completed successfully!');
        return result;
      } else if (result.needsSignature) {
        // Return the result so the callback component can show the popup
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

  // Make authenticated API calls using the JWT token
  const makeAuthenticatedRequest = async (url, options = {}) => {
    try {
      return await ZkLoginService.makeAuthenticatedRequest(url, options);
    } catch (err) {
      if (err.message.includes('expired')) {
        // Token expired - trigger logout
        logout();
      }
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // If we have a token, call backend logout endpoint
      if (jwtToken) {
        try {
          await makeAuthenticatedRequest(import.meta.env.VITE_BACKEND_URL + '/api/zk-login/zklogin-logout', {
            method: 'POST'
          });
        } catch (err) {
          console.warn('Backend logout failed:', err);
          // Continue with local logout even if backend fails
        }
      }
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Clear local state and storage
      ZkLoginService.logout();
      
      setIsAuthenticated(false);
      setZkLoginAddress(null);
      setUserInfo(null);
      setJwtToken(null);
      setError(null);
    }
  };

  // Validate current token
  const validateToken = async () => {
    try {
      if (!jwtToken) {
        return { valid: false, error: 'No token found' };
      }

      const response = await makeAuthenticatedRequest(
        import.meta.env.VITE_BACKEND_URL + '/api/zk-login/zklogin-validate'
      );
      
      if (response.ok) {
        const data = await response.json();
        return { valid: true, userData: data };
      } else {
        throw new Error('Token validation failed');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      return { valid: false, error: err.message };
    }
  };

  // Context value
  const contextValue = {
    isAuthenticated,
    zkLoginAddress,
    userInfo,
    isLoading,
    error,
    jwtToken,
    startZkLogin,
    completeZkLogin,
    signTransaction,
    makeAuthenticatedRequest,
    validateToken,
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