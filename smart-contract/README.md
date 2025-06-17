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

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

## Deployment

### Local Development (Ganache)

1. Start Ganache on port 8545:
```bash
ganache-cli
```

2. Deploy contracts:
```bash
truffle migrate --network development
```

### Testnet Deployment

1. Ensure your `.env` file has valid `MNEMONIC` and `INFURA_KEY` values

2. Deploy to Sepolia:
```bash
truffle migrate --network sepolia
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
truffle test
```

## Security Considerations

1. **Reentrancy Protection**: Payment functions use checks-effects-interactions pattern
2. **Access Control**: Every cross-contract call validates permissions
3. **Lock State Management**: NFTs cannot be transferred/burned while locked
4. **Payment Protection**: Paid users cannot have access revoked
5. **Commitment Validation**: Functions revert if commitment/notice not set

## License

MIT