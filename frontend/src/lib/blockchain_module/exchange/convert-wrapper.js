// Wrapper for exchange convert functionality to match the expected interface
import { Transaction } from '@mysten/sui/transactions';

/**
 * Convert SUI to WAL tokens using the exchange contract
 * This wrapper adapts the interface to match what the frontend expects
 */
export async function convertSuiToWal(client, config, currentAccount, signAndExecute, params) {
  const { amount, exchangeConfig } = params;
  
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
    
    // Call the exchange function
    tx.moveCall({
      target: `${exchangeConfig.PACKAGE_ID}::exchange::convert_sui_to_wal`,
      arguments: [
        coin,
        tx.object(exchangeConfig.SHARED_OBJECT_ID)
      ],
    });
    
    // Set sender
    tx.setSender(currentAccount.address);
    
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
    
    return result;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
}