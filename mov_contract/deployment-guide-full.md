# NeuraLabs NFT Deployment Guide for Sui

This guide provides comprehensive instructions for deploying the NeuraLabs NFT smart contract on Sui testnet, including account setup, contract deployment, and integration with Seal for encrypted data management.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setting Up Sui Environment](#setting-up-sui-environment)
3. [Account Creation and Configuration](#account-creation-and-configuration)
4. [Contract Deployment](#contract-deployment)
5. [Seal Integration Setup](#seal-integration-setup)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Testing the Deployment](#testing-the-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:
- Node.js (v16 or higher)
- Python 3.12+ with conda environment
- Git
- A code editor (VS Code recommended)
- Basic understanding of blockchain concepts

## Setting Up Sui Environment

### 1. Install Sui CLI

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Sui
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### 2. Verify Installation

```bash
sui --version
# Should output: sui x.x.x
```

## Account Creation and Configuration

### 1. Create a New Sui Account

```bash
# Generate a new address
sui client new-address ed25519

# Example output:
# Created new address with alias: <alias>: 0x1234...abcd
# Secret Recovery Phrase: [word1] [word2] ... [word12]
```

**IMPORTANT**: Save your recovery phrase in a secure location. You'll need it to recover your account.

### 2. Configure Sui Client

```bash
# Set up client for testnet
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Switch to testnet
sui client switch --env testnet

# Verify active address
sui client active-address
```

### 3. Get Test SUI Tokens

```bash
# Request test tokens from faucet
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "<YOUR_SUI_ADDRESS>"
    }
}'

# Check balance
sui client gas
```

## Contract Deployment

### 1. Prepare the Contract

```bash
cd mov_contract

# Update Move.toml with your address
# Replace "0x0" with your actual address in the [addresses] section
sed -i 's/neuralnft = "0x0"/neuralnft = "<YOUR_SUI_ADDRESS>"/' Move.toml
```

### 2. Build the Contract

```bash
# Build the package
sui move build

# Expected output:
# BUILDING NeuraLabsNFT
# Successfully verified dependencies on-chain against source.
# Build Successful
```

### 3. Deploy the Contract

```bash
# Deploy with sufficient gas budget
sui client publish --gas-budget 100000000

# Save the output! You'll see:
# ----- Transaction Effects ----
# Status: Success
# Created Objects:
#   - ID: 0x... , Owner: Immutable (Package ID)
#   - ID: 0x... , Owner: Account Address (UpgradeCap)
```

Save the Package ID - you'll need it for all interactions with the contract.

### 4. Set Environment Variables

Create a `.env` file in your project root:

```bash
# Contract addresses
PACKAGE_ID=0x... # Your deployed package ID
NEURALNFT_MODULE=nft

# Seal integration
SEAL_PACKAGE_ID=0x62c79dfeb0a2ca8c308a56bde530ccf3846535e1623949d45c90d23128afff52
MYSTEN_KEY_SERVER_1=https://seal-key-server-testnet-1.mystenlabs.com
MYSTEN_KEY_SERVER_2=https://seal-key-server-testnet-2.mystenlabs.com

# Network
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

## Seal Integration Setup

### 1. Understanding Seal Key Servers

Seal uses threshold encryption with multiple key servers. For testing, we'll use Mysten Labs' testnet servers:
- Server 1: Object ID `0x13a86a87ab1bf3a2e81b3c13b2e7a3b0db8b3c4d5e6f708192a3b4c5d6e7f809`
- Server 2: Object ID `0x23b97b98bc2cf4a3f92c4d14c3f8b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6`

### 2. Initialize NFT Collection

```bash
# Create Python script for initialization
cd old_contracts_and_scripts
python3 << 'EOF'
import subprocess
import json

# Initialize collection
cmd = f"sui client call --package {PACKAGE_ID} --module nft --function create_collection --gas-budget 10000000"
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(result.stdout)

# Parse the output to get CollectionCap object ID
# Save this ID - you'll need it for admin operations
EOF
```

### 3. Configure Access Control

The contract implements 6 levels of access:
1. **USE_MODEL** - Basic usage rights
2. **RESALE** - Can resell the NFT
3. **CREATE_REPLICA** - Can create copies
4. **VIEW_DOWNLOAD** - Can decrypt and download files (minimum for Seal decryption)
5. **EDIT_DATA** - Can modify encrypted data
6. **ABSOLUTE_OWNERSHIP** - Full control

Only levels 4 and above can decrypt files using Seal.

## Post-Deployment Configuration

### 1. Create Helper Scripts

Create `scripts/contract_interaction.py`:

```python
#!/usr/bin/env python3
import os
import json
import subprocess
from typing import Dict, Any

class NeuraLabsContract:
    def __init__(self, package_id: str):
        self.package_id = package_id
        self.module = "nft"
    
    def create_nft(self, name: str, description: str, level: int, collection_id: str):
        """Create a new NFT"""
        cmd = [
            "sui", "client", "call",
            "--package", self.package_id,
            "--module", self.module,
            "--function", "create_nft",
            "--args", collection_id, f'"{name}"', f'"{description}"', str(level), "0x6",  # clock object
            "--gas-budget", "10000000"
        ]
        return self._execute_command(cmd)
    
    def grant_access(self, collection_id: str, token_id: int, user: str, level: int):
        """Grant access to a user"""
        cmd = [
            "sui", "client", "call",
            "--package", self.package_id,
            "--module", self.module,
            "--function", "grant_access",
            "--args", collection_id, str(token_id), user, str(level), "0x6",
            "--gas-budget", "10000000"
        ]
        return self._execute_command(cmd)
    
    def _execute_command(self, cmd: list) -> Dict[str, Any]:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Command failed: {result.stderr}")
        return json.loads(result.stdout)

# Usage example
if __name__ == "__main__":
    contract = NeuraLabsContract(os.getenv("PACKAGE_ID"))
    # Create NFT, grant access, etc.
```

### 2. Set Up Walrus Storage

For storing encrypted files, you'll need to:
1. Set up a Walrus storage node or use a public endpoint
2. Upload encrypted files and get blob IDs
3. Store blob IDs in the NFT's encrypted data

### 3. Configure Frontend Integration

Update your React app configuration:

```javascript
// src/config/sui.config.js
export const SUI_CONFIG = {
  PACKAGE_ID: process.env.REACT_APP_PACKAGE_ID,
  COLLECTION_ID: process.env.REACT_APP_COLLECTION_ID,
  NETWORK: 'testnet',
  RPC_URL: 'https://fullnode.testnet.sui.io:443',
  
  // Seal configuration
  SEAL: {
    KEY_SERVERS: [
      {
        name: 'mysten-testnet-1',
        url: 'https://seal-key-server-testnet-1.mystenlabs.com',
        objectId: '0x...' // From key server registration
      },
      {
        name: 'mysten-testnet-2', 
        url: 'https://seal-key-server-testnet-2.mystenlabs.com',
        objectId: '0x...' // From key server registration
      }
    ],
    THRESHOLD: 1, // 1-out-of-2 for testing
  }
};
```

## Testing the Deployment

### 1. Create Test NFT

```bash
# Using Sui CLI
sui client call \
  --package $PACKAGE_ID \
  --module nft \
  --function create_nft \
  --args $COLLECTION_ID '"AI Workflow Test"' '"Test workflow for deployment"' 6 0x6 \
  --gas-budget 10000000
```

### 2. Test Access Control

```python
# test_access.py
from scripts.contract_interaction import NeuraLabsContract

contract = NeuraLabsContract(package_id)

# Create NFT with level 6 (absolute ownership)
nft_result = contract.create_nft(
    "Test Workflow",
    "Testing access control",
    6,
    collection_id
)

# Grant level 4 access to another user (can decrypt)
contract.grant_access(
    collection_id,
    token_id=1,
    user="0xuser_address",
    level=4
)
```

### 3. Test Seal Encryption

```javascript
// test_seal.js
import { SealClient } from '@mysten/seal';
import { SuiClient } from '@mysten/sui.js/client';

async function testSealEncryption() {
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
  const sealClient = new SealClient({
    suiClient: client,
    serverObjectIds: [SERVER_1_ID, SERVER_2_ID],
    verifyKeyServers: true
  });

  // Encrypt data
  const data = new TextEncoder().encode('Secret workflow data');
  const { encryptedObject, key } = await sealClient.encrypt({
    threshold: 1,
    packageId: PACKAGE_ID,
    id: TOKEN_ID_BYTES, // 8 bytes for token ID + nonce
    data
  });

  console.log('Encrypted successfully:', encryptedObject);
  console.log('Backup key:', key);
}
```

## Troubleshooting

### Common Issues

1. **Insufficient gas**: Increase gas budget in commands
   ```bash
   --gas-budget 200000000
   ```

2. **Package not found**: Ensure you're using the correct package ID and it's deployed

3. **Seal key server errors**: 
   - Check network connectivity
   - Verify key server URLs are correct
   - Ensure threshold is not higher than available servers

4. **Access denied errors**:
   - Verify user has correct access level (≥4 for decryption)
   - Check NFT ownership and access grants

### Debug Commands

```bash
# Check package info
sui client object $PACKAGE_ID

# Check collection state
sui client object $COLLECTION_ID --json

# View transaction
sui client transaction $TX_DIGEST --json
```

### Getting Help

- Sui Discord: https://discord.gg/sui
- Seal Discord Channel: #seal-support
- GitHub Issues: https://github.com/MystenLabs/seal/issues

## Next Steps

1. Review the [Architecture Guide](architecture-guide.md) for system design
2. Check the [Testing Guide](testing-guide.md) for comprehensive testing
3. Deploy the React test app for UI testing
4. Set up monitoring and logging for production