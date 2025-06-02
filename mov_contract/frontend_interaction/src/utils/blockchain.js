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
  console.log('grantAccessToUser called with params:', params);
  
  const client = params.client || window.suiClient
  const signAndExecute = params.signAndExecute || window.signAndExecute
  const config = params.config || window.config
  const currentAccount = params.currentAccount || window.currentAccount
  
  if (!client) {
    throw new Error('SUI client not initialized');
  }
  if (!signAndExecute) {
    throw new Error('signAndExecute function not available');
  }
  if (!config) {
    throw new Error('Config not available');
  }
  if (!currentAccount) {
    throw new Error('Current account not available');
  }
  
  console.log('Calling _grantAccess with:', {
    nftId: params.nftId,
    recipientAddress: params.userAddress,
    accessLevel: params.accessLevel,
    accessCapId: params.accessCapId
  });
  
  const result = await _grantAccess(client, config, currentAccount, signAndExecute, {
    nftId: params.nftId,
    recipientAddress: params.userAddress,
    accessLevel: params.accessLevel,
    accessCapId: params.accessCapId
  });
  
  console.log('_grantAccess result:', result);
  return result;
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

// Import walrus functions
import {
  uploadToWalrus as _uploadToWalrus,
  downloadFromWalrus as _downloadFromWalrus
} from '../blockchain_module/walrus/index.ts'

// Wrap Walrus functions with proper configuration
export const uploadToWalrus = async (data, config = null) => {
  const finalConfig = config || window.config
  if (!finalConfig || !finalConfig.WALRUS_PUBLISHER) {
    throw new Error('Walrus publisher URL not configured')
  }
  
  // Convert data to proper format if needed
  let uploadData
  if (data instanceof Blob) {
    uploadData = await data.arrayBuffer()
  } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
    uploadData = data
  } else {
    throw new Error('Invalid data format for upload')
  }
  
  // Call with proper parameters: publisherUrl first, then data
  const result = await _uploadToWalrus(finalConfig.WALRUS_PUBLISHER, uploadData)
  
  // Return just the blob ID for backward compatibility
  return result.blobId
}

export const downloadFromWalrus = async (blobId) => {
  const config = window.config
  if (!config || !config.WALRUS_AGGREGATOR) {
    throw new Error('Walrus aggregator URL not configured')
  }
  
  return _downloadFromWalrus(config.WALRUS_AGGREGATOR, blobId)
}

// Import exchange functions
import {
  getSuiBalance as _getSuiBalance,
  getWalBalance as _getWalBalance,
  convertSuiToWal as _convertSuiToWal,
  formatBalance
} from '../blockchain_module/exchange/index.ts'

// Wrap exchange functions to provide client
export const getSUIBalance = async (address) => {
  const client = window.suiClient
  if (!client) {
    throw new Error('SUI client not initialized')
  }
  const balance = await _getSuiBalance(client, address)
  // Return formatted balance string for backward compatibility
  return formatBalance(balance.totalBalance, 9)
}

export const getWALBalance = async (address, walCoinType) => {
  const client = window.suiClient
  const config = window.config
  if (!client) {
    throw new Error('SUI client not initialized')
  }
  // Use provided walCoinType or default to config
  const coinType = walCoinType || config?.WAL_TOKEN_TYPE
  if (!coinType) {
    throw new Error('WAL token type not provided or configured')
  }
  const balance = await _getWalBalance(client, address, coinType)
  // Return formatted balance string for backward compatibility
  return formatBalance(balance.totalBalance, 9)
}

