// Contract interaction module

import { SuiClient } from '@mysten/sui/client';
import { NeuralabsConfig } from '../types';
import { getObjectFields } from '../utils/helpers';

export interface ContractInfo {
  package: {
    id: string;
    version: string;
    published_at: string;
  };
  registry: {
    id: string;
    creator: string;
    nft_count: number;
    access_registry: string;
  };
  accessRegistry: {
    id: string;
    creator: string;
    grant_count: number;
  };
}

export async function getContractInfo(
  client: SuiClient,
  config: NeuralabsConfig
): Promise<ContractInfo> {
  try {
    // Fetch package info
    const packageObject = await client.getObject({
      id: config.PACKAGE_ADDRESS,
      options: { showContent: true },
    });
    
    // Fetch registry info
    const registryObject = await client.getObject({
      id: config.REGISTRY_ADDRESS,
      options: { showContent: true },
    });
    
    // Fetch access registry info
    const accessRegistryObject = await client.getObject({
      id: config.ACCESS_REGISTRY_ADDRESS,
      options: { showContent: true },
    });
    
    const packageFields = getObjectFields(packageObject);
    const registryFields = getObjectFields(registryObject);
    const accessRegistryFields = getObjectFields(accessRegistryObject);
    
    return {
      package: {
        id: config.PACKAGE_ADDRESS,
        version: packageFields?.version || '1.0.0',
        published_at: packageFields?.published_at || 'Unknown',
      },
      registry: {
        id: config.REGISTRY_ADDRESS,
        creator: registryFields?.creator || '',
        nft_count: Number(registryFields?.nft_count || 0),
        access_registry: registryFields?.access_registry || config.ACCESS_REGISTRY_ADDRESS,
      },
      accessRegistry: {
        id: config.ACCESS_REGISTRY_ADDRESS,
        creator: accessRegistryFields?.creator || '',
        grant_count: Number(accessRegistryFields?.grant_count || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching contract info:', error);
    throw new Error('Failed to fetch contract information');
  }
}

export function getPackageAddress(config: NeuralabsConfig): string {
  return config.PACKAGE_ADDRESS;
}

export function getRegistryAddress(config: NeuralabsConfig): string {
  return config.REGISTRY_ADDRESS;
}

export function getAccessRegistryAddress(config: NeuralabsConfig): string {
  return config.ACCESS_REGISTRY_ADDRESS;
}