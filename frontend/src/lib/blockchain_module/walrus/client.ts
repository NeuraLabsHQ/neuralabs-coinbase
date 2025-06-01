// Walrus client management

import { NeuralabsConfig, WalrusUploadResult } from '../types';
import { STORAGE_CONSTANTS } from '../utils/constants';

// Walrus uses HTTP API, not a client SDK like in the example
export interface WalrusConfig {
  aggregatorUrl?: string;
  publisherUrl?: string;
}

// Get Walrus configuration
export function getWalrusConfig(config: NeuralabsConfig): WalrusConfig {
  return {
    aggregatorUrl: config.WALRUS_AGGREGATOR || STORAGE_CONSTANTS.WALRUS_AGGREGATOR_TESTNET,
    publisherUrl: config.WALRUS_PUBLISHER || STORAGE_CONSTANTS.WALRUS_PUBLISHER_TESTNET,
  };
}

// Upload data to Walrus using HTTP API
export async function uploadToWalrus(
  publisherUrl: string,
  data: ArrayBuffer | Uint8Array,
  epochs: number = STORAGE_CONSTANTS.WALRUS_EPOCHS
): Promise<WalrusUploadResult> {
  try {
    const bodyData = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    
    const response = await fetch(`${publisherUrl}/v1/blobs?epochs=${epochs}`, {
      method: 'PUT',
      body: bodyData,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Handle both newly created and already certified blobs
    if (result.newlyCreated) {
      return {
        blobId: result.newlyCreated.blobObject.blobId,
        endEpoch: result.newlyCreated.blobObject.endEpoch,
        blobObject: result.newlyCreated.blobObject.id,
        cost: result.newlyCreated.cost ? Number(result.newlyCreated.cost) : undefined,
      };
    } else if (result.alreadyCertified) {
      return {
        blobId: result.alreadyCertified.blobId,
        endEpoch: result.alreadyCertified.endEpoch,
        blobObject: undefined, // Already certified blobs don't have new object IDs
        cost: 0, // No cost for already certified
      };
    } else {
      throw new Error('Unexpected response format from Walrus');
    }
  } catch (error) {
    console.error('Error uploading to Walrus:', error);
    throw new Error(`Failed to upload data to Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Download data from Walrus using HTTP API
export async function downloadFromWalrus(
  aggregatorUrl: string,
  blobId: string
): Promise<Uint8Array> {
  try {
    const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Blob not found');
      }
      throw new Error(`Download failed with status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    // const data_json   = new TextDecoder().decode(arrayBuffer)
    return new Uint8Array(arrayBuffer);
    // return data_json;
  } catch (error) {
    console.error('Error downloading from Walrus:', error);
    throw new Error(`Failed to download data from Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to check blob status
export async function checkBlobStatus(
  aggregatorUrl: string,
  blobId: string
): Promise<{ exists: boolean; certified: boolean }> {
  try {
    const response = await fetch(`${aggregatorUrl}/v1/${blobId}/status`, {
      method: 'GET',
    });
    
    if (response.status === 404) {
      return { exists: false, certified: false };
    }
    
    if (!response.ok) {
      throw new Error(`Status check failed with status: ${response.status}`);
    }
    
    const status = await response.json();
    return {
      exists: true,
      certified: status.certified ?? false,
    };
  } catch (error) {
    console.error('Error checking blob status:', error);
    return { exists: false, certified: false };
  }
}

// Helper to create blob URL for direct access
export function getBlobUrl(aggregatorUrl: string, blobId: string): string {
  return `${aggregatorUrl}/v1/blobs/${blobId}`;
}