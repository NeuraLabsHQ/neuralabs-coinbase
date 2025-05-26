// NFT creation functionality

import { SuiClient } from '@mysten/sui/client';
import { NeuralabsConfig, TransactionResult } from '../types';
import { SUI_CONSTANTS } from '../utils/constants';
import { createTransaction, signAndExecuteTransaction } from '../transaction-proposer';
import { checkWalletConnection } from '../wallet-connection';

export interface MintNFTParams {
  name: string;
  description: string;
  url: string;
}

export async function mintNFT(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  params: MintNFTParams
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  tx.moveCall({
    target: `${config.PACKAGE_ADDRESS}::nft::mint_to_sender`,
    arguments: [
      tx.pure.string(params.name),
      tx.pure.string(params.description),
      tx.pure.string(params.url),
      tx.object(config.REGISTRY_ADDRESS),
      tx.object(SUI_CONSTANTS.CLOCK_OBJECT_ID),
    ]
  });
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}

export async function batchMintNFTs(
  _client: SuiClient,
  config: NeuralabsConfig,
  currentWallet: any,
  signAndExecute: any,
  nfts: MintNFTParams[]
): Promise<TransactionResult> {
  checkWalletConnection(currentWallet);
  
  const tx = createTransaction();
  
  // Add multiple mint calls in a single transaction
  for (const nft of nfts) {
    tx.moveCall({
      target: `${config.PACKAGE_ADDRESS}::nft::mint_to_sender`,
      arguments: [
        tx.pure.string(nft.name),
        tx.pure.string(nft.description),
        tx.pure.string(nft.url),
        tx.object(config.REGISTRY_ADDRESS),
        tx.object(SUI_CONSTANTS.CLOCK_OBJECT_ID),
      ],
    });
  }
  
  return await signAndExecuteTransaction(signAndExecute, tx);
}