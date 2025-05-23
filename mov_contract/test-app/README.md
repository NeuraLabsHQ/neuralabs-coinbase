# NeuraLabs Test App

A React-based test application for the NeuraLabs NFT smart contract with Seal encryption and Walrus storage integration.

## Features

- **NFT Management**: Create and manage AI workflow NFTs with 6 access levels
- **Access Control**: Grant and revoke access to different users
- **Seal Encryption**: Encrypt/decrypt files using threshold encryption
- **Walrus Storage**: Store encrypted files on decentralized storage
- **Wallet Integration**: Connect with Sui wallets for on-chain interactions

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

### WalrusStorage
- Upload encrypted files to Walrus
- Link files to NFTs
- Track stored files and metadata
- Generate Walrus blob IDs

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
│   └── WalrusStorage.jsx
├── App.jsx          # Main app component
├── main.jsx         # Entry point
└── index.css        # Styles
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