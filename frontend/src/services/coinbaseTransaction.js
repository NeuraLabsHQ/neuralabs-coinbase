import { parseEther, formatEther, isAddress } from 'viem';
import { getAccount, sendTransaction, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '../config/wagmi.js';

/**
 * Execute a transaction using Coinbase Smart Wallet
 * @param {Object} transaction - Transaction object from build_transaction_json
 * @param {Object} options - Execution options
 * @returns {Object} Result object with success, hash, receipt, and error
 */
export async function executeCoinbaseTransaction(transaction, options = {}) {
  const { 
    onConnect, 
    onStatus,
    waitForConfirmation = true 
  } = options;
  
  try {
    // Validate transaction object
    const validation = validateTransaction(transaction);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if transaction is an error object
    if (transaction.error) {
      return { success: false, error: transaction.error };
    }

    // Get connected account
    const account = getAccount(config);
    if (!account.isConnected) {
      if (onConnect) {
        onStatus?.({ type: 'connecting' });
        await onConnect();
        // Re-check connection
        const newAccount = getAccount(config);
        if (!newAccount.isConnected) {
          return { success: false, error: 'Failed to connect wallet' };
        }
      } else {
        return { success: false, error: 'Wallet not connected' };
      }
    }

    // Verify the from address matches connected wallet (if specified)
    if (transaction.from && transaction.from.toLowerCase() !== account.address.toLowerCase()) {
      return { 
        success: false, 
        error: `Transaction from address (${transaction.from}) does not match connected wallet (${account.address})` 
      };
    }

    // Prepare transaction for wagmi
    const preparedTx = prepareTransactionForWagmi(transaction, account.address);
    
    // Send status update
    onStatus?.({ type: 'pending', transaction: preparedTx });

    // Send transaction
    const hash = await sendTransaction(config, preparedTx);
    
    // Send mining status
    onStatus?.({ type: 'mining', hash });

    let receipt = null;
    if (waitForConfirmation) {
      // Wait for transaction confirmation
      receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
      });
      
      // Check if transaction was successful
      if (receipt.status === 'reverted') {
        return { 
          success: false, 
          error: 'Transaction reverted', 
          hash, 
          receipt 
        };
      }
    }

    return {
      success: true,
      hash,
      receipt,
      error: null
    };

  } catch (error) {
    console.error('Transaction execution error:', error);
    return {
      success: false,
      error: error.message || 'Transaction failed',
      rawError: error
    };
  }
}

/**
 * Prepare transaction for wagmi format
 */
function prepareTransactionForWagmi(transaction, defaultFrom) {
  const prepared = {
    to: transaction.to,
    account: transaction.from || defaultFrom,
  };

  // Handle value - convert to bigint if needed
  if (transaction.value) {
    if (typeof transaction.value === 'string') {
      if (transaction.value.startsWith('0x')) {
        // Hex value
        prepared.value = BigInt(transaction.value);
      } else if (transaction.value.includes('.')) {
        // Decimal ETH value
        prepared.value = parseEther(transaction.value);
      } else {
        // Wei value as string
        prepared.value = BigInt(transaction.value);
      }
    } else if (typeof transaction.value === 'number') {
      prepared.value = BigInt(transaction.value);
    }
  }

  // Handle data
  if (transaction.data && transaction.data !== '0x') {
    prepared.data = transaction.data;
  }

  // Handle gas
  if (transaction.gas) {
    prepared.gas = typeof transaction.gas === 'string' && transaction.gas.startsWith('0x')
      ? BigInt(transaction.gas)
      : BigInt(transaction.gas);
  }

  // Handle gasPrice
  if (transaction.gasPrice) {
    prepared.gasPrice = typeof transaction.gasPrice === 'string' && transaction.gasPrice.startsWith('0x')
      ? BigInt(transaction.gasPrice)
      : BigInt(transaction.gasPrice);
  }

  // Handle nonce
  if (transaction.nonce !== undefined && transaction.nonce !== null) {
    prepared.nonce = typeof transaction.nonce === 'string' && transaction.nonce.startsWith('0x')
      ? parseInt(transaction.nonce, 16)
      : parseInt(transaction.nonce);
  }

  // Handle chainId
  if (transaction.chainId) {
    prepared.chainId = transaction.chainId;
  }
  
  return prepared;
}

/**
 * Validate transaction object
 */
export function validateTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object') {
    return { valid: false, error: 'Invalid transaction object' };
  }

  // Check for error in transaction
  if (transaction.error) {
    return { valid: false, error: transaction.error };
  }

  // Must have either 'to' address or be a contract deployment
  if (!transaction.to && !transaction.data) {
    return { valid: false, error: 'Transaction must have a recipient address or deployment data' };
  }

  // Validate addresses
  if (transaction.to && !isAddress(transaction.to)) {
    return { valid: false, error: 'Invalid recipient address' };
  }

  if (transaction.from && !isAddress(transaction.from)) {
    return { valid: false, error: 'Invalid sender address' };
  }

  return { valid: true };
}

/**
 * Get transaction type
 */
export function getTransactionType(transaction) {
  if (!transaction.to) {
    return 'deployment';
  } else if (transaction.data && transaction.data !== '0x') {
    return 'contract_call';
  } else {
    return 'transfer';
  }
}

/**
 * Format transaction for display
 */
export function formatTransactionDisplay(transaction) {
  const type = getTransactionType(transaction);
  const display = {
    type,
    network: getNetworkName(transaction.chainId),
  };

  // Format value if present
  if (transaction.value) {
    try {
      let ethValue;
      if (typeof transaction.value === 'string' && transaction.value.startsWith('0x')) {
        ethValue = formatEther(BigInt(transaction.value));
      } else if (typeof transaction.value === 'string' && !transaction.value.includes('.')) {
        ethValue = formatEther(BigInt(transaction.value));
      } else {
        ethValue = transaction.value;
      }
      display.value = `${ethValue} ETH`;
    } catch (e) {
      display.value = transaction.value;
    }
  }

  // Add function name for contract calls
  if (type === 'contract_call' && transaction.data) {
    // First 10 characters of data is the function selector (0x + 8 chars)
    display.functionSelector = transaction.data.substring(0, 10);
    // You could decode this to actual function name if you have the ABI
    display.functionName = `Contract Call (${display.functionSelector})`;
  }

  return display;
}

/**
 * Get network name from chain ID
 */
function getNetworkName(chainId) {
  const networks = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    8453: 'Base Mainnet',
    84532: 'Base Sepolia',
    84531: 'Base Goerli',
  };
  
  return networks[chainId] || `Chain ${chainId}`;
}