// Access granting functionality

// import { SuiClient } from '@mysten/sui/client';
// import { Transaction } from '@mysten/sui/transactions';
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
): Promise<TransactionResult> 

{
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  // tx.moveCall({
  //   target: `${config.PACKAGE_ID}::access::grant_access`,
  //   arguments: [
  //     tx.object(config.REGISTRY_ID),
  //     tx.object(params.accessCapId),
  //     tx.object(params.nftId),
  //     tx.pure.address(params.recipientAddress),
  //     tx.pure.u8(params.accessLevel),
  //   ]
  // });
  
  tx.moveCall({
    target: `${config.PACKAGE_ID}::access::grant_access`,
    arguments: [
      tx.object(config.ACCESS_REGISTRY_ID),
      tx.object(params.accessCapId),
      tx.pure.id(params.nftId),
      tx.pure.address(params.recipientAddress),
      tx.pure.u8(params.accessLevel),
    ]
  });


  // Wrap the mutation in a promise since signAndExecute is a mutation function
  const result = await new Promise((resolve, reject) => {
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Grant access transaction result:', result);
          resolve(result);
        },
        onError: (error) => {
          console.error('Transaction error:', error);
          reject(error);
        },
      }
    );
  });
  
  if (!result || !result.digest) {
    console.error('Transaction result missing digest:', result);
    throw new Error('Transaction failed');
  }
  
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
  
  // Wrap the mutation in a promise since signAndExecute is a mutation function
  const result = await new Promise((resolve, reject) => {
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Revoke access transaction result:', result);
          resolve(result);
        },
        onError: (error) => {
          console.error('Revoke transaction error:', error);
          reject(error);
        },
      }
    );
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
  
  // Wrap the mutation in a promise since signAndExecute is a mutation function
  const result = await new Promise((resolve, reject) => {
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Change access level transaction result:', result);
          resolve(result);
        },
        onError: (error) => {
          console.error('Change access level transaction error:', error);
          reject(error);
        },
      }
    );
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

export function getAccessLevelName(level: number): string {
  const levelInfo = ACCESS_LEVELS[level as keyof typeof ACCESS_LEVELS];
  return levelInfo ? levelInfo.name : 'Unknown';
}