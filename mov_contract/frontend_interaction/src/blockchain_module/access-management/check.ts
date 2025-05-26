// Access checking functionality

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { AccessCapData, AccessLevel, NeuralabsConfig } from '../types';
import { getObjectFields } from '../utils/helpers';

export async function checkUserAccess(
  client: SuiClient,
  config: NeuralabsConfig,
  nftId: string,
  userAddress: string
): Promise<AccessLevel> {
  try {
    const tx = new Transaction();
    
    // Use the NFT object directly, not through registry
    const result = await client.devInspectTransactionBlock({
      transactionBlock: await tx.build({ client }),
      sender: userAddress,
    });
    
    // For now, check if user owns the NFT or has been granted access
    const nftObject = await client.getObject({
      id: nftId,
      options: { showOwner: true, showContent: true },
    });
    
    if (!nftObject.data) {
      return { level: 0, permissions: [] };
    }
    
    // Check if user is owner
    const owner = nftObject.data.owner;
    if (owner && typeof owner === 'object' && 'AddressOwner' in owner && owner.AddressOwner === userAddress) {
      return { level: 6, permissions: ['all'] }; // Owner has full access
    }
    
    // Check stored access (from localStorage for now)
    const storedAccess = localStorage.getItem(`access_${nftId}_${userAddress}`);
    if (storedAccess) {
      const level = parseInt(storedAccess);
      return {
        level,
        permissions: getPermissionsForLevel(level),
      };
    }
    
    return { level: 0, permissions: [] };
  } catch (error) {
    console.error('Error checking access:', error);
    return { level: 0, permissions: [] };
  }
}

export async function getUserAccessCaps(
  client: SuiClient,
  config: NeuralabsConfig,
  userAddress: string
): Promise<AccessCapData[]> {
  try {
    const objects = await client.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${config.PACKAGE_ID}::access::AccessCap`,
      },
      options: {
        showContent: true,
      },
    });
    
    const accessCaps: AccessCapData[] = [];
    
    for (const obj of objects.data) {
      const fields = getObjectFields(obj);
      if (fields && obj.data?.objectId) {
        accessCaps.push({
          id: obj.data.objectId,
          owner: userAddress,
          level: Number(fields.level || 0),
          expires_at: fields.expires_at ? Number(fields.expires_at) : undefined,
          nft_id: fields.nft_id,
        });
      }
    }
    
    return accessCaps;
  } catch (error) {
    console.error('Error fetching access caps:', error);
    return [];
  }
}

export async function checkAccessForNFT(
  client: SuiClient,
  config: NeuralabsConfig,
  nftId: string
): Promise<Map<string, number>> {
  try {
    const accessMap = new Map<string, number>();
    
    // Get NFT owner
    const nftObject = await client.getObject({
      id: nftId,
      options: { showOwner: true },
    });
    
    if (nftObject.data?.owner && typeof nftObject.data.owner === 'object' && 'AddressOwner' in nftObject.data.owner) {
      accessMap.set(nftObject.data.owner.AddressOwner, 6); // Owner has level 6
    }
    
    // Check localStorage for additional access grants
    // This is a workaround since we can't easily query the access registry
    const keys = Object.keys(localStorage);
    const prefix = `access_${nftId}_`;
    
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        const userAddress = key.substring(prefix.length);
        const level = parseInt(localStorage.getItem(key) || '0');
        if (level > 0) {
          accessMap.set(userAddress, level);
        }
      }
    }
    
    return accessMap;
  } catch (error) {
    console.error('Error checking NFT access:', error);
    return new Map();
  }
}

function getPermissionsForLevel(level: number): string[] {
  if (level >= 6) return ['all'];
  if (level >= 5) return ['view', 'edit', 'upload', 'decrypt'];
  if (level >= 4) return ['view', 'decrypt'];
  if (level >= 3) return ['view', 'replicate'];
  if (level >= 2) return ['view', 'resell'];
  if (level >= 1) return ['view', 'use'];
  return [];
}