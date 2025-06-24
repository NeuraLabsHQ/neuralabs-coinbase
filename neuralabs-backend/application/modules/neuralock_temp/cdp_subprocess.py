#!/usr/bin/env python3
"""
CDP Wallet operations in subprocess to avoid event loop conflicts
This script is called as a subprocess to isolate CDP SDK operations
"""
import sys
import json
import asyncio
from cdp import CdpClient


async def create_wallet(api_key: str, api_secret: str, wallet_secret: str, user_public_key: str):
    """Create a new wallet using CDP SDK"""
    try:
        # Initialize CDP client
        client = CdpClient(
            api_key_id=api_key,
            api_key_secret=api_secret,
            wallet_secret=wallet_secret
        )
        
        # Create wallet name
        import time
        wallet_name = f"agent-{user_public_key[:8]}-{int(time.time())}"
        
        # Create wallet
        wallet = await client.evm.create_account(name=wallet_name)
        
        # Export private key
        private_key = await client.evm.export_account(address=wallet.address)
        
        # Clean up
        await client.close()
        
        # Return result
        result = {
            "success": True,
            "public_key": wallet.address,
            "private_key": private_key
        }
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(result))
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    api_key = sys.argv[1]
    api_secret = sys.argv[2]
    wallet_secret = sys.argv[3]
    user_public_key = sys.argv[4]
    
    # Run the async function
    asyncio.run(create_wallet(api_key, api_secret, wallet_secret, user_public_key))