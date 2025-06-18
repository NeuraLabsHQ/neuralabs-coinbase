# elements/coinbase/read_contract.py
from typing import Dict, Any
import os
import json

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs, validate_outputs

# Note: CDP SDK doesn't provide direct contract reading functionality
# We use web3.py for actual contract calls while CDP handles authentication
try:
    from web3 import Web3
    HAS_WEB3 = True
except ImportError:
    logger.warning("web3 not installed. Contract reading requires: pip install web3")
    HAS_WEB3 = False

try:
    from cdp import CdpClient
    HAS_CDP = True
except ImportError:
    logger.warning("CDP SDK not installed. Install with: pip install cdp-sdk")
    HAS_CDP = False


class ReadContract(ElementBase):
    """Read Contract element for reading data from smart contracts.
    
    This element uses web3.py for contract interactions as the CDP SDK
    doesn't provide direct contract reading functionality.
    """
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="read_contract",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        # Extract parameters
        params = parameters or {}
        self.contract_address = params.get("contract_address", "")
        self.contract_abi = params.get("contract_abi", [])
        self.function_name = params.get("function_name", "")
        self.network = params.get("network", "base-sepolia")
        self.node_url = params.get("node_url", "")
        
        # Set default RPC URL based on network
        if not self.node_url:
            if self.network == "base-sepolia":
                self.node_url = "https://sepolia.base.org"
            elif self.network == "base-mainnet":
                self.node_url = "https://mainnet.base.org"
            else:
                self.node_url = "https://sepolia.base.org"  # Default
        
        # Validate requirements
        if not HAS_WEB3:
            raise ImportError("web3.py is required for contract reading. Install with: pip install web3")
        
        # Validate ABI and function
        self._validate_contract_params()
    
    def _validate_contract_params(self):
        """Validate contract parameters."""
        if not self.contract_address:
            raise ValueError("Contract address is required")
        
        if not self.contract_abi or not isinstance(self.contract_abi, list):
            raise ValueError("Contract ABI must be a non-empty array")
        
        if not self.function_name:
            raise ValueError("Function name is required")
        
        # Find the function in ABI
        self.function_abi = None
        for item in self.contract_abi:
            if item.get("type") == "function" and item.get("name") == self.function_name:
                self.function_abi = item
                break
        
        if not self.function_abi:
            raise ValueError(f"Function '{self.function_name}' not found in ABI")
        
        # Check if function is view/pure (read-only)
        state_mutability = self.function_abi.get("stateMutability", "")
        if state_mutability not in ["view", "pure"]:
            logger.warning(f"Function '{self.function_name}' is not marked as view/pure. It may modify state.")
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the read contract element."""
        # Log execution
        logger.info(f"Executing read contract element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": f"Reading {self.function_name} from contract..."
            })
        
        # For dynamic schemas, we need to be flexible with input validation
        # If input_schema is empty, we accept any inputs
        if self.input_schema:
            validation_result = validate_inputs(self.inputs, self.input_schema)
            if not validation_result["valid"]:
                error_msg = f"Invalid inputs for read contract element: {validation_result['error']}"
                logger.error(error_msg)
                raise ValueError(error_msg)
        
        # Get function inputs - could be the entire inputs dict or nested under a key
        # This allows flexibility for users to define their own schema
        function_inputs = self.inputs
        
        # Stream contract read request info
        await executor._stream_event("contract_read_request", {
            "element_id": self.element_id,
            "contract_address": self.contract_address,
            "function_name": self.function_name,
            "network": self.network
        })
        
        try:
            # Connect to the network using web3
            w3 = Web3(Web3.HTTPProvider(self.node_url))
            
            # Check connection
            if not w3.is_connected():
                raise Exception(f"Failed to connect to {self.node_url}")
            
            # Create contract instance
            contract = w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=self.contract_abi
            )
            
            # Get the function
            contract_function = getattr(contract.functions, self.function_name)
            
            # Prepare function arguments
            args = self._prepare_function_args(function_inputs)
            
            # Call the function
            logger.info(f"Calling {self.function_name} with args: {args}")
            
            if args:
                # Convert args dict to positional arguments
                arg_values = []
                for abi_input in self.function_abi.get("inputs", []):
                    param_name = abi_input.get("name")
                    if param_name in args:
                        arg_values.append(args[param_name])
                result = contract_function(*arg_values).call()
            else:
                result = contract_function().call()
            
            # Format the result
            formatted_result = self._format_result(result)
            
            # Set outputs based on user-defined schema
            # If output_schema is empty, return the raw result
            if not self.output_schema:
                # Return raw result directly
                self.outputs = formatted_result if isinstance(formatted_result, dict) else {"result": formatted_result}
            else:
                # Use standard format if schema is defined
                self.outputs = {
                    "result": formatted_result,
                    "success": True,
                    "error": None
                }
                
                # Validate outputs only if schema is defined
                validation_result = validate_outputs(self.outputs, self.output_schema)
                if not validation_result["valid"]:
                    error_msg = f"Invalid outputs from read contract: {validation_result['error']}"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
            
            # Stream contract read response
            await executor._stream_event("contract_read_response", {
                "element_id": self.element_id,
                "result": str(formatted_result)[:200] + ("..." if len(str(formatted_result)) > 200 else "")
            })
            
            return self.outputs
            
        except Exception as e:
            error_msg = f"Error reading contract: {str(e)}"
            logger.error(error_msg)
            
            # Stream error info
            await executor._stream_event("contract_error", {
                "element_id": self.element_id,
                "error": error_msg
            })
            
            # Set error outputs based on schema
            if not self.output_schema:
                # Simple error format for empty schema
                self.outputs = {"error": error_msg}
            else:
                # Standard error format
                self.outputs = {
                    "result": None,
                    "success": False,
                    "error": error_msg
                }
            
            return self.outputs
    
    def _prepare_function_args(self, function_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare function arguments based on ABI inputs."""
        args = {}
        
        # Get input definitions from ABI
        abi_inputs = self.function_abi.get("inputs", [])
        
        # If no inputs required, return empty args
        if not abi_inputs:
            return args
        
        for abi_input in abi_inputs:
            param_name = abi_input.get("name")
            param_type = abi_input.get("type")
            
            # Try to find the parameter value in function_inputs
            # Support both named parameters and positional (if name is empty)
            value = None
            if param_name and param_name in function_inputs:
                value = function_inputs[param_name]
            elif not param_name and isinstance(function_inputs, dict) and len(function_inputs) == 1:
                # For unnamed single parameter, use the first value
                value = list(function_inputs.values())[0]
            
            if value is not None:
                # Type conversion based on Solidity type
                if param_type.startswith("uint") or param_type.startswith("int"):
                    # Keep as integer for web3
                    args[param_name] = int(value) if isinstance(value, str) else value
                elif param_type == "address":
                    # Ensure proper address format with checksum
                    args[param_name] = Web3.to_checksum_address(str(value))
                elif param_type == "bool":
                    args[param_name] = bool(value)
                elif param_type.startswith("bytes"):
                    # Handle bytes data
                    if isinstance(value, str) and value.startswith("0x"):
                        args[param_name] = value
                    else:
                        args[param_name] = "0x" + value.hex() if hasattr(value, 'hex') else str(value)
                elif param_type == "string":
                    args[param_name] = str(value)
                elif param_type.endswith("[]"):
                    # Array type
                    args[param_name] = list(value) if not isinstance(value, list) else value
                else:
                    # Default: pass as-is
                    args[param_name] = value
            else:
                # Check if parameter is required
                if param_name:
                    logger.warning(f"Missing input parameter: {param_name}")
        
        return args
    
    def _format_result(self, result: Any) -> Any:
        """Format the contract call result based on output types."""
        if result is None:
            return None
        
        # Get output definitions from ABI
        abi_outputs = self.function_abi.get("outputs", [])
        
        # If single output, return directly
        if len(abi_outputs) == 1:
            output_type = abi_outputs[0].get("type", "")
            return self._format_single_value(result, output_type)
        
        # Multiple outputs - return as dictionary
        if isinstance(result, (list, tuple)) and len(result) == len(abi_outputs):
            formatted = {}
            for i, output in enumerate(abi_outputs):
                output_name = output.get("name", f"output_{i}")
                output_type = output.get("type", "")
                formatted[output_name] = self._format_single_value(result[i], output_type)
            return formatted
        
        # Return as-is if we can't format
        return result
    
    def _format_single_value(self, value: Any, solidity_type: str) -> Any:
        """Format a single value based on its Solidity type."""
        try:
            if solidity_type.startswith("uint") or solidity_type.startswith("int"):
                # Return numbers as strings to preserve precision
                return str(value)
            elif solidity_type == "address":
                # Format addresses with 0x prefix
                return value.lower() if isinstance(value, str) else str(value).lower()
            elif solidity_type == "bool":
                return bool(value)
            elif solidity_type.startswith("bytes"):
                # Format bytes as hex string
                if hasattr(value, 'hex'):
                    return "0x" + value.hex()
                elif isinstance(value, str) and not value.startswith("0x"):
                    return "0x" + value
                return value
            elif solidity_type == "string":
                return str(value)
            else:
                return value
        except Exception as e:
            logger.warning(f"Error formatting value of type {solidity_type}: {e}")
            return value