#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const CONTRACT_DIR = path.join(__dirname, '../contract');
const BUILD_DIR = path.join(CONTRACT_DIR, 'build/contracts');
const DEPLOYMENT_FILE = path.join(CONTRACT_DIR, 'deployments/local-latest.json');
const OUTPUT_DIR = path.join(__dirname, '../blockchain-app/src/blockchain/config');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'blockchain-config.json');

// Contract names to include
const CONTRACTS = [
  'MasterAccessControl',
  'NFTAccessControl',
  'NFTContract',
  'NFTMetadata',
  'AIServiceAgreementManagement',
  'Monetization',
  'UserAgentWallet',
  'NFTAgentWallet'
];

// Network configuration
const NETWORKS = {
  local: {
    chainId: 1337,
    name: 'Local Development',
    rpcUrl: 'http://localhost:8545',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
    currency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
    currency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

function loadABI(contractName) {
  try {
    const abiPath = path.join(BUILD_DIR, `${contractName}.json`);
    const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    return contractData.abi;
  } catch (error) {
    console.error(`Error loading ABI for ${contractName}:`, error.message);
    return null;
  }
}

function loadDeploymentData() {
  try {
    if (!fs.existsSync(DEPLOYMENT_FILE)) {
      console.error(`Deployment file not found: ${DEPLOYMENT_FILE}`);
      return null;
    }
    return JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf8'));
  } catch (error) {
    console.error('Error loading deployment data:', error.message);
    return null;
  }
}

function generateConfig() {
  console.log('🔧 Generating blockchain configuration...\n');

  // Load deployment data
  const deploymentData = loadDeploymentData();
  if (!deploymentData) {
    console.error('❌ Failed to load deployment data');
    process.exit(1);
  }

  console.log(`📋 Loaded deployment from: ${deploymentData.timestamp}`);
  console.log(`🔗 Network: ${deploymentData.network}`);
  console.log(`👷 Deployer: ${deploymentData.deployer}\n`);

  // Create configuration object
  const config = {
    networks: NETWORKS,
    contracts: {},
    deployment: {
      network: deploymentData.network,
      timestamp: deploymentData.timestamp,
      deployer: deploymentData.deployer
    }
  };

  // Process each contract
  let successCount = 0;
  let errorCount = 0;

  CONTRACTS.forEach(contractName => {
    console.log(`📄 Processing ${contractName}...`);
    
    const abi = loadABI(contractName);
    const deploymentInfo = deploymentData.contracts[contractName];
    
    if (!abi) {
      console.error(`   ❌ ABI not found`);
      errorCount++;
      return;
    }
    
    if (!deploymentInfo) {
      console.error(`   ❌ Deployment info not found`);
      errorCount++;
      return;
    }
    
    config.contracts[contractName] = {
      address: deploymentInfo.address,
      abi: abi,
      deploymentInfo: {
        constructorArgs: deploymentInfo.constructorArgs,
        gasUsed: deploymentInfo.gasUsed
      }
    };
    
    console.log(`   ✅ Address: ${deploymentInfo.address}`);
    console.log(`   ✅ ABI loaded (${abi.length} functions)`);
    successCount++;
  });

  // Add contract relationships for easier access
  config.contractRelationships = {
    MasterAccessControl: {
      dependents: ['NFTAccessControl', 'NFTMetadata', 'AIServiceAgreementManagement', 'NFTContract', 'Monetization', 'NFTAgentWallet']
    },
    NFTAccessControl: {
      dependencies: ['MasterAccessControl'],
      dependents: ['NFTContract', 'NFTMetadata', 'AIServiceAgreementManagement', 'Monetization']
    },
    NFTContract: {
      dependencies: ['MasterAccessControl', 'NFTAccessControl', 'NFTMetadata'],
      dependents: ['Monetization']
    },
    NFTMetadata: {
      dependencies: ['MasterAccessControl', 'NFTAccessControl'],
      dependents: ['NFTContract', 'Monetization']
    },
    AIServiceAgreementManagement: {
      dependencies: ['MasterAccessControl', 'NFTAccessControl'],
      dependents: ['Monetization']
    },
    Monetization: {
      dependencies: ['MasterAccessControl', 'NFTContract', 'NFTAccessControl', 'NFTMetadata', 'AIServiceAgreementManagement']
    },
    UserAgentWallet: {
      dependencies: [],
      dependents: []
    },
    NFTAgentWallet: {
      dependencies: ['MasterAccessControl'],
      dependents: ['Monetization']
    }
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write configuration file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(config, null, 2));

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully processed: ${successCount} contracts`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount} contracts`);
  }
  console.log(`\n✨ Configuration saved to: ${OUTPUT_FILE}`);

  // Generate TypeScript types file
  generateTypeDefinitions(config);
}

function generateTypeDefinitions(config) {
  const typesPath = path.join(OUTPUT_DIR, 'blockchain-config.d.ts');
  
  const typeDefinitions = `// Auto-generated TypeScript definitions for blockchain configuration
// Generated on: ${new Date().toISOString()}

export interface BlockchainConfig {
  networks: {
    [networkName: string]: NetworkConfig;
  };
  contracts: {
    [contractName: string]: ContractConfig;
  };
  deployment: DeploymentInfo;
  contractRelationships: {
    [contractName: string]: {
      dependencies?: string[];
      dependents?: string[];
    };
  };
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ContractConfig {
  address: string;
  abi: any[];
  deploymentInfo: {
    constructorArgs: any[];
    gasUsed: number;
  };
}

export interface DeploymentInfo {
  network: string;
  timestamp: string;
  deployer: string;
}

// Contract name constants
export const CONTRACT_NAMES = {
  MASTER_ACCESS_CONTROL: 'MasterAccessControl',
  NFT_ACCESS_CONTROL: 'NFTAccessControl',
  NFT_CONTRACT: 'NFTContract',
  NFT_METADATA: 'NFTMetadata',
  AI_SERVICE_AGREEMENT: 'AIServiceAgreementManagement',
  MONETIZATION: 'Monetization',
  USER_AGENT_WALLET: 'UserAgentWallet',
  NFT_AGENT_WALLET: 'NFTAgentWallet'
} as const;

export type ContractName = typeof CONTRACT_NAMES[keyof typeof CONTRACT_NAMES];
`;

  fs.writeFileSync(typesPath, typeDefinitions);
  console.log(`📝 TypeScript definitions saved to: ${typesPath}`);
}

// Run the script
generateConfig();