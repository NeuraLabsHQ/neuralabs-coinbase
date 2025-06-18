import { ethers } from 'ethers';

/**
 * Generic execute function for blockchain contract transactions
 * @param {Object} params - Parameters for the execute operation
 * @param {string} params.contractAddress - The contract address
 * @param {Array} params.abi - The contract ABI
 * @param {string} params.methodName - The method name to call
 * @param {Array} params.args - Arguments for the method
 * @param {Object} params.signer - Ethers signer instance
 * @param {Object} params.options - Transaction options (value, gasLimit, etc.)
 * @returns {Promise<Object>} Transaction receipt and other details
 */
export async function execute({ 
  contractAddress, 
  abi, 
  methodName, 
  args = [], 
  signer, 
  options = {} 
}) {
  try {
    if (!contractAddress || !abi || !methodName || !signer) {
      throw new Error('Missing required parameters for execute operation');
    }

    // Create contract instance with signer
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Check if method exists
    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`);
    }

    // Prepare transaction options
    const txOptions = {
      ...options,
      // Convert value to Wei if provided as string
      value: options.value ? ethers.parseEther(options.value.toString()) : undefined
    };

    // Estimate gas if not provided
    if (!txOptions.gasLimit) {
      try {
        const estimatedGas = await contract[methodName].estimateGas(...args, txOptions);
        // Add 20% buffer to estimated gas
        txOptions.gasLimit = estimatedGas * 120n / 100n;
      } catch (estimateError) {
        console.warn('Gas estimation failed, using default:', estimateError.message);
      }
    }

    // Execute the transaction
    console.log(`Executing ${methodName} on ${contractAddress}`);
    const tx = await contract[methodName](...args, txOptions);

    // Wait for transaction to be mined
    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();

    // Parse events from receipt
    const events = parseEvents(receipt, contract);

    return {
      success: receipt.status === 1,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events,
      receipt
    };
  } catch (error) {
    console.error(`Error executing ${methodName}:`, error);
    
    // Parse revert reason if available
    const revertReason = parseRevertReason(error);
    
    throw {
      method: methodName,
      error: revertReason || error.message || 'Transaction failed',
      code: error.code,
      details: error,
      transactionHash: error.transaction?.hash
    };
  }
}

/**
 * Execute multiple transactions in sequence
 * @param {Array} transactions - Array of transaction parameters
 * @returns {Promise<Array>} Array of transaction results
 */
export async function batchExecute(transactions) {
  const results = [];
  
  for (const tx of transactions) {
    try {
      const result = await execute(tx);
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({ success: false, error });
      // Optionally stop on first error
      if (tx.stopOnError) {
        break;
      }
    }
  }
  
  return results;
}

/**
 * Execute with automatic retry on failure
 * @param {Object} params - Same as execute function
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 2000)
 * @returns {Promise<Object>} Transaction result
 */
export async function executeWithRetry(params, maxRetries = 3, retryDelay = 2000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await execute(params);
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's a revert error
      if (error.code === 'CALL_EXCEPTION' || error.error?.includes('revert')) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        console.log(`Retry ${i + 1}/${maxRetries} after ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Estimate gas and cost for a transaction
 * @param {Object} params - Same as execute function (without signer)
 * @param {Object} provider - Ethers provider instance
 * @returns {Promise<Object>} Gas estimate and cost information
 */
export async function estimateTransaction({ 
  contractAddress, 
  abi, 
  methodName, 
  args = [], 
  options = {}, 
  provider,
  signer 
}) {
  try {
    const contract = new ethers.Contract(contractAddress, abi, signer || provider);
    
    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`);
    }
    
    const txOptions = {
      ...options,
      value: options.value ? ethers.parseEther(options.value.toString()) : undefined
    };
    
    // Estimate gas
    const estimatedGas = await contract[methodName].estimateGas(...args, txOptions);
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    
    // Calculate costs
    const gasLimit = estimatedGas * 120n / 100n; // 20% buffer
    const maxCost = gasLimit * (feeData.maxFeePerGas || feeData.gasPrice);
    const likelyCost = gasLimit * feeData.gasPrice;
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei',
      maxFeePerGas: feeData.maxFeePerGas ? 
        ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' gwei' : null,
      maxCostETH: ethers.formatEther(maxCost),
      likelyCostETH: ethers.formatEther(likelyCost),
      value: options.value ? options.value.toString() + ' ETH' : '0 ETH'
    };
  } catch (error) {
    console.error('Error estimating transaction:', error);
    throw {
      error: parseRevertReason(error) || error.message,
      details: error
    };
  }
}

/**
 * Parse events from transaction receipt
 * @param {Object} receipt - Transaction receipt
 * @param {Object} contract - Contract instance
 * @returns {Array} Parsed events
 */
function parseEvents(receipt, contract) {
  const events = [];
  
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog({
        topics: log.topics,
        data: log.data
      });
      
      if (parsedLog) {
        events.push({
          name: parsedLog.name,
          args: Object.fromEntries(
            parsedLog.args.map((arg, i) => [
              parsedLog.fragment.inputs[i]?.name || i,
              typeof arg === 'bigint' ? arg.toString() : arg
            ])
          ),
          signature: parsedLog.signature,
          address: log.address
        });
      }
    } catch (e) {
      // Log might be from a different contract
      continue;
    }
  }
  
  return events;
}

/**
 * Parse revert reason from error
 * @param {Error} error - The error object
 * @returns {string|null} Parsed revert reason or null
 */
function parseRevertReason(error) {
  // Check for revert reason in different formats
  if (error.reason) return error.reason;
  if (error.data?.message) return error.data.message;
  if (error.error?.data?.message) return error.error.data.message;
  
  // Try to decode custom error
  if (error.data && typeof error.data === 'string' && error.data.startsWith('0x')) {
    // Custom error decoding would go here
    return 'Transaction reverted with custom error';
  }
  
  // Check error message for revert
  if (error.message?.includes('revert')) {
    const match = error.message.match(/revert(?:ed)?\s+(.+)/i);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Wait for a transaction to be confirmed
 * @param {string} txHash - Transaction hash
 * @param {Object} provider - Ethers provider
 * @param {number} confirmations - Number of confirmations to wait for
 * @returns {Promise<Object>} Transaction receipt
 */
export async function waitForTransaction(txHash, provider, confirmations = 1) {
  console.log(`Waiting for ${confirmations} confirmations for tx: ${txHash}`);
  const receipt = await provider.waitForTransaction(txHash, confirmations);
  return receipt;
}