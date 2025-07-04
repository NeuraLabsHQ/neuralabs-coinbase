# NFT Monetization Smart Contracts

A comprehensive smart contract system for tokenizing and monetizing intellectual property (IP) through NFTs with sophisticated access control and multiple monetization models.

## Overview

This system enables creators to mint NFTs representing their IP with:
- 7-tier access control system with sales protection
- Multiple monetization models (pay-per-use, subscriptions, direct sales)
- IP type-based restrictions (data, flow, model)
- Time-based locking mechanisms
- Secure payment flows and service agreement management

## Contract Architecture

### 1. **MasterAccessControl**
Central authorization contract managing permissions across all system contracts.

### 2. **NFTAccessControl**
Implements 7 permission tiers with sales protection for purchased access:
- None (0)
- UseModel (1)
- Resale (2)
- CreateReplica (3)
- ViewAndDownload (4)
- EditData (5)
- AbsoluteOwnership (6)

### 3. **NFTMetadata**
Manages IP-specific metadata including encryption, storage location, and versioning.

### 4. **AIServiceAgreementManagement**
Tracks and manages AI service agreements, protecting user investments.

### 5. **NFTContract**
Core NFT contract with locking mechanism, ownership levels, and ERC721 compliance.

### 6. **Monetization**
Handles multiple revenue models with commitment periods:
- Pay-per-use
- Subscription
- Buy-access
- Buy-ownership
- Buy-replica

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your environment:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:
   - Network RPC URLs (Infura, Alchemy, etc.)
   - Account mnemonics or private keys
   - Gas settings
   - Etherscan API key for verification

## Blockchain Interaction Application

This project includes a full-featured web application for interacting with the smart contracts.

### Features
- Dark/Light theme support with Bootstrap
- Wallet connection management (MetaMask, etc.)
- Contract interaction modules with read/execute functions
- Management interfaces for:
  - NFT creation and management
  - Access control configuration
  - Monetization setup
  - Agent wallet associations
  - Service agreement monitoring

### Quick Start

1. Generate blockchain configuration:
```bash
cd contract
npm run generate-config
```

2. Install and run the application:
```bash
cd ../blockchain-app
npm install
npm run dev
```

3. Open http://localhost:5173 in your browser

### Application Structure
```
blockchain-app/
├── src/
│   ├── blockchain/         # Blockchain interaction modules
│   │   ├── config/        # Generated config and network settings
│   │   └── modules/       # Core functions and contract interfaces
│   ├── components/        # Reusable UI components
│   ├── pages/            # Application pages
│   ├── contexts/         # React contexts (wallet, etc.)
│   └── styles/           # CSS with dark/light themes
```

### Blockchain Module Usage

```javascript
import { nftContract, masterAccessControl, read, execute } from './blockchain/modules';

// Read contract data
const nftInfo = await nftContract.getNFTInfo({ 
  tokenId: 1, 
  provider 
});

// Execute transactions
const result = await nftContract.createNFT({ 
  name: "My NFT", 
  levelOfOwnership: 6, 
  signer 
});

// Generic read/execute functions
const balance = await read({
  contractAddress: nftContract.address,
  abi: nftContract.abi,
  methodName: 'balanceOf',
  args: [userAddress],
  provider
});
```

## Deployment

### Quick Start

The project includes automated deployment scripts that handle:
- Environment validation
- Contract deployment with proper initialization
- Deployment record keeping
- Contract verification on Etherscan

### Local Development

1. Start local blockchain (Ganache/Hardhat):
```bash
ganache-cli  # Default port 8545
```

2. Deploy using npm scripts:
```bash
npm run deploy:local
```

Or using Truffle directly:
```bash
npx truffle migrate --network development
```

### Testnet Deployment (Sepolia)

1. Configure `.env` with testnet settings:
   - `TESTNET_RPC_URL`: Your Infura/Alchemy endpoint
   - `TESTNET_MNEMONIC` or `MNEMONIC`: 12-24 word seed phrase
   - `ETHERSCAN_API_KEY`: For contract verification

2. Deploy to testnet:
```bash
npm run deploy:testnet
```

3. Verify contracts on Etherscan:
```bash
npm run verify:testnet
```

### Mainnet Deployment

1. Configure `.env` with mainnet settings:
   - `MAINNET_RPC_URL`: Production RPC endpoint
   - `MAINNET_MNEMONIC`: Secure mnemonic (3 accounts generated)
   - Set `REQUIRE_MAINNET_CONFIRMATION=true` for safety

2. Deploy with confirmation:
```bash
npm run deploy:mainnet
```

3. Verify contracts:
```bash
npm run verify:mainnet
```

### Deployment Options

- **Dry Run**: Test deployment without executing
  ```bash
  npm run deploy:dry-run
  ```

- **With Examples**: Deploy example contracts
  ```bash
  npm run deploy:examples
  ```

- **Reset Deployment**: Clear previous deployment records
  ```bash
  node scripts/deploy.js --reset --network local
  ```

### Deployment Records

