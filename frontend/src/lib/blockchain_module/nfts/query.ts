// NFT query functionality

import { SuiClient } from '@mysten/sui/client';
import { NeuralabsConfig, NFTData } from '../types';
import { getObjectFields } from '../utils/helpers';

export async function getUserNFTs(
  client: SuiClient,
  config: NeuralabsConfig,
  userAddress: string
): Promise<NFTData[]> {
  try {
    const objects = await client.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${config.PACKAGE_ID}::nft::NeuraLabsNFT`,
      },
      options: {
        showContent: true,
        showDisplay: true,
      },
    });
    
    const nfts: NFTData[] = [];
    
    for (const obj of objects.data) {
      const fields = getObjectFields(obj);
      if (fields && obj.data?.objectId) {
        nfts.push({
          id: obj.data.objectId,
          name: fields.name || '',
          description: fields.description || '',
          url: fields.url || '',
          creation_date: Number(fields.creation_date || 0),
          metadata: fields.metadata || {},
        });
      }
    }
    
    // Sort by creation date (newest first)
    return nfts.sort((a, b) => b.creation_date - a.creation_date);
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    throw new Error('Failed to fetch NFTs');
  }
}

export async function getNFTById(
  client: SuiClient,
  nftId: string
): Promise<NFTData | null> {
  try {
    const object = await client.getObject({
      id: nftId,
      options: { showContent: true },
    });
    
    const fields = getObjectFields(object);
    
    if (!fields) {
      return null;
    }
    
    return {
      id: nftId,
      name: fields.name || '',
      description: fields.description || '',
      url: fields.url || '',
      creation_date: Number(fields.creation_date || 0),
      metadata: fields.metadata || {},
    };
  } catch (error) {
    console.error('Error fetching NFT:', error);
    return null;
  }
}

export async function getTotalNFTCount(
  client: SuiClient,
  config: NeuralabsConfig
): Promise<number> {
  try {
    const registryObject = await client.getObject({
      id: config.REGISTRY_ID,
      options: { showContent: true },
    });
    
    const fields = getObjectFields(registryObject);
    return Number(fields?.nft_count || 0);
  } catch (error) {
    console.error('Error fetching NFT count:', error);
    return 0;
  }
}