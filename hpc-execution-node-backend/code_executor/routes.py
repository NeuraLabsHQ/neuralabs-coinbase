from fastapi import FastAPI, HTTPException, Request, WebSocket, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
from typing import Optional, Dict, Any, List

from config import settings
from core.executor import FlowExecutor
from core.schema import Connection as ConnectionSchema, ConnectionType, FlowDefinition, NodeDefinition
from services.streaming import WebSocketStreamManager, DirectResponseStreamManager, SSEStreamManager
from utils.logger import logger
from elements import element_registry  # Import from app.py

class ExecuteFlowRequest(BaseModel):
    flow_id: str
    flow_definition: FlowDefinition
    initial_inputs: dict | None = None
    backend2_ws_url: Optional[str] = None  # Make this optional
    stream_mode: str = "sse"  # Options: "sse", "ws", "backend2"
    config: dict | None = None

async def execute_flow(request: ExecuteFlowRequest, background_tasks: BackgroundTasks):
    """Execute a flow and stream results back to the caller."""
    try:
        stream_manager = None
        
        # Handle streaming mode
        if request.stream_mode == "backend2" and request.backend2_ws_url:
            # Legacy mode: stream to Backend 2
            stream_manager = WebSocketStreamManager(request.backend2_ws_url)
            connected = await stream_manager.connect()
            
            if not connected:
                raise HTTPException(status_code=500, detail="Failed to connect to Backend 2 WebSocket")
        elif request.stream_mode == "sse":
            # Server-Sent Events mode
            stream_manager = SSEStreamManager()
        # The "ws" mode will be handled separately in the WebSocket endpoint
        
        # Parse the flow definition
        flow_def = request.flow_definition
        
        # Create element instances and setup the flow executor
        # elements, executor = await setup_flow_executor(flow_def, stream_manager, request.config)
        elements, executor = await setup_flow_executor(flow_def, stream_manager)
        
        
        # Execute the flow in the background
        background_tasks.add_task(
            execute_flow_task, 
            executor, 
            request.initial_inputs, 
            request.flow_id, 
            stream_manager
        )
        
        # If SSE streaming, return a streaming response
        if request.stream_mode == "sse":
            return StreamingResponse(
                stream_manager.get_messages(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream"
                }
            )
        
        # Otherwise, return a status message
        return {
            "status": "started", 
            "flow_id": request.flow_id,
            "message": f"Flow execution started in {request.stream_mode} mode"
        }
    
    except Exception as e:
        logger.error(f"Error executing flow: {str(e)}")
        # Try to notify about the error if stream_manager exists
        if 'stream_manager' in locals() and stream_manager:
            try:
                await stream_manager.send_message(json.dumps({
                    "type": "flow_error",
                    "data": {
                        "flow_id": request.flow_id,
                        "error": str(e)
                    }
                }))
            except Exception as ws_error:
                logger.error(f"Failed to send error to stream: {str(ws_error)}")
                
        raise HTTPException(status_code=500, detail=str(e))

async def execute_flow_websocket(websocket: WebSocket, flow_id: str, flow_definition_str: str, 
                               initial_inputs_str: Optional[str] = None, config_str: Optional[str] = None):
    """WebSocket endpoint for executing flows with direct WebSocket streaming."""
    
    try:
        # Parse the JSON strings
        flow_definition = json.loads(flow_definition_str)
        initial_inputs  = json.loads(initial_inputs_str) if initial_inputs_str else None
        config          = json.loads(config_str) if config_str else None
        
        # Create flow definition model - handle both old and new formats
        logger.info(f"Received flow_definition type: {type(flow_definition)}")
        logger.info(f"Received flow_definition keys: {list(flow_definition.keys()) if isinstance(flow_definition, dict) else 'not a dict'}")
        
        # Preprocess flow definition to ensure compatibility
        processed_flow = flow_definition.copy()
        
        # If nodes exist, preprocess them
        if "nodes" in processed_flow:
            for node_id, node_data in processed_flow["nodes"].items():
                # Ensure node data has all required fields
                if not isinstance(node_data, dict):
                    continue
                    
                # Don't add element_id and name to node_data anymore
                # We'll handle these separately in setup_flow_executor
                    
                # Ensure input_schema and output_schema are present
                if "input_schema" not in node_data:
                    node_data["input_schema"] = {}
                if "output_schema" not in node_data:
                    node_data["output_schema"] = {}
                    
        # Create flow definition
        try:
            flow_def = FlowDefinition(**processed_flow)
            logger.info("Successfully created FlowDefinition")
        except Exception as e:
            logger.error(f"Failed to create FlowDefinition: {str(e)}")
            logger.error(f"Processed flow data: {json.dumps(processed_flow, indent=2)}")
            raise
        
        # Create a direct WebSocket stream manager
        stream_manager = DirectResponseStreamManager(websocket)
        
        # Setup the flow executor
        elements, executor = await setup_flow_executor(flow_def, stream_manager, config)
        
        # Execute the flow
        await execute_flow_task(executor, initial_inputs, flow_id, stream_manager)
        
    except Exception as e:
        error_msg = f"Error executing flow via WebSocket: {str(e)}"
        logger.error(error_msg)
        try:
            await websocket.send_text(json.dumps({
                "type": "flow_error",
                "data": {
                    "flow_id": flow_id,
                    "error": str(e)
                }
            }))
        except Exception:
            pass

