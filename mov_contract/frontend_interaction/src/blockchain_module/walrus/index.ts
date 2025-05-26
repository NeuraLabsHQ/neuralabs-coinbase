// Walrus storage module main export

export { 
  getWalrusConfig,
  uploadToWalrus, 
  downloadFromWalrus,
  checkBlobStatus,
  getBlobUrl
} from './client';
export type { WalrusConfig } from './client';

export { 
  uploadEncryptedDataReference, 
  getStoredDataForNFT, 
  checkStorageAccess,
  validateFileSize,
  removeStoredData
} from './storage';

export type { UploadEncryptedDataParams, StoredDataInfo } from './storage';

// Re-export types
export type { WalrusUploadResult } from '../types';
export { STORAGE_CONSTANTS } from '../utils/constants';