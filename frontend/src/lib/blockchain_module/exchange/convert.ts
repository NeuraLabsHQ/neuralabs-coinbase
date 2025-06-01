// SUI to WAL conversion functionality

import { SuiClient } from '@mysten/sui/client';
import { TransactionResult } from '../types';
import { createTransaction, signAndExecuteTransaction } from '../transaction-proposer';
import { checkWalletConnection, getWalletAddress } from '../wallet-connection';
import { getSuiBalance } from './balance';

export interface ConversionParams {
  amount: bigint;
  slippageTolerance?: number; // Percentage (e.g., 0.5 for 0.5%)
}

// Mock exchange rate for demonstration
// In production, this would come from an AMM or oracle
const MOCK_EXCHANGE_RATE = {
  suiToWal: 10n, // 1 SUI = 10 WAL
  walToSui: 1n / 10n, // 1 WAL = 0.1 SUI
};

export async function convertSuiToWal(
  client: SuiClient,
  currentWallet: any,
  signAndExecute: any,
  params: ConversionParams
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const address = getWalletAddress(currentWallet);
  
  // Check balance
  const balance = await getSuiBalance(client, address);
  if (balance.totalBalance < params.amount) {
    throw new Error('Insufficient SUI balance for conversion');
  }
  
  const tx = createTransaction();
  
  // In a real implementation, this would interact with a DEX or swap contract
  // For now, we'll create a mock transaction
  
  // Split the amount to convert
  const [coinToConvert] = tx.splitCoins(tx.gas, [params.amount]);
  
  // Mock: Transfer to a swap pool (in reality, this would be a swap call)
  // tx.moveCall({
  //   target: `${SWAP_PACKAGE}::swap::swap_sui_to_wal`,
  //   arguments: [coinToConvert, tx.object(SWAP_POOL)],
  // });
  
  // For demonstration, we'll just transfer back to sender
  tx.transferObjects([coinToConvert], address);
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export async function convertWalToSui(
  client: SuiClient,
  currentWallet: any,
  signAndExecute: any,
  params: ConversionParams,
  walCoinType: string
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const address = getWalletAddress(currentWallet);
  
  const tx = createTransaction();
  
  // Get WAL coins
  const walCoins = await client.getCoins({
    owner: address,
    coinType: walCoinType,
  });
  
  if (walCoins.data.length === 0) {
    throw new Error('No WAL coins found');
  }
  
  // Merge coins if needed
  if (walCoins.data.length > 1) {
    const coinRefs = walCoins.data.slice(1).map(coin => tx.object(coin.coinObjectId));
    tx.mergeCoins(tx.object(walCoins.data[0].coinObjectId), coinRefs);
  }
  
  // Split the amount to convert
  const [coinToConvert] = tx.splitCoins(
    tx.object(walCoins.data[0].coinObjectId),
    [params.amount]
  );
  
  // Mock: Convert WAL to SUI
  // In reality, this would interact with a swap contract
  
  // For demonstration, transfer back
  tx.transferObjects([coinToConvert], address);
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export function calculateExpectedOutput(
  inputAmount: bigint,
  direction: 'suiToWal' | 'walToSui',
  slippageTolerance: number = 0.5
): {
  expectedOutput: bigint;
  minimumOutput: bigint;
  exchangeRate: bigint;
} {
  const rate = direction === 'suiToWal' ? MOCK_EXCHANGE_RATE.suiToWal : 1n;
  const expectedOutput = inputAmount * rate;
  
  // Calculate minimum output with slippage
  const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
  const minimumOutput = (expectedOutput * slippageMultiplier) / 10000n;
  
  return {
    expectedOutput,
    minimumOutput,
    exchangeRate: rate,
  };
}

export async function getExchangeRate(
  _client: SuiClient,
  direction: 'suiToWal' | 'walToSui'
): Promise<number> {
  // In production, this would query an AMM or oracle
  // For now, return mock rate
  return direction === 'suiToWal' ? 10 : 0.1;
}