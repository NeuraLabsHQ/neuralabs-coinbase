#!/usr/bin/env python3
"""
CDP Wallet Test Suite
=====================

This test suite demonstrates wallet operations using the Coinbase Developer Platform (CDP) SDK.
Tests include:
1. Create a wallet
2. Create a wallet with a name  
3. Get wallet address and details by name
4. Export wallet private key
5. List all wallets for specific API key

Usage:
    python cdp-wallet-test-simple.py
"""

import os
import sys
import asyncio
import json
import yaml
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime


# CDP SDK imports
from cdp import CdpClient


class CDPWalletTester:
    """Test suite for CDP wallet operations."""
    
    def __init__(self):
        """Initialize the CDP client and test configuration."""
        self.client = None
        self.config = None
        self.test_results = []
        self.created_wallets = []  # Track created wallets for cleanup
        self.api_key = None
        self.api_secret = None
        self.wallet_secret = None
        
    def load_config(self) -> bool:
        """Load configuration from config.yaml."""
        try:
            config_path = Path(__file__).parent.parent.parent.parent / "config.yaml"
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
            
            # Extract Coinbase secrets
            self.api_key = self.config['coinbase_secrets']['api_key']
            self.api_secret = self.config['coinbase_secrets']['api_secret']
            self.wallet_secret = self.config['coinbase_secrets']['wallet_secret']
            
            print("✅ Configuration loaded successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to load configuration: {e}")
            return False
    
    async def setup(self):
        """Set up the CDP client."""
        try:
            # Load configuration
            if not self.load_config():
                return False
            
            # Initialize CDP client
            self.client = CdpClient(
                api_key_id=self.api_key,
                api_key_secret=self.api_secret,
                wallet_secret=self.wallet_secret
            )
            print("✅ CDP Client initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize CDP Client: {e}")
            return False
    
    async def cleanup(self):
        """Clean up resources."""
        if self.client:
            await self.client.close()
            print("✅ CDP Client closed")
    
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
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} - {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
    
    async def test_create_wallet(self) -> Optional[Any]:
        """Test 1: Create a wallet without a name."""
        test_name = "Create Wallet (no name)"
        try:
            # Create wallet without specifying a name
            wallet = await self.client.evm.create_account()
            self.created_wallets.append(wallet)
            
            self.log_result(
                test_name, 
                True, 
                f"Created wallet with address: {wallet.address}"
            )
            
            # Print wallet details
            print(f"   Address: {wallet.address}")
            print(f"   Name: {wallet.name if wallet.name else 'None'}")
            print(f"   ID: {wallet.id if hasattr(wallet, 'id') else 'N/A'}")
            
            return wallet
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_create_wallet_with_name(self, name: str = "test-wallet-001") -> Optional[Any]:
        """Test 2: Create a wallet with a specific name."""
        test_name = "Create Wallet with Name"
        try:
            # Create wallet with a specific name
            wallet = await self.client.evm.create_account(name=name)
            self.created_wallets.append(wallet)
            
            self.log_result(
                test_name, 
                True, 
                f"Created wallet '{name}' with address: {wallet.address}"
            )
            
            # Print wallet details
            print(f"   Address: {wallet.address}")
            print(f"   Name: {wallet.name}")
            print(f"   ID: {wallet.id if hasattr(wallet, 'id') else 'N/A'}")
            
            return wallet
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_get_wallet_by_name(self, name: str) -> Optional[Any]:
        """Test 3: Get wallet address and details by name."""
        test_name = "Get Wallet by Name"
        try:
            # Get wallet by name
            wallet = await self.client.evm.get_account(name=name)
            
            self.log_result(
                test_name, 
                True, 
                f"Retrieved wallet '{name}'"
            )
            
            # Print wallet details
            print(f"   Address: {wallet.address}")
            print(f"   Name: {wallet.name}")
            print(f"   ID: {wallet.id if hasattr(wallet, 'id') else 'N/A'}")
            
            # If wallet has additional properties, print them
            if hasattr(wallet, '__dict__'):
                for key, value in wallet.__dict__.items():
                    if key not in ['address', 'name', 'id', '_client']:
                        print(f"   {key}: {value}")
            
            return wallet
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_export_private_key(self, wallet) -> Optional[str]:
        """Test 4: Export the private key of a wallet."""
        test_name = "Export Wallet Private Key"
        try:
            # Export private key by address
            private_key = await self.client.evm.export_account(address=wallet.address)
            
            self.log_result(
                test_name,
                True,
                f"Exported private key for wallet {wallet.address}"
            )
            
            print(f"   Wallet Address: {wallet.address}")
            print(f"   Private Key: {private_key[:10]}...{private_key[-10:]}")  # Show partial key for security
            print(f"   Key Length: {len(private_key)} characters")
            
            # To verify the key works, we could re-import it
            # But for testing purposes, we'll just check the format
            is_valid_format = len(private_key) == 64 and all(c in '0123456789abcdefABCDEF' for c in private_key)
            print(f"   Valid Hex Format: {is_valid_format}")
            
            return private_key
        except Exception as e:
            self.log_result(test_name, False, error=e)
            return None
    
    async def test_list_all_wallets(self) -> Optional[List[Any]]:
        """Test 5: List all wallets created for specific API key."""
        test_name = "List All Wallets"
        try:
            # List all wallets
            all_wallets = []
            page_size = 50
            page_token = None
            
            while True:
                response = await self.client.evm.list_accounts(
                    page_size=page_size,
                    page_token=page_token
                )
                
                if not response.accounts:
                    break
                
                all_wallets.extend(response.accounts)
                
                # Check if there's a next page
                page_token = response.next_page_token if hasattr(response, 'next_page_token') else None
                if not page_token:
                    break
            
            self.log_result(
                test_name, 
                True, 
                f"Found {len(all_wallets)} wallets for API key: {self.api_key[:10]}..."
            )
            
            # Print wallet summary
            print(f"\n   Total wallets: {len(all_wallets)}")
            print("   First 10 wallets:")
            for i, wallet in enumerate(all_wallets[:10]):
                print(f"     {i+1}. {wallet.address} - Name: {wallet.name if wallet.name else 'No name'}")
            
            if len(all_wallets) > 10:
                print(f"   ... and {len(all_wallets) - 10} more wallets")
            
            return all_wallets
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
            
        print(f"API Key: {self.api_key[:10]}...")
        print("="*60)
        
        try:
            # Test 1: Create wallet without name
            print("\n🔧 Test 1: Create wallet without name")
            wallet1 = await self.test_create_wallet()
            
            # Test 2: Create wallet with name
            print("\n🔧 Test 2: Create wallet with specific name")
            wallet_name = f"test-wallet-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            wallet2 = await self.test_create_wallet_with_name(wallet_name)
            
            # Test 3: Get wallet by name
            if wallet2:
                print("\n🔧 Test 3: Get wallet by name")
                await self.test_get_wallet_by_name(wallet_name)
            
            # Test 4: Export private key
            if wallet2:
                print("\n🔧 Test 4: Export wallet private key")
                await self.test_export_private_key(wallet2)
            
            # Test 5: List all wallets
            print("\n🔧 Test 5: List all wallets for API key")
            await self.test_list_all_wallets()
            
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
        print(f"Success rate: {(passed/total*100):.1f}%" if total > 0 else "N/A")
        
        if failed > 0:
            print("\nFailed tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['error']}")
        
        # Save results to file
        results_file = f"cdp_wallet_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\nDetailed results saved to: {results_file}")
        
        # Print created wallets summary
        if self.created_wallets:
            print(f"\nCreated {len(self.created_wallets)} wallets during testing:")
            for wallet in self.created_wallets:
                print(f"  - {wallet.address} (Name: {wallet.name if wallet.name else 'None'})")


async def main():
    """Main entry point."""
    # Run tests
    tester = CDPWalletTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())