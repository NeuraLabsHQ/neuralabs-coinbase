// Seal encryption and decryption functionality

import { SealClient, SessionKey } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { NeuralabsConfig, TransactionResult } from '../types';
import { createTransaction, signAndExecuteTransaction } from '../transaction-proposer';
import { checkUserAccess } from '../access-management/check';
import { ACCESS_LEVELS } from '../utils/constants';

export interface EncryptParams {
  data: Uint8Array;
  packageId: string;
  policyId: string;
  nonce?: Uint8Array;
  threshold?: number;
}

export interface DecryptParams {
  encryptedData: Uint8Array;
  sessionKey: SessionKey;
  txBytes: Uint8Array;
}

export interface EncryptResult {
  encryptedData: Uint8Array;
  encryptedId: string;
}

// Encrypt data using Seal
export async function encryptData(
  sealClient: SealClient,
  params: EncryptParams
): Promise<EncryptResult> {
  try {
    // Generate nonce if not provided
    const nonce = params.nonce || crypto.getRandomValues(new Uint8Array(5));
    
    // Create the ID for encryption (policy ID + nonce)
    const policyIdBytes = fromHex(params.policyId);
    const idBytes = new Uint8Array([...policyIdBytes, ...nonce]);
    const id = toHex(idBytes);
    
    // Encrypt the data
    const { encryptedObject } = await sealClient.encrypt({
      threshold: params.threshold || 2,
      packageId: params.packageId,
      id,
      data: params.data,
    });
    
    return {
      encryptedData: encryptedObject,
      encryptedId: id,
    };
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data using Seal
export async function decryptData(
  sealClient: SealClient,
  params: DecryptParams
): Promise<Uint8Array> {
  try {
    // The decrypt method returns the decrypted data directly as Uint8Array
    return await sealClient.decrypt({
      data: params.encryptedData,
      sessionKey: params.sessionKey,
      txBytes: params.txBytes,
    });
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Encrypt a file
export async function encryptFile(
  sealClient: SealClient,
  file: File,
  packageId: string,
  policyId: string
): Promise<EncryptResult> {
  const fileBuffer = await file.arrayBuffer();
  const fileData = new Uint8Array(fileBuffer);
  
  return encryptData(sealClient, {
    data: fileData,
    packageId,
    policyId,
  });
}

// Create the Move call constructor for seal_approve
export function createSealApproveCall(
  packageId: string,
  moduleName: string,
  allowlistId: string
): (tx: Transaction, encryptedId: string) => void {
  return (tx: Transaction, encryptedId: string) => {
    tx.moveCall({
      target: `${packageId}::${moduleName}::seal_approve`,
      arguments: [
        tx.pure.vector('u8', fromHex(encryptedId)),
        tx.object(allowlistId),
      ],
    });
  };
}

// Approve Seal usage for an NFT
export async function approveSealUsage(
  signAndExecute: any,
  packageId: string,
  encryptedId: string,
  allowlistId: string
): Promise<TransactionResult> {
  const tx = createTransaction();
  
  // Add the seal_approve call
  const sealApprove = createSealApproveCall(packageId, 'allowlist', allowlistId);
  sealApprove(tx, encryptedId);
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

// Check if user has encryption access
export async function checkEncryptionAccess(
  client: SuiClient,
  config: NeuralabsConfig,
  nftId: string,
  userAddress: string
): Promise<boolean> {
  const access = await checkUserAccess(client, config, nftId, userAddress);
  
  // User needs at least contributor access to encrypt/decrypt
  return access.level >= ACCESS_LEVELS.CONTRIBUTOR;
}