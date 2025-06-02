// AccessCap creation functionality

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NeuralabsConfig, TransactionResult } from '../types';
import { checkWalletConnection } from '../wallet-connection';

export interface CreateAccessCapParams {
  nftId: string;
  level?: number;
  expiresAt?: number;
}

export async function createAccessCap(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  params: CreateAccessCapParams
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  // The NFT needs to be passed as a reference, and we should set the transaction to run at latest version
  tx.setGasBudget(10000000); // 0.01 SUI
  
  tx.moveCall({
    target: `${config.PACKAGE_ID}::access::create_access_cap_entry`,
    arguments: [
      tx.object(params.nftId),
    ]
  });
  
  const result = await signAndExecute({
    transaction: tx,
  });
  
  if (!result || !result.digest) {
    throw new Error('Transaction failed');
  }
  
  return {
    digest: result.digest,
    effects: result.effects,
    events: result.events || [],
    objectChanges: result.objectChanges || [],
  };
}

export async function transferAccessCap(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  accessCapId: string,
  recipientAddress: string
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  tx.transferObjects([tx.object(accessCapId)], recipientAddress);
  
  const result = await signAndExecute({
    transaction: tx,
  });
  
  if (!result || !result.digest) {
    throw new Error('Transaction failed');
  }
  
  return {
    digest: result.digest,
    effects: result.effects,
    events: result.events || [],
    objectChanges: result.objectChanges || [],
  };
}

export async function burnAccessCap(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  accessCapId: string
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  // Note: The Move contract might not have a burn_access_cap function
  // If it doesn't, we can transfer to 0x0 address or use a delete function
  // For now, let's assume there's a destroy function or we transfer to burn address
  
  // Option 1: If there's a destroy function in the contract
  /*
  tx.moveCall({
    target: `${config.PACKAGE_ID}::access::destroy_access_cap`,
    arguments: [tx.object(accessCapId)]
  });
  */
  
  // Option 2: Transfer to burn address (0x0)
  // This effectively removes it from circulation
  const BURN_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000';
  tx.transferObjects([tx.object(accessCapId)], BURN_ADDRESS);
  
  const result = await signAndExecute({
    transaction: tx,
  });
  
  if (!result || !result.digest) {
    throw new Error('Transaction failed');
  }
  
  return {
    digest: result.digest,
    effects: result.effects,
    events: result.events || [],
    objectChanges: result.objectChanges || [],
  };
}