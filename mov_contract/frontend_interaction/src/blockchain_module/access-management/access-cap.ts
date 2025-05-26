// AccessCap creation functionality

import { SuiClient } from '@mysten/sui/client';
import { NeuralabsConfig, TransactionResult } from '../types';
import { createTransaction, signAndExecuteTransaction } from '../transaction-proposer';
import { checkWalletConnection } from '../wallet-connection';

export interface CreateAccessCapParams {
  nftId: string;
  level: number;
  expiresAt?: number; // Optional expiration timestamp
}

export async function createAccessCap(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  params: CreateAccessCapParams
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  if (params.expiresAt) {
    // Create with expiration
    tx.moveCall({
      target: `${config.PACKAGE_ADDRESS}::access::create_access_cap_with_expiry`,
      arguments: [
        tx.object(params.nftId),
        tx.pure.u8(params.level),
        tx.pure.u64(params.expiresAt),
        tx.object(config.ACCESS_REGISTRY_ADDRESS),
      ]
    });
  } else {
    // Create without expiration
    tx.moveCall({
      target: `${config.PACKAGE_ADDRESS}::access::create_access_cap_entry`,
      arguments: [
        tx.object(params.nftId),
        tx.pure.u8(params.level),
        tx.object(config.ACCESS_REGISTRY_ADDRESS),
      ]
    });
  }
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export async function transferAccessCap(
  _client: SuiClient,
  _config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  accessCapId: string,
  recipientAddress: string
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  tx.transferObjects([tx.object(accessCapId)], recipientAddress);
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export async function burnAccessCap(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  accessCapId: string
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::access::burn_access_cap`,
    arguments: [tx.object(accessCapId)]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}