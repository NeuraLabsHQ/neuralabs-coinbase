"""
Chat websocket route for streaming flow execution
Acts as intermediary between frontend and HPC execution engine
"""
import json
import asyncio
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, Optional
import logging
from ..modules.database.postgresconn import PostgresConnection
from ..modules.authentication.jwt.token import JWTHandler

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration for HPC execution engine
HPC_WEBSOCKET_URL = "ws://localhost:8000/ws/execute/{flow_id}"

class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.hpc_connections: Dict[str, Any] = {}
    
    async def connect(self, websocket: WebSocket, flow_id: str):
        """Accept WebSocket connection from frontend"""
        await websocket.accept()
        self.active_connections[flow_id] = websocket
        logger.info(f"Frontend connected for flow: {flow_id}")
    
    def disconnect(self, flow_id: str):
        """Remove connection"""
        if flow_id in self.active_connections:
            del self.active_connections[flow_id]
        if flow_id in self.hpc_connections:
            del self.hpc_connections[flow_id]
        logger.info(f"Disconnected flow: {flow_id}")
    
    async def send_to_frontend(self, flow_id: str, message: dict):
        """Send message to frontend WebSocket"""
        if flow_id in self.active_connections:
            try:
                await self.active_connections[flow_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending to frontend {flow_id}: {e}")
                self.disconnect(flow_id)

manager = ConnectionManager()

async def get_workflow_from_db(agent_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve workflow data from database for the given agent and user
    Checks both unpublished and published tables based on publication status
    """
    try:
        pg_conn = PostgresConnection()
        
        # First, get the agent info to check publication status
        agent_query = """
            SELECT agent_id, owner, status
            FROM agent
            WHERE agent_id = %s
        """
        
        agent_result = await pg_conn.execute_query(agent_query, (agent_id,))
        
        if not agent_result or len(agent_result) == 0:
            logger.warning(f"No agent found for agent_id {agent_id}")
            return None
        
        agent_info = agent_result[0]
        agent_status = agent_info.get('status', 'Not Published')
        is_published = agent_status == 'Active'
        
        logger.info(f"Agent {agent_id} status: {agent_status}, is_published: {is_published}")
        
        # Query the appropriate table based on publication status
        if is_published:
            # Query published_agent table
            workflow_query = """
                SELECT workflow
                FROM published_agent 
                WHERE agent_id = %s
            """
            logger.info(f"Querying published_agent table for agent {agent_id}")
        else:
            # Query unpublished_agent table
            workflow_query = """
                SELECT workflow
                FROM unpublished_agent 
                WHERE agent_id = %s
            """
            logger.info(f"Querying unpublished_agent table for agent {agent_id}")
        
        workflow_result = await pg_conn.execute_query(workflow_query, (agent_id,))
        
        if workflow_result and len(workflow_result) > 0:
            workflow_data = workflow_result[0].get('workflow')
            if workflow_data:
                logger.info(f"Found workflow for agent {agent_id} in {'published_agent' if is_published else 'unpublished_agent'} table")
                return workflow_data
        
        logger.warning(f"No workflow found for agent {agent_id} in {'published_agent' if is_published else 'unpublished_agent'} table")
        return None
        
    except Exception as e:
        logger.error(f"Error retrieving workflow: {e}")
        return None

def convert_frontend_workflow_to_hpc_format(workflow_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert frontend workflow format to HPC execution engine format
    """
    try:
        # Extract nodes and edges from frontend format
        nodes = workflow_data.get('nodes', [])
        edges = workflow_data.get('edges', [])
        
        # Convert to HPC format
        hpc_nodes = {}
        id_mapping = {}
        
        # Transform nodes to HPC format
        for node in nodes:
            # Create element ID with format: NodeType_timestamp
            node_type = map_node_type_to_element_type(node.get('type', ''))
            timestamp = node.get('id', '').split('-')[-1] if '-' in node.get('id', '') else str(int(asyncio.get_event_loop().time() * 1000))
            element_id = f"{node_type}_{timestamp}"
            id_mapping[node.get('id')] = element_id
            
            # Build HPC node structure
            hpc_node = {
                'type': node_type,
                'name': node.get('name', node.get('id', '')),
                'description': node.get('description', f"{node.get('type', '')} element"),
                'processing_message': node.get('processing_message', node.get('processingMessage', 'Processing...')),
                'tags': node.get('tags', []),
                'layer': node.get('layer', 3)
            }
            
            # Add parameters
            if node.get('parametersObject'):
                hpc_node['parameters'] = node['parametersObject']
            elif node.get('parameters') and isinstance(node['parameters'], list):
                params = {}
                for param in node['parameters']:
                    if param.get('name'):
                        value = param.get('value', param.get('default'))
                        if value is not None and value != '':
                            params[param['name']] = value
                if params:
                    hpc_node['parameters'] = params
            
            # Add input/output schemas
            hpc_node['input_schema'] = convert_inputs_to_schema(node.get('inputs', []))
            hpc_node['output_schema'] = convert_outputs_to_schema(node.get('outputs', []))
            
            # Add code for custom nodes
            if node.get('code'):
                if 'parameters' not in hpc_node:
                    hpc_node['parameters'] = {}
                hpc_node['parameters']['code'] = node['code']
            
            hpc_nodes[element_id] = hpc_node
        
        # Transform edges to connections
        connections = []
        for edge in edges:
            mapped_source = id_mapping.get(edge.get('source'))
            mapped_target = id_mapping.get(edge.get('target'))
            
            if mapped_source and mapped_target:
                # Add control connection
                connections.append({
                    'from_id': mapped_source,
                    'to_id': mapped_target,
                    'connection_type': 'control'
                })
                
                # Add data connections if mappings exist
                if edge.get('mappings'):
                    for mapping in edge['mappings']:
                        if mapping.get('fromOutput') and mapping.get('toInput'):
                            connections.append({
                                'from_id': mapped_source,
                                'to_id': mapped_target,
                                'connection_type': 'data',
                                'from_output': f"{mapped_source}:{mapping['fromOutput']}",
                                'to_input': f"{mapped_target}:{mapping['toInput']}"
                            })
        
        # Find start element
        start_node = next((node for node in nodes if node.get('type', '').lower() in ['start']), nodes[0] if nodes else None)
        start_element = id_mapping.get(start_node.get('id')) if start_node else None
        
        # Build final HPC flow definition
        hpc_flow = {
            'nodes': hpc_nodes,
            'connections': connections,
            'start_element': start_element
        }
        
        logger.info(f"Converted workflow to HPC format with {len(hpc_nodes)} nodes and {len(connections)} connections")
        return hpc_flow
        
    except Exception as e:
        logger.error(f"Error converting workflow format: {e}")
        raise

def map_node_type_to_element_type(node_type: str) -> str:
    """Map frontend node types to HPC element types"""
    type_map = {
        'start': 'start', 'Start': 'start',
        'end': 'end', 'End': 'end',
        'ChatInput': 'chat_input', 'chat_input': 'chat_input',
        'ContextHistory': 'context_history', 'context_history': 'context_history',
        'Datablock': 'datablock', 'datablock': 'datablock',
        'Constants': 'constants', 'constants': 'constants',
        'RestAPI': 'rest_api', 'rest_api': 'rest_api',
        'Metadata': 'metadata', 'metadata': 'metadata',
        'Selector': 'selector', 'selector': 'selector',
        'Merger': 'merger', 'merger': 'merger',
        'RandomGenerator': 'random_generator', 'random_generator': 'random_generator',
        'Time': 'time', 'time': 'time',
        'LLMText': 'llm_text', 'llm_text': 'llm_text',
        'LLMStructured': 'llm_structured', 'llm_structured': 'llm_structured',
        'ReadBlockchainData': 'read_blockchain_data', 'read_blockchain_data': 'read_blockchain_data',
        'BuildTransactionJSON': 'build_transaction_json', 'build_transaction_json': 'build_transaction_json',
        'Custom': 'custom', 'custom': 'custom',
        'Case': 'case', 'case': 'case',
        'FlowSelect': 'flow_select', 'flow_select': 'flow_select'
    }
    return type_map.get(node_type, node_type.lower())

def convert_inputs_to_schema(inputs: list) -> dict:
    """Convert frontend inputs to HPC schema format"""
    schema = {}
    for inp in inputs:
        schema[inp.get('name', '')] = {
            'type': inp.get('type', 'string'),
            'description': inp.get('description', ''),
            'required': inp.get('required', True)
        }
    return schema

def convert_outputs_to_schema(outputs: list) -> dict:
    """Convert frontend outputs to HPC schema format"""
    schema = {}
    for out in outputs:
        schema[out.get('name', '')] = {
            'type': out.get('type', 'string'),
            'description': out.get('description', ''),
            'required': out.get('required', True)
        }
    return schema

async def connect_to_hpc_engine(flow_id: str, flow_definition: Dict[str, Any], initial_inputs: Dict[str, Any]):
    """
    Connect to HPC execution engine WebSocket and handle streaming
    """
    hpc_url = HPC_WEBSOCKET_URL.format(flow_id=flow_id)
    logger.info(f"🔗 Connecting to HPC engine at: {hpc_url}")
    logger.info(f"📋 Flow definition being sent: {json.dumps(flow_definition, indent=2)}")
    logger.info(f"📥 Initial inputs: {json.dumps(initial_inputs, indent=2)}")
    
    try:
        async with websockets.connect(hpc_url) as hpc_websocket:
            manager.hpc_connections[flow_id] = hpc_websocket
            
            # HPC WebSocket handshake
            ready_msg = await hpc_websocket.recv()
            logger.info(f"✅ HPC ready: {ready_msg}")
            
            # Send flow definition
            logger.info("📤 Sending flow definition to HPC...")
            await hpc_websocket.send(json.dumps(flow_definition))
            ack1 = await hpc_websocket.recv()
            logger.info(f"📨 HPC flow definition ack: {ack1}")
            
            # Send initial inputs
            logger.info("📤 Sending initial inputs to HPC...")
            await hpc_websocket.send(json.dumps(initial_inputs))
            ack2 = await hpc_websocket.recv()
            logger.info(f"📨 HPC initial inputs ack: {ack2}")
            
            # Send config (null for now)
            logger.info("📤 Sending config to HPC...")
            await hpc_websocket.send("null")
            ack3 = await hpc_websocket.recv()
            logger.info(f"📨 HPC config ack: {ack3}")
            
            logger.info("🚀 Starting to stream events from HPC...")
            
            # Stream events from HPC to frontend
            async for message in hpc_websocket:
                try:
                    event = json.loads(message)
                    logger.info(f"📨 HPC event: {event.get('type', 'unknown')} - {event}")
                    
                    # Forward the event to frontend
                    await manager.send_to_frontend(flow_id, event)
                    
                    # Check if flow is complete
                    if event.get('type') in ['flow_completed', 'flow_error']:
                        logger.info(f"🏁 Flow {flow_id} finished with type: {event.get('type')}")
                        if event.get('type') == 'flow_error':
                            logger.error(f"❌ HPC Flow Error: {event.get('data', {}).get('error', 'Unknown error')}")
                        break
                        
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Error parsing HPC message: {e} - Raw message: {message}")
                except Exception as e:
                    logger.error(f"❌ Error forwarding message: {e}")
                    
    except websockets.exceptions.ConnectionClosed as e:
        logger.error(f"🔌 HPC connection closed for flow {flow_id}: {e}")
        await manager.send_to_frontend(flow_id, {
            'type': 'flow_error',
            'data': {'error': 'Connection to execution engine lost'}
        })
    except Exception as e:
        logger.error(f"❌ Error in HPC connection for flow {flow_id}: {e}")
        import traceback
        logger.error(f"📋 HPC connection traceback: {traceback.format_exc()}")
        await manager.send_to_frontend(flow_id, {
            'type': 'flow_error',
            'data': {'error': f'Execution engine error: {str(e)}'}
        })
    finally:
        manager.disconnect(flow_id)

@router.websocket("/execute/{agent_id}")
async def websocket_execute_flow(websocket: WebSocket, agent_id: str, token: Optional[str] = None):
    """
    WebSocket endpoint for executing flows
    
    Flow:
    1. Frontend connects to this WebSocket
    2. Verify user authentication 
    3. Retrieve workflow from database (unpublished/published based on status)
    4. Convert workflow format
    5. Connect to HPC execution engine
    6. Stream results back to frontend
    """
    flow_id = f"flow_{agent_id}_{int(asyncio.get_event_loop().time() * 1000)}"
    
    logger.info(f"🌐 NEW WEBSOCKET CONNECTION: agent_id={agent_id}, flow_id={flow_id}")
    logger.info(f"🔑 Authentication token present: {bool(token)}")
    
    await manager.connect(websocket, flow_id)
    
    try:
        # Verify authentication (extract from query param or wait for message)
        user_id = None
        if token:
            try:
                jwt_handler = JWTHandler()
                payload = jwt_handler.verify_token(token)
                if payload:
                    user_id = payload.get('user_id')
                else:
                    await websocket.send_text(json.dumps({
                        'type': 'error',
                        'data': {'error': 'Invalid authentication token'}
                    }))
                    return
            except Exception as e:
                await websocket.send_text(json.dumps({
                    'type': 'error',
                    'data': {'error': 'Invalid authentication token'}
                }))
                return
        
        # Wait for initial message with auth or input data
        logger.info("📥 Waiting for initial message from frontend...")
        initial_message = await websocket.receive_text()
        logger.info(f"📨 Received initial message: {initial_message[:200]}...")
        
        try:
            initial_data = json.loads(initial_message)
            logger.info(f"📋 Parsed initial data keys: {list(initial_data.keys())}")
            
            # Extract user_id from message if not from token
            if not user_id:
                user_id = initial_data.get('user_id')
                logger.info(f"👤 User ID from message: {user_id}")
                if not user_id:
                    logger.error("❌ No user authentication provided")
                    await websocket.send_text(json.dumps({
                        'type': 'error',
                        'data': {'error': 'User authentication required'}
                    }))
                    return
            
            # Log the agent_id from the URL and message for debugging
            logger.info(f"🤖 Agent ID from URL: {agent_id}")
            if 'agent_id' in initial_data:
                logger.info(f"🤖 Agent ID from message: {initial_data['agent_id']}")
                # Use agent_id from message if provided, otherwise use URL param
                agent_id = initial_data.get('agent_id', agent_id)
            
            # Get workflow from database
            await websocket.send_text(json.dumps({
                'type': 'status',
                'data': {'message': 'Retrieving workflow...'}
            }))
            
            workflow_data = await get_workflow_from_db(agent_id)
            if not workflow_data:
                await websocket.send_text(json.dumps({
                    'type': 'error',
                    'data': {'error': f'Workflow not found for agent {agent_id}'}
                }))
                return
            
            # Use workflow format directly (no conversion needed)
            await websocket.send_text(json.dumps({
                'type': 'status',
                'data': {'message': 'Preparing workflow for execution...'}
            }))
            
            # Send the workflow data directly to HPC executor (it now handles frontend format)
            if 'flow_definition' in workflow_data:
                hpc_flow_definition = workflow_data['flow_definition']
                logger.info("✅ Using flow_definition from workflow data")
            elif 'nodes' in workflow_data and 'edges' in workflow_data:
                # Frontend format: convert to expected structure
                nodes_dict = {}
                start_element = None
                
                # Convert nodes list to dict and fix parameters format
                for node in workflow_data.get('nodes', []):
                    node_id = node.get('id', '')
                    node_copy = node.copy()
                    
                    # Convert node type to HPC format (lowercase)
                    frontend_type = node_copy.get('type', '')
                    hpc_type = map_node_type_to_element_type(frontend_type)
                    node_copy['type'] = hpc_type
                    
                    # Convert parameters from list to dict if needed
                    if 'parametersObject' in node_copy and node_copy['parametersObject']:
                        # Use parametersObject which is already in the correct format
                        node_copy['parameters'] = node_copy['parametersObject']
                    elif 'parameters' in node_copy and isinstance(node_copy['parameters'], list):
                        # Convert parameters list to dict
                        params_dict = {}
                        for param in node_copy['parameters']:
                            if param.get('name') and 'value' in param:
                                params_dict[param['name']] = param['value']
                        node_copy['parameters'] = params_dict
                    elif not isinstance(node_copy.get('parameters'), dict):
                        # Ensure parameters is always a dict
                        node_copy['parameters'] = {}
                    
                    nodes_dict[node_id] = node_copy
                    
                    # Find start node
                    if node.get('type', '').lower() in ['start'] and not start_element:
                        start_element = node_id
                
                hpc_flow_definition = {
                    'nodes': nodes_dict,
                    'connections': workflow_data.get('edges', []),
                    'start_element': start_element or (list(nodes_dict.keys())[0] if nodes_dict else '')
                }
                logger.info("✅ Converted frontend workflow format")
            else:
                logger.error("❌ Unknown workflow format")
                await websocket.send_text(json.dumps({
                    'type': 'error',
                    'data': {'error': 'Invalid workflow format'}
                }))
                return
            
            # Extract initial inputs from message or use default for chat_input
            initial_inputs = initial_data.get('initial_inputs', {})
            
            # If no initial inputs provided, create default for chat_input nodes
            if not initial_inputs:
                # Look for chat_input nodes in the flow
                logger.info(f"🔍 Looking for chat_input nodes in flow. Available nodes: {list(hpc_flow_definition.get('nodes', {}).keys())}")
                for node_id, node in hpc_flow_definition.get('nodes', {}).items():
                    node_type = node.get('type', '').lower()
                    logger.info(f"🔍 Checking node {node_id} of type '{node_type}'")
                    if node_type in ['chat_input', 'chatinput']:
                        user_message = initial_data.get('message', 'Hello')
                        initial_inputs[node_id] = {'chat_input': user_message}
                        logger.info(f"💬 Created initial input for chat_input node {node_id}: {user_message}")
                        break
                
                logger.info(f"📥 Final initial_inputs: {initial_inputs}")
            
            # Debug: Log the flow structure to understand the data connections
            logger.info(f"🔗 Flow connections:")
            for conn in hpc_flow_definition.get('connections', []):
                logger.info(f"   {conn.get('from_id')} -> {conn.get('to_id')} (type: {conn.get('connection_type')}, from_output: {conn.get('from_output')}, to_input: {conn.get('to_input')})")
            
            # Connect to HPC execution engine
            await websocket.send_text(json.dumps({
                'type': 'status',
                'data': {'message': 'Starting execution...'}
            }))
            
            # Run HPC connection in background task
            await connect_to_hpc_engine(flow_id, hpc_flow_definition, initial_inputs)
            
        except json.JSONDecodeError:
            await websocket.send_text(json.dumps({
                'type': 'error',
                'data': {'error': 'Invalid JSON in request'}
            }))
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            await websocket.send_text(json.dumps({
                'type': 'error',
                'data': {'error': f'Processing error: {str(e)}'}
            }))
            
    except WebSocketDisconnect:
        logger.info(f"Frontend disconnected for flow {flow_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_text(json.dumps({
                'type': 'error',
                'data': {'error': f'Server error: {str(e)}'}
            }))
        except:
            pass
    finally:
        manager.disconnect(flow_id)

@router.get("/status/{agent_id}")
async def get_flow_status(agent_id: str):
    """
    Get the status of a flow execution
    """
    # This could be extended to track execution status
    return {
        "agent_id": agent_id,
        "status": "ready",
        "message": "Flow ready for execution"
    }