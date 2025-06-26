// Core blockchain interaction functions
export { read, batchRead, readWithRetry, estimateReadGas } from './core/read.js';
export { execute, batchExecute, executeWithRetry, estimateTransaction, waitForTransaction } from './core/execute.js';
export { 
  getWalletInfo, 
  verifyWalletConnection, 
  checkNetwork, 
  formatAddress, 
  formatBalance,
  getNetworkName,
  getExplorerUrl,
  checkSufficientBalance,
  requestPermissions,
  addTokenToWallet
} from './core/wallet.js';

// Contract-specific modules
export { masterAccessControl } from './contracts/masterAccessControl.js';
export { nftContract } from './contracts/nftContract.js';

// Re-export blockchain config
export { default as blockchainConfig } from '../config/blockchain-config.json';
export { NETWORKS, DEFAULT_NETWORK, getCurrentNetwork, getNetworkByChainId, isSupportedNetwork } from '../config/networks.js';

// Utility function to get contract instance
export function getContract(contractName) {
  const contracts = {
    MasterAccessControl: masterAccessControl,
    NFTContract: nftContract,
    // Add other contracts here as they are implemented
  };

  return contracts[contractName];
}

// Utility to check if all contracts are deployed
export function areContractsDeployed() {
  try {
    // Import is already done at the top
    const requiredContracts = [
      'MasterAccessControl',
      'NFTAccessControl',
      'NFTContract',
      'NFTMetadata',
      'AIServiceAgreementManagement',
      'Monetization',
      'UserAgentWallet',
      'NFTAgentWallet'
    ];

    return requiredContracts.every(contractName => {
      const contract = blockchainConfig.contracts[contractName];
      return contract && contract.address && contract.address !== '0x0000000000000000000000000000000000000000';
    });
  } catch (error) {
    console.error('Error checking contract deployment:', error);
    return false;
  }
}