async def setup_flow_executor(flow_def: FlowDefinition, stream_manager, user_config: Optional[Dict[str, Any]] = None):
    """Setup the flow executor with elements and connections."""
    # Create element instances
    elements = {}
    nodes = flow_def.nodes or flow_def.elements
    if not nodes:
        raise HTTPException(status_code=400, detail="No nodes/elements found in flow definition")
    
    for elem_id, node_data in nodes.items():
        elem_type = node_data.type
        if elem_type not in element_registry:
            raise HTTPException(status_code=400, detail=f"Unknown element type: {elem_type}")
        
        # Create element instance based on type
        ElementClass = element_registry[elem_type]
        
        # Extract common parameters
        # Use the node's name if available, otherwise use description or elem_id
        element_name = getattr(node_data, 'name', None) or node_data.description or elem_id
        
        common_params = {
            "element_id": elem_id,
            "name": element_name,
            "description": node_data.description or "",
            "input_schema": node_data.input_schema or {},
            "output_schema": node_data.output_schema or {},
        }
        
        # Add new structure parameters if available
        if hasattr(node_data, 'node_description'):
            common_params["node_description"] = node_data.node_description
        if hasattr(node_data, 'processing_message'):
            common_params["processing_message"] = node_data.processing_message
        if hasattr(node_data, 'tags'):
            common_params["tags"] = node_data.tags
        if hasattr(node_data, 'layer'):
            common_params["layer"] = node_data.layer
        if hasattr(node_data, 'parameters'):
            common_params["parameters"] = node_data.parameters
        
        # Extract additional parameters specific to the element type
        # Make sure to exclude all common params to avoid duplicates
        additional_params = {k: v for k, v in node_data.dict().items() 
                           if k not in ["type", "node_description", "description", "processing_message", 
                                      "tags", "layer", "parameters", "input_schema", "output_schema",
                                      "element_id", "name"]}  # Exclude element_id and name
        
        # Handle parameters for specific element types
        if elem_type == "llm_text" and hasattr(node_data, 'parameters'):
            params = node_data.parameters or {}
            additional_params.update({
                "model": params.get("model"),
                "temperature": params.get("temperature", 0.65),
                "max_tokens": params.get("max_tokens", 1000),
                "wrapper_prompt": params.get("wrapper_prompt", "")
            })
        
        # Log the params for debugging
        logger.info(f"Creating element {elem_id} of type {elem_type}")
        logger.info(f"Common params keys: {list(common_params.keys())}")
        logger.info(f"Additional params keys: {list(additional_params.keys())}")
        
        # Check for duplicate keys
        duplicate_keys = set(common_params.keys()) & set(additional_params.keys())
        if duplicate_keys:
            logger.warning(f"Duplicate keys found: {duplicate_keys}")
        
        # Create the element instance
        try:
            # Merge params, with common_params taking precedence
            all_params = {**additional_params, **common_params}
            logger.info(f"All params keys: {list(all_params.keys())}")
            elements[elem_id] = ElementClass(**all_params)
        except Exception as e:
            logger.error(f"Failed to create element {elem_id}: {str(e)}")
            logger.error(f"ElementClass: {ElementClass}")
            logger.error(f"All params: {all_params}")
            raise
    
    # Convert connections to schema objects
    connections = []
    for conn in flow_def.connections:
        connection = ConnectionSchema(
            from_id=conn.from_id,
            to_id=conn.to_id,
            connection_type=ConnectionType(conn.connection_type) if hasattr(conn, 'connection_type') else ConnectionType.BOTH,
            from_output=conn.from_output,
            to_input=conn.to_input
        )
        connections.append(connection)

    
    # Merge configuration
    config = {}
    if settings:
        config.update({k: v for k, v in vars(settings).items() if not k.startswith('_')})    
    
    if user_config:
        config.update(user_config)
    
    # Create the flow executor
    start_element = flow_def.start_element or flow_def.start_element_id
    if not start_element:
        raise HTTPException(status_code=400, detail="No start element specified in flow definition")
    
    executor = FlowExecutor(
        elements=elements,
        start_element_id=start_element,
        connections=connections,
        stream_manager=stream_manager,
        config=config
    )
    
    return elements, executor

async def execute_flow_task(executor: FlowExecutor, initial_inputs, flow_id, stream_manager):
    """Execute the flow and handle cleanup."""
    try:
        # Execute the flow
        result = await executor.execute_flow(initial_inputs)
        logger.info(f"Flow {flow_id} execution completed successfully")
        
    except Exception as e:
        logger.error(f"Error during flow {flow_id} execution: {str(e)}")
        # Try to notify about the error
        try:
            await stream_manager.send_message(json.dumps({
                "type": "flow_error",
                "data": {
                    "flow_id": flow_id,
                    "error": str(e)
                }
            }))
        except Exception:
            pass
    finally:
        # Disconnect stream manager
        try:
            await stream_manager.disconnect()
        except Exception as disconnect_error:
            logger.error(f"Error disconnecting stream manager: {str(disconnect_error)}")

async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

async def log_requests(request: Request, call_next):
    """Middleware to log all requests."""
    start_time = asyncio.get_event_loop().time()
    response = await call_next(request)
    process_time = asyncio.get_event_loop().time() - start_time
    
    logger.info(f"Request {request.method} {request.url.path} completed in {process_time:.3f}s with status {response.status_code}")
    
    return response