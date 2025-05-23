# Sui NFT Contract with Seal Integration - Deployment Guide

This comprehensive guide will walk you through deploying the NFT contract with Seal integration on Sui Testnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Sui CLI Installation](#sui-cli-installation)
4. [Account Creation and Funding](#account-creation-and-funding)
5. [Project Structure Setup](#project-structure-setup)
6. [Contract Compilation](#contract-compilation)
7. [Contract Deployment](#contract-deployment)
8. [Contract Initialization](#contract-initialization)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Git**: For cloning repositories
- **Node.js**: Version 18+ (for frontend integration)
- **Python**: Version 3.8+ (for backend integration)
- **Basic understanding**: Move language basics and blockchain concepts

## Environment Setup

### 1. Install Required Tools

#### Install Git (if not already installed)
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install git

# macOS
brew install git

# Windows (use Git Bash or WSL2)
# Download from https://git-scm.com/download/win
```

#### Install Node.js and npm
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify installation
node --version
npm --version
```

#### Install Python and pip
```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip

# macOS
brew install python3

# Verify installation
python3 --version
pip3 --version
```

## Sui CLI Installation

### Option 1: Using Cargo (Recommended)

```bash
# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.bashrc

# Install Sui CLI dependencies
sudo apt update
sudo apt install -y clang libclang-dev llvm-dev
sudo apt install -y librocksdb-dev


# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui

# Install Older Version (if needed)

cargo install --locked --git https://github.com/MystenLabs/sui.git --tag testnet-v1.47.0 sui

```

### Option 2: Using Homebrew (macOS)

```bash
brew install sui
```

### Option 3: Download Pre-built Binary

Visit [Sui Releases](https://github.com/MystenLabs/sui/releases) and download the appropriate binary for your system.

### Verify Installation

```bash
sui --version
```

You should see output similar to:
```
sui 1.15.0-testnet
```

## Account Creation and Funding

### 1. Initialize Sui Configuration

```bash
# Create Sui configuration directory
mkdir -p ~/.sui/sui_config

# Initialize Sui client
sui client
```

On first run, you'll be prompted to create a new wallet. Choose option 1 to create a new wallet.

### 2. Create a New Account

```bash
# Generate a new address
sui client new-address secp256k1

# List your addresses
sui client addresses
```

Save your address and mnemonic phrase securely!

### 3. Switch to Testnet

```bash
# Add testnet environment
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Switch to testnet
sui client switch --env testnet

# Verify you're on testnet
sui client envs
```

### 4. Fund Your Account

```bash
# Request testnet SUI tokens (replace with your address)
sui client faucet --address YOUR_ADDRESS_HERE

# Check your balance
sui client balance
```

You can also use the web faucet: https://discord.gg/sui (go to #testnet-faucet channel)

## Project Structure Setup

### 1. Create Project Directory

```bash
mkdir sui-neural-nft
cd sui-neural-nft
```

### 2. Initialize Move Project

```bash
# Create Move.toml file
cat > Move.toml << EOF
[package]
name = "neuralnft"
version = "0.1.0"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
neuralnft = "0x0"

[dev-dependencies]

[dev-addresses]
EOF
```

### 3. Create Source Directory and Files

```bash
# Create sources directory
mkdir -p sources

# Create the main contract file
# Copy the contract code from the artifact above into sources/nft.move
```

### 4. Create Additional Configuration Files

#### .gitignore
```bash
cat > .gitignore << EOF
# Sui artifacts
build/
.sui/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Node modules (for frontend)
node_modules/
.env
.env.local

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/

# Logs
*.log
logs/
EOF
```

#### README.md
```bash
cat > README.md << EOF
# Neural NFT with Seal Integration

An NFT contract on Sui with integrated decentralized encryption using Seal.

## Features
- NFT creation with 6 levels of access control
- Decentralized encryption using Seal
- Encrypted data storage on Walrus
- Threshold cryptography for secure key management

## Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.
EOF
```

## Contract Compilation

### 1. Update Move.toml with Your Address

```bash
# Get your address
YOUR_ADDRESS=$(sui client active-address)
echo "Your address: $YOUR_ADDRESS"

# Update Move.toml
sed -i "s/neuralnft = \"0x0\"/neuralnft = \"$YOUR_ADDRESS\"/" Move.toml
```

### 2. Compile the Contract

```bash
# Compile the Move package
sui move build

# Check for compilation errors
echo $?  # Should output 0 if successful
```

If compilation is successful, you'll see:
```
BUILDING neuralnft
```

## Contract Deployment

### 1. Deploy to Testnet

```bash
# Deploy the contract
sui client publish --gas-budget 50000000

# Save the output - you'll need the Package ID!
```

### 2. Save Deployment Information

The deployment output will include important information. Save these values:

```bash
# Example output structure:
# Package ID: 0x1234567890abcdef...
# Transaction Digest: H1234567890abcdef...

# Save to environment file
cat > deployment.env << EOF
PACKAGE_ID=YOUR_PACKAGE_ID_HERE
TRANSACTION_DIGEST=YOUR_TRANSACTION_DIGEST_HERE
DEPLOYED_AT=$(date)
DEPLOYER_ADDRESS=$YOUR_ADDRESS
EOF
```

### 3. Verify Deployment

```bash
# Check the package exists
sui client object $PACKAGE_ID

# View the transaction
sui client transaction $TRANSACTION_DIGEST
```

## Contract Initialization

### 1. Create Collection

```bash
# Call the create_collection function
sui client call \
  --package $PACKAGE_ID \
  --module nft \
  --function create_collection \
  --gas-budget 10000000
```

### 2. Save Collection Information

```bash
# The transaction will create a CollectionCap object
# Save the object ID from the transaction output
COLLECTION_CAP_ID=YOUR_COLLECTION_CAP_ID_HERE

# Add to environment file
echo "COLLECTION_CAP_ID=$COLLECTION_CAP_ID" >> deployment.env
```

### 3. Test NFT Creation

```bash
# Create a test NFT
sui client call \
  --package $PACKAGE_ID \
  --module nft \
  --function create_nft \
  --args $COLLECTION_ID "Test NFT" "A test NFT for verification" 6 0x6 \
  --gas-budget 10000000
```

## Verification

### 1. Check Package Information

```bash
# Get package details
sui client object $PACKAGE_ID --json

# Check module functions
sui client package $PACKAGE_ID
```

### 2. Verify Contract Functions

```bash
# List available functions
sui client call --help

# Test read functions (if available)
# This depends on your specific implementation
```

### 3. Check Events

```bash
# Check for NFT creation events
sui client events --package $PACKAGE_ID
```

## Environment Configuration for Integration

### 1. Frontend Environment (.env)

```bash
# Create frontend environment file
cat > frontend.env << EOF
REACT_APP_SUI_NETWORK=testnet
REACT_APP_PACKAGE_ID=$PACKAGE_ID
REACT_APP_COLLECTION_ID=$COLLECTION_ID
REACT_APP_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
REACT_APP_SEAL_NETWORK=testnet
EOF
```

### 2. Backend Environment

```bash
# Create backend environment file
cat > backend.env << EOF
SUI_NETWORK=testnet
PACKAGE_ID=$PACKAGE_ID
COLLECTION_ID=$COLLECTION_ID
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SEAL_NETWORK=testnet
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
EOF
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Compilation Errors

**Error**: `Failed to resolve package dependencies`
```bash
# Solution: Update Sui framework version
sui client update
```

**Error**: `Address 0x0 is not a valid address`
```bash
# Solution: Update Move.toml with your address
YOUR_ADDRESS=$(sui client active-address)
sed -i "s/neuralnft = \"0x0\"/neuralnft = \"$YOUR_ADDRESS\"/" Move.toml
```

#### 2. Deployment Errors

**Error**: `Insufficient gas`
```bash
# Solution: Increase gas budget
sui client publish --gas-budget 100000000
```

**Error**: `Package already exists`
```bash
# Solution: Use upgrade instead of publish (if applicable)
sui client upgrade --package $PACKAGE_ID --gas-budget 50000000
```

#### 3. Funding Issues

**Error**: `Insufficient balance`
```bash
# Solution: Request more tokens from faucet
sui client faucet --address $(sui client active-address)

# Or use Discord faucet
echo "Use Discord faucet: https://discord.gg/sui (#testnet-faucet channel)"
```

#### 4. Network Issues

**Error**: `Connection refused`
```bash
# Solution: Check network configuration
sui client envs
sui client switch --env testnet
```

### Getting Help

1. **Sui Documentation**: https://docs.sui.io/
2. **Sui Discord**: https://discord.gg/sui
3. **Sui GitHub**: https://github.com/MystenLabs/sui
4. **Seal Documentation**: https://github.com/MystenLabs/seal

### Next Steps

After successful deployment:

1. **Frontend Integration**: Set up React frontend with Sui SDK
2. **Backend Integration**: Configure Python backend with Sui Python SDK
3. **Seal Integration**: Configure threshold encryption
4. **Walrus Integration**: Set up encrypted file storage
5. **Testing**: Run comprehensive tests

## Security Considerations

1. **Private Keys**: Never commit private keys or mnemonic phrases to version control
2. **Environment Variables**: Use secure environment variable management
3. **Gas Limits**: Set appropriate gas limits to prevent excessive fees
4. **Access Control**: Verify access control logic before mainnet deployment

## Mainnet Deployment

When ready for mainnet:

1. Switch to mainnet environment:
   ```bash
   sui client new-env --alias mainnet --rpc https://fullnode.mainnet.sui.io:443
   sui client switch --env mainnet
   ```

2. Fund your mainnet account (real SUI required)

3. Deploy with production-ready configurations

4. Perform thorough testing before going live

---

**Warning**: This deployment is on testnet. Do not use real funds or sensitive data. Always test thoroughly before mainnet deployment.