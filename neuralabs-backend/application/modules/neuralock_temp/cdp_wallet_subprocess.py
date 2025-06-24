"""
CDP Wallet Manager using subprocess to avoid event loop conflicts
"""
import yaml
import asyncio
import subprocess
import json
import sys
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class CDPWalletManager:
    """
    Manages CDP wallet operations for agent wallets using subprocess
    """
    
    def __init__(self):
        """Initialize with configuration"""
        self.config = None
        self._load_config()
        
    def _load_config(self) -> None:
        """Load configuration from config.yaml"""
        try:
            config_path = Path(__file__).parent.parent.parent.parent / "config.yaml"
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
            logger.info("Configuration loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            raise
    
    async def initialize_client(self) -> None:
        """Initialize - no longer needed but kept for compatibility"""
        logger.info("Using subprocess for CDP operations")
    
    async def create_agent_wallet(self, user_public_key: str) -> Tuple[str, str]:
        """
        Create a new agent wallet for the user using subprocess
        
        Args:
            user_public_key: The user's public key
            
        Returns:
            Tuple of (agent_public_key, agent_private_key)
        """
        try:
            # Get CDP credentials
            api_key = self.config['coinbase_secrets']['api_key']
            api_secret = self.config['coinbase_secrets']['api_secret']
            wallet_secret = self.config['coinbase_secrets']['wallet_secret']
            
            # Path to subprocess script
            script_path = Path(__file__).parent / "cdp_subprocess.py"
            
            # Run subprocess
            process = await asyncio.create_subprocess_exec(
                sys.executable,
                str(script_path),
                api_key,
                api_secret,
                wallet_secret,
                user_public_key,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"Subprocess failed: {error_msg}")
                raise Exception(f"Failed to create wallet: {error_msg}")
            
            # Parse result
            result = json.loads(stdout.decode())
            
            if not result.get("success"):
                raise Exception(result.get("error", "Unknown error"))
            
            agent_public_key = result["public_key"]
            agent_private_key = result["private_key"]
            
            logger.info(f"Created agent wallet for user {user_public_key}: {agent_public_key}")
            
            return agent_public_key, agent_private_key
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse subprocess output: {e}")
            raise Exception("Failed to create wallet: Invalid response")
        except Exception as e:
            logger.error(f"Failed to create agent wallet: {e}")
            raise
    
    async def get_wallet_details(self, wallet_address: str) -> Optional[Dict[str, Any]]:
        """
        Get wallet details by address
        
        Args:
            wallet_address: The wallet address
            
        Returns:
            Wallet details
        """
        try:
            return {
                "address": wallet_address,
                "network": "base-sepolia"
            }
            
        except Exception as e:
            logger.error(f"Failed to get wallet details: {e}")
            return None
    
    async def cleanup(self):
        """Clean up resources"""
        logger.info("No cleanup needed for subprocess implementation")