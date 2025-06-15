// frontend/src/services/WalletSignatureService.js

import { signMessage } from '@wagmi/core';
import { config } from '../../config/wagmi';

/**
 * Generate authentication message for signing
 * @param {string} walletAddress - The wallet address
 * @returns {string} - Message to be signed
 */
export const generateAuthMessage = (walletAddress) => {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  return `Authenticate wallet ${walletAddress} at ${timestamp} with nonce ${nonce}`;
};

/**
 * Sign message using Coinbase Wallet via wagmi
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<Object>} - Signature result
 */
export const signAuthMessage = async (walletAddress) => {
  try {
    const message = generateAuthMessage(walletAddress);
    console.log('Signing message:', message);

    // Use wagmi's signMessage
    const signature = await signMessage(config, {
      message: message,
    });

    console.log('Message signed successfully:', signature);
    
    return {
      success: true,
      signature: signature,
      message: message,
      address: walletAddress
    };
  } catch (error) {
    console.error('Signing error:', error);
    throw new Error('Failed to sign message: ' + error.message);
  }
};

/**
 * Send signature to backend and get JWT token
 * @param {Object} signatureData - Object containing address, signature, and message
 * @returns {Promise<Object>} - Backend authentication response
 */
export const authenticateWithBackend = async (signatureData) => {
  try {
    const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_key: signatureData.address,
        signature: signatureData.signature,
        message: signatureData.message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Authentication failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Store JWT token
    if (result.access_token) {
      sessionStorage.setItem('wallet_auth_token', result.access_token);
      sessionStorage.setItem('wallet_user_id', result.user_id);
    }

    return result;
  } catch (error) {
    console.error('Backend authentication error:', error);
    throw error;
  }
};

/**
 * Complete wallet authentication (sign + backend call)
 * @param {string} walletAddress - The wallet address
 * @returns {Promise<Object>} - Complete authentication result
 */
export const authenticateWallet = async (walletAddress) => {
  try {
    // Step 1: Sign message
    const signResult = await signAuthMessage(walletAddress);
    
    if (!signResult.success) {
      throw new Error('Failed to sign message');
    }

    // Step 2: Send to backend
    const authResult = await authenticateWithBackend(signResult);

    return {
      success: true,
      ...authResult
    };
  } catch (error) {
    console.error('Wallet authentication error:', error);
    throw error;
  }
};

/**
 * Get stored authentication token
 * @returns {string|null} - JWT token or null
 */
export const getStoredAuthToken = () => {
  return sessionStorage.getItem('wallet_auth_token');
};

/**
 * Get stored user ID
 * @returns {string|null} - User ID or null
 */
export const getStoredUserId = () => {
  return sessionStorage.getItem('wallet_user_id');
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  const token = getStoredAuthToken();
  const userId = getStoredUserId();
  return !!(token && userId);
};

/**
 * Make authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getStoredAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired - clear stored data
    logout();
    throw new Error('Authentication token expired');
  }

  return response;
};

/**
 * Logout and clear stored data
 */
export const logout = () => {
  const token = getStoredAuthToken();
  if (token) {
    fetch(import.meta.env.VITE_BACKEND_URL + '/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
    })
    .catch(error => {
      console.error('Logout error:', error);
    });
  }
  sessionStorage.removeItem('wallet_auth_token');
  sessionStorage.removeItem('wallet_user_id');
};