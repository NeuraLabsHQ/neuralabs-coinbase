# elements/coinbase/fetch_balance.py
from typing import Dict, Any, Optional
import os
from decimal import Decimal
import asyncio

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs, validate_outputs

try:
    from cdp import CdpClient
except ImportError:
    logger.error("CDP SDK not installed. Install with: pip install cdp-sdk")
    raise


class FetchBalance(ElementBase):
    """Fetch balance element for Base Sepolia ETH and USDC balances using Coinbase CDP."""
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="fetch_balance",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        # Extract parameters
        params = parameters or {}
        self.node_url = params.get("node_url", "https://sepolia.base.org")
        self.usdc_contract_address = params.get("usdc_contract_address", "0x036CbD53842c5426634e7929541eC2318f3dCF7e")
        
        # Base Sepolia network ID for CDP
        self.network_id = "base-sepolia"
        
        # Check CDP credentials
        self._check_credentials()
    
    def _check_credentials(self):
        """Check if CDP credentials are available in environment."""
        self.api_key_id = os.getenv("CDP_API_KEY_ID")
        self.api_key_secret = os.getenv("CDP_API_KEY_SECRET")
        # self.wallet_secret = os.getenv("CDP_WALLET_SECRET")
        
        if not self.api_key_id or not self.api_key_secret:
            raise ValueError(
                "CDP API keys not found in environment. "
                "Set CDP_API_KEY_ID and CDP_API_KEY_SECRET"
            )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the fetch balance element."""
        # Log execution
        logger.info(f"Executing fetch balance element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": "Reading Base Sepolia wallet data..."
            })
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for fetch balance element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Get wallet address from inputs
        wallet_address = self.inputs.get("wallet_address", "")
        
        # Stream blockchain read request info
        await executor._stream_event("blockchain_read_request", {
            "element_id": self.element_id,
            "wallet_address": wallet_address,
            "network": self.network_id
        })
        
        try:
            # Read wallet data using CDP
            wallet_data = await self._read_wallet_data(wallet_address)
            
            # Set outputs
            self.outputs = wallet_data
            
            # Validate outputs
            validation_result = validate_outputs(self.outputs, self.output_schema)
            if not validation_result["valid"]:
                error_msg = f"Invalid outputs from fetch balance: {validation_result['error']}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Stream blockchain read response
            await executor._stream_event("blockchain_read_response", {
                "element_id": self.element_id,
                "wallet_data": self._redact_sensitive_data(wallet_data)
            })
            
            return self.outputs
            
        except Exception as e:
            error_msg = f"Error fetching balance: {str(e)}"
            logger.error(error_msg)
            
            # Stream error info
            await executor._stream_event("blockchain_error", {
                "element_id": self.element_id,
                "error": error_msg
            })
            
            raise
    
    async def _read_wallet_data(self, wallet_address: str) -> Dict[str, Any]:
        """Read wallet data from Base Sepolia using CDP."""
        logger.info(f"Reading wallet data for address: {wallet_address}")
        
        try:
            async with CdpClient(
                api_key_id=self.api_key_id,
                api_key_secret=self.api_key_secret,
                # wallet_secret=self.wallet_secret
            ) as cdp:
                try:
                    # List token balances for the address
                    response = await cdp.evm.list_token_balances(
                        address=wallet_address,
                        network=self.network_id
                    )
                    
                    # Extract ETH and USDC balances
                    eth_balance = Decimal("0")
                    eth_balance_wei = "0"
                    usdc_balance = Decimal("0")
                    usdc_balance_raw = "0"
                    
                    # Parse the response
                    if hasattr(response, 'balances'):
                        for balance_item in response.balances:
                            if hasattr(balance_item, 'token') and hasattr(balance_item, 'amount'):
                                token = balance_item.token
                                amount = balance_item.amount
                                
                                # Check for ETH
                                if hasattr(token, 'symbol') and token.symbol == 'ETH':
                                    if hasattr(amount, 'amount') and hasattr(amount, 'decimals'):
                                        eth_balance_wei = str(amount.amount)
                                        eth_balance = Decimal(amount.amount) / Decimal(10 ** amount.decimals)
                                
                                # Check for USDC by contract address
                                if hasattr(token, 'contract_address'):
                                    if token.contract_address.lower() == self.usdc_contract_address.lower():
                                        if hasattr(amount, 'amount') and hasattr(amount, 'decimals'):
                                            usdc_balance_raw = str(amount.amount)
                                            usdc_balance = Decimal(amount.amount) / Decimal(10 ** amount.decimals)
                    
                    logger.info(f"Successfully read balances - ETH: {eth_balance}, USDC: {usdc_balance}")
                    
                except Exception as e:
                    logger.warning(f"Could not get token balances: {e}")
                    # Default values if balance check fails
                    eth_balance = Decimal("0")
                    usdc_balance = Decimal("0")
                    eth_balance_wei = "0"
                    usdc_balance_raw = "0"
                
                # CDP doesn't provide block number directly
                block_number = 0
                
                return {
                    "wallet_address": wallet_address,
                    "eth_balance": eth_balance_wei,
                    "eth_balance_formatted": f"{eth_balance:.6f} ETH",
                    "usdc_balance": usdc_balance_raw,
                    "usdc_balance_formatted": f"{usdc_balance:.2f} USDC",
                    "block_number": block_number
                }
                
        except Exception as e:
            logger.error(f"Error reading wallet data: {str(e)}")
            # Return default values on error
            return {
                "wallet_address": wallet_address,
                "eth_balance": "0",
                "eth_balance_formatted": "0.000000 ETH",
                "usdc_balance": "0",
                "usdc_balance_formatted": "0.00 USDC",
                "block_number": 0
            }
    
    def _redact_sensitive_data(self, wallet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact sensitive data for logging."""
        if not isinstance(wallet_data, dict):
            return wallet_data
        
        # Create a copy
        safe_data = wallet_data.copy()
        
        # Partially redact wallet address
        if "wallet_address" in safe_data and len(safe_data["wallet_address"]) > 10:
            addr = safe_data["wallet_address"]
            safe_data["wallet_address"] = f"{addr[:6]}...{addr[-4:]}"
        
        return safe_data