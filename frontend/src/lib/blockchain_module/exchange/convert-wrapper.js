// Wrapper for exchange convert functionality to match the expected interface
import { Transaction } from '@mysten/sui/transactions';

/**
 * Convert SUI to WAL tokens - MOCK IMPLEMENTATION for testnet
 * This is a mock that just transfers SUI back to the sender
 * In production, this would interact with a real exchange contract
 */
export async function convertSuiToWal(client, config, currentAccount, signAndExecute, params) {
  const { amount } = params;
  
  if (!client || !currentAccount) {
    throw new Error('Missing required parameters');
  }
  
  try {
    // Create transaction
    const tx = new Transaction();
    
    // Convert amount to MIST (1 SUI = 10^9 MIST)
    const amountInMist = Math.floor(amount * 1e9);
    
    // Split coins for the exact amount
    const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
    
    // MOCK: Just transfer the coin back to sender
    // In reality, this would interact with an exchange contract
    tx.transferObjects([coin], currentAccount.address);
    
    // Execute transaction
    const result = await signAndExecute({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    if (!result || result.effects?.status?.status !== 'success') {
      throw new Error('Transaction failed');
    }
    
    // Mock: Log that this is a demo transaction
    console.log('DEMO: SUI to WAL conversion (mock transaction completed)');
    console.log(`Would have converted ${amount} SUI to ${amount} WAL at 1:1 rate`);
    
    return result;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
}