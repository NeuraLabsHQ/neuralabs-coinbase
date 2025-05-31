# elements/onchain/read_blockchain_data.py
from typing import Dict, Any, Optional
import json
import aiohttp

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs, validate_outputs

class ReadBlockchainData(ElementBase):
    """Read Blockchain Data element for reading data from blockchain networks, primarily SUI."""
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="read_blockchain_data",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        # Extract parameters
        params = parameters or {}
        self.node_url = params.get("node_url", "https://fullnode.mainnet.sui.io")
        self.network = params.get("network", "mainnet")
        self.api_key = params.get("api_key", "")
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the read blockchain data element."""
        # Log execution
        logger.info(f"Executing read blockchain data element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": "Reading blockchain data..."
            })
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for read blockchain data element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Get query parameters from inputs
        query_type = self.inputs.get("query_type", "balance")
        address = self.inputs.get("address", "")
        parameters = self.inputs.get("parameters", {})
        
        # Stream blockchain request info
        await executor._stream_event("blockchain_request", {
            "element_id": self.element_id,
            "query_type": query_type,
            "address": address,
            "network": self.network,
            "node_url": self.node_url
        })
        
        try:
            # Execute the blockchain query based on type
            if query_type == "balance":
                result = await self._query_balance(address, parameters)
            elif query_type == "object":
                result = await self._query_object(address, parameters)
            elif query_type == "transaction":
                result = await self._query_transaction(address, parameters)
            elif query_type == "events":
                result = await self._query_events(parameters)
            elif query_type == "contract_call":
                result = await self._query_contract_call(address, parameters)
            else:
                raise ValueError(f"Unsupported query type: {query_type}")
            
            # Set outputs
            self.outputs = {
                "data": result.get("data", {}),
                "success": result.get("success", True),
                "error": result.get("error"),
                "metadata": result.get("metadata", {})
            }
            
            # Validate outputs
            validation_result = validate_outputs(self.outputs, self.output_schema)
            if not validation_result["valid"]:
                error_msg = f"Invalid outputs from read blockchain data: {validation_result['error']}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Stream blockchain response
            await executor._stream_event("blockchain_response", {
                "element_id": self.element_id,
                "query_type": query_type,
                "success": self.outputs["success"],
                "data_preview": str(self.outputs["data"])[:200] + ("..." if len(str(self.outputs["data"])) > 200 else "")
            })
            
            return self.outputs
            
        except Exception as e:
            error_msg = f"Error reading blockchain data: {str(e)}"
            logger.error(error_msg)
            
            # Stream error info
            await executor._stream_event("blockchain_error", {
                "element_id": self.element_id,
                "error": error_msg
            })
            
            # Return error in standard format
            self.outputs = {
                "data": {},
                "success": False,
                "error": error_msg,
                "metadata": {}
            }
            return self.outputs
    
    async def _make_rpc_call(self, method: str, params: list) -> Dict[str, Any]:
        """Make an RPC call to the blockchain node."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.node_url, json=payload, headers=headers) as response:
                if response.status != 200:
                    raise Exception(f"RPC call failed with status {response.status}")
                
                result = await response.json()
                
                if "error" in result:
                    raise Exception(f"RPC error: {result['error']}")
                
                return result.get("result", {})
    
    async def _query_balance(self, address: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Query account balance."""
        try:
            coin_type = parameters.get("coin_type", "0x2::sui::SUI")
            
            # Call suix_getBalance for SUI balance
            result = await self._make_rpc_call("suix_getBalance", [address, coin_type])
            
            # Convert MIST to SUI for display
            balance_mist = int(result.get("totalBalance", "0"))
            balance_sui = balance_mist / 1e9
            
            return {
                "success": True,
                "data": {
                    "balance": str(balance_mist),
                    "balance_in_sui": str(balance_sui),
                    "coin_type": coin_type,
                    "coin_object_count": result.get("coinObjectCount", 0)
                },
                "metadata": {
                    "address": address,
                    "query_type": "balance"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "error": str(e),
                "metadata": {"address": address, "query_type": "balance"}
            }
    
    async def _query_object(self, address: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Query SUI object data."""
        try:
            show_content = parameters.get("show_content", True)
            show_owner = parameters.get("show_owner", True)
            show_type = parameters.get("show_type", True)
            
            options = {
                "showContent": show_content,
                "showOwner": show_owner,
                "showType": show_type
            }
            
            result = await self._make_rpc_call("sui_getObject", [address, options])
            
            return {
                "success": True,
                "data": result.get("data", {}),
                "metadata": {
                    "object_id": address,
                    "query_type": "object"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "error": str(e),
                "metadata": {"object_id": address, "query_type": "object"}
            }
    
    async def _query_transaction(self, address: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Query transaction details."""
        try:
            show_input = parameters.get("show_input", True)
            show_effects = parameters.get("show_effects", True)
            show_events = parameters.get("show_events", True)
            
            options = {
                "showInput": show_input,
                "showEffects": show_effects,
                "showEvents": show_events
            }
            
            result = await self._make_rpc_call("sui_getTransactionBlock", [address, options])
            
            return {
                "success": True,
                "data": result,
                "metadata": {
                    "transaction_digest": address,
                    "query_type": "transaction"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "error": str(e),
                "metadata": {"transaction_digest": address, "query_type": "transaction"}
            }
    
    async def _query_events(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Query blockchain events."""
        try:
            event_type = parameters.get("event_type")
            sender = parameters.get("sender")
            recipient = parameters.get("recipient")
            limit = parameters.get("limit", 10)
            descending_order = parameters.get("descending_order", True)
            
            # Build event filter
            event_filter = {}
            if event_type:
                event_filter["MoveEventType"] = event_type
            elif sender:
                event_filter["Sender"] = sender
            
            result = await self._make_rpc_call("suix_queryEvents", [
                event_filter,
                None,  # cursor
                limit,
                descending_order
            ])
            
            return {
                "success": True,
                "data": {
                    "events": result.get("data", []),
                    "next_cursor": result.get("nextCursor"),
                    "has_next_page": result.get("hasNextPage", False)
                },
                "metadata": {
                    "event_filter": event_filter,
                    "query_type": "events"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "error": str(e),
                "metadata": {"query_type": "events"}
            }
    
    async def _query_contract_call(self, address: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Query smart contract view function."""
        try:
            module = parameters.get("module", "")
            function = parameters.get("function", "")
            type_arguments = parameters.get("type_arguments", [])
            arguments = parameters.get("arguments", [])
            
            # Construct function name
            function_name = f"{address}::{module}::{function}"
            
            result = await self._make_rpc_call("sui_devInspectTransactionBlock", [
                {
                    "sender": "0x" + "0" * 64,  # Dummy sender for view calls
                    "gasPrice": "1000",
                    "gasBudget": "10000000",
                    "transactions": [{
                        "kind": "MoveCall",
                        "data": {
                            "package": address,
                            "module": module,
                            "function": function,
                            "typeArguments": type_arguments,
                            "arguments": arguments
                        }
                    }]
                }
            ])
            
            return {
                "success": True,
                "data": {
                    "result": result.get("results", []),
                    "effects": result.get("effects", {}),
                    "events": result.get("events", [])
                },
                "metadata": {
                    "package": address,
                    "function": function_name,
                    "query_type": "contract_call"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "error": str(e),
                "metadata": {"package": address, "query_type": "contract_call"}
            }
