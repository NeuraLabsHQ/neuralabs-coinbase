// Blockchain constants

export const SUI_CONSTANTS = {
  CLOCK_OBJECT_ID: '0x6',
  NETWORK: 'testnet' as const,
  DEFAULT_GAS_BUDGET: 100000000,
  MIN_GAS_BUDGET: 10000000,
} as const;

export const NFT_CONSTANTS = {
  TYPE_PREFIX: 'neuranft_contract::nft::',
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
  NONE: 0,
  VIEWER: 1,
  CONTRIBUTOR: 2,
  ADMIN: 3,
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