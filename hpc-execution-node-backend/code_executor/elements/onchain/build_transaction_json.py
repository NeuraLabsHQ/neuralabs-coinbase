# elements/onchain/build_transaction_json.py
from typing import Dict, Any, List, Optional
import json
import uuid

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs, validate_outputs

class BuildTransactionJSON(ElementBase):
    """Build Transaction JSON element for creating blockchain transaction payloads, primarily for SUI."""
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="build_transaction_json",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        # Extract parameters
        params = parameters or {}
        self.node_url = params.get("node_url", "")
        self.contract_address = params.get("contract_address", "")
        self.function_name = params.get("function_name", "")
        self.function_args = params.get("function_args", [])
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the build transaction JSON element."""
        # Log execution
        logger.info(f"Executing build transaction JSON element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": "Building transaction..."
            })
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for build transaction JSON element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Stream transaction build request info
        await executor._stream_event("transaction_build_request", {
            "element_id": self.element_id,
            "contract_address": self.contract_address,
            "function_name": self.function_name,
            "function_args": self.function_args
        })
        
        try:
            # Build transaction based on function type
            if self.function_name == "coin::transfer" or "transfer" in self.function_name.lower():
                transaction_json = await self._build_transfer_transaction()
            elif self.function_name == "coin::mint" or "mint" in self.function_name.lower():
                transaction_json = await self._build_mint_transaction()
            elif self.function_name.startswith("0x"):
                transaction_json = await self._build_contract_call_transaction()
            else:
                transaction_json = await self._build_generic_transaction()
            
            # Set output to the transaction JSON
            self.outputs = {"transaction_json": transaction_json}
            
            # Validate outputs
            validation_result = validate_outputs(self.outputs, self.output_schema)
            if not validation_result["valid"]:
                error_msg = f"Invalid outputs from build transaction JSON: {validation_result['error']}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Stream transaction build response
            safe_tx = self._redact_sensitive_tx_data(transaction_json)
            await executor._stream_event("transaction_build_response", {
                "element_id": self.element_id,
                "transaction_json": safe_tx,
                "transaction_type": self._get_transaction_type(transaction_json)
            })
            
            return self.outputs
            
        except Exception as e:
            error_msg = f"Error building transaction JSON: {str(e)}"
            logger.error(error_msg)
            
            # Stream error info
            await executor._stream_event("blockchain_error", {
                "element_id": self.element_id,
                "error": error_msg
            })
            
            # Return error data
            self.outputs = {
                "transaction_json": {
                    "error": error_msg,
                    "success": False
                }
            }
            return self.outputs
    
    async def _build_transfer_transaction(self) -> Dict[str, Any]:
        """Build a SUI token transfer transaction."""
        recipient = self.inputs.get("recipient", "")
        amount = self.inputs.get("amount", "0")
        gas_budget = self.inputs.get("gas_budget", "10000000")
        
        return {
            "kind": "ProgrammableTransaction",
            "inputs": [
                {
                    "kind": "Input",
                    "value": amount,
                    "type": "pure"
                },
                {
                    "kind": "Input", 
                    "value": recipient,
                    "type": "pure"
                }
            ],
            "transactions": [
                {
                    "SplitCoins": [
                        "GasCoin",
                        [{"Input": 0}]
                    ]
                },
                {
                    "TransferObjects": [
                        [{"Result": [0, 0]}],
                        {"Input": 1}
                    ]
                }
            ],
            "gasConfig": {
                "budget": gas_budget,
                "price": "1000",
                "payment": []
            }
        }
    
    async def _build_mint_transaction(self) -> Dict[str, Any]:
        """Build an NFT minting transaction."""
        name = self.inputs.get("name", "")
        description = self.inputs.get("description", "")
        image_url = self.inputs.get("image_url", "")
        recipient = self.inputs.get("recipient", "")
        gas_budget = self.inputs.get("gas_budget", "50000000")
        
        return {
            "kind": "ProgrammableTransaction",
            "inputs": [
                {"kind": "Input", "value": name, "type": "pure"},
                {"kind": "Input", "value": description, "type": "pure"},
                {"kind": "Input", "value": image_url, "type": "pure"},
                {"kind": "Input", "value": recipient, "type": "pure"}
            ],
            "transactions": [
                {
                    "MoveCall": {
                        "package": self.contract_address,
                        "module": "nft",
                        "function": "mint",
                        "arguments": [
                            {"Input": 0},
                            {"Input": 1},
                            {"Input": 2},
                            {"Input": 3}
                        ]
                    }
                }
            ],
            "gasConfig": {
                "budget": gas_budget,
                "price": "1000",
                "payment": []
            }
        }
    
    async def _build_contract_call_transaction(self) -> Dict[str, Any]:
        """Build a smart contract function call transaction."""
        gas_budget = self.inputs.get("gas_budget", "20000000")
        
        # Parse function name
        parts = self.function_name.split("::")
        if len(parts) >= 3:
            package_id = parts[0]
            module = parts[1] 
            function = parts[2]
        else:
            package_id = self.contract_address
            module = parts[0] if len(parts) > 0 else "main"
            function = parts[1] if len(parts) > 1 else self.function_name
        
        # Prepare arguments from inputs and function_args
        arguments = []
        for i, arg_name in enumerate(self.function_args):
            if arg_name in self.inputs:
                arguments.append({"Input": i})
        
        # Prepare inputs
        inputs = []
        for arg_name in self.function_args:
            if arg_name in self.inputs:
                inputs.append({
                    "kind": "Input",
                    "value": self.inputs[arg_name],
                    "type": "pure"
                })
        
        return {
            "kind": "ProgrammableTransaction",
            "inputs": inputs,
            "transactions": [
                {
                    "MoveCall": {
                        "package": package_id,
                        "module": module,
                        "function": function,
                        "arguments": arguments
                    }
                }
            ],
            "gasConfig": {
                "budget": gas_budget,
                "price": "1000",
                "payment": []
            }
        }
    
    async def _build_generic_transaction(self) -> Dict[str, Any]:
        """Build a generic transaction."""
        gas_budget = self.inputs.get("gas_budget", "20000000")
        
        return {
            "kind": "ProgrammableTransaction",
            "inputs": [],
            "transactions": [
                {
                    "MoveCall": {
                        "package": self.contract_address,
                        "module": "main",
                        "function": self.function_name,
                        "arguments": []
                    }
                }
            ],
            "gasConfig": {
                "budget": gas_budget,
                "price": "1000",
                "payment": []
            }
        }
    
    def _get_transaction_type(self, transaction_json: Dict[str, Any]) -> str:
        """Determine the type of transaction."""
        if not isinstance(transaction_json, dict):
            return "unknown"
        
        transactions = transaction_json.get("transactions", [])
        if not transactions:
            return "empty"
        
        first_tx = transactions[0]
        if "TransferObjects" in first_tx:
            return "transfer"
        elif "MoveCall" in first_tx:
            return "contract_call"
        elif "SplitCoins" in first_tx:
            return "split_coins"
        else:
            return "programmable"
    
    def _redact_sensitive_tx_data(self, tx_data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact sensitive data from transaction JSON for logging."""
        if not isinstance(tx_data, dict):
            return tx_data
            
        # Create a copy to avoid modifying the original
        safe_tx = tx_data.copy()
        
        # Redact sender if present
        if "sender" in safe_tx and isinstance(safe_tx["sender"], str) and len(safe_tx["sender"]) > 8:
            safe_tx["sender"] = safe_tx["sender"][:4] + "..." + safe_tx["sender"][-4:]
        
        # Redact gas payment addresses if present
        gas_config = safe_tx.get("gasConfig", {})
        if "payment" in gas_config and isinstance(gas_config["payment"], list):
            safe_tx["gasConfig"]["payment"] = ["redacted"] * len(gas_config["payment"])
        
        return safe_tx
