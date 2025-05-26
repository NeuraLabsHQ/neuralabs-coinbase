// Access granting functionality

import { SuiClient } from '@mysten/sui/client';
import { NeuralabsConfig, TransactionResult } from '../types';
import { ACCESS_LEVELS } from '../utils/constants';
import { createTransaction, signAndExecuteTransaction } from '../transaction-proposer';
import { checkWalletConnection } from '../wallet-connection';

export interface GrantAccessParams {
  nftId: string;
  recipientAddress: string;
  accessLevel: number;
}

export async function grantAccess(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  params: GrantAccessParams
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::access::grant_access`,
    arguments: [
      tx.object(params.nftId),
      tx.pure.address(params.recipientAddress),
      tx.pure.u8(params.accessLevel),
      tx.object(config.ACCESS_REGISTRY_ADDRESS),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export async function revokeAccess(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  nftId: string,
  userAddress: string
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::access::revoke_access`,
    arguments: [
      tx.object(nftId),
      tx.pure.address(userAddress),
      tx.object(config.ACCESS_REGISTRY_ADDRESS),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export async function changeAccessLevel(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  nftId: string,
  userAddress: string,
  newLevel: number
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::access::change_access_level`,
    arguments: [
      tx.object(nftId),
      tx.pure.address(userAddress),
      tx.pure.u8(newLevel),
      tx.object(config.ACCESS_REGISTRY_ADDRESS),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export function getAccessLevelName(level: number): string {
  switch (level) {
    case ACCESS_LEVELS.NONE:
      return 'None';
    case ACCESS_LEVELS.VIEWER:
      return 'Viewer';
    case ACCESS_LEVELS.CONTRIBUTOR:
      return 'Contributor';
    case ACCESS_LEVELS.ADMIN:
      return 'Admin';
    default:
      return 'Unknown';
  }
}