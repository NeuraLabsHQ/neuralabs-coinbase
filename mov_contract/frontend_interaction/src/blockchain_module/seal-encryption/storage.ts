// Seal storage integration with blockchain

import { SuiClient } from '@mysten/sui/client';
import { NeuralabsConfig, TransactionResult, EncryptedData } from '../types';
import { createTransaction, signAndExecuteTransaction } from '../transaction-proposer';
import { checkWalletConnection } from '../wallet-connection';

export interface StoreEncryptedDataParams {
  nftId: string;
  blobId: string;
  encryptionType: 'seal';
  metadata?: Record<string, any>;
}

export async function storeEncryptedData(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  params: StoreEncryptedDataParams
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  // Convert metadata to JSON string
  const metadataJson = params.metadata ? JSON.stringify(params.metadata) : '{}';
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::storage::add_encrypted_data`,
    arguments: [
      tx.object(params.nftId),
      tx.pure.string(params.blobId),
      tx.pure.string(params.encryptionType),
      tx.pure.string(metadataJson),
      tx.object(config.ACCESS_REGISTRY_ADDRESS),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export async function getEncryptedDataForNFT(
  client: SuiClient,
  _config: NeuralabsConfig,
  nftId: string
): Promise<EncryptedData[]> {
  try {
    // Query dynamic fields for the NFT's encrypted data
    const dynamicFields = await client.getDynamicFields({
      parentId: nftId,
    });
    
    const encryptedDataList: EncryptedData[] = [];
    
    for (const field of dynamicFields.data) {
      if (field.name && typeof field.name === 'object' && 'type' in field.name) {
        // Check if this is an encrypted data field
        const fieldType = field.name.type;
        if (fieldType && fieldType.includes('storage::EncryptedData')) {
          const fieldObject = await client.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          if (fieldObject.data && 'content' in fieldObject.data && 
              fieldObject.data.content && 'fields' in fieldObject.data.content) {
            const fields = fieldObject.data.content.fields as any;
            
            encryptedDataList.push({
              blob_id: fields.blob_id || '',
              encryption_type: fields.encryption_type || 'seal',
              metadata: fields.metadata ? JSON.parse(fields.metadata) : {},
            });
          }
        }
      }
    }
    
    return encryptedDataList;
  } catch (error) {
    console.error('Error fetching encrypted data:', error);
    return [];
  }
}

export async function removeEncryptedData(
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
    target: `${config.PACKAGE_ADDRESS}::storage::remove_encrypted_data`,
    arguments: [
      tx.object(nftId),
      tx.pure.string(blobId),
      tx.object(config.ACCESS_REGISTRY_ADDRESS),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}