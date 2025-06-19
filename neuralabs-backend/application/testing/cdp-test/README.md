# CDP Wallet Test Suite

This directory contains comprehensive tests for the Coinbase Developer Platform (CDP) SDK wallet operations.

## Overview

The test suite demonstrates and validates various wallet operations available in the CDP SDK:

1. **Account Management**
   - Create new EVM accounts
   - Get accounts by address or name
   - List all accounts
   - Update account properties

2. **Import/Export**
   - Import existing accounts using private keys
   - Export account private keys

3. **Blockchain Operations**
   - Request test tokens from faucet
   - Sign messages
   - Send transactions
   - List token balances

4. **Smart Accounts**
   - Create smart accounts with owners
   - Manage smart account operations

## Prerequisites

### Environment Variables

Create a `.env` file in this directory with the following variables:

```env
CDP_API_KEY_ID=your_api_key_id
CDP_API_KEY_SECRET=your_api_key_secret
CDP_WALLET_SECRET=your_wallet_secret
```

### Dependencies

Install the required packages:

```bash
pip install cdp-sdk python-dotenv pytest pytest-asyncio eth-account web3
```

## Running the Tests

### Basic Usage

Run all tests:

```bash
python cdp-wallet-test.py
```

### Test Output

The test suite will:
- Display real-time test results with ✅ PASS or ❌ FAIL indicators
- Show detailed information for each test
- Generate a summary report at the end
- Save detailed results to a JSON file with timestamp

### Example Output

```
CDP Wallet Test Suite
============================================================

✅ CDP Client initialized successfully

✅ PASS - Create EVM Account
   Details: Created account: 0x123... (name: cdp-wallet-abc123)

✅ PASS - Get EVM Account
   Details: Retrieved by address: 0x123...

✅ PASS - List EVM Accounts
   Details: Found 5 accounts
   Account 1: 0x123... (name: cdp-wallet-abc123)
   Account 2: 0x456... (name: test-wallet)
   ...

Test Summary
============================================================
Total tests: 11
Passed: 10
Failed: 1
Success rate: 90.9%

Detailed results saved to: cdp_test_results_20240119_143052.json
```

## Test Descriptions

### 1. Create EVM Account
Creates a new EVM account with a random name. Returns the account object with address and name.

### 2. Get EVM Account
Retrieves an existing account by either address or name. Validates that the account exists.

### 3. List EVM Accounts
Lists all accounts with pagination support. Shows the first few accounts as examples.

### 4. Import EVM Account
- Generates a local Ethereum account
- Imports it to CDP using the private key
- Verifies the imported address matches the original

### 5. Export EVM Account
- Exports the private key for an account
- Validates the key by recovering the address

### 6. Request Faucet
Requests test ETH from the faucet on the Base Sepolia testnet.

### 7. Sign Message
Signs a test message with the account's private key.

### 8. Send Transaction
Sends a small test transaction (0.001 ETH) to a random address.

### 9. List Token Balances
Lists all token balances for an account on the specified network.

### 10. Smart Account Operations
- Creates a smart account with an owner
- Demonstrates smart account functionality

### 11. Update Account
Updates account properties (e.g., name) and verifies the changes.

## Network Configuration

The test suite uses the Base Sepolia testnet by default. You can modify the network by changing:

```python
self.test_network = "base-sepolia"  # Change to your preferred network
```

## Error Handling

Each test includes comprehensive error handling:
- API errors are caught and logged
- Test failures don't stop the entire suite
- Detailed error messages are saved in the results file

## Extending the Tests

To add new tests:

1. Create a new async method in the `CDPWalletTester` class:
   ```python
   async def test_new_feature(self):
       test_name = "New Feature Test"
       try:
           # Your test logic here
           self.log_result(test_name, True, "Success details")
       except Exception as e:
           self.log_result(test_name, False, error=e)
   ```

2. Add the test to the `run_all_tests` method:
   ```python
   await self.test_new_feature()
   ```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required variables are set in `.env`
   - Check variable names match exactly

2. **Network Errors**
   - Verify your API credentials are valid
   - Check network connectivity
   - Ensure the CDP service is accessible

3. **Insufficient Balance**
   - Request tokens from faucet before sending transactions
   - Wait for faucet transaction to confirm

4. **Rate Limiting**
   - Add delays between tests if hitting rate limits
   - Reduce page sizes for list operations

## CDP SDK Structure

Based on the SDK analysis, here are the key components:

### Core Classes
- `CdpClient`: Main client for interacting with CDP
- `EvmClient`: EVM-specific operations (accessed via `client.evm`)
- `EvmServerAccount`: Server-managed account
- `EvmLocalAccount`: Local account wrapper for signing
- `EvmSmartAccount`: Smart contract accounts

### Key Methods
- Account Management: `create_account`, `get_account`, `list_accounts`, `update_account`
- Import/Export: `import_account`, `export_account`
- Transactions: `send_transaction`, `sign_message`, `sign_transaction`
- Token Operations: `list_token_balances`, `request_faucet`
- Smart Accounts: `create_smart_account`, `send_user_operation`

### Transaction Types
- `TransactionRequestEIP1559`: EIP-1559 transaction format
- `ContractCall`: For contract interactions
- `EncodedCall`: Pre-encoded contract calls

## Additional Resources

- [CDP SDK Documentation](https://docs.cdp.coinbase.com/)
- [Base Network Documentation](https://docs.base.org/)
- [Ethereum Development Docs](https://ethereum.org/developers/)