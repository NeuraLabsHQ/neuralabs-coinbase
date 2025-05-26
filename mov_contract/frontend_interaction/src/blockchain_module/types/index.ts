// Core blockchain types for the NeuraLabs platform

export interface NeuralabsConfig {
  PACKAGE_ADDRESS: string;
  REGISTRY_ADDRESS: string;
  ACCESS_REGISTRY_ADDRESS: string;
  WALRUS_AGGREGATOR: string;
  WALRUS_PUBLISHER: string;
  SEAL_APP_NAME?: string;
  SEAL_URL?: string;
  SUI_RPC_URL?: string;
}

export interface NFTData {
  id: string;
  name: string;
  description: string;
  url: string;
  creation_date: number;
  metadata?: Record<string, any>;
}

export interface AccessLevel {
  level: number;
  permissions: string[];
}

export interface AccessCapData {
  id: string;
  owner: string;
  level: number;
  expires_at?: number;
}

export interface EncryptedData {
  blob_id: string;
  encryption_type: 'seal' | 'custom';
  metadata?: Record<string, any>;
}

export interface WalrusUploadResult {
  blobId: string;
  endEpoch: number;
  blobObject?: string;
  cost?: number;
}

export interface TransactionResult {
  digest: string;
  effects: any;
  events: any[];
  objectChanges: any[];
}

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface WalletState {
  isConnected: boolean;
  address?: string;
  balance?: bigint;
}