export const convertSUIToWAL = async (params) => {
  const client = params.client || window.suiClient
  const signAndExecute = params.signAndExecute || window.signAndExecute
  const config = params.config || window.config
  const currentAccount = params.currentAccount || window.currentAccount
  
  if (!client || !signAndExecute || !config || !currentAccount) {
    throw new Error('Blockchain services not initialized')
  }
  
  // Convert amount to bigint (assuming it's in SUI units)
  const amountInMist = BigInt(Math.floor(params.amount * 1000000000)) // Convert SUI to MIST (9 decimals)
  
  // Use exchange config from params or default to window.config
  const exchangeConfig = params.exchangeConfig || {
    PACKAGE_ID: config.EXCHANGE_PACKAGE_ID,
    SHARED_OBJECT_ID: config.EXCHANGE_SHARED_OBJECT_ID,
    INITIAL_SHARED_VERSION: config.EXCHANGE_INITIAL_SHARED_VERSION
  }
  
  return _convertSuiToWal(client, currentAccount, signAndExecute, {
    amount: amountInMist,
    slippageTolerance: params.slippageTolerance || 0.5,
    exchangeConfig: exchangeConfig
  })
}

// Add missing wrapper functions for Interactive Publish
export const getSuiBalance = async (address) => {
  const client = window.suiClient
  if (!client) {
    throw new Error('SUI client not initialized')
  }
  const balance = await _getSuiBalance(client, address)
  return balance.totalBalance
}

export const getWalBalance = async (address) => {
  const client = window.suiClient
  const config = window.config
  if (!client) {
    throw new Error('SUI client not initialized')
  }
  if (!config || !config.WAL_TOKEN_TYPE) {
    throw new Error('WAL token type not configured')
  }
  const balance = await _getWalBalance(client, address, config.WAL_TOKEN_TYPE)
  return balance.totalBalance
}

export const encryptDataWithSeal = async (sealClient, data, sessionKey, config = null) => {
  const finalConfig = config || window.config
  
  console.log('encryptDataWithSeal called with:');
  console.log('- sealClient:', !!sealClient);
  console.log('- data length:', data?.length);
  console.log('- sessionKey:', !!sessionKey);
  console.log('- config parameter:', !!config);
  console.log('- window.config:', !!window.config);
  console.log('- finalConfig:', !!finalConfig);
  
  if (!finalConfig) {
    console.error('No config available. window.config:', window.config);
    throw new Error('Config not available for encryption. Please ensure the application is properly initialized.')
  }
  
  if (!finalConfig.PACKAGE_ID) {
    console.error('PACKAGE_ID not found in config:', finalConfig);
    throw new Error('PACKAGE_ID not found in configuration')
  }
  
  console.log('Using PACKAGE_ID:', finalConfig.PACKAGE_ID);
  
  // Use the encryptData function with proper parameters
  return _encryptData(sealClient, {
    data: data,
    packageId: finalConfig.PACKAGE_ID,
    policyId: finalConfig.PACKAGE_ID, // Using package ID as policy ID for now
    threshold: 2
  })
}

export const storeToWalrus = async (blob, config = null) => {
  const finalConfig = config || window.config
  
  console.log('storeToWalrus called with:');
  console.log('- blob:', !!blob);
  console.log('- config parameter:', !!config);
  console.log('- window.config:', !!window.config);
  console.log('- finalConfig:', !!finalConfig);
  
  if (!finalConfig) {
    console.error('No config available. window.config:', window.config);
    throw new Error('Config not available for Walrus storage. Please ensure the application is properly initialized.')
  }
  
  if (!finalConfig.WALRUS_PUBLISHER) {
    console.error('WALRUS_PUBLISHER not found in config:', finalConfig);
    throw new Error('Walrus publisher URL not configured')
  }
  
  if (!finalConfig.WALRUS_AGGREGATOR) {
    console.error('WALRUS_AGGREGATOR not found in config:', finalConfig);
    throw new Error('Walrus aggregator URL not configured')
  }
  
  console.log('Using WALRUS_PUBLISHER:', finalConfig.WALRUS_PUBLISHER);
  console.log('Using WALRUS_AGGREGATOR:', finalConfig.WALRUS_AGGREGATOR);
  
  const result = await _uploadToWalrus(finalConfig.WALRUS_PUBLISHER, blob)
  return {
    url: `${finalConfig.WALRUS_AGGREGATOR}/v1/${result.blobId}`,
    blobId: result.blobId
  }
}

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