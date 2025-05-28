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
    // First, check if user owns the NFT
    const nftObject = await client.getObject({
      id: nftId,
      options: { showOwner: true, showContent: true },
    });
    
    if (!nftObject.data) {
      console.log('NFT not found:', nftId);
      return { level: 0, permissions: [] };
    }
    
    // Check if user is owner
    const owner = nftObject.data.owner;
    if (owner && typeof owner === 'object' && 'AddressOwner' in owner && owner.AddressOwner === userAddress) {
      return { level: 6, permissions: ['all'] }; // Owner has full access
    }
    
    // Get the AccessRegistry object
    const registryObject = await client.getObject({
      id: config.ACCESS_REGISTRY_ID,
      options: { showContent: true },
    });
    
    if (!registryObject.data?.content || registryObject.data.content.dataType !== 'moveObject') {
      console.error('AccessRegistry not found or not a move object');
      return { level: 0, permissions: [] };
    }
    
    // Cast fields to any to handle dynamic structure
    const registryFields = registryObject.data.content.fields as any;
    
    // Get the permissions table ID from registry
    const permissionsTableId = registryFields?.permissions?.fields?.id?.id;
    if (!permissionsTableId) {
      console.error('Permissions table ID not found in registry');
      return { level: 0, permissions: [] };
    }
    
    // Query for NFT-specific permissions table
    try {
      const nftPermissionsResult = await client.getDynamicFieldObject({
        parentId: permissionsTableId,
        name: {
          type: '0x2::object::ID',
          value: nftId,
        },
      });
      
      if (!nftPermissionsResult.data?.content || nftPermissionsResult.data.content.dataType !== 'moveObject') {
        console.log('No permissions found for NFT:', nftId);
        return { level: 0, permissions: [] };
      }
      
      // Cast to any to handle dynamic structure
      const nftPermFields = nftPermissionsResult.data.content.fields as any;
      
      // Get the user permissions table ID
      const userPermissionsTableId = nftPermFields?.value?.fields?.id?.id;
      if (!userPermissionsTableId) {
        console.log('Invalid NFT permissions structure');
        return { level: 0, permissions: [] };
      }
      
      // Query for user's access level
      const userAccessResult = await client.getDynamicFieldObject({
        parentId: userPermissionsTableId,
        name: {
          type: 'address',
          value: userAddress,
        },
      });
      
      if (!userAccessResult.data?.content || userAccessResult.data.content.dataType !== 'moveObject') {
        console.log('No access found for user:', userAddress);
        return { level: 0, permissions: [] };
      }
      
      // Cast to any to handle dynamic structure
      const userAccessFields = userAccessResult.data.content.fields as any;
      
      // Extract the access level - it should be directly in the value field
      const level = parseInt(userAccessFields?.value) || 0;
      console.log(`User ${userAddress} has level ${level} access to NFT ${nftId}`);
      
      return {
        level,
        permissions: getPermissionsForLevel(level),
      };
      
    } catch (dynamicFieldError) {
      console.log('Error querying dynamic fields:', dynamicFieldError);
      return { level: 0, permissions: [] };
    }
    
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
    
    // Note: To get all users with access, you would need to query blockchain events
    // or maintain this information in the smart contract itself
    // For now, this only returns the owner
    
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