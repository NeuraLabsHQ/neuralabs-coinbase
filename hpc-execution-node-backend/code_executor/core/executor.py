# core/executor.py
import asyncio
import json
from typing import Dict, Any, List, Optional
from uuid import uuid4
import time

from .element_base import ElementBase
from .schema import ConnectionType, Connection
from utils.logger import logger
from services.streaming import WebSocketStreamManager

class FlowExecutor:
    """Main class for executing flows."""
    
    def __init__(self, elements: Dict[str, ElementBase], 
                 start_element_id: str,
                 connections: List[Connection] = None,
                 stream_manager: Optional[WebSocketStreamManager] = None,
                 config: Dict[str, Any] = None):
        self.elements = elements
        self.start_element_id = start_element_id
        self.connections = connections or []
        self.output_cache = {}  # Cache for element outputs
        self.execution_order = []  # Tracks execution order
        self.stream_manager = stream_manager
        self.config = config or {}
        self.flow_id = str(uuid4())
        
        # Setup connections between elements
        self._setup_connections()
        
    async def execute_flow(self, initial_inputs: Dict[str, Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute the entire flow starting from the start element."""
        start_time = time.time()
        
        # Set initial inputs to respective elements
        if initial_inputs:
            for element_id, inputs in initial_inputs.items():
                if element_id in self.elements:
                    element = self.elements[element_id]
                    for input_name, input_value in inputs.items():
                        element.set_input(input_name, input_value)
                else:
                    logger.warning(f"Element with ID '{element_id}' not found, skipping initial inputs")
        
        # Begin execution
        await self._stream_event("flow_started", {
            "flow_id": self.flow_id,
            "start_time": start_time
        })
        
        # Get the start element (after setting inputs)
        start_element = self.elements[self.start_element_id]
        
        # Execute the start element
        try:
            result = await self._execute_element(start_element)
            
            # Prepare final result
            final_result = {
                "flow_id": self.flow_id,
                "execution_order": self.execution_order,
                "element_outputs": self.output_cache,
                "final_output": result,
                "execution_time": time.time() - start_time
            }
            
            await self._stream_event("flow_completed", final_result)
            
            return final_result
            
        except Exception as e:
            error_data = {
                "flow_id": self.flow_id,
                "error": str(e),
                "partial_execution_order": self.execution_order,
                "partial_outputs": self.output_cache,
                "execution_time": time.time() - start_time
            }
            
            await self._stream_event("flow_error", error_data)
            logger.error(f"Flow execution error: {str(e)}")
            raise
            
        except Exception as e:
            error_data = {
                "flow_id": self.flow_id,
                "error": str(e),
                "partial_execution_order": self.execution_order,
                "partial_outputs": self.output_cache,
                "execution_time": time.time() - start_time
            }
            
            await self._stream_event("flow_error", error_data)
            logger.error(f"Flow execution error: {str(e)}")
            raise
    
    async def _execute_element(self, element: ElementBase, backtracking=False) -> Dict[str, Any]:
        """Execute a single element in the flow."""
        element_id = element.element_id
        
        # Check if already executed and cached
        if element.executed and element_id in self.output_cache:
            return self.output_cache[element_id]
            
        # Check if all dependencies have been executed
        for dep in element.dependencies:
            if not dep.executed:
                # Execute dependency in backtracking mode
                await self._execute_element(dep, backtracking=True)
        
        # Stream execution start event
        await self._stream_event("element_started", {
            "flow_id": self.flow_id,
            "element_id": element_id,
            "element_type": element.element_type,
            "element_name": element.name,
            "backtracking": backtracking
        })
        
        try:
            # Execute the element
            outputs = await element.execute(self, backtracking)
            
            # Mark as executed and cache outputs
            element.executed = True
            self.output_cache[element_id] = outputs
            self.execution_order.append(element_id)
            
            # Stream execution completed event
            await self._stream_event("element_completed", {
                "flow_id": self.flow_id,
                "element_id": element_id,
                "element_type": element.element_type,
                "element_name": element.name,
                "outputs": outputs,
                "backtracking": backtracking
            })
            

            # Handle data connections
            await self._transfer_data(element, outputs)
            
            # If not in backtracking mode and downwards execution is allowed,
            # continue with downstream elements (control flow)
            if not backtracking and element.downwards_execute:
                # Get control flow connections for this element
                control_connections = self._get_control_connections(element_id)
                for conn_id in control_connections:
                    if conn_id in self.elements:
                        # Execute connected element
                        await self._execute_element(self.elements[conn_id])
            
            

            
            return outputs
            
        except Exception as e:
            # Stream error event
            await self._stream_event("element_error", {
                "flow_id": self.flow_id,
                "element_id": element_id,
                "element_type": element.element_type,
                "element_name": element.name,
                "error": str(e),
                "backtracking": backtracking
            })
            logger.error(f"Error executing element {element_id}: {str(e)}")
            raise
    
    async def _stream_event(self, event_type: str, data: Dict[str, Any]):
        """Stream execution events to Backend 2."""
        if self.stream_manager:
            event = {
                "type": event_type,
                "timestamp": time.time(),
                "data": data
            }
            await self.stream_manager.send_message(json.dumps(event))
            logger.debug(f"Streamed event: {event_type}")
    
    def _setup_connections(self):
        """Setup connections between elements based on connection definitions."""
        for conn in self.connections:
            from_element = self.elements.get(conn.from_id)
            to_element = self.elements.get(conn.to_id)
            
            if not from_element or not to_element:
                logger.warning(f"Connection references non-existent element: {conn.from_id} -> {conn.to_id}")
                continue
            
            # Setup control flow connections
            if conn.connection_type in [ConnectionType.CONTROL, ConnectionType.BOTH]:
                from_element.connect(to_element)
            
            # Setup data mappings
            if conn.connection_type in [ConnectionType.DATA, ConnectionType.BOTH]:
                if conn.from_output and conn.to_input:
                    # Parse the variable references
                    from_parts = conn.from_output.split(":")
                    to_parts = conn.to_input.split(":")
                    
                    if len(from_parts) == 2 and len(to_parts) == 2:
                        from_elem_id, from_var = from_parts
                        to_elem_id, to_var = to_parts
                        
                        # Map the output to input
                        if from_elem_id == conn.from_id and to_elem_id == conn.to_id:
                            from_element.map_output_to_input(to_element, from_var, to_var)
    
    def _get_control_connections(self, element_id: str) -> List[str]:
        """Get elements connected via control flow from the given element."""
        connected_elements = []
        for conn in self.connections:
            if (conn.from_id == element_id and 
                conn.connection_type in [ConnectionType.CONTROL, ConnectionType.BOTH]):
                connected_elements.append(conn.to_id)
        return connected_elements
    
    async def _transfer_data(self, element: ElementBase, outputs: Dict[str, Any]):
        """Transfer data from element outputs to connected element inputs."""
        element_id = element.element_id
        logger.info(f"🔗 _transfer_data called for element {element_id} with outputs: {outputs}")
        
        # Use the existing output_map mechanism
        for output_mapping in element.output_map:
            if (output_mapping["dependent_element"] in element.connections 
                and output_mapping["output_variable"] in outputs 
                and output_mapping["input_variable"] in output_mapping["dependent_element"].input_schema):
                
                output_mapping["dependent_element"].set_input(
                    output_mapping["input_variable"], outputs[output_mapping["output_variable"]])
                logger.info(f"🔗 Used output_map to transfer {output_mapping['output_variable']} -> {output_mapping['input_variable']}")
        
        # Also check for data connections in the connections list
        logger.info(f"🔗 Checking {len(self.connections)} connections for data transfer from {element_id}")
        for conn in self.connections:
            logger.info(f"🔗 Connection: {conn.from_id} -> {conn.to_id}, type: {conn.connection_type}, from_output: {conn.from_output}, to_input: {conn.to_input}")
            
            if (conn.from_id == element_id and 
                conn.connection_type in [ConnectionType.DATA, ConnectionType.BOTH]):
                
                to_element = self.elements.get(conn.to_id)
                logger.info(f"🔗 Found data connection from {element_id} to {conn.to_id}, to_element exists: {to_element is not None}")
                
                if to_element and conn.from_output and conn.to_input:
                    # Parse variable references
                    from_parts = conn.from_output.split(":")
                    to_parts = conn.to_input.split(":")
                    
                    logger.info(f"🔗 Parsing connection: from_parts={from_parts}, to_parts={to_parts}")
                    
                    if len(from_parts) == 2 and len(to_parts) == 2:
                        _, from_var = from_parts
                        _, to_var = to_parts
                        
                        logger.info(f"🔗 Looking for {from_var} in outputs {list(outputs.keys())}")
                        
                        if from_var in outputs:
                            logger.info(f"🔗 ✅ Transferring data: {from_var}='{outputs[from_var]}' -> {to_var} on element {conn.to_id}")
                            to_element.set_input(to_var, outputs[from_var])
                        else:
                            logger.warning(f"🔗 ❌ Output variable {from_var} not found in outputs {list(outputs.keys())}")
                    else:
                        logger.warning(f"🔗 ❌ Invalid connection format: from_output={conn.from_output}, to_input={conn.to_input}")
                else:
                    logger.warning(f"🔗 ❌ Cannot transfer data: to_element={to_element is not None}, from_output={conn.from_output}, to_input={conn.to_input}")
