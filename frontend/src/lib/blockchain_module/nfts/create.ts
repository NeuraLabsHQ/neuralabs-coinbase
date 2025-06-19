// NFT creation functionality

// import { SuiClient } from '@mysten/sui/client';
// import { Transaction } from '@mysten/sui/transactions';
import { NeuralabsConfig, TransactionResult } from '../types';
import { SUI_CONSTANTS } from '../utils/constants';
import { checkWalletConnection } from '../wallet-connection';

export interface MintNFTParams {
  name: string;
  description: string;
  url: string;
}

function parseError(error: any): string {
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

export async function mintNFT(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  params: MintNFTParams
): Promise<TransactionResult> {
  try {
    checkWalletConnection(currentAccount);
    
    console.log('=== NFT MINT BLOCKCHAIN MODULE ===');
    console.log('Target function:', `${config.PACKAGE_ID}::nft::mint_to_sender`);
    console.log('Parameters:', params);
    console.log('Package ID:', config.PACKAGE_ID);
    console.log('Clock Object ID:', SUI_CONSTANTS.CLOCK_OBJECT_ID);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${config.PACKAGE_ID}::nft::mint_to_sender`,
      arguments: [
        tx.pure.string(params.name),
        tx.pure.string(params.description),
        tx.object(SUI_CONSTANTS.CLOCK_OBJECT_ID),
      ]
    });
    
    console.log('Transaction built, executing...');
    
    const result = await signAndExecute({
      transaction: tx,
    });
    
    console.log('Transaction executed, result:', result);
    
    if (!result || !result.digest) {
      throw new Error('Transaction failed: No digest returned');
    }
    
    return {
      digest: result.digest,
      effects: result.effects,
      events: result.events || [],
      objectChanges: result.objectChanges || [],
    };
  } catch (error) {
    console.error('NFT minting error in blockchain module:', error);
    
    // Extract more error details if available
    const errorDetails = {
      message: error.message,
      code: error.code,
      details: error.details,
      transaction: error.transaction,
      effects: error.effects
    };
    
    console.error('Detailed error info:', errorDetails);
    
    throw new Error(`Transaction failed: ${parseError(error)}`);
  }
}

export async function batchMintNFTs(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  nfts: MintNFTParams[]
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  for (const nft of nfts) {
    tx.moveCall({
      target: `${config.PACKAGE_ID}::nft::mint_to_sender`,
      arguments: [
        tx.pure.string(nft.name),
        tx.pure.string(nft.description),
        tx.object(SUI_CONSTANTS.CLOCK_OBJECT_ID),
      ],
    });
  }
  
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