// Walrus storage integration with blockchain

import { SuiClient } from '@mysten/sui/client';
import { NeuralabsConfig, TransactionResult } from '../types';
import { createTransaction, signAndExecuteTransaction } from '../transaction-proposer';
import { checkWalletConnection } from '../wallet-connection';
import { checkUserAccess } from '../access-management/check';
import { ACCESS_LEVELS, STORAGE_CONSTANTS } from '../utils/constants';

export interface UploadEncryptedDataParams {
  nftId: string;
  blobId: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  metadata?: Record<string, any>;
}

export async function uploadEncryptedDataReference(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  params: UploadEncryptedDataParams
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  // Prepare metadata
  const fullMetadata = {
    fileName: params.fileName,
    fileSize: params.fileSize,
    mimeType: params.mimeType || 'application/octet-stream',
    uploadedAt: Date.now(),
    ...params.metadata,
  };
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::storage::upload_encrypted_data`,
    arguments: [
      tx.object(params.nftId),
      tx.pure.string(params.blobId),
      tx.pure.string(JSON.stringify(fullMetadata)),
      tx.object(config.ACCESS_REGISTRY_ADDRESS),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export interface StoredDataInfo {
  blobId: string;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: number;
    [key: string]: any;
  };
}

export async function getStoredDataForNFT(
  client: SuiClient,
  nftId: string
): Promise<StoredDataInfo[]> {
  try {
    // Query dynamic fields for stored data
    const dynamicFields = await client.getDynamicFields({
      parentId: nftId,
    });
    
    const storedData: StoredDataInfo[] = [];
    
    for (const field of dynamicFields.data) {
      if (field.name && typeof field.name === 'object' && 'value' in field.name) {
        // Check if this is a blob_id field
        const nameValue = field.name.value;
        if (typeof nameValue === 'string' && nameValue.startsWith('blob_')) {
          const fieldObject = await client.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          if (fieldObject.data && 'content' in fieldObject.data && 
              fieldObject.data.content && 'fields' in fieldObject.data.content) {
            const fields = fieldObject.data.content.fields as any;
            
            storedData.push({
              blobId: nameValue.replace('blob_', ''),
              metadata: fields.metadata ? JSON.parse(fields.metadata) : {},
            });
          }
        }
      }
    }
    
    return storedData;
  } catch (error) {
    console.error('Error fetching stored data:', error);
    return [];
  }
}

export async function checkStorageAccess(
  client: SuiClient,
  config: NeuralabsConfig,
  nftId: string,
  userAddress: string
): Promise<boolean> {
  const access = await checkUserAccess(client, config, nftId, userAddress);
  
  // User needs at least contributor access to upload
  return access.level >= ACCESS_LEVELS.CONTRIBUTOR;
}

export function validateFileSize(fileSize: number): void {
  if (fileSize > STORAGE_CONSTANTS.MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${STORAGE_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
}

export async function removeStoredData(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  nftId: string,
  blobId: string
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::storage::remove_stored_data`,
    arguments: [
      tx.object(nftId),
      tx.pure.string(blobId),
      tx.object(config.ACCESS_REGISTRY_ADDRESS),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}