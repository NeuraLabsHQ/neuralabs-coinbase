/**
 * Wallet management utilities for blockchain interaction
 * These functions work with the WalletContext to provide additional functionality
 */

/**
 * Get wallet context from the React context
 * This function should be called from within React components
 * @param {Object} walletContext - The wallet context from useWallet hook
 * @returns {Object} Wallet information and utilities
 */
export function getWalletInfo(walletContext) {
  if (!walletContext) {
    throw new Error('Wallet context not provided');
  }

  const {
    account,
    provider,
    signer,
    balance,
    network,
    isConnected,
    error
  } = walletContext;

  return {
    address: account,
    provider,
    signer,
    balance,
    chainId: network?.chainId,
    networkName: network?.name,
    isConnected,
    error,
    isReady: isConnected && provider && signer
  };
}

/**
 * Verify wallet is connected and ready for transactions
 * @param {Object} walletContext - The wallet context from useWallet hook
 * @returns {Object} Verification result with status and message
 */
export function verifyWalletConnection(walletContext) {
  const wallet = getWalletInfo(walletContext);

  if (!wallet.isConnected) {
    return {
      isValid: false,
      error: 'Wallet not connected',
      action: 'connect'
    };
  }

  if (!wallet.provider) {
    return {
      isValid: false,
      error: 'Provider not available',
      action: 'refresh'
    };
  }

  if (!wallet.signer) {
    return {
      isValid: false,
      error: 'Signer not available',
      action: 'reconnect'
    };
  }

  return {
    isValid: true,
    address: wallet.address,
    chainId: wallet.chainId
  };
}

/**
 * Check if wallet is on the correct network
 * @param {Object} walletContext - The wallet context
 * @param {number} requiredChainId - Required chain ID
 * @returns {Object} Network check result
 */
export function checkNetwork(walletContext, requiredChainId) {
  const wallet = getWalletInfo(walletContext);

  if (!wallet.isConnected) {
    return {
      isCorrect: false,
      error: 'Wallet not connected',
      currentChainId: null,
      requiredChainId
    };
  }

  const isCorrect = wallet.chainId === requiredChainId;

  return {
    isCorrect,
    currentChainId: wallet.chainId,
    requiredChainId,
    error: isCorrect ? null : `Please switch to chain ID ${requiredChainId}`
  };
}

/**
 * Format wallet address for display
 * @param {string} address - Full wallet address
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Formatted address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format balance for display
 * @param {string|number} balance - Balance in ETH
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted balance
 */
export function formatBalance(balance, decimals = 4) {
  if (!balance) return '0 ETH';
  const num = parseFloat(balance);
  return `${num.toFixed(decimals)} ETH`;
}

/**
 * Get network name from chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} Network name
 */
export function getNetworkName(chainId) {
  const networks = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten',
    4: 'Rinkeby',
    5: 'Goerli',
    11155111: 'Sepolia',
    1337: 'Local Development',
    31337: 'Hardhat',
    137: 'Polygon',
    80001: 'Mumbai',
    10: 'Optimism',
    420: 'Optimism Goerli',
    42161: 'Arbitrum One',
    421613: 'Arbitrum Goerli'
  };

  return networks[chainId] || `Chain ${chainId}`;
}

/**
 * Get block explorer URL for a transaction
 * @param {number} chainId - Chain ID
 * @param {string} txHash - Transaction hash
 * @returns {string} Block explorer URL
 */
export function getExplorerUrl(chainId, txHash) {
  const explorers = {
    1: 'https://etherscan.io/tx/',
    3: 'https://ropsten.etherscan.io/tx/',
    4: 'https://rinkeby.etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/',
    11155111: 'https://sepolia.etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    80001: 'https://mumbai.polygonscan.com/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    420: 'https://goerli-optimism.etherscan.io/tx/',
    42161: 'https://arbiscan.io/tx/',
    421613: 'https://goerli.arbiscan.io/tx/'
  };

  const baseUrl = explorers[chainId];
  if (!baseUrl) return '';
  
  return `${baseUrl}${txHash}`;
}

/**
 * Check if wallet has sufficient balance for transaction
 * @param {Object} walletContext - The wallet context
 * @param {string} requiredAmount - Required amount in ETH
 * @param {string} gasEstimate - Estimated gas cost in ETH
 * @returns {Object} Balance check result
 */
export async function checkSufficientBalance(walletContext, requiredAmount = '0', gasEstimate = '0') {
  const wallet = getWalletInfo(walletContext);

  if (!wallet.isConnected || !wallet.balance) {
    return {
      sufficient: false,
      error: 'Wallet not connected or balance not available',
      balance: '0',
      required: requiredAmount,
      total: '0'
    };
  }

  const balance = parseFloat(wallet.balance);
  const required = parseFloat(requiredAmount);
  const gas = parseFloat(gasEstimate);
  const total = required + gas;

  return {
    sufficient: balance >= total,
    balance: wallet.balance,
    required: requiredAmount,
    gas: gasEstimate,
    total: total.toString(),
    shortage: balance < total ? (total - balance).toString() : '0'
  };
}

/**
 * Request wallet permissions if needed
 * @param {Object} walletContext - The wallet context
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export async function requestPermissions(walletContext) {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });

    return true;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}

/**
 * Add custom token to wallet
 * @param {Object} tokenInfo - Token information
 * @param {string} tokenInfo.address - Token contract address
 * @param {string} tokenInfo.symbol - Token symbol
 * @param {number} tokenInfo.decimals - Token decimals
 * @param {string} tokenInfo.image - Token image URL (optional)
 * @returns {Promise<boolean>} Whether token was added
 */
export async function addTokenToWallet(tokenInfo) {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet provider found');
    }

    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenInfo.address,
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          image: tokenInfo.image
        }
      }
    });

    return wasAdded;
  } catch (error) {
    console.error('Failed to add token:', error);
    return false;
  }
}