// Helper functions to refresh object references and handle version conflicts

export const refreshObjectReference = async (client, objectId) => {
  try {
    // Fetch the latest state of the object
    const object = await client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showOwner: true,
        showType: true,
      }
    });
    
    if (!object || object.error) {
      throw new Error(`Failed to fetch object ${objectId}: ${object?.error || 'Unknown error'}`);
    }
    
    return {
      objectId: object.data.objectId,
      version: object.data.version,
      digest: object.data.digest,
      owner: object.data.owner,
      type: object.data.type,
      content: object.data.content
    };
  } catch (error) {
    console.error(`Error refreshing object ${objectId}:`, error);
    throw error;
  }
};

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a version conflict error
      if (error.message && error.message.includes('is not available for consumption')) {
        console.log(`Version conflict detected, attempt ${i + 1}/${maxRetries}`);
        
        // Wait before retrying with exponential backoff
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        continue;
      }
      
      // If it's not a version conflict, throw immediately
      throw error;
    }
  }
  
  throw lastError;
};

// Wrapper for transactions that might face version conflicts
export const executeTransactionWithRetry = async (transactionFn, maxRetries = 3) => {
  return retryWithBackoff(transactionFn, maxRetries);
};