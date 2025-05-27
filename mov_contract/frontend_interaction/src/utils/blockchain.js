// JavaScript wrapper for blockchain modules
// This ensures compatibility between JS and TS files

// Import the client instances
import { useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// Re-export contract functions
export { getContractInfo } from '../blockchain_module/contracts/index.ts'

// Re-export NFT functions with wrappers
export { 
  getUserNFTs, 
  getTotalNFTCount 
} from '../blockchain_module/nfts/index.ts'

// Import NFT creation function
import { mintNFT as _mintNFT } from '../blockchain_module/nfts/index.ts'

// Wrap mintNFT to handle the client and signAndExecute properly
export const mintNFT = async (client, config, currentAccount, signAndExecute, params) => {
  return _mintNFT(client, config, currentAccount, signAndExecute, params)
}

// Import access management functions first
import {
  grantAccess as _grantAccess,
  revokeAccess as _revokeAccess,
  checkUserAccess as _checkUserAccess,
  getUserAccessCaps as _getUserAccessCaps,
  createAccessCap as _createAccessCap
} from '../blockchain_module/access-management/index.ts'

// Wrap access functions
export const grantAccessToUser = async (params) => {
  const client = params.client || window.suiClient
  const signAndExecute = params.signAndExecute || window.signAndExecute
  const config = params.config || window.config
  const currentAccount = params.currentAccount || window.currentAccount
  
  return _grantAccess(client, config, currentAccount, signAndExecute, {
    nftId: params.nftId,
    recipientAddress: params.userAddress,
    accessLevel: params.accessLevel,
    accessCapId: params.accessCapId
  })
}

export const revokeUserAccess = async (params) => {
  const client = params.client || window.suiClient
  const signAndExecute = params.signAndExecute || window.signAndExecute
  const config = params.config || window.config
  const currentAccount = params.currentAccount || window.currentAccount
  
  return _revokeAccess(client, config, currentAccount, signAndExecute, {
    nftId: params.nftId,
    userAddress: params.userAddress,
    accessCapId: params.accessCapId
  })
}

export const checkUserAccess = async (nftId, userAddress) => {
  const client = window.suiClient
  const config = window.config
  return _checkUserAccess(client, config, nftId, userAddress)
}

export const getAccessCaps = async (client, config, userAddress) => {
  return _getUserAccessCaps(client, config, userAddress)
}


export const createAccessCap = async (nftId, userAddress) => {
  // Make sure global references exist
  if (!window.suiClient || !window.signAndExecute || !window.config || !window.currentAccount) {
    throw new Error('Blockchain services not initialized. Please ensure wallet is connected.')
  }
  
  const client = window.suiClient
  const signAndExecute = window.signAndExecute
  const config = window.config
  const currentAccount = window.currentAccount
  
  return _createAccessCap(client, config, currentAccount, signAndExecute, { nftId })
}

// Import seal encryption functions
import {
  getSealClient as _getSealClient,
  createSessionKey as _createSessionKey,
  importSessionKey as _importSessionKey,
  encryptData as _encryptData,
  decryptData as _decryptData,
  storeEncryptedData as _storeEncryptedData,
  SessionKey
} from '../blockchain_module/seal-encryption/index.ts'

// Wrap Seal functions
export const initializeSealClient = (suiClient) => {
  return _getSealClient({ suiClient, network: 'testnet', verifyKeyServers: false })
}

export const createSealSessionKey = (params) => {
  return new SessionKey({
    address: params.address,
    packageId: params.packageId,
    ttlMin: params.ttlMin || 10
  })
}

export const importSessionKey = _importSessionKey
export const encryptData = _encryptData
export const decryptData = _decryptData
export const storeEncryptedData = async (params) => {
  const client = window.suiClient
  const signAndExecute = window.signAndExecute
  const config = window.config
  const currentAccount = window.currentAccount
  
  if (!client || !signAndExecute || !config || !currentAccount) {
    throw new Error('Blockchain services not initialized. Please ensure wallet is connected.')
  }
  
  return _storeEncryptedData(client, config, currentAccount, signAndExecute, params)
}
export { SessionKey }

// Create wrapper functions for missing/complex operations
export const exportSessionKey = async (sessionKey) => {
  if (!sessionKey || typeof sessionKey.export !== 'function') {
    throw new Error('Invalid session key for export')
  }
  return JSON.stringify(await sessionKey.export())
}

export const fetchDecryptionKeys = async ({ ids, tx, sessionKey, threshold, client }) => {
  // This is typically handled within the decrypt operation itself
  console.warn('fetchDecryptionKeys is handled within decryptData')
  return Promise.resolve()
}

// Re-export walrus functions
export {
  uploadToWalrus,
  downloadFromWalrus
} from '../blockchain_module/walrus/index.ts'

// Re-export exchange functions
export {
  getSuiBalance as getSUIBalance,
  getWalBalance as getWALBalance,
  convertSuiToWal as convertSUIToWAL
} from '../blockchain_module/exchange/index.ts'

// Re-export transaction proposer functions
export { createTransaction } from '../blockchain_module/transaction-proposer/index.ts'

// Re-export constants
export { ACCESS_LEVELS } from '../blockchain_module/utils/constants.ts'

// Set up global references for easy access
if (typeof window !== 'undefined') {
  window.config = null
  window.suiClient = null
  window.signAndExecute = null
  window.currentAccount = null
}