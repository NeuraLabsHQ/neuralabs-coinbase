// Access checking functionality

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NeuralabsConfig, AccessLevel, AccessCapData } from '../types';
import { getObjectFields } from '../utils/helpers';
import { devInspectTransaction } from '../transaction-proposer';
import { ACCESS_LEVELS } from '../utils/constants';

export async function checkUserAccess(
  client: SuiClient,
  config: NeuralabsConfig,
  nftId: string,
  userAddress: string
): Promise<AccessLevel> {
  try {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${config.PACKAGE_ADDRESS}::access::get_access_level`,
      arguments: [
        tx.object(nftId),
        tx.pure.address(userAddress),
        tx.object(config.ACCESS_REGISTRY_ADDRESS),
      ],
    });
    
    const result = await devInspectTransaction(client, userAddress, tx);
    
    if (result.results?.[0]?.returnValues?.[0]) {
      const [level] = result.results[0].returnValues[0];
      const accessLevel = Number(level);
      
      return {
        level: accessLevel,
        permissions: getPermissionsForLevel(accessLevel),
      };
    }
    
    return {
      level: ACCESS_LEVELS.NONE,
      permissions: [],
    };
  } catch (error) {
    console.error('Error checking access:', error);
    return {
      level: ACCESS_LEVELS.NONE,
      permissions: [],
    };
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
        StructType: `${config.PACKAGE_ADDRESS}::access::AccessCap`,
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
    // Query dynamic fields for the NFT's access permissions
    const dynamicFields = await client.getDynamicFields({
      parentId: config.ACCESS_REGISTRY_ADDRESS,
    });
    
    const accessMap = new Map<string, number>();
    
    // Filter and process fields related to this NFT
    for (const field of dynamicFields.data) {
      if (field.name && typeof field.name === 'object' && 'value' in field.name) {
        const nameValue = field.name.value as any;
        if (nameValue?.nft_id === nftId) {
          const fieldObject = await client.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          const fields = getObjectFields(fieldObject);
          if (fields?.level !== undefined) {
            accessMap.set(nameValue.user, Number(fields.level));
          }
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
  switch (level) {
    case ACCESS_LEVELS.VIEWER:
      return ['view'];
    case ACCESS_LEVELS.CONTRIBUTOR:
      return ['view', 'edit', 'upload'];
    case ACCESS_LEVELS.ADMIN:
      return ['view', 'edit', 'upload', 'delete', 'manage_access'];
    default:
      return [];
  }
}