// JavaScript wrapper for blockchain modules
// This ensures compatibility between JS and TS files

// Re-export contract functions
export { getContractInfo } from '../blockchain_module/contracts/index.ts'

// Re-export NFT functions  
export { 
  mintNFT, 
  getUserNFTs, 
  getTotalNFTCount 
} from '../blockchain_module/nfts/index.ts'

// Import access management functions first
import {
  grantAccess,
  revokeAccess,
  checkUserAccess,
  getUserAccessCaps,
  createAccessCap
} from '../blockchain_module/access-management/index.ts'

// Re-export access management functions (keeping original names)
export {
  grantAccess,
  revokeAccess,
  checkUserAccess,
  getUserAccessCaps,
  createAccessCap
}

// Create aliases for backward compatibility
export const grantAccessToUser = grantAccess
export const revokeUserAccess = revokeAccess
export const getAccessCaps = getUserAccessCaps

// Import seal encryption functions first
import {
  getSealClient,
  createSessionKey,
  importSessionKey,
  encryptData,
  decryptData,
  storeEncryptedData,
  SessionKey
} from '../blockchain_module/seal-encryption/index.ts'

// Re-export seal encryption functions (keeping original names)
export {
  getSealClient,
  createSessionKey,
  importSessionKey,
  encryptData,
  decryptData,
  storeEncryptedData,
  SessionKey
}

// Create aliases for backward compatibility
export const initializeSealClient = getSealClient
export const createSealSessionKey = createSessionKey

// Create wrapper functions for missing/complex operations
export const exportSessionKey = async (sessionKey) => {
  if (!sessionKey || typeof sessionKey.export !== 'function') {
    throw new Error('Invalid session key for export')
  }
  return JSON.stringify(await sessionKey.export())
}

export const fetchDecryptionKeys = async ({ ids, tx, sessionKey, threshold, client }) => {
  // This is typically handled within the decrypt operation itself
  // For now, return a placeholder or integrate with the actual decryption flow
  console.warn('fetchDecryptionKeys is a complex operation - handled within decryptData')
  return Promise.resolve()
}

// Re-export walrus functions
export {
  uploadToWalrus,
  downloadFromWalrus
} from '../blockchain_module/walrus/index.ts'

// Re-export exchange functions (keeping original names)
export {
  getSuiBalance,
  getWalBalance,
  convertSuiToWal
} from '../blockchain_module/exchange/index.ts'

// Create aliases for backward compatibility
export const getSUIBalance = getSuiBalance
export const getWALBalance = getWalBalance
export const convertSUIToWAL = convertSuiToWal

// Re-export transaction proposer functions
export { createTransaction } from '../blockchain_module/transaction-proposer/index.ts'

// Re-export constants
export { ACCESS_LEVELS } from '../blockchain_module/utils/constants.ts'