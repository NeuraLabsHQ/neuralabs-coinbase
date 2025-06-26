const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  network: process.env.TRUFFLE_NETWORK || 'development',
  contract: null,
  all: true
};

// Parse specific contract if provided
args.forEach(arg => {
  if (arg.startsWith('--network=')) {
    options.network = arg.split('=')[1];
  } else if (arg.startsWith('--contract=')) {
    options.contract = arg.split('=')[1];
    options.all = false;
  }
});

// Load environment variables
require('dotenv').config();

// Check for Etherscan API key
if (!process.env.ETHERSCAN_API_KEY) {
  console.error('Error: ETHERSCAN_API_KEY not found in .env file');
  process.exit(1);
}

// Get latest deployment data
function getDeploymentData() {
  const deploymentsDir = path.join(__dirname, '../deployments');
  const latestFile = path.join(deploymentsDir, `${options.network}-latest.json`);
  
  if (!fs.existsSync(latestFile)) {
    console.error(`No deployment found for network: ${options.network}`);
    console.error(`Expected file: ${latestFile}`);
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  } catch (error) {
    console.error('Failed to read deployment data:', error.message);
    process.exit(1);
  }
}

// Get contract build info
function getContractBuildInfo(contractName) {
  const buildFile = path.join(
    __dirname,
    '../build/contracts',
    `${contractName}.json`
  );

  if (!fs.existsSync(buildFile)) {
    console.error(`Build file not found for contract: ${contractName}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(buildFile, 'utf8'));
  } catch (error) {
    console.error(`Failed to read build file for ${contractName}:`, error.message);
    return null;
  }
}

// Verify a single contract
async function verifyContract(contractName, contractData) {
  console.log(`\nVerifying ${contractName}...`);
  
  const buildInfo = getContractBuildInfo(contractName);
  if (!buildInfo) {
    console.error(`Skipping ${contractName} - no build info found`);
    return false;
  }

  // Prepare constructor arguments
  let constructorArgs = '';
  if (contractData.constructorArgs && contractData.constructorArgs.length > 0) {
    // Encode constructor arguments
    constructorArgs = contractData.constructorArgs
      .map(arg => {
        if (typeof arg === 'string' && arg.startsWith('0x')) {
          return arg;
        }
        return `"${arg}"`;
      })
      .join(' ');
  }

  // Build verification command
  const verifyCmd = [
    'npx',
    'truffle',
    'run',
    'verify',
    `${contractName}@${contractData.address}`,
    '--network',
    options.network
  ];

  if (constructorArgs) {
    verifyCmd.push('--constructorArgs');
    verifyCmd.push(constructorArgs);
  }

  try {
    console.log(`Command: ${verifyCmd.join(' ')}`);
    const { stdout, stderr } = await execAsync(verifyCmd.join(' '));
    
    if (stderr && !stderr.includes('Already Verified')) {
      throw new Error(stderr);
    }

    console.log(stdout);
    console.log(`✓ ${contractName} verified successfully`);
    return true;

  } catch (error) {
    if (error.message.includes('Already Verified')) {
      console.log(`✓ ${contractName} already verified`);
      return true;
    }
    
    console.error(`✗ ${contractName} verification failed:`, error.message);
    return false;
  }
}

// Main verification function
async function verify() {
  console.log('NeuraLabs Contract Verification');
  console.log('===============================');
  console.log(`Network: ${options.network}`);
  console.log();

  // Get deployment data
  const deploymentData = getDeploymentData();
  
  if (!deploymentData.contracts || Object.keys(deploymentData.contracts).length === 0) {
    console.error('No contracts found in deployment data');
    process.exit(1);
  }

  console.log(`Found ${Object.keys(deploymentData.contracts).length} contracts to verify`);

  // Determine which contracts to verify
  let contractsToVerify = {};
  
  if (options.all) {
    contractsToVerify = deploymentData.contracts;
  } else if (options.contract) {
    if (deploymentData.contracts[options.contract]) {
      contractsToVerify[options.contract] = deploymentData.contracts[options.contract];
    } else {
      console.error(`Contract not found: ${options.contract}`);
      console.error(`Available contracts: ${Object.keys(deploymentData.contracts).join(', ')}`);
      process.exit(1);
    }
  }

  // Verify contracts
  const results = {
    total: Object.keys(contractsToVerify).length,
    success: 0,
    failed: 0,
    failures: []
  };

  for (const [contractName, contractData] of Object.entries(contractsToVerify)) {
    const success = await verifyContract(contractName, contractData);
    if (success) {
      results.success++;
    } else {
      results.failed++;
      results.failures.push(contractName);
    }
  }

  // Summary
  console.log('\nVerification Summary');
  console.log('===================');
  console.log(`Total contracts: ${results.total}`);
  console.log(`Verified: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  
  if (results.failures.length > 0) {
    console.log(`\nFailed contracts:`);
    results.failures.forEach(name => console.log(`  - ${name}`));
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run verification
verify().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});