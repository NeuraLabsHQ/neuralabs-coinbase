// Main blockchain module exports

// Types
export * from './types';

// Utils
export * from './utils/constants';
export * from './utils/helpers';

// Core modules
export * as wallet from './wallet-connection';
export * as transaction from './transaction-proposer';
export * as contracts from './contracts';

// Feature modules
export * as nfts from './nfts';
export * as access from './access-management';
export * as seal from './seal-encryption';
export * as walrus from './walrus';
export * as exchange from './exchange';

// Re-export commonly used items at top level
export { 
  checkWalletConnection, 
  getWalletAddress,
  getWalletState 
} from './wallet-connection';

export { 
  TransactionBuilder,
  executeTransaction,
  signAndExecuteTransaction,
  createTransaction,
  dryRunTransaction,
  devInspectTransaction
} from './transaction-proposer';

export {
  getContractInfo,
  getPackageAddress,
  getRegistryAddress,
  getAccessRegistryAddress
} from './contracts';

// Export a convenience function to check if blockchain module is properly initialized
export function isBlockchainModuleReady(): boolean {
  return true; // Add any initialization checks here
}