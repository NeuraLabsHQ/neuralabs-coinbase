const { time } = require('@openzeppelin/test-helpers');

// Helper to handle nonce synchronization issues
async function syncNonce(web3, account) {
  try {
    // Get the latest nonce from the blockchain
    const nonce = await web3.eth.getTransactionCount(account, 'latest');
    return nonce;
  } catch (error) {
    console.error('Error syncing nonce:', error);
    throw error;
  }
}

// Helper to add delay between transactions
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to handle transaction with retry on nonce errors
async function sendTransaction(txPromise, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await txPromise();
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if it's a nonce error
      if (error.message && error.message.includes('nonce')) {
        console.log(`Nonce error detected, retrying... (attempt ${i + 1}/${maxRetries})`);
        await delay(100); // Small delay before retry
        continue;
      }
      
      // If not a nonce error, throw immediately
      throw error;
    }
  }
  
  // If all retries failed, throw the last error
  throw lastError;
}

// Helper to advance time and mine a new block
async function advanceTimeAndBlock(seconds) {
  await time.increase(seconds);
  await time.advanceBlock();
}

module.exports = {
  syncNonce,
  delay,
  sendTransaction,
  advanceTimeAndBlock
};