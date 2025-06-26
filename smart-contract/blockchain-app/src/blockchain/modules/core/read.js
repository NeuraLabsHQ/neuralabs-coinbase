import { ethers } from 'ethers';

/**
 * Generic read function for blockchain contract calls
 * @param {Object} params - Parameters for the read operation
 * @param {string} params.contractAddress - The contract address
 * @param {Array} params.abi - The contract ABI
 * @param {string} params.methodName - The method name to call
 * @param {Array} params.args - Arguments for the method
 * @param {Object} params.provider - Ethers provider instance
 * @returns {Promise<any>} The result of the contract call
 */
export async function read({ contractAddress, abi, methodName, args = [], provider }) {
  try {
    if (!contractAddress || !abi || !methodName || !provider) {
      throw new Error(`Missing required parameters for read operation: ${JSON.stringify({
        contractAddress: !!contractAddress,
        abi: !!abi,
        methodName: !!methodName,
        provider: !!provider,
        providerType: provider ? typeof provider : 'null'
      })}`);
    }

    // Ensure provider is an ethers provider instance (v6 check)
    if (!provider.getNetwork) {
      throw new Error('Invalid provider instance - missing getNetwork method');
    }

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Check if method exists
    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`);
    }

    // Call the method
    const result = await contract[methodName](...args);

    // Format the result based on type
    return formatResult(result);
  } catch (error) {
    console.error(`Error reading ${methodName}:`, error);
    throw {
      method: methodName,
      error: error.message || 'Unknown error occurred',
      code: error.code,
      details: error
    };
  }
}

/**
 * Batch read multiple methods from the same contract
 * @param {Object} params - Parameters for batch read
 * @param {string} params.contractAddress - The contract address
 * @param {Array} params.abi - The contract ABI
 * @param {Array} params.calls - Array of { methodName, args } objects
 * @param {Object} params.provider - Ethers provider instance
 * @returns {Promise<Object>} Object with method names as keys and results as values
 */
export async function batchRead({ contractAddress, abi, calls, provider }) {
  try {
    if (!contractAddress || !abi || !calls || !provider) {
      throw new Error('Missing required parameters for batch read operation');
    }

    const contract = new ethers.Contract(contractAddress, abi, provider);
    const results = {};

    // Execute all calls in parallel
    const promises = calls.map(async ({ methodName, args = [] }) => {
      if (!contract[methodName]) {
        throw new Error(`Method ${methodName} not found in contract`);
      }
      const result = await contract[methodName](...args);
      return { methodName, result: formatResult(result) };
    });

    const resolvedResults = await Promise.all(promises);
    
    // Convert array to object
    resolvedResults.forEach(({ methodName, result }) => {
      results[methodName] = result;
    });

    return results;
  } catch (error) {
    console.error('Error in batch read:', error);
    throw {
      error: error.message || 'Batch read failed',
      details: error
    };
  }
}

/**
 * Read with automatic retry on failure
 * @param {Object} params - Same as read function
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<any>} The result of the contract call
 */
export async function readWithRetry(params, maxRetries = 3, retryDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await read(params);
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Format contract call results to handle BigInt and other special types
 * @param {any} result - The raw result from contract call
 * @returns {any} Formatted result
 */
function formatResult(result) {
  // Handle BigInt
  if (typeof result === 'bigint') {
    return result.toString();
  }
  
  // Handle arrays
  if (Array.isArray(result)) {
    return result.map(item => formatResult(item));
  }
  
  // Handle objects (structs)
  if (result && typeof result === 'object' && result.constructor === Object) {
    const formatted = {};
    for (const key in result) {
      // Skip numeric keys (already in array format)
      if (!isNaN(key)) continue;
      formatted[key] = formatResult(result[key]);
    }
    return formatted;
  }
  
  // Handle Result objects from ethers
  if (result && result._isResult) {
    const formatted = {};
    result.forEach((value, index) => {
      const key = result._names[index];
      if (key) {
        formatted[key] = formatResult(value);
      }
    });
    return formatted;
  }
  
  return result;
}

/**
 * Estimate gas for a read operation (useful for view functions that might consume significant gas)
 * @param {Object} params - Same as read function
 * @returns {Promise<string>} Estimated gas as string
 */
export async function estimateReadGas(params) {
  const { contractAddress, abi, methodName, args = [], provider } = params;
  
  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} not found in contract`);
    }
    
    // For view functions, we can't estimate gas directly
    // Return a default value
    return '0';
  } catch (error) {
    console.error(`Error estimating gas for ${methodName}:`, error);
    throw error;
  }
}