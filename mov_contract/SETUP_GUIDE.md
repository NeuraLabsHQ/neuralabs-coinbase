# NeuraLabs NFT Contract Setup Guide

## Contract Deployment ✅

The contract has been successfully deployed to Sui Testnet!

**Package ID**: `0x926de4be791b165822a8a213540c0606bb0d52450e5f8b6531097d9cd2c4dc64`

## Next Steps

### 1. Initialize the AccessRegistry

The AccessRegistry is required for managing user permissions. Run:

```bash
cd scripts
python initialize.py
```

This will create the AccessRegistry and update the configuration files.

### 2. Run Test Scripts

Test the contract functionality:

```bash
cd scripts
python test_new_contract.py
```

### 3. Start the React Test App

```bash
cd test-app
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Contract Architecture

The simplified contract consists of 4 modules:

1. **nft** - NFT creation and management
2. **access** - Access control with 6 permission levels
3. **storage** - Encrypted data storage integration with Walrus
4. **utils** - Helper functions

## Key Changes from Previous Version

- Removed the collection concept - NFTs are created directly
- Simplified access control - no more nested tables
- Better Seal integration following the official examples
- Modular structure for easier maintenance

## Access Levels

1. **USE_MODEL** - Basic usage rights
2. **RESALE** - Can resell the NFT
3. **CREATE_REPLICA** - Can create copies
4. **VIEW_DOWNLOAD** - Can decrypt files (minimum for Seal)
5. **EDIT_DATA** - Can modify encrypted data
6. **ABSOLUTE_OWNERSHIP** - Full control

## Important Notes

- Users need level 4 or above to decrypt files stored on Walrus
- The `seal_approve` function follows Seal's pattern for access control
- All encrypted data is stored as dynamic fields on the NFT