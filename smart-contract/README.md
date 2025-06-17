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
truffle migrate --network development
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

### Compilation
```bash
npm run compile  # Compile contracts
```

### Console Access
```bash
npm run console           # Local console
npm run console:testnet   # Testnet console
npm run console:mainnet   # Mainnet console
```

### Contract Verification
```bash
# Verify all contracts
npm run verify:testnet

# Verify specific contract
npm run verify:contract -- --contract=NFTContract --network=testnet
```

### Flatten Contracts
```bash
npm run flatten  # Creates flattened.sol for verification
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