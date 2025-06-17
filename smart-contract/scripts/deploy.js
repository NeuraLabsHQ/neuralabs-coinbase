const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Contract names to deploy
const CORE_CONTRACTS = [
  'MasterAccessControl',
  'NFTAccessControl', 
  'NFTMetadata',
  'Monetization'
];

const EXAMPLE_CONTRACTS = [
  // Add example contracts here if needed
];

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  examples: args.includes('--examples'),
  dryRun: args.includes('--dry-run'),
  reset: args.includes('--reset'),
  verify: args.includes('--verify'),
  network: process.env.TRUFFLE_NETWORK || 'development'
};

// Validate network
const validNetworks = ['development', 'local', 'testnet', 'mainnet'];
if (!validNetworks.includes(options.network)) {
  console.error(`Invalid network: ${options.network}`);
  console.error(`Valid networks: ${validNetworks.join(', ')}`);
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Check for .env file
if (!fs.existsSync(path.join(__dirname, '../.env'))) {
  console.log('No .env file found. Creating from .env.example...');
  try {
    fs.copyFileSync(
      path.join(__dirname, '../.env.example'),
      path.join(__dirname, '../.env')
    );
    console.log('.env file created. Please update it with your configuration.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create .env file:', error.message);
    process.exit(1);
  }
}

// Check critical environment variables
function checkEnvironment() {
  const network = options.network;
  const errors = [];

  // Check RPC URL
  const rpcVar = `${network.toUpperCase()}_RPC_URL`;
  if (!process.env[rpcVar] && network !== 'development') {
    errors.push(`Missing ${rpcVar}`);
  }

  // Check account configuration
  const mnemonicVar = `${network.toUpperCase()}_MNEMONIC`;
  const privateKeyVar = `${network.toUpperCase()}_PRIVATE_KEY`;
  
  if (!process.env[mnemonicVar] && !process.env.MNEMONIC && !process.env[privateKeyVar]) {
    errors.push(`Missing account configuration: ${mnemonicVar}, MNEMONIC, or ${privateKeyVar}`);
  }

  // Check Etherscan API key for verification
  if (options.verify && !process.env.ETHERSCAN_API_KEY) {
    errors.push('Missing ETHERSCAN_API_KEY for contract verification');
  }

  // Mainnet safety check
  if (network === 'mainnet' && process.env.REQUIRE_MAINNET_CONFIRMATION !== 'false') {
    console.warn('\n⚠️  WARNING: You are about to deploy to MAINNET ⚠️');
    console.warn('This will consume real ETH. Are you sure? (yes/no)');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('> ', (answer) => {
        rl.close();
        if (answer.toLowerCase() !== 'yes') {
          console.log('Deployment cancelled.');
          process.exit(0);
        }
        resolve(errors);
      });
    });
  }

  return Promise.resolve(errors);
}

// Create deployment record
function createDeploymentRecord(deploymentData, isError = false) {
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const network = options.network;
  
  // Determine filename
  let baseFilename = network;
  if (options.examples && !isError) {
    baseFilename += '-examples';
  }
  if (isError) {
    baseFilename += '-error';
  }

  // Save timestamped version
  const timestampedFile = path.join(
    deploymentsDir,
    `${baseFilename}-${timestamp.replace(/[:.]/g, '-')}.json`
  );
  
  fs.writeFileSync(
    timestampedFile,
    JSON.stringify(deploymentData, null, 2)
  );

  // Save latest version (unless it's an error)
  if (!isError) {
    const latestFile = path.join(deploymentsDir, `${baseFilename}-latest.json`);
    fs.writeFileSync(
      latestFile,
      JSON.stringify(deploymentData, null, 2)
    );
  }

  return timestampedFile;
}

// Main deployment function
async function deploy() {
  console.log('NeuraLabs Smart Contract Deployment');
  console.log('====================================');
  console.log(`Network: ${options.network}`);
  console.log(`Options:`, options);
  console.log();

  // Check environment
  const envErrors = await checkEnvironment();
  if (envErrors.length > 0) {
    console.error('Environment configuration errors:');
    envErrors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  // Reset deployments if requested
  if (options.reset) {
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (fs.existsSync(deploymentsDir)) {
      console.log('Resetting deployments directory...');
      fs.rmSync(deploymentsDir, { recursive: true, force: true });
    }
  }

  // Dry run mode
  if (options.dryRun) {
    console.log('DRY RUN MODE - No contracts will be deployed');
    console.log('\nContracts to deploy:');
    CORE_CONTRACTS.forEach(c => console.log(`  - ${c}`));
    if (options.examples) {
      console.log('\nExample contracts:');
      EXAMPLE_CONTRACTS.forEach(c => console.log(`  - ${c}`));
    }
    return;
  }

  // Deploy contracts
  const deploymentData = {
    network: options.network,
    timestamp: new Date().toISOString(),
    deployer: null,
    contracts: {},
    summary: {
      totalContracts: 0,
      success: true,
      totalGasUsed: 0,
      estimatedCostETH: 0
    }
  };

  try {
    console.log('Starting deployment...\n');

    // Run truffle migrate
    const migrateCmd = `npx truffle migrate --network ${options.network}`;
    console.log(`Executing: ${migrateCmd}`);
    
    const { stdout, stderr } = await execAsync(migrateCmd);
    
    if (stderr && !stderr.includes('Warning')) {
      throw new Error(stderr);
    }

    console.log(stdout);

    // Parse deployment results from stdout
    // This is a simplified version - you would need to parse the actual truffle output
    // to extract addresses and gas usage

    // For now, we'll create a success record
    deploymentData.summary.success = true;
    deploymentData.summary.totalContracts = CORE_CONTRACTS.length;

    // Save deployment record
    const recordFile = createDeploymentRecord(deploymentData);
    console.log(`\nDeployment record saved: ${recordFile}`);

    // Verify contracts if requested
    if (options.verify) {
      console.log('\nStarting contract verification...');
      try {
        await execAsync(`node ${path.join(__dirname, 'verify.js')} --network ${options.network}`);
        console.log('Contract verification completed.');
      } catch (error) {
        console.error('Contract verification failed:', error.message);
      }
    }

  } catch (error) {
    console.error('\nDeployment failed:', error.message);
    deploymentData.summary.success = false;
    deploymentData.error = error.message;
    
    const errorFile = createDeploymentRecord(deploymentData, true);
    console.error(`Error details saved: ${errorFile}`);
    process.exit(1);
  }

  console.log('\nDeployment completed successfully!');
}

// Run deployment
deploy().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});