#!/usr/bin/env python3
"""
CDP Wallet Test Suite
=====================

This test suite demonstrates various wallet operations using the Coinbase Developer Platform (CDP) SDK.

Prerequisites:
- Set environment variables: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET
- Install required packages: pip install cdp-sdk python-dotenv pytest pytest-asyncio eth-account web3

Usage:
    python cdp-wallet-test.py
"""

import os
import asyncio
import json
from datetime import datetime
from typing import Optional, Dict, Any
from decimal import Decimal
import random
import string

# Third-party imports
from dotenv import load_dotenv
from eth_account import Account
from web3 import Web3

# CDP SDK imports
from cdp import CdpClient
from cdp.evm_transaction_types import TransactionRequestEIP1559
from cdp.evm_call_types import FunctionCall, ContractCall
from cdp.openapi_client.errors import ApiError

# Load environment variables
load_dotenv()


class CDPWalletTester:
    """Test suite for CDP wallet operations."""
    
    def __init__(self):
        """Initialize the CDP client and test configuration."""
        self.client = None
        self.test_network = "base-sepolia"  # Using Base Sepolia testnet
        self.test_results = []
        
    async def setup(self):
        """Set up the CDP client."""
        try:
            # Initialize CDP client with environment variables
            self.client = CdpClient(
                api_key_id=os.getenv("CDP_API_KEY_ID"),
                api_key_secret=os.getenv("CDP_API_KEY_SECRET"),
                wallet_secret=os.getenv("CDP_WALLET_SECRET")
            )
            print(" CDP Client initialized successfully")
            return True
        except Exception as e:
            print(f"L Failed to initialize CDP Client: {e}")
            return False
    
    async def cleanup(self):
        """Clean up resources."""
        if self.client:
            await self.client.close()
            print(" CDP Client closed")
    
    def generate_random_name(self, prefix: str = "test") -> str:
        """Generate a random name for test accounts."""
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"{prefix}-{suffix}"
    
    def log_result(self, test_name: str, success: bool, details: str = "", error: Exception = None):
        """Log test results."""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": str(error) if error else None,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = " PASS" if success else "L FAIL"
        print(f"\n{status} - {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
    
    async def test_create_account(self) -> Optional[Any]:
        """Test 1: Create a new EVM account."""
        test_name = "Create EVM Account"
        try:
            account_name = self.generate_random_name("cdp-wallet")
            account = await self.client.evm.create_account(name=account_name)
            
            self.log_result(
                test_name, 
                True, 
                f"Created account: {account.address} (name: {account_name})"
            )
            return account
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_get_account(self, address: str = None, name: str = None) -> Optional[Any]:
        """Test 2: Get an existing account by address or name."""
        test_name = "Get EVM Account"
        try:
            if address:
                account = await self.client.evm.get_account(address=address)
                details = f"Retrieved by address: {address}"
            elif name:
                account = await self.client.evm.get_account(name=name)
                details = f"Retrieved by name: {name}"
            else:
                raise ValueError("Either address or name must be provided")
            
            self.log_result(test_name, True, details)
            return account
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_list_accounts(self) -> Optional[list]:
        """Test 3: List all EVM accounts."""
        test_name = "List EVM Accounts"
        try:
            response = await self.client.evm.list_accounts(page_size=10)
            accounts = response.accounts
            
            self.log_result(
                test_name, 
                True, 
                f"Found {len(accounts)} accounts"
            )
            
            # Print first few accounts
            for i, account in enumerate(accounts[:3]):
                print(f"   Account {i+1}: {account.address} (name: {account.name})")
            
            return accounts
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_import_account(self) -> Optional[Any]:
        """Test 4: Import an existing account using private key."""
        test_name = "Import EVM Account"
        try:
            # Generate a new account locally
            local_account = Account.create()
            private_key = local_account.key.hex()
            account_name = self.generate_random_name("imported")
            
            # Import it to CDP
            imported_account = await self.client.evm.import_account(
                private_key=private_key,
                name=account_name
            )
            
            self.log_result(
                test_name,
                True,
                f"Imported account: {imported_account.address} (expected: {local_account.address})"
            )
            
            # Verify addresses match
            if imported_account.address.lower() != local_account.address.lower():
                raise ValueError("Imported address doesn't match expected address")
            
            return imported_account
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_export_account(self, account) -> Optional[str]:
        """Test 5: Export account private key."""
        test_name = "Export EVM Account"
        try:
            # Export by address
            private_key = await self.client.evm.export_account(address=account.address)
            
            # Verify the exported key works
            recovered_account = Account.from_key(private_key)
            
            self.log_result(
                test_name,
                True,
                f"Exported private key for {account.address}"
            )
            
            if recovered_account.address.lower() != account.address.lower():
                raise ValueError("Exported key doesn't match account address")
            
            return private_key
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_request_faucet(self, address: str) -> Optional[str]:
        """Test 6: Request test tokens from faucet."""
        test_name = "Request Faucet"
        try:
            tx_hash = await self.client.evm.request_faucet(
                address=address,
                network=self.test_network,
                token="eth"  # Request ETH on testnet
            )
            
            self.log_result(
                test_name,
                True,
                f"Faucet transaction: {tx_hash}"
            )
            
            return tx_hash
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_sign_message(self, account) -> Optional[str]:
        """Test 7: Sign a message with the account."""
        test_name = "Sign Message"
        try:
            message = "Hello from CDP SDK test suite!"
            signature = await self.client.evm.sign_message(
                address=account.address,
                message=message
            )
            
            self.log_result(
                test_name,
                True,
                f"Signed message, signature: {signature[:20]}..."
            )
            
            return signature
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_send_transaction(self, from_account, to_address: str = None) -> Optional[str]:
        """Test 8: Send a transaction."""
        test_name = "Send Transaction"
        try:
            # Use a random address if none provided
            if not to_address:
                to_address = Account.create().address
            
            # Create transaction request
            transaction = TransactionRequestEIP1559(
                to=to_address,
                value=1000000000000000,  # 0.001 ETH in wei
                data="0x",  # Empty data for simple transfer
            )
            
            tx_hash = await self.client.evm.send_transaction(
                address=from_account.address,
                transaction=transaction,
                network=self.test_network
            )
            
            self.log_result(
                test_name,
                True,
                f"Transaction sent: {tx_hash}"
            )
            
            return tx_hash
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_list_token_balances(self, address: str) -> Optional[list]:
        """Test 9: List token balances for an address."""
        test_name = "List Token Balances"
        try:
            result = await self.client.evm.list_token_balances(
                address=address,
                network=self.test_network,
                page_size=10
            )
            
            balances = result.token_balances
            self.log_result(
                test_name,
                True,
                f"Found {len(balances)} token balances"
            )
            
            # Print balances
            for balance in balances[:5]:
                print(f"   Token: {balance.token.symbol} - Balance: {balance.amount}")
            
            return balances
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_smart_account(self, owner_account) -> Optional[Any]:
        """Test 10: Create and use a smart account."""
        test_name = "Smart Account Operations"
        try:
            # Create a local account to act as owner
            from cdp.evm_local_account import EvmLocalAccount
            local_owner = EvmLocalAccount(owner_account)
            
            # Create smart account
            smart_account_name = self.generate_random_name("smart")
            smart_account = await self.client.evm.create_smart_account(
                owner=local_owner,
                name=smart_account_name
            )
            
            self.log_result(
                test_name,
                True,
                f"Created smart account: {smart_account.address} (owner: {owner_account.address})"
            )
            
            return smart_account
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_update_account(self, account) -> Optional[Any]:
        """Test 11: Update account properties."""
        test_name = "Update Account"
        try:
            from cdp.update_account_types import UpdateAccountOptions
            
            new_name = self.generate_random_name("updated")
            update_options = UpdateAccountOptions(name=new_name)
            
            updated_account = await self.client.evm.update_account(
                address=account.address,
                update=update_options
            )
            
            self.log_result(
                test_name,
                True,
                f"Updated account name from '{account.name}' to '{updated_account.name}'"
            )
            
            return updated_account
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def run_all_tests(self):
        """Run all wallet tests."""
        print("\n" + "="*60)
        print("CDP Wallet Test Suite")
        print("="*60)
        
        # Setup
        if not await self.setup():
            print("Failed to set up CDP client. Exiting.")
            return
        
        try:
            # Test 1: Create account
            account = await self.test_create_account()
            if not account:
                print("
                      Skipping remaining tests due to account creation failure")
                return
            
            # Test 2: Get account
            await self.test_get_account(address=account.address)
            await self.test_get_account(name=account.name)
            
            # Test 3: List accounts
            await self.test_list_accounts()
            
            # Test 4: Import account
            imported_account = await self.test_import_account()
            
            # Test 5: Export account
            if imported_account:
                await self.test_export_account(imported_account)
            
            # Test 6: Request faucet
            await self.test_request_faucet(account.address)
            
            # Wait a bit for faucet transaction
            print("\n� Waiting 5 seconds for faucet transaction...")
            await asyncio.sleep(5)
            
            # Test 7: Sign message
            await self.test_sign_message(account)
            
            # Test 8: Send transaction (may fail if no balance)
            await self.test_send_transaction(account)
            
            # Test 9: List token balances
            await self.test_list_token_balances(account.address)
            
            # Test 10: Smart account
            await self.test_smart_account(account)
            
            # Test 11: Update account
            await self.test_update_account(account)
            
        finally:
            await self.cleanup()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary."""
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["success"])
        failed = total - passed
        
        print(f"Total tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\nFailed tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['error']}")
        
        # Save results to file
        results_file = f"cdp_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\nDetailed results saved to: {results_file}")


async def main():
    """Main entry point."""
    # Check for required environment variables
    required_vars = ["CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "CDP_WALLET_SECRET"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("L Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment")
        return
    
    # Run tests
    tester = CDPWalletTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())