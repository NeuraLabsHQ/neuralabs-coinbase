# NeuraLabs Testing Guide

This guide covers comprehensive testing strategies for the NeuraLabs NFT contract with Seal integration. All test scripts are located in the `scripts/` directory.

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Test Scripts Overview](#test-scripts-overview)
3. [Running Tests](#running-tests)
4. [Test Scenarios](#test-scenarios)
5. [Performance Testing](#performance-testing)
6. [Troubleshooting](#troubleshooting)

## Environment Setup

### 1. Prerequisites

```bash
# Create and activate conda environment
conda create -n neuralabs-exec python=3.12
conda activate neuralabs-exec

# Install Python dependencies
cd scripts
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

### 2. Configure Test Environment

1. Copy and update the test configuration:
```bash
cp test-config.json test-config.local.json
```

2. Edit `test-config.local.json` with your actual values:
   - Package ID from deployment
   - Collection ID after initialization
   - Test account addresses and private keys
   - Seal key server object IDs

### 3. Environment Variables

Set required environment variables:
```bash
export PACKAGE_ID=0x... # Your deployed package ID
export COLLECTION_ID=0x... # Your collection ID
```

## Test Scripts Overview

### Core Scripts

1. **`contract_interaction.py`** - Helper library for contract interactions
   - NFT creation and management
   - Access control operations
   - Encrypted data management

2. **`test_integration.py`** - Python integration tests
   - NFT lifecycle testing
   - Access control verification
   - Concurrent operations

3. **`seal-integration.test.js`** - JavaScript Seal tests
   - Encryption/decryption flows
   - Session key management
   - Threshold configurations

4. **`e2e_workflow_test.py`** - End-to-end workflow testing
   - Complete user journey
   - Multi-step operations
   - Access revocation

5. **`performance_test.py`** - Performance benchmarking
   - Operation timing
   - Throughput analysis
   - Concurrency testing

6. **`run_tests.sh`** - Master test runner script

## Running Tests

### Quick Start

Run all tests:
```bash
cd scripts
chmod +x run_tests.sh
./run_tests.sh
```

### Individual Test Suites

#### Move Unit Tests
```bash
cd ..
sui move test
```

#### Python Integration Tests
```bash
cd scripts
pytest test_integration.py -v
```

#### JavaScript Seal Tests
```bash
npm test seal-integration.test.js
```

#### End-to-End Tests
```bash
python e2e_workflow_test.py
```

#### Performance Tests
```bash
python performance_test.py
```

## Test Scenarios

### 1. Smart Contract Testing

The Move tests (`sources/tests/`) cover:
- Collection creation
- NFT minting with access levels
- Access control operations
- Seal approve function validation

### 2. Integration Testing

Python integration tests verify:
- NFT creation with different access levels
- Access grant/revoke operations
- Encrypted data storage
- Concurrent operations

### 3. Seal Encryption Testing

JavaScript tests validate:
- Session key creation and signing
- Encryption with different thresholds (1-of-1, 1-of-2, 2-of-2)
- Decryption with proper access
- Access denied scenarios

### 4. End-to-End Workflow

The E2E test simulates a complete user journey:
1. Create NFT collection
2. Mint NFT with level 6 access
3. Encrypt multiple workflow files
4. Upload to Walrus (mocked)
5. Store encrypted references
6. Grant level 4 access to another user
7. Verify decryption works
8. Revoke access and verify denial

### 5. Performance Benchmarks

Performance tests measure:
- NFT creation speed
- Access control operation timing
- Encryption/decryption throughput
- Concurrent operation handling
- Gas usage estimates

## Performance Testing

### Running Performance Tests

```bash
python performance_test.py
```

### Metrics Collected

1. **Transaction Performance**
   - NFT creation time
   - Access grant/revoke time
   - Batch operation efficiency

2. **Encryption Performance**
   - Throughput for different file sizes
   - Encryption vs decryption speed
   - Memory usage

3. **Concurrency**
   - Operations per second
   - Success rate under load
   - Optimal concurrency level

### Interpreting Results

Performance reports are saved as JSON files:
```
performance_report_YYYYMMDD_HHMMSS.json
```

Key metrics to monitor:
- NFT creation < 2 seconds
- Access operations < 1 second
- Encryption throughput > 10 MB/s

## Test Data Management

### Sample Test Files

The E2E test uses sample files:
- `model.pkl` - Binary model data
- `config.json` - Configuration
- `training_data.csv` - Dataset
- `requirements.txt` - Dependencies

### Access Levels Testing

Test all 6 access levels:
1. USE_MODEL - Basic usage
2. RESALE - Can transfer
3. CREATE_REPLICA - Can copy
4. VIEW_DOWNLOAD - Can decrypt (minimum for Seal)
5. EDIT_DATA - Can modify
6. ABSOLUTE_OWNERSHIP - Full control

## Continuous Integration

### GitHub Actions Setup

Create `.github/workflows/test.yml`:
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup environment
        run: |
          # Install Sui and dependencies
      - name: Run tests
        run: ./scripts/run_tests.sh
```

## Troubleshooting

### Common Issues

1. **Package not found**
   - Verify PACKAGE_ID is set correctly
   - Ensure contract is deployed

2. **Insufficient gas**
   - Increase gas budget in contract_interaction.py
   - Check account balance

3. **Seal key server errors**
   - Verify network connectivity
   - Check key server URLs
   - Ensure threshold <= available servers

4. **Test failures**
   - Check test-config.json values
   - Verify account permissions
   - Review transaction logs

### Debug Mode

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Checking Contract State

```bash
# View collection details
sui client object $COLLECTION_ID --json

# Check transaction
sui client transaction $TX_DIGEST --json
```

## Best Practices

1. **Isolation**: Run tests on testnet with dedicated accounts
2. **Cleanup**: Reset state between test runs if needed
3. **Monitoring**: Watch gas usage and performance metrics
4. **Documentation**: Document any custom test scenarios
5. **Version Control**: Track test configurations separately

## Next Steps

After successful testing:
1. Deploy to mainnet with production parameters
2. Set up monitoring and alerting
3. Create user documentation
4. Plan security audit