// Seal encryption module main export

export { 
  getSealClient, 
  resetSealClient, 
  createSessionKey,
  importSessionKey,
  isSessionKeyExpired
} from './client';
export type { SessionKeyResult, SealClientConfig } from './client';

export { 
  encryptData,
  decryptData,
  encryptFile, 
  approveSealUsage, 
  checkEncryptionAccess,
  createSealApproveCall
} from './encrypt';
export type { EncryptParams, DecryptParams, EncryptResult } from './encrypt';

export { storeEncryptedData, getEncryptedDataForNFT, removeEncryptedData } from './storage';
export type { StoreEncryptedDataParams } from './storage';

// Re-export types
export type { EncryptedData } from '../types';
export { SessionKey, type SessionKeyType } from '@mysten/seal';