#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const chalk = require('chalk');

// Test configurations
const TEST_SUITES = {
  master: {
    name: 'MasterAccessControl',
    file: 'test/MasterAccessControl.test.js',
    description: 'Central authorization and access control'
  },
  access: {
    name: 'NFTAccessControl',
    file: 'test/NFTAccessControl.test.js',
    description: '7-tier permission system and access management'
  },
  metadata: {
    name: 'NFTMetadata',
    file: 'test/NFTMetadata.test.js',
    description: 'IP metadata management and validation'
  },
  nft: {
    name: 'NFTContract',
    file: 'test/NFTContract.test.js',
    description: 'Core NFT functionality and lock mechanism'
  },
  monetization: {
    name: 'Monetization',
    file: 'test/Monetization.test.js',
    description: 'Five monetization models and payment handling'
  },
  agreement: {
    name: 'AIServiceAgreementManagement',
    file: 'test/AIServiceAgreementManagement.test.js',
    description: 'Agreement tracking and expiry management'
  },
  integration: {
    name: 'Integration',
    file: 'test/Integration.test.js',
    description: 'Cross-contract interactions and end-to-end flows'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  suite: args[0] || 'all',
  network: process.env.TRUFFLE_NETWORK || 'development',
  gas: args.includes('--gas'),
  coverage: args.includes('--coverage'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  bail: args.includes('--bail')
};

// Display help
function showHelp() {
  console.log(`
${chalk.bold('NeuraLabs Smart Contract Test Runner')}

${chalk.yellow('Usage:')}
  npm test [suite] [options]
  node scripts/test.js [suite] [options]

${chalk.yellow('Test Suites:')}
  ${chalk.cyan('all')}          Run all test suites (default)
  ${chalk.cyan('master')}       ${TEST_SUITES.master.description}
  ${chalk.cyan('access')}       ${TEST_SUITES.access.description}
  ${chalk.cyan('metadata')}     ${TEST_SUITES.metadata.description}
  ${chalk.cyan('nft')}          ${TEST_SUITES.nft.description}
  ${chalk.cyan('monetization')} ${TEST_SUITES.monetization.description}
  ${chalk.cyan('agreement')}    ${TEST_SUITES.agreement.description}
  ${chalk.cyan('integration')}  ${TEST_SUITES.integration.description}

${chalk.yellow('Options:')}
  ${chalk.cyan('--network')} <name>  Test network (default: development)
  ${chalk.cyan('--gas')}             Report gas usage
  ${chalk.cyan('--coverage')}        Generate coverage report
  ${chalk.cyan('--verbose, -v')}     Verbose output
  ${chalk.cyan('--bail')}            Stop on first test failure
  ${chalk.cyan('--help, -h')}        Show this help

${chalk.yellow('Examples:')}
  npm test                    # Run all tests
  npm test nft                # Run only NFT contract tests
  npm test integration --gas  # Run integration tests with gas reporting
  npm test --coverage         # Run all tests with coverage
`);
}

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Build test command
function buildTestCommand() {
  let cmd = options.coverage ? 'npx truffle run coverage' : 'npx truffle test';
  
  // Add specific test file if not running all
  if (options.suite !== 'all' && TEST_SUITES[options.suite]) {
    if (!options.coverage) {
      cmd += ` ${TEST_SUITES[options.suite].file}`;
    }
  } else if (options.suite !== 'all') {
    console.error(chalk.red(`Unknown test suite: ${options.suite}`));
    console.log(chalk.yellow('Run with --help to see available suites'));
    process.exit(1);
  }
  
  // Add network
  cmd += ` --network ${options.network}`;
  
  // Add options
  if (options.bail) cmd += ' --bail';
  
  return cmd;
}

// Run tests
async function runTests() {
  console.log(chalk.bold('\n🧪 NeuraLabs Smart Contract Tests\n'));
  console.log(chalk.gray('Network:'), options.network);
  console.log(chalk.gray('Suite:'), options.suite === 'all' ? 'All test suites' : TEST_SUITES[options.suite].name);
  
  if (options.coverage) {
    console.log(chalk.gray('Coverage:'), 'Enabled');
  }
  if (options.gas) {
    console.log(chalk.gray('Gas reporting:'), 'Enabled');
  }
  
  console.log('');
  
  // Set environment variables
  if (options.gas) {
    process.env.REPORT_GAS = 'true';
  }
  
  const command = buildTestCommand();
  
  if (options.verbose) {
    console.log(chalk.gray('Command:'), command);
    console.log('');
  }
  
  try {
    console.log(chalk.yellow('Running tests...\n'));
    
    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(command);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Display output
    console.log(stdout);
    
    if (stderr && !stderr.includes('Warning')) {
      console.error(chalk.red('Errors:'));
      console.error(stderr);
    }
    
    // Summary
    console.log(chalk.green(`\n✅ Tests completed in ${duration}s`));
    
    // Coverage report location
    if (options.coverage) {
      console.log(chalk.gray('\nCoverage report generated at:'), './coverage/index.html');
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test execution failed:'));
    console.error(error.stdout || error.message);
    
    if (error.stderr) {
      console.error(chalk.red('\nError details:'));
      console.error(error.stderr);
    }
    
    process.exit(1);
  }
}

// Display test suite info
function showTestSuiteInfo() {
  if (options.suite === 'all') {
    console.log(chalk.yellow('Test suites to run:'));
    Object.values(TEST_SUITES).forEach(suite => {
      console.log(chalk.cyan(`  • ${suite.name}:`), suite.description);
    });
    console.log('');
  } else {
    const suite = TEST_SUITES[options.suite];
    console.log(chalk.yellow('Test suite:'), suite.name);
    console.log(chalk.gray('Description:'), suite.description);
    console.log(chalk.gray('File:'), suite.file);
    console.log('');
  }
}

// Main execution
async function main() {
  if (options.verbose) {
    showTestSuiteInfo();
  }
  
  await runTests();
}

// Run
main().catch(error => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});