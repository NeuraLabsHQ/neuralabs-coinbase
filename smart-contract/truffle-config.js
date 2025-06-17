/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation, and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * https://trufflesuite.com/docs/truffle/reference/configuration
 *
 * Hands-off deployment with Infura
 * --------------------------------
 *
 * Do you have a complex application that requires lots of transactions to deploy?
 * Use this approach to make deployment a breeze 🏖️:
 *
 * Infura deployment needs a wallet provider (like @truffle/hdwallet-provider)
 * to sign transactions before they're sent to a remote public node.
 * Infura accounts are available for free at 🔍: https://infura.io/register
 *
 * You'll need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. You can store your secrets 🤐 in a .env file.
 * In your project root, run `$ npm install dotenv`.
 * Create .env (which should be .gitignored) and declare your MNEMONIC
 * and Infura PROJECT_ID variables inside.
 * For example, your .env file will have the following structure:
 *
 * MNEMONIC = <Your 12 phrase mnemonic>
 * PROJECT_ID = <Your Infura project id>
 *
 * Deployment with Truffle Dashboard (Recommended for best security practice)
 * --------------------------------------------------------------------------
 *
 * Are you concerned about security and minimizing rekt status 🤔?
 * Use this method for best security:
 *
 * Truffle Dashboard lets you review transactions in detail, and leverages
 * MetaMask for signing, so there's no need to copy-paste your mnemonic.
 * More details can be found at 🔎:
 *
 * https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/
 */

require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Helper function to get account provider
function getProvider(network) {
  const networkUpper = network.toUpperCase();
  
  // Check for network-specific mnemonic first
  const networkMnemonic = process.env[`${networkUpper}_MNEMONIC`];
  if (networkMnemonic) {
    const rpcUrl = process.env[`${networkUpper}_RPC_URL`];
    if (!rpcUrl) {
      throw new Error(`Missing ${networkUpper}_RPC_URL in .env file`);
    }
    // Different account counts based on network
    const accountCount = network === 'local' ? 10 : network === 'testnet' ? 5 : 3;
    return new HDWalletProvider({
      mnemonic: networkMnemonic,
      providerOrUrl: rpcUrl,
      numberOfAddresses: accountCount
    });
  }
  
  // Check for global mnemonic
  const globalMnemonic = process.env.MNEMONIC;
  if (globalMnemonic) {
    const rpcUrl = process.env[`${networkUpper}_RPC_URL`];
    if (!rpcUrl) {
      throw new Error(`Missing ${networkUpper}_RPC_URL in .env file`);
    }
    return new HDWalletProvider(globalMnemonic, rpcUrl);
  }
  
  // Check for private key
  const privateKey = process.env[`${networkUpper}_PRIVATE_KEY`];
  if (privateKey) {
    const rpcUrl = process.env[`${networkUpper}_RPC_URL`];
    if (!rpcUrl) {
      throw new Error(`Missing ${networkUpper}_RPC_URL in .env file`);
    }
    return new HDWalletProvider(privateKey, rpcUrl);
  }
  
  throw new Error(`No account configuration found for ${network}. Please set ${networkUpper}_MNEMONIC, MNEMONIC, or ${networkUpper}_PRIVATE_KEY`);
}

// Get gas price for network
function getGasPrice(network) {
  const networkUpper = network.toUpperCase();
  const gasPriceKey = `GAS_PRICE_${networkUpper}`;
  return process.env[gasPriceKey] ? parseInt(process.env[gasPriceKey]) : 20000000000; // Default 20 gwei
}

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a managed Ganache instance for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache, geth, or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 8000000,
      gasPrice: getGasPrice('local')
    },
    
    // Local network with HDWallet provider (for consistent addresses)
    local: {
      provider: () => getProvider('local'),
      network_id: "*",
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 8000000,
      gasPrice: getGasPrice('local')
    },


    // Testnet configuration (Sepolia)
    testnet: {
      provider: () => getProvider('testnet'),
      network_id: 11155111,  // Sepolia's network id
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 8000000,
      gasPrice: getGasPrice('testnet'),
      confirmations: 2,      // # of confirmations to wait between deployments
      timeoutBlocks: 200,    // # of blocks before a deployment times out
      skipDryRun: true       // Skip dry run before migrations
    },

    // Mainnet configuration
    mainnet: {
      provider: () => getProvider('mainnet'),
      network_id: 1,         // Mainnet's id
      gas: process.env.GAS_LIMIT ? parseInt(process.env.GAS_LIMIT) : 8000000,
      gasPrice: getGasPrice('mainnet'),
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: false,
      production: true       // Treat as production network
    }
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.20",      // Fetch exact version from solc-bin
      settings: {             // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "paris"
      }
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows:
  // $ truffle migrate --reset --compile-all
  //
  // db: {
  //   enabled: false,
  //   host: "127.0.0.1",
  //   adapter: {
  //     name: "indexeddb",
  //     settings: {
  //       directory: ".db"
  //     }
  //   }
  // }
  
  // Truffle plugins for contract verification
  plugins: [
    'truffle-plugin-verify'
  ],
  
  // API keys for contract verification
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
