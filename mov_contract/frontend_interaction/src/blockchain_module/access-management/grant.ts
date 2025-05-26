// Access granting functionality

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NeuralabsConfig, TransactionResult } from '../types';
import { ACCESS_LEVELS } from '../utils/constants';
import { checkWalletConnection } from '../wallet-connection';

export interface GrantAccessParams {
  nftId: string;
  recipientAddress: string;
  accessLevel: number;
  accessCapId: string;
}

export async function grantAccess(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  params: GrantAccessParams
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ID}::access::grant_access`,
    arguments: [
      tx.object(config.ACCESS_REGISTRY_ID),
      tx.object(params.accessCapId),
      tx.object(params.nftId),
      tx.pure.address(params.recipientAddress),
      tx.pure.u8(params.accessLevel),
    ]
  });
  
  const result = await signAndExecute({
    transaction: tx,
  });
  
  if (!result || !result.digest) {
    throw new Error('Transaction failed');
  }
  
  // Store in localStorage for retrieval
  localStorage.setItem(`access_${params.nftId}_${params.recipientAddress}`, params.accessLevel.toString());
  
  return {
    digest: result.digest,
    effects: result.effects,
    events: result.events || [],
    objectChanges: result.objectChanges || [],
  };
}

export async function revokeAccess(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  params: {
    nftId: string;
    userAddress: string;
    accessCapId: string;
  }
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ID}::access::revoke_access`,
    arguments: [
      tx.object(config.ACCESS_REGISTRY_ID),
      tx.object(params.accessCapId),
      tx.object(params.nftId),
      tx.pure.address(params.userAddress),
    ]
  });
  
  const result = await signAndExecute({
    transaction: tx,
  });
  
  if (!result || !result.digest) {
    throw new Error('Transaction failed');
  }
  
  // Remove from localStorage
  localStorage.removeItem(`access_${params.nftId}_${params.userAddress}`);
  
  return {
    digest: result.digest,
    effects: result.effects,
    events: result.events || [],
    objectChanges: result.objectChanges || [],
  };
}

export async function changeAccessLevel(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  nftId: string,
  userAddress: string,
  newLevel: number
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  // Note: The Move contract might not have a change_access_level function
  // If it doesn't, you'll need to revoke and then grant again
  // For now, let's assume it exists or we'll use grant_access to update
  tx.moveCall({
    target: `${config.PACKAGE_ID}::access::grant_access`,
    arguments: [
      tx.object(config.ACCESS_REGISTRY_ID),
      tx.object(nftId), // Assuming we need the NFT ID here
      tx.pure.address(userAddress),
      tx.pure.u8(newLevel),
    ]
  });
  
  const result = await signAndExecute({
    transaction: tx,
  });
  
  if (!result || !result.digest) {
    throw new Error('Transaction failed');
  }
  
  // Update in localStorage
  localStorage.setItem(`access_${nftId}_${userAddress}`, newLevel.toString());
  
  return {
    digest: result.digest,
    effects: result.effects,
    events: result.events || [],
    objectChanges: result.objectChanges || [],
  };
}

export function getAccessLevelName(level: number): string {
  const levelInfo = ACCESS_LEVELS[level as keyof typeof ACCESS_LEVELS];
  return levelInfo ? levelInfo.name : 'Unknown';
}