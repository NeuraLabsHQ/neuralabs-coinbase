// Network configuration for the blockchain app
export const NETWORKS = {
  local: {
    chainId: 1337,
    name: 'Local Development',
    rpcUrl: import.meta.env.VITE_LOCAL_RPC_URL || 'http://localhost:8545',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: null,
    isTestnet: true
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
    currency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://sepolia.etherscan.io',
    isTestnet: true
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://etherscan.io',
    isTestnet: false
  }
};

// Default network (can be overridden by environment variable)
export const DEFAULT_NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || 'local';

// Get current network configuration
export function getCurrentNetwork() {
  return NETWORKS[DEFAULT_NETWORK] || NETWORKS.local;
}

// Get network by chain ID
export function getNetworkByChainId(chainId) {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
}

// Check if a chain ID is supported
export function isSupportedNetwork(chainId) {
  return Object.values(NETWORKS).some(network => network.chainId === chainId);
}