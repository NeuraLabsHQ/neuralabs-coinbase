# NeuraLabs Test App

A React-based test application for the NeuraLabs NFT smart contract with Seal encryption and Walrus storage integration using the official Walrus SDK.

## Features

- **NFT Management**: Create and manage AI workflow NFTs with 6 access levels
- **Access Control**: Grant and revoke access to different users
- **Seal Encryption**: Encrypt/decrypt files using threshold encryption
- **Walrus Storage**: Store encrypted files on decentralized storage using the official SDK
- **Wallet Integration**: Connect with Sui wallets for on-chain interactions

## What's New: Walrus SDK Integration

This test app now uses the official `@mysten/walrus` SDK instead of HTTP API calls, providing:

- **Type-safe API**: Full TypeScript support with proper types
- **Automatic retries**: Built-in retry logic for failed operations
- **Progress tracking**: Monitor upload/download progress for large files
- **Cost estimation**: See storage costs before uploading
- **Native SUI integration**: Seamless integration with SUI wallet for signing

## Prerequisites

- Node.js 16+
- A Sui wallet (Sui Wallet, Ethos, etc.)
- Deployed NeuraLabs contract on Sui testnet
- Test SUI tokens

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your contract addresses
```

### Understanding the Registry ID

The **Registry ID** is a critical component of the NeuraLabs contract system:

- **What it is**: A shared object on Sui blockchain that acts as a global permission database
- **Purpose**: Stores all NFT access permissions in a centralized registry
- **Type**: `AccessRegistry` - a shared object that anyone can read but only NFT owners can modify
- **Structure**: Maps NFT IDs to user permissions (NFT ID → User Address → Access Level)

```
AccessRegistry (Shared Object)
├── ID: 0xb01b33f8...  <-- This is your REGISTRY_ID
└── permissions: Table
    ├── NFT_ID_1 → Table
    │   ├── User_A → Level 6 (owner)
    │   ├── User_B → Level 4 (can download)
    │   └── User_C → Level 1 (can use)
    └── NFT_ID_2 → Table
        ├── User_D → Level 6 (owner)
        └── User_E → Level 2 (can resell)
```

#### How to get your Registry ID:

1. **After deploying the contract**, you must initialize the registry:
```bash
sui client call \
  --package $PACKAGE_ID \
  --module access \
  --function init_registry \
  --gas-budget 10000000
```

2. **Look for the created object** in the transaction output:
```
Created Objects:
  ┌──
  │ ObjectID: 0xb01b33f8038a78532a946b3d9093616cf050f23f...  <-- This is your Registry ID
  │ Owner: Shared
  │ ObjectType: 0x31717ba3482c33f3bfe0bab05b3f509053a206b0::access::AccessRegistry
  └──
```

3. **The Registry ID is**:
   - A shared object (owned by no one, accessible by everyone)
   - Required for ALL access control operations
   - The same for all NFTs in your deployment
   - Must be passed to functions that check or modify permissions

### What values to change in .env:

| Variable | Must Change? | Description |
|----------|--------------|-------------|
| `REACT_APP_PACKAGE_ID` | ✅ YES | Your deployed contract address |
| `REACT_APP_REGISTRY_ID` | ✅ YES | Your AccessRegistry object ID |
| All Walrus URLs | ❌ NO | Official testnet endpoints |
| Walrus System Objects | ❌ NO | Official testnet objects |
| Other settings | ❌ NO | Good defaults |

3. Run the app:
```bash
npm run dev
```

The app will be available at http://localhost:3001

## Component Overview

### ContractInfo
Displays contract deployment information and configuration details.

### NFTManager
- Create NFTs with different access levels
- View your owned NFTs
- Set initial access permissions

### AccessControl
- Grant access to other users (levels 1-6)
- Revoke access from users
- View access control matrix
- Only level 4+ users can decrypt files

### SealEncryption
- Create session keys for decryption
- Encrypt files with threshold encryption
- Decrypt files (requires level 4+ access)
- Support for 1-of-2 and 2-of-2 threshold

### WalrusStorage (SDK Version)
- Upload encrypted files to Walrus using the official SDK
- Link files to NFTs with on-chain metadata
- Track stored files, costs, and storage duration
- Download files directly using blob IDs
- Real-time status of SDK initialization
- Support for configurable storage epochs

## Access Levels

1. **USE_MODEL** - Basic usage rights
2. **RESALE** - Can resell the NFT
3. **CREATE_REPLICA** - Can create copies
4. **VIEW_DOWNLOAD** - Can decrypt files (minimum for Seal)
5. **EDIT_DATA** - Can modify encrypted data
6. **ABSOLUTE_OWNERSHIP** - Full control

## Testing Workflow

1. **Connect Wallet**: Connect your Sui wallet
2. **Create NFT**: Go to NFT Manager and create an NFT with level 6
3. **Grant Access**: In Access Control, grant level 4+ to test users
4. **Encrypt File**: Use Seal Encryption to encrypt a test file
5. **Upload to Walrus**: Store the encrypted file on Walrus
6. **Test Decryption**: Create session key and decrypt as authorized user

## Security Notes

- Only users with level 4+ access can decrypt files
- Session keys expire after the set TTL (default 60 minutes)
- Encrypted files are stored on Walrus with references in NFTs
- Threshold encryption ensures no single point of failure

## Troubleshooting

### "Package not found" error
- Ensure VITE_PACKAGE_ID is set correctly in .env
- Verify the contract is deployed on testnet

### "Insufficient gas" error
- Get more test SUI from the faucet
- Increase gas budget in transaction calls

### Decryption fails
- Verify you have level 4+ access to the NFT
- Ensure session key is active
- Check that the NFT token ID matches

## Development

### Project Structure
```
src/
├── components/       # React components
│   ├── ContractInfo.jsx
│   ├── NFTManager.jsx
│   ├── AccessControl.jsx
│   ├── SealEncryption.jsx
│   ├── WalrusStorage.jsx    # SDK version (new)
│   └── WalrusStorage.old.jsx # HTTP API version (legacy)
├── App.jsx          # Main app component
├── main.jsx         # Entry point
└── index.css        # Styles
```

### Walrus SDK Usage

The new WalrusStorage component uses the official `@mysten/walrus` SDK:

```javascript
import { WalrusClient } from '@mysten/walrus'

// Initialize client
const walrusClient = new WalrusClient({
  network: 'testnet',
  suiClient: suiClient
})

// Upload file
const result = await walrusClient.writeBlob({
  blob: fileData,
  deletable: false,
  epochs: 5,
  signer: keypair
})

// Download file
const data = await walrusClient.readBlob({ 
  blobId: 'your-blob-id' 
})
```

### Adding Features
- Components are modular and can be copied to main app
- Each component is self-contained with its own state
- Uses @mysten/dapp-kit for Sui integration
- Tailwind CSS for styling

## Resources

- [Sui Documentation](https://docs.sui.io)
- [Seal Documentation](https://github.com/MystenLabs/seal)
- [Walrus Documentation](https://docs.wal.app)
- [NeuraLabs Contract](../source/neuralabs.move)