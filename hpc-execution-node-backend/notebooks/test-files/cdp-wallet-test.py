#!/usr/bin/env python3
"""
Test CDP wallet reading functionality for Base Sepolia
Based on official CDP SDK documentation
"""

import os
import sys
import asyncio
from decimal import Decimal


async def test_cdp_wallet_read():
    """Test reading wallet balance using CDP"""
    
    # Import CDP
    try:
        from cdp import CdpClient
    except ImportError:
        print("Error: CDP SDK not installed. Run: pip install cdp-sdk")
        return
    
    # Check CDP credentials from environment
    api_key_id = ""
    api_key_secret = ""
    # wallet_secret = os.getenv("CDP_WALLET_SECRET", "")  # Optional
    
    if not api_key_id or not api_key_secret:
        print("Error: CDP API keys not found in environment")
        print("Set CDP_API_KEY_ID and CDP_API_KEY_SECRET")
        return
    
    print("✅ CDP credentials found\n")
    
    # Get wallet address from command line or create new wallet
    if len(sys.argv) > 1:
        wallet_address = sys.argv[1]
        print(f"Testing with address: {wallet_address}")
        test_mode = "external"
    else:
        test_mode = "managed"
    
    print("-" * 50)
    
    try:
        # Create CDP client
        async with CdpClient(
            api_key_id=api_key_id,
            api_key_secret=api_key_secret,
            # wallet_secret=wallet_secret
        ) as cdp:
            print("✅ CDP client initialized\n")
            
            if test_mode == "managed":
                # Create a new wallet for testing
                print("Creating new test wallet...")
                account = await cdp.evm.create_account()
                wallet_address = account.address
                print(f"Created wallet: {wallet_address}")
                
                # For managed wallets, we can use account actions
                try:
                    balances = await account.list_token_balances(
                        network="base-sepolia"
                    )
                    
                    print("\nToken balances:")
                    for balance in balances:
                        print(f"  {balance.token}: {balance.amount}")
                    
                except Exception as e:
                    print(f"Error listing balances: {e}")
            
            else:
                # Try to read external wallet
                print(f"Attempting to read external wallet...")
                
                try:
                    # Try list_token_balances API
                    response = await cdp.evm.list_token_balances(
                        address=wallet_address,
                        network="base-sepolia"
                    )
                    
                    print("\nToken balances found:")
                    eth_found = False
                    usdt_found = False
                    
                    # Parse the response structure
                    if hasattr(response, 'balances'):
                        for balance_item in response.balances:
                            if hasattr(balance_item, 'token') and hasattr(balance_item, 'amount'):
                                token = balance_item.token
                                amount = balance_item.amount
                                
                                # Get token details
                                symbol = getattr(token, 'symbol', 'Unknown')
                                contract = getattr(token, 'contract_address', '')
                                
                                # Get amount details
                                raw_amount = getattr(amount, 'amount', 0)
                                decimals = getattr(amount, 'decimals', 18)
                                
                                # Calculate formatted amount
                                formatted_amount = Decimal(raw_amount) / Decimal(10 ** decimals)
                                
                                print(f"  {symbol}: {formatted_amount:.6f}")
                                print(f"    Contract: {contract}")
                                print(f"    Raw amount: {raw_amount}")
                                print(f"    Decimals: {decimals}")
                                
                                # Check for ETH
                                if symbol == 'ETH':
                                    eth_found = True
                                
                                # Check for USDT by contract address
                                usdt_contract = "0x853154e2A5604E5C74a2546E2871Ad44932eB92C"
                                if contract.lower() == usdt_contract.lower():
                                    usdt_found = True
                    
                    if not eth_found:
                        print("\n  ETH: Not found in response")
                    if not usdt_found:
                        print("  USDT: Not found (contract 0x853154e2A5604E5C74a2546E2871Ad44932eB92C)")
                        print("  Note: The response shows USDC, not USDT")
                    
                except Exception as e:
                    print(f"\n⚠️  Error reading external wallet: {e}")
                    print("\nNote: CDP SDK may not support reading arbitrary wallet addresses.")
                    print("It's primarily designed for wallets created through CDP.")
            
            # Test faucet capability (only for managed wallets)
            if test_mode == "managed":
                print("\n" + "-" * 50)
                print("Testing faucet request...")
                try:
                    faucet_hash = await cdp.evm.request_faucet(
                        address=wallet_address,
                        network="base-sepolia",
                        token="eth"
                    )
                    print(f"✅ Faucet request submitted: {faucet_hash}")
                except Exception as e:
                    print(f"⚠️  Faucet request failed: {e}")
        
        print("\n✅ Test completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")


def main():
    """Main function to run async test"""
    asyncio.run(test_cdp_wallet_read())


if __name__ == "__main__":
    main()