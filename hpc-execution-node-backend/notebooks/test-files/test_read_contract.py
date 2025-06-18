#!/usr/bin/env python3
"""
Test CDP read contract functionality independently
Tests reading data from smart contracts on Base Sepolia using CDP SDK directly
"""

import os
import asyncio
import json
from typing import Dict, Any

try:
    from cdp import CdpClient
except ImportError:
    print("Error: CDP SDK not installed. Run: pip install cdp-sdk")
    exit(1)

# Try importing web3 for contract interaction
try:
    from web3 import Web3
    HAS_WEB3 = True
except ImportError:
    print("Warning: web3 not installed. Some features may be limited.")
    HAS_WEB3 = False


# Example ABIs for testing
USDC_ABI = [
    {
        "type": "function",
        "name": "name",
        "inputs": [],
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "symbol",
        "inputs": [],
        "outputs": [{"name": "", "type": "string"}],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "decimals",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "totalSupply",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "balanceOf",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
    }
]


async def read_contract_with_web3(
    contract_address: str,
    abi: list,
    function_name: str,
    args: dict = None
) -> Any:
    """Read contract using web3.py"""
    if not HAS_WEB3:
        print("Error: web3.py not installed")
        return None
    
    # Base Sepolia RPC
    w3 = Web3(Web3.HTTPProvider("https://sepolia.base.org"))
    
    # Create contract instance
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(contract_address),
        abi=abi
    )
    
    # Get the function
    contract_function = getattr(contract.functions, function_name)
    
    # Call the function
    if args:
        # Convert args dict to positional arguments
        arg_values = list(args.values())
        result = contract_function(*arg_values).call()
    else:
        result = contract_function().call()
    
    return result


async def test_read_token_info():
    """Test reading basic token information."""
    print("\n" + "="*50)
    print("Test 1: Reading Token Information")
    print("="*50)
    
    # USDC contract on Base Sepolia
    usdc_address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    
    try:
        # Test reading token name
        print("\nReading token name...")
        result = await read_contract_with_web3(
            usdc_address,
            USDC_ABI,
            "name"
        )
        print(f"Token Name: {result}")
        
        # Test reading symbol
        print("\nReading token symbol...")
        result = await read_contract_with_web3(
            usdc_address,
            USDC_ABI,
            "symbol"
        )
        print(f"Token Symbol: {result}")
        
        # Test reading decimals
        print("\nReading token decimals...")
        result = await read_contract_with_web3(
            usdc_address,
            USDC_ABI,
            "decimals"
        )
        print(f"Token Decimals: {result}")
        
        # Test reading total supply
        print("\nReading total supply...")
        result = await read_contract_with_web3(
            usdc_address,
            USDC_ABI,
            "totalSupply"
        )
        if result:
            supply_formatted = int(result) / 10**6  # USDC has 6 decimals
            print(f"Total Supply: {result} (raw)")
            print(f"Total Supply: {supply_formatted:,.2f} USDC")
        
    except Exception as e:
        print(f"Error: {e}")


async def test_read_with_parameters():
    """Test reading with function parameters."""
    print("\n" + "="*50)
    print("Test 2: Reading With Parameters")
    print("="*50)
    
    # USDC contract on Base Sepolia
    usdc_address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    # Test address
    test_address = "0x7efD1aae7Ff2203eFa02D44c492f9ab95d1feD4e"
    
    try:
        print(f"\nReading balance for address: {test_address}")
        result = await read_contract_with_web3(
            usdc_address,
            USDC_ABI,
            "balanceOf",
            {"account": test_address}
        )
        
        if result:
            balance_formatted = int(result) / 10**6  # USDC has 6 decimals
            print(f"Balance: {result} (raw)")
            print(f"Balance: {balance_formatted:,.2f} USDC")
        else:
            print("Balance: 0")
            
    except Exception as e:
        print(f"Error: {e}")


async def test_weth_contract():
    """Test with WETH (Wrapped ETH) contract on Base Sepolia."""
    print("\n" + "="*50)
    print("Test 3: WETH Contract on Base Sepolia")
    print("="*50)
    
    # WETH9 ABI for Base Sepolia
    weth_abi = [
        {
            "type": "function",
            "name": "name",
            "inputs": [],
            "outputs": [{"name": "", "type": "string"}],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "symbol",
            "inputs": [],
            "outputs": [{"name": "", "type": "string"}],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "decimals",
            "inputs": [],
            "outputs": [{"name": "", "type": "uint8"}],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "totalSupply",
            "inputs": [],
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view"
        }
    ]
    
    # WETH contract address on Base Sepolia
    weth_address = "0x4200000000000000000000000000000000000006"
    
    try:
        # Read WETH name
        print("\nReading WETH name...")
        result = await read_contract_with_web3(
            weth_address,
            weth_abi,
            "name"
        )
        print(f"WETH Name: {result}")
        
        # Read WETH symbol
        print("\nReading WETH symbol...")
        result = await read_contract_with_web3(
            weth_address,
            weth_abi,
            "symbol"
        )
        print(f"WETH Symbol: {result}")
        
        # Read WETH total supply
        print("\nReading WETH total supply...")
        result = await read_contract_with_web3(
            weth_address,
            weth_abi,
            "totalSupply"
        )
        if result:
            supply_wei = int(result)
            supply_eth = supply_wei / 10**18
            print(f"Total Supply: {supply_wei} wei")
            print(f"Total Supply: {supply_eth:.6f} ETH")
            
    except Exception as e:
        print(f"Error: {e}")


def test_custom_contract_example():
    """Example of how to read from any custom contract."""
    print("\n" + "="*50)
    print("Test 4: Custom Contract Example")
    print("="*50)
    
    print("\nExample: Reading from a custom contract")
    print("1. Define your contract ABI with the functions you want to read")
    print("2. Use web3.py to interact with the contract")
    print("3. Pass arguments as needed")
    
    # Example custom ABI
    custom_abi = [
        {
            "type": "function",
            "name": "getOwner",
            "inputs": [],
            "outputs": [{"name": "owner", "type": "address"}],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "allowance",
            "inputs": [
                {"name": "owner", "type": "address"},
                {"name": "spender", "type": "address"}
            ],
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view"
        }
    ]
    
    print("\nExample usage:")
    print("result = await read_contract_with_web3(")
    print('    "0xYourContractAddress",')
    print('    custom_abi,')
    print('    "allowance",')
    print('    {"owner": "0xOwnerAddress", "spender": "0xSpenderAddress"}')
    print(")")


async def main():
    """Run all tests."""
    print("CDP SDK Contract Reading Tests")
    print("=" * 60)
    
    # Note about CDP SDK
    print("\nNote: The CDP SDK does not currently provide direct contract reading functionality.")
    print("Using web3.py for contract interactions instead.")
    
    # Check for web3
    if not HAS_WEB3:
        print("\nError: web3.py is required for contract reading.")
        print("Install with: pip install web3")
        return
    
    try:
        # Run tests
        await test_read_token_info()
        await test_read_with_parameters()
        await test_weth_contract()
        test_custom_contract_example()
        
        print("\n" + "="*60)
        print("All tests completed!")
        
    except Exception as e:
        print(f"\nError during tests: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())