All deployments are recorded in the `deployments/` directory:
- `{network}-latest.json`: Most recent deployment
- `{network}-{timestamp}.json`: Historical deployments
- `{network}-error-{timestamp}.json`: Failed deployments

Example deployment record:
```json
{
  "network": "testnet",
  "timestamp": "2025-06-17T10:30:00.000Z",
  "deployer": "0x...",
  "contracts": {
    "MasterAccessControl": {
      "address": "0x...",
      "constructorArgs": [],
      "gasUsed": 1234567
    },
    // ... other contracts
  },
  "summary": {
    "totalContracts": 6,
    "success": true,
    "totalGasUsed": 7654321,
    "estimatedCostETH": "0.1234"
  }
}
```

## Usage

### Creating an NFT

```javascript
// Create NFT with ownership level 6 (AbsoluteOwnership)
const tokenId = await nftContract.createNFT("My AI Model", 6);

// Add metadata
await nftMetadata.createMetadata(tokenId, {
    image: "ipfs://...",
    intellectual_property_type: "model", // or "flow" or "data"
    encrypted: false,
    encryption_id: "",
    intellectual_property_id: "unique-id",
    intellectual_property_storage: "neuralabs",
    md5: "hash",
    version: "1.0.0"
});
```

### Setting Up Monetization

```javascript
// Set commitment time and notice period (required for most monetization options)
await monetization.setCommitmentTime(tokenId, futureTimestamp);
await monetization.setNoticeBeforeUnlockCommitment(tokenId, 7 * 24 * 60 * 60); // 7 days

// Enable monetization options
await monetization.enablePayPerUse(tokenId, costPerUse, platformCostPaidBy);
await monetization.enableSubscription(tokenId, cost, timeDays, limit, limitMinutes);
await monetization.enableBuyAccess(tokenId, accessLevel, accessTimeDays, costWei);
await monetization.enableBuyOwnership(tokenId, costWei, ownershipLevel);
await monetization.enableBuyReplica(tokenId, costWei, ownershipLevel);
```

### IP Type Restrictions

- **"data"** type: Only `buy-ownership` monetization is available
- **"flow"** and **"model"** types: All monetization options available

## Testing

Run the test suite:
```bash
npm test
```

Or with specific network:
```bash
npm run test:local
```

## Development Commands

### Compilation & Building
```bash
npm run compile           # Compile all contracts
npm run flatten          # Create flattened.sol for verification
```

### Testing
```bash
npm test                 # Run all tests
npm run test:local       # Run tests on local network
```

### Migration & Deployment
```bash
# Basic migrations
npm run migrate          # Run migrations on development network
npm run migrate:reset    # Reset and re-run all migrations

# Deployment with custom scripts
npm run deploy:local     # Deploy to local network
npm run deploy:testnet   # Deploy to Sepolia testnet
npm run deploy:mainnet   # Deploy to Ethereum mainnet

# Additional deployment options
npm run deploy:examples  # Deploy with example contracts
npm run deploy:dry-run   # Test deployment without executing
```

### Contract Verification
```bash
# Verify all contracts on network
npm run verify:testnet   # Verify on Sepolia
npm run verify:mainnet   # Verify on mainnet

# Verify specific contract
npm run verify:contract -- --contract=NFTContract --network=testnet
```

### Console Access
```bash
npm run console          # Local development console
npm run console:testnet  # Sepolia testnet console
npm run console:mainnet  # Mainnet console
```

### Direct Script Access
```bash
# Deploy with specific options
node scripts/deploy.js --network testnet --verify
node scripts/deploy.js --network mainnet --reset --dry-run

# Verify contracts manually
node scripts/verify.js --network=testnet
node scripts/verify.js --network=mainnet --contract=Monetization
```

### Environment Management
```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

## Security Considerations

1. **Reentrancy Protection**: Payment functions use checks-effects-interactions pattern
2. **Access Control**: Every cross-contract call validates permissions
3. **Lock State Management**: NFTs cannot be transferred/burned while locked
4. **Payment Protection**: Paid users cannot have access revoked
5. **Commitment Validation**: Functions revert if commitment/notice not set

## Gas Optimization

The contracts are optimized with:
- Solidity optimizer enabled (200 runs)
- Efficient storage patterns
- Batch operations where possible

Typical deployment costs:
- Local: ~0.15 ETH (at 20 gwei)
- Testnet: ~0.15 ETH (at 20 gwei)
- Mainnet: ~0.23 ETH (at 30 gwei)

## Troubleshooting

### Common Issues

1. **"No account configuration found"**
   - Ensure mnemonic or private key is set in `.env`
   - Check network-specific variables (e.g., `TESTNET_MNEMONIC`)

2. **"Missing RPC_URL"**
   - Set appropriate RPC URL for your network
   - Format: `{NETWORK}_RPC_URL` (e.g., `TESTNET_RPC_URL`)

3. **Verification fails**
   - Ensure `ETHERSCAN_API_KEY` is set
   - Wait a few minutes after deployment before verifying
   - Check constructor arguments match deployment

4. **Gas estimation errors**
   - Increase `GAS_LIMIT` in `.env`
   - Check account has sufficient balance

## License

MIT