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

// Re-export access management functions
export {
  grantAccessToUser,
  revokeUserAccess,
  checkUserAccess,
  getAccessCaps,
  createAccessCap
} from '../blockchain_module/access-management/index.ts'

// Re-export seal encryption functions
export {
  initializeSealClient,
  createSealSessionKey,
  exportSessionKey,
  importSessionKey,
  encryptData,
  decryptData,
  fetchDecryptionKeys,
  storeEncryptedData
} from '../blockchain_module/seal-encryption/index.ts'

// Re-export walrus functions
export {
  uploadToWalrus,
  downloadFromWalrus
} from '../blockchain_module/walrus/index.ts'

// Re-export exchange functions
export {
  getSUIBalance,
  getWALBalance,
  convertSUIToWAL
} from '../blockchain_module/exchange/index.ts'

// Re-export transaction proposer functions
export { createTransaction } from '../blockchain_module/transaction-proposer/index.ts'

// Re-export constants
export { ACCESS_LEVELS } from '../blockchain_module/utils/constants.ts'