# elements/onchain/build_transaction_json.py
from typing import Dict, Any, List, Optional
import json

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs, validate_outputs

# Try importing web3 for Ethereum transaction building
try:
    from web3 import Web3
    HAS_WEB3 = True
except ImportError:
    logger.warning("web3 not installed. Install with: pip install web3")
    HAS_WEB3 = False

class BuildTransactionJSON(ElementBase):
    """Build Transaction JSON element for creating Ethereum/Base blockchain transaction payloads.
    
    This element creates transaction payloads for:
    - Simple ETH transfers
    - Smart contract function calls (write operations)
    - ERC20 transfers, approvals, minting, etc.
    
    The element adapts to user-defined input schemas and builds appropriate
    transaction payloads based on the function being called.
    
    Input Schema Flexibility:
    The input schema is completely user-defined. Common fields include:
    - from/sender: The sender address
    - to/recipient: The recipient address (or contract address)
    - value/amount: ETH amount to send (in wei or as string)
    - gas/gas_limit: Gas limit for the transaction
    - gasPrice/gas_price: Gas price in wei
    - nonce: Transaction nonce (optional, usually auto-managed)
    - Function parameters: Any parameters required by the contract function
    """
    
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
        self.chain_id = params.get("chain_id", 84532)  # Default to Base Sepolia
        self.node_url = params.get("node_url", "")
        self.contract_address = params.get("contract_address", "")
        self.contract_abi = params.get("contract_abi", [])
        self.function_name = params.get("function_name", "")
        self.function_args = params.get("function_args", [])
        
        # Handle contract_abi if it's a JSON string
        if isinstance(self.contract_abi, str):
            try:
                self.contract_abi = json.loads(self.contract_abi)
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse contract_abi: {e}")
                self.contract_abi = []
    
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
        
        # Validate inputs if schema is defined
        if self.input_schema:
            validation_result = validate_inputs(self.inputs, self.input_schema)
            if not validation_result["valid"]:
                error_msg = f"Invalid inputs for build transaction JSON element: {validation_result['error']}"
                logger.error(error_msg)
                raise ValueError(error_msg)
        
        # Apply default values from input schema if inputs are missing
        function_inputs = self.inputs.copy()
        if self.input_schema:
            for key, schema in self.input_schema.items():
                if key not in function_inputs and 'default' in schema:
                    function_inputs[key] = schema['default']
        
        # Stream transaction build request info
        await executor._stream_event("transaction_build_request", {
            "element_id": self.element_id,
            "contract_address": self.contract_address,
            "function_name": self.function_name,
            "chain_id": self.chain_id
        })
        
        try:
            # Build Ethereum transaction
            transaction_json = await self._build_ethereum_transaction(function_inputs)
            
            # Set output to the transaction JSON
            self.outputs = {"transaction_json": transaction_json}
            
            # Validate outputs if schema is defined
            if self.output_schema:
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
    
    async def _build_ethereum_transaction(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Build an Ethereum/Base transaction.
        
        Supports flexible input naming:
        - from/sender for the sender address
        - to/recipient for the recipient address
        - value/amount for ETH amount
        - gas/gas_limit for gas limit
        - gasPrice/gas_price for gas price
        """
        # Get common fields from inputs with flexible naming
        from_address = inputs.get("from", inputs.get("sender", ""))
        to_address = inputs.get("to", inputs.get("recipient", self.contract_address))
        
        # Handle amount - could be under 'value' or 'amount' key
        value = inputs.get("value", inputs.get("amount", "0"))
        
        gas = inputs.get("gas", inputs.get("gas_limit", None))
        gas_price = inputs.get("gasPrice", inputs.get("gas_price", None))
        nonce = inputs.get("nonce", None)
        
        # Basic transaction structure
        tx = {
            "from": from_address,
            "chainId": self.chain_id
        }
        
        # Add optional fields if provided
        if to_address:
            tx["to"] = to_address
        if gas:
            tx["gas"] = hex(int(gas)) if isinstance(gas, (int, str)) and not str(gas).startswith('0x') else gas
        if gas_price:
            tx["gasPrice"] = hex(int(gas_price)) if isinstance(gas_price, (int, str)) and not str(gas_price).startswith('0x') else gas_price
        if nonce is not None:
            tx["nonce"] = hex(int(nonce)) if isinstance(nonce, (int, str)) and not str(nonce).startswith('0x') else nonce
        
        # Determine transaction type
        if not self.contract_address or not self.function_name:
            # Simple ETH transfer
            tx["value"] = self._to_hex_value(value)
            tx["data"] = "0x"
        else:
            # Contract interaction
            tx["to"] = self.contract_address
            tx["value"] = self._to_hex_value(value)  # Usually "0x0" for contract calls
            
            # Encode function call data
            if HAS_WEB3 and self.contract_abi:
                try:
                    tx["data"] = self._encode_function_data(inputs)
                except Exception as e:
                    logger.error(f"Error encoding function data: {e}")
                    # Fallback to empty data
                    tx["data"] = "0x"
            else:
                # Without web3, can't encode properly
                logger.warning("web3 not available or no ABI provided. Cannot encode function data.")
                tx["data"] = "0x"
        
        return tx
    
    def _encode_function_data(self, inputs: Dict[str, Any]) -> str:
        """Encode function call data using web3.
        
        This method:
        1. Finds the function in the ABI (handles overloaded functions by matching input schema)
        2. Extracts parameters from the user inputs
        3. Converts parameters to appropriate types
        4. Encodes the function call
        """
        if not HAS_WEB3:
            raise ValueError("web3 is required for encoding function data")
        
        w3 = Web3()
        
        # Find all functions with the given name (handles overloading)
        matching_functions = []
        for item in self.contract_abi:
            if item.get("type") == "function" and item.get("name") == self.function_name:
                matching_functions.append(item)
        
        if not matching_functions:
            raise ValueError(f"Function '{self.function_name}' not found in ABI")
        
        # If only one function found, use it
        if len(matching_functions) == 1:
            function_abi = matching_functions[0]
        else:
            # Multiple functions with same name - match using input schema
            function_abi = self._match_function_by_schema(matching_functions)
        
        # Build contract instance
        contract = w3.eth.contract(abi=[function_abi])
        
        # Prepare function arguments
        args = []
        for abi_input in function_abi.get("inputs", []):
            param_name = abi_input.get("name")
            param_type = abi_input.get("type")
            
            # Look for parameter in inputs
            value = None
            if param_name and param_name in inputs:
                value = inputs[param_name]
            elif f"arg{len(args)}" in inputs:
                # Fallback to indexed args (arg0, arg1, etc.)
                value = inputs[f"arg{len(args)}"]
            elif len(function_abi.get("inputs", [])) == 1 and "value" in inputs:
                # Single parameter function with "value" input
                value = inputs["value"]
            
            if value is not None:
                # Type conversion based on Solidity type
                if param_type == "address":
                    value = Web3.to_checksum_address(str(value))
                elif param_type.startswith("uint") or param_type.startswith("int"):
                    value = int(value)
                elif param_type == "bool":
                    value = bool(value)
                elif param_type.startswith("bytes"):
                    if isinstance(value, str) and not value.startswith("0x"):
                        value = "0x" + value
                elif param_type == "string":
                    value = str(value)
                elif param_type.endswith("[]"):
                    # Array type
                    if not isinstance(value, list):
                        value = [value]
                # Add more type conversions as needed
                
                args.append(value)
            else:
                raise ValueError(f"Missing required parameter: {param_name}")
        
        # Encode the function call
        function = getattr(contract.functions, self.function_name)
        return function(*args).build_transaction({"gas": 0})["data"]
    
    def _match_function_by_schema(self, functions: List[Dict]) -> Dict:
        """Match the correct overloaded function based on input schema.
        
        The user's input schema should define fields that match the function parameters.
        For example, if input schema has 'recipient' and 'amount', it matches
        transfer(address recipient, uint256 amount) rather than transfer(address to, uint256 value).
        """
        # Get parameter names from input schema, excluding common transaction fields
        schema_params = set()
        if self.input_schema:
            schema_params = set(self.input_schema.keys()) - {
                'from', 'sender', 'to', 'value', 'gas', 'gas_limit', 
                'gasPrice', 'gas_price', 'nonce', 'chainId'
            }
        
        best_match = None
        best_score = -1
        
        for func in functions:
            score = 0
            func_inputs = func.get("inputs", [])
            
            # Extract parameter names from function
            func_param_names = {inp.get("name", "") for inp in func_inputs if inp.get("name")}
            
            # Score based on exact parameter name matches
            matching_params = schema_params & func_param_names
            score += len(matching_params) * 2
            
            # Bonus if ALL schema params match ALL function params
            if schema_params == func_param_names and len(schema_params) > 0:
                score += 10
            
            # Score based on parameter count match
            if len(schema_params) == len(func_inputs):
                score += 1
            
            # Track the best match
            if score > best_score:
                best_score = score
                best_match = func
        
        if not best_match:
            # Fallback: use the function with matching parameter count
            for func in functions:
                if len(func.get("inputs", [])) == len(schema_params):
                    best_match = func
                    break
        
        if not best_match:
            best_match = functions[0]
            logger.warning(
                f"Could not match function '{self.function_name}' by schema. "
                f"Input schema params: {schema_params}. "
                f"Using first overload with {len(best_match.get('inputs', []))} parameters."
            )
        else:
            logger.info(
                f"Matched function '{self.function_name}' with parameters: "
                f"{[inp.get('name', f'param{i}') for i, inp in enumerate(best_match.get('inputs', []))]}"
            )
        
        return best_match
    
    def _to_hex_value(self, value: Any) -> str:
        """Convert value to hex format for Ethereum.
        
        Handles:
        - ETH amounts: "0.005" -> converts to wei then hex
        - Decimal strings: "1000" -> "0x3e8"
        - Hex strings: "0x3e8" -> "0x3e8"
        - Integers: 1000 -> "0x3e8"
        - Wei values: Large numbers for ETH amounts
        """
        if value is None or value == "0":
            return "0x0"
            
        if isinstance(value, (int, float)):
            # Handle numeric values
            if isinstance(value, float) or (isinstance(value, int) and value < 1):
                # Assume it's ETH, convert to wei
                wei_value = int(value * 10**18)
                return hex(wei_value)
            else:
                return hex(int(value))
        elif isinstance(value, str):
            if value.startswith("0x"):
                return value
            try:
                # Check if it's a decimal (ETH amount)
                if "." in value:
                    eth_value = float(value)
                    wei_value = int(eth_value * 10**18)
                    return hex(wei_value)
                else:
                    # Integer wei value
                    int_value = int(value)
                    return hex(int_value)
            except ValueError:
                # If it's not a number, assume it's already hex without 0x
                return "0x" + value
        else:
            return "0x0"
    
    def _get_transaction_type(self, transaction_json: Dict[str, Any]) -> str:
        """Determine the type of transaction."""
        if not isinstance(transaction_json, dict):
            return "unknown"
        
        # Check data field
        data = transaction_json.get("data", "0x")
        if data == "0x" or not data:
            return "transfer"
        else:
            return "contract_call"
    
    def _redact_sensitive_tx_data(self, tx_data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact sensitive data from transaction JSON for logging."""
        if not isinstance(tx_data, dict):
            return tx_data
            
        # Create a copy to avoid modifying the original
        safe_tx = tx_data.copy()
        
        # Redact addresses
        for field in ["from", "to", "sender", "recipient"]:
            if field in safe_tx and isinstance(safe_tx[field], str) and len(safe_tx[field]) > 8:
                safe_tx[field] = safe_tx[field][:6] + "..." + safe_tx[field][-4:]
        
        return safe_tx