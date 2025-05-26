// Blockchain constants

export const SUI_CONSTANTS = {
  CLOCK_OBJECT_ID: '0x6',
  NETWORK: 'testnet' as const,
  DEFAULT_GAS_BUDGET: 100000000,
  MIN_GAS_BUDGET: 10000000,
} as const;

export const NFT_CONSTANTS = {
  TYPE_PREFIX: 'neuralabs::nft::',
  NFT_TYPE: 'NeuraLabsNFT',
  ACCESS_CAP_TYPE: 'AccessCap',
} as const;

export const STORAGE_CONSTANTS = {
  WALRUS_AGGREGATOR_TESTNET: 'https://aggregator.walrus-testnet.walrus.space',
  WALRUS_PUBLISHER_TESTNET: 'https://publisher.walrus-testnet.walrus.space',
  WALRUS_EPOCHS: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const ACCESS_LEVELS = {
  1: { name: 'Use Model', canDecrypt: false },
  2: { name: 'Resale', canDecrypt: false },
  3: { name: 'Create Replica', canDecrypt: false },
  4: { name: 'View/Download', canDecrypt: true },
  5: { name: 'Edit Data', canDecrypt: true },
  6: { name: 'Absolute Ownership', canDecrypt: true }
} as const;

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_BALANCE: 'Insufficient SUI balance',
  TRANSACTION_FAILED: 'Transaction failed',
  NFT_NOT_FOUND: 'NFT not found',
  ACCESS_DENIED: 'Access denied',
  UPLOAD_FAILED: 'Upload failed',
  DECRYPTION_FAILED: 'Decryption failed',
} as const;