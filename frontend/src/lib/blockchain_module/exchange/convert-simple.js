// Simple conversion wrapper that works with the exchange contract
import { Transaction } from '@mysten/sui/transactions';

export async function convertSuiToWal(client, currentAccount, signAndExecute, params) {
  const { amount, exchangeConfig } = params;
  
  if (!client || !currentAccount || !signAndExecute) {
    throw new Error('Missing required parameters');
  }
  
  try {
    // Create transaction
    const tx = new Transaction();
    
    // Split the amount to convert from gas coins (amount is already in bigint MIST format)
    const [coinToConvert] = tx.splitCoins(tx.gas, [amount]);
    
    // Call the exchange contract to convert SUI to WAL
    const [walCoin] = tx.moveCall({
      target: `${exchangeConfig.PACKAGE_ID}::wal_exchange::exchange_all_for_wal`,
      arguments: [
        tx.sharedObjectRef({
          objectId: exchangeConfig.SHARED_OBJECT_ID,
          initialSharedVersion: exchangeConfig.INITIAL_SHARED_VERSION,
          mutable: true,
        }),
        coinToConvert,
      ],
    });
    
    // Transfer the resulting WAL coin to the user
    tx.transferObjects([walCoin], currentAccount.address);
    
    // Execute transaction directly with the hook
    const result = await signAndExecute({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    return result;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
}