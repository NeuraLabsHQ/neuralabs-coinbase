// NFT creation functionality

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NeuralabsConfig, TransactionResult } from '../types';
import { SUI_CONSTANTS } from '../utils/constants';
import { checkWalletConnection } from '../wallet-connection';

export interface MintNFTParams {
  name: string;
  description: string;
  url: string;
}

export async function mintNFT(
  client: SuiClient,
  config: NeuralabsConfig,
  currentAccount: any,
  signAndExecute: any,
  params: MintNFTParams
): Promise<TransactionResult> {
  checkWalletConnection(currentAccount);
  
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ID}::nft::mint_to_sender`,
    arguments: [
      tx.pure.string(params.name),
      tx.pure.string(params.description),
      tx.object(SUI_CONSTANTS.CLOCK_OBJECT_ID),
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