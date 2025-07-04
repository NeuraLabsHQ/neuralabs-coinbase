import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

// Helper function to get network name from chain ID
const getNetworkName = (chainId) => {
  const networks = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten',
    4: 'Rinkeby', 
    5: 'Goerli',
    11155111: 'Sepolia',
    1337: 'Local Development',
    31337: 'Hardhat',
    137: 'Polygon',
    80001: 'Mumbai'
  };
  return networks[chainId] || `Chain ${chainId}`;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      disconnect();
    } else {
      setAccount(accounts[0]);
      updateBalance(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    // Reload the page as recommended by MetaMask
    window.location.reload();
  };

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check if we have permission to access accounts
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          // Only proceed if we actually have accounts
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const network = await provider.getNetwork();
          
          // Add network name for known networks
          const networkWithName = {
            ...network,
            chainId: Number(network.chainId),
            name: network.name || getNetworkName(Number(network.chainId))
          };
          
          setProvider(provider);
          setSigner(signer);
          setAccount(address);
          setNetwork(networkWithName);
          await updateBalance(address);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        // Reset state on error
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setNetwork(null);
      }
    }
  };

  const updateBalance = async (address) => {
    if (provider && address) {
      try {
        const balance = await provider.getBalance(address);
        setBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      // Add network name for known networks
      const networkWithName = {
        ...network,
        chainId: Number(network.chainId),
        name: network.name || getNetworkName(Number(network.chainId))
      };
      
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setNetwork(networkWithName);
      await updateBalance(address);
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error connecting wallet:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBalance(null);
    setNetwork(null);
    setError(null);
  };

  const switchNetwork = async (chainId) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (err) {
      if (err.code === 4902) {
        // Chain not added to wallet
        setError('Please add this network to your wallet');
      } else {
        setError(err.message);
      }
      return false;
    }
  };

  const value = {
    // State
    account,
    provider,
    signer,
    balance,
    network,
    isConnecting,
    error,
    isConnected: !!(account && provider && signer),
    
    // Actions
    connect,
    disconnect,
    switchNetwork,
    updateBalance: () => updateBalance(account),
    
    // Formatted values
    formattedAddress: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '',
    formattedBalance: balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH',
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};