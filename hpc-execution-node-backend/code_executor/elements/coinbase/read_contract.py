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
    
    Output Schema Flexibility:
    The output schema should match the return type of the selected function:
    - For functions returning strings (e.g., name(), symbol()): use {"token_name": {"type": "string"}}
    - For functions returning numbers (e.g., balanceOf(), totalSupply()): use {"balance": {"type": "uint256"}}
    - For functions returning booleans: use {"is_paused": {"type": "bool"}}
    
    The element will automatically adapt the output to match your schema definition.
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
        
        # Handle contract_abi - it might be a string that needs parsing
        contract_abi_raw = params.get("contract_abi", [])
        if isinstance(contract_abi_raw, str):
            try:
                self.contract_abi = json.loads(contract_abi_raw)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON in contract_abi: {e}")
        else:
            self.contract_abi = contract_abi_raw
            
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
        function_inputs = self.inputs.copy()
        
        # Apply default values from input schema if inputs are missing
        if self.input_schema:
            for key, schema in self.input_schema.items():
                if key not in function_inputs and 'default' in schema:
                    function_inputs[key] = schema['default']
        
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
            if not self.output_schema:
                # If no schema defined, return raw result
                self.outputs = formatted_result if isinstance(formatted_result, dict) else {"result": formatted_result}
            else:
                # Map formatted result to user-defined schema
                self.outputs = self._map_to_output_schema(formatted_result)
                
                # Validate outputs against schema
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
                # Create error outputs that match user-defined schema
                self.outputs = {}
                for key, schema_def in self.output_schema.items():
                    # Check if this field is meant for errors
                    if key.lower() in ["error", "error_message", "message"]:
                        self.outputs[key] = error_msg
                    elif key.lower() in ["success", "is_success", "ok"]:
                        self.outputs[key] = False
                    else:
                        # Set default value for other fields
                        output_type = schema_def.get("type", "string")
                        self.outputs[key] = self._get_default_value(output_type)
            
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
    
    def _map_to_output_schema(self, formatted_result: Any) -> Dict[str, Any]:
        """Map the formatted result to match the user-defined output schema.
        
        This method handles the flexible nature of contract outputs where:
        - balanceOf returns a uint256 (number)
        - symbol returns a string
        - name returns a string
        - decimals returns a uint8 (number)
        
        The user defines the output schema based on what function they're calling.
        """
        outputs = {}
        
        # Special handling for single-value returns (most common case)
        if len(self.output_schema) == 1:
            key = list(self.output_schema.keys())[0]
            schema_def = self.output_schema[key]
            
            # Direct mapping for single output
            outputs[key] = formatted_result
            
            # Type validation/conversion based on schema
            expected_type = schema_def.get("type", "string")
            
            # Convert types if needed
            if expected_type in ["string", "str"]:
                outputs[key] = str(formatted_result) if formatted_result is not None else ""
            elif expected_type in ["int", "integer", "number", "uint", "uint256", "uint8"]:
                # Handle numeric types - already formatted as string for precision
                if isinstance(formatted_result, str) and formatted_result.isdigit():
                    outputs[key] = formatted_result  # Keep as string to preserve precision
                else:
                    outputs[key] = formatted_result
            elif expected_type in ["bool", "boolean"]:
                outputs[key] = bool(formatted_result) if formatted_result is not None else False
            elif expected_type == "address":
                outputs[key] = str(formatted_result).lower() if formatted_result else ""
            
            return outputs
        
        # Handle multiple outputs or complex results
        if isinstance(formatted_result, dict):
            # Check if the result already has the expected schema keys
            schema_keys = set(self.output_schema.keys())
            result_keys = set(formatted_result.keys())
            
            # If keys match exactly, return as is
            if schema_keys == result_keys:
                return formatted_result
            
            # Otherwise, try to map values to schema
            for key, schema_def in self.output_schema.items():
                if key in formatted_result:
                    outputs[key] = formatted_result[key]
                else:
                    # Try to find a matching key
                    # Common mappings
                    if key == "balance" and "result" in formatted_result:
                        outputs[key] = formatted_result["result"]
                    elif key == "value" and "result" in formatted_result:
                        outputs[key] = formatted_result["result"]
                    else:
                        # Set default value based on type
                        output_type = schema_def.get("type", "string")
                        outputs[key] = self._get_default_value(output_type)
        else:
            # Non-dict result with multiple expected outputs
            # This is unusual but handle gracefully
            if "result" in self.output_schema:
                outputs["result"] = formatted_result
                # Fill other fields with defaults
                for key, schema_def in self.output_schema.items():
                    if key != "result":
                        output_type = schema_def.get("type", "string")
                        outputs[key] = self._get_default_value(output_type)
            else:
                # Put in first field and default the rest
                first_key = list(self.output_schema.keys())[0]
                outputs[first_key] = formatted_result
                for key, schema_def in self.output_schema.items():
                    if key != first_key:
                        output_type = schema_def.get("type", "string")
                        outputs[key] = self._get_default_value(output_type)
        
        return outputs
    
    def _get_default_value(self, output_type: str) -> Any:
        """Get default value for a given type."""
        if output_type == "string":
            return ""
        elif output_type in ["int", "integer", "number"]:
            return 0
        elif output_type == "float":
            return 0.0
        elif output_type in ["bool", "boolean"]:
            return False
        elif output_type in ["array", "list"]:
            return []
        elif output_type in ["object", "dict", "json"]:
            return {}
        else:
            return None
    
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