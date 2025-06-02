import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createContext, useContext, useEffect, useState } from 'react';

// Create context for wallet-related state
const WalletContext = createContext(null);

// Create provider component
export const WalletContextProvider = ({ children, rpcUrl }) => {
  return (
    <InnerWalletContextProvider rpcUrl={rpcUrl}>
      {children}
    </InnerWalletContextProvider>
  );
};

// Inner provider for wallet context
const InnerWalletContextProvider = ({ children, rpcUrl }) => {
  const [client, setClient] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [network, setNetwork] = useState(rpcUrl ? 'custom' : 'testnet');
  const [wallet, setWallet] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);

  // Initialize Sui client
  useEffect(() => {
    try {
      let endpoint;
      if (rpcUrl) {
        endpoint = rpcUrl;
      } else {
        // Use default endpoints based on network
        endpoint = getFullnodeUrl('testnet');
      }
      
      const newClient = new SuiClient({ url: endpoint });
      setClient(newClient);
    } catch (error) {
      console.error('Failed to initialize SUI client:', error);
    }
  }, [rpcUrl]);

  // Detect and track available wallets
  useEffect(() => {
    const checkForWallets = () => {
      const wallets = [];
      
      if (window.slush) {
        wallets.push({
          name: 'Slush',
          icon: 'https://slush.xyz/logo.png',
          adapter: window.slush
        });
      }
      
      if (window.suiet) {
        wallets.push({
          name: 'Suiet',
          icon: 'https://suiet.app/logo.png',
          adapter: window.suiet
        });
      }
      
      if (window.sui) {
        wallets.push({
          name: 'Sui Wallet',
          icon: 'https://sui.io/logo.png',
          adapter: window.sui
        });
      }
      
      // Add other wallet detection as needed
      
      return wallets;
    };
    
    // Initial check for wallets
    const initialWallets = checkForWallets();
    setAvailableWallets(initialWallets);
    
    // Function to handle wallet availability changes
    const handleWalletChange = () => {
      const updatedWallets = checkForWallets();
      setAvailableWallets(updatedWallets);
    };
    
    // Check for wallets periodically
    const intervalId = setInterval(handleWalletChange, 2000);
    
    // Listen for wallet initialization events
    window.addEventListener('load', handleWalletChange);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('load', handleWalletChange);
    };
  }, []);

  // Connect to Slush wallet
  const connectToSlush = async () => {
    try {
      setConnecting(true);
      
      if (!window.slush) {
        throw new Error('Slush wallet not detected. Please install Slush wallet extension.');
      }
      
      // Connect to wallet
      const response = await window.slush.connect();
      
      // Set wallet details
      if (response && response.accounts && response.accounts.length > 0) {
        setWalletAddress(response.accounts[0]);
        setConnected(true);
        setWallet({
          name: 'Slush',
          icon: 'https://slush.xyz/logo.png',
          adapter: window.slush
        });
        
        // Fetch balance
        if (client && response.accounts[0]) {
          fetchBalance(response.accounts[0]);
        }
      } else {
        throw new Error('No accounts found in wallet response');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to connect to Slush wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  };
  
  // Connect to any supported wallet by name
  const connect = async (walletName) => {
    try {
      if (!walletName) {
        throw new Error('Wallet name is required');
      }
      
      setConnecting(true);
      
      // Normalize wallet name for comparison
      const normalizedName = walletName.toLowerCase();
      
      // Find the wallet in available wallets
      const targetWallet = availableWallets.find(w => 
        w.name.toLowerCase() === normalizedName || 
        w.name.toLowerCase().includes(normalizedName)
      );
      
      if (!targetWallet) {
        throw new Error(`${walletName} wallet not found. Please make sure it's installed.`);
      }
      
      if (normalizedName === 'slush' || normalizedName.includes('slush')) {
        return await connectToSlush();
      }
      
      // Generic connect for other wallets
      const response = await targetWallet.adapter.connect();
      console.log('Wallet response:', response);
      if (response && response.accounts && response.accounts.length > 0) {
        setWalletAddress(response.accounts[0]);
        setConnected(true);
        setWallet({
          name: targetWallet.name,
          icon: targetWallet.icon,
          adapter: targetWallet.adapter
        });
        
        if (client && response.accounts[0]) {
          fetchBalance(response.accounts[0]);
        }
      } else {
        throw new Error('No accounts found in wallet response');
      }
      
      return response;
    } catch (error) {
      console.error(`Failed to connect to ${walletName} wallet:`, error);
      throw error;
    } finally {
      setConnecting(false);
    }
  };
  
  // Disconnect from wallet
  const disconnect = async () => {
    try {
      setDisconnecting(true);
      
      if (wallet?.adapter) {
        try {
          await wallet.adapter.disconnect();
        } catch (error) {
          console.warn('Error during disconnect:', error);
          // Continue with state cleanup even if wallet disconnect fails
        }
      }
      
      // Reset wallet state
      setWalletAddress('');
      setBalance(null);
      setConnected(false);
      setWallet(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    } finally {
      setDisconnecting(false);
    }
  };
  
  // Fetch account balance
  const fetchBalance = async (address) => {
    try {
      if (!client || !address) return;
      
      const { totalBalance } = await client.getBalance({
        owner: address,
      });
      
      // Convert from MIST to SUI (1 SUI = 10^9 MIST)
      setBalance(Number(totalBalance) / 1000000000);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };
  
  // Sign and execute transaction
  const signAndExecuteTransaction = async (transaction) => {
    if (!client || !walletAddress || !wallet?.adapter) {
      throw new Error('Client, wallet address or wallet adapter not available');
    }
    
    try {
      const result = await wallet.adapter.signAndExecuteTransaction(transaction);
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };
  
  // Sign transaction (without executing)
  const signTransaction = async (transaction) => {
    if (!client || !walletAddress || !wallet?.adapter) {
      throw new Error('Client, wallet address or wallet adapter not available');
    }
    
    try {
      const result = await wallet.adapter.signTransaction(transaction);
      return result;
    } catch (error) {
      console.error('Transaction signing error:', error);
      throw error;
    }
  };
  
  // Sign message
  const signMessage = async (message) => {
    if (!walletAddress || !wallet?.adapter) {
      throw new Error('Wallet address or wallet adapter not available');
    }
    
    try {
      const result = await wallet.adapter.signMessage({
        message: new TextEncoder().encode(message)
      });
      return result;
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  };

    // Request zkLogin signature
  const requestZkLoginSignature = async (params) => {
    if (!client || !walletAddress || !wallet?.adapter) {
      throw new Error('Client, wallet address or wallet adapter not available');
    }
    if (wallet.name !== 'Sui Wallet') {
      throw new Error('zkLogin is only supported by Sui Wallet');
    }
    try {
      const response = await wallet.adapter.request({
        method: 'sui_signZkLogin',
        params: params
      });
      return response;
    } catch (error) {
      console.error('Error requesting zkLogin signature:', error);
      throw error;
    }
  };

  // Account object for compatibility with existing components
  const account = walletAddress ? { address: walletAddress } : null;

  return (
    <WalletContext.Provider 
      value={{ 
        connect,
        connectToSlush,
        disconnect,
        account,
        wallets: availableWallets,
        wallet,
        connected,
        connecting,
        disconnecting,
        network: {
          name: network,
          url: rpcUrl || getFullnodeUrl('testnet')
        },
        walletAddress,
        balance,
        client,
        signAndExecuteTransaction,
        signTransaction,
        signMessage,
        fetchBalance,
        requestZkLoginSignature
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === null) {
    throw new Error('useWallet must be used within a WalletContextProvider');
  }
  return context;
};

export default WalletContext;