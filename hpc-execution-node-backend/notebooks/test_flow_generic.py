#!/usr/bin/env python3
"""
Generic test script for executing flows exported from NeuraLabs frontend
Supports the exported YAML format with flow_definition wrapper
"""
import yaml
import json
import asyncio
import websockets
import sys
import argparse
from datetime import datetime
from pathlib import Path

def clean_flow_definition(flow_def):
    """Remove frontend-specific fields that backend doesn't expect"""
    cleaned = {
        'nodes': {},
        'connections': flow_def.get('connections', []),
        'start_element': flow_def.get('start_element')
    }
    
    # Fields to remove from nodes
    fields_to_remove = ['position', 'original_id', 'node_description']
    
    for node_id, node_data in flow_def.get('nodes', {}).items():
        cleaned_node = {}
        for key, value in node_data.items():
            if key not in fields_to_remove:
                cleaned_node[key] = value
        cleaned['nodes'][node_id] = cleaned_node
    
    return cleaned

def load_yaml_flow(yaml_path):
    """Load and parse YAML flow file"""
    with open(yaml_path, 'r') as file:
        yaml_data = yaml.safe_load(file)
    
    # Support both wrapped (exported) and unwrapped formats
    if 'flow_definition' in yaml_data:
        # Exported format from frontend
        flow_definition = yaml_data.get('flow_definition', {})
        metadata = yaml_data.get('metadata', {})
        # Clean frontend-specific fields
        flow_definition = clean_flow_definition(flow_definition)
    else:
        # Direct format (like simple-ai-flow.yaml)
        flow_definition = {
            'nodes': yaml_data.get('nodes', {}),
            'connections': yaml_data.get('connections', []),
            'start_element': yaml_data.get('start_element')
        }
        metadata = yaml_data.get('metadata', {})
    
    return flow_definition, metadata

def extract_initial_inputs(flow_definition):
    """Extract required inputs from the flow definition"""
    initial_inputs = {}
    nodes = flow_definition.get('nodes', {})
    
    # Find nodes that expect initial inputs (typically chat_input or start nodes)
    for node_id, node_data in nodes.items():
        node_type = node_data.get('type', '').lower()
        
        if node_type in ['chatinput', 'chat_input']:
            # Chat input nodes need user input
            output_schema = node_data.get('output_schema', {})
            if 'chat_input' in output_schema:
                initial_inputs[node_id] = {
                    'chat_input': input(f"Enter input for {node_data.get('name', node_id)}: ") or "Hello, AI!"
                }
        elif node_type == 'start':
            # Start nodes might need initial data
            output_schema = node_data.get('output_schema', {})
            if output_schema:
                # For now, we'll leave start nodes empty unless they have specific requirements
                pass
    
    # If no inputs found, provide a default structure
    if not initial_inputs:
        print("No input nodes found. Using empty initial inputs.")
        initial_inputs = {}
    
    return initial_inputs

async def execute_flow(yaml_path, websocket_url="ws://localhost:8001/ws/execute", flow_id=None):
    """Execute a flow from YAML file"""
    print(f"\n{'='*60}")
    print(f"Executing flow from: {yaml_path}")
    print(f"{'='*60}\n")
    
    # Load flow
    flow_definition, metadata = load_yaml_flow(yaml_path)
    
    # Generate flow ID if not provided
    if not flow_id:
        flow_name = metadata.get('flow_name', 'generic-flow')
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        flow_id = f"{flow_name.lower().replace(' ', '-')}-{timestamp}"
    
    print(f"Flow ID: {flow_id}")
    print(f"Flow Name: {metadata.get('flow_name', 'Unknown')}")
    print(f"Description: {metadata.get('description', 'No description')}")
    
    # Extract initial inputs
    initial_inputs = extract_initial_inputs(flow_definition)
    print(f"\nInitial inputs: {json.dumps(initial_inputs, indent=2)}")
    
    # Prepare flow data
    flow_data = {
        "flow_id": flow_id,
        "flow_definition": flow_definition,
        "initial_inputs": initial_inputs
    }
    
    # Connect and execute
    full_url = f"{websocket_url}/{flow_id}"
    print(f"\nConnecting to: {full_url}")
    
    try:
        async with websockets.connect(full_url) as websocket:
            # WebSocket handshake
            ready_msg = await websocket.recv()
            print(f"Server ready: {ready_msg}")
            
            # Send flow definition
            await websocket.send(json.dumps(flow_definition))
            print("Sent flow definition")
            
            ack1 = await websocket.recv()
            print(f"Server acknowledged: {ack1}")
            
            # Send initial inputs
            await websocket.send(json.dumps(initial_inputs))
            print("Sent initial inputs")
            
            ack2 = await websocket.recv()
            print(f"Server acknowledged: {ack2}")
            
            # Send config (null for default)
            await websocket.send("null")
            print("Sent config")
            
            ack3 = await websocket.recv()
            print(f"Server acknowledged: {ack3}")
            
            print(f"\n{'='*60}")
            print("FLOW EXECUTION STARTED")
            print(f"{'='*60}\n")
            
            # Process streaming events
            events = []
            final_output = None
            
            try:
                while True:
                    message = await websocket.recv()
                    event = json.loads(message)
                    events.append(event)
                    
                    event_type = event.get('type')
                    data = event.get('data', {})
                    
                    if event_type == 'flow_started':
                        print("✅ Flow started")
                        
                    elif event_type == 'element_started':
                        element_id = data.get('element_id')
                        element_type = data.get('element_type', 'unknown')
                        print(f"🔄 Started: {element_id} ({element_type})")
                        
                    elif event_type == 'processing':
                        message = data.get('message', '')
                        element_id = data.get('element_id', '')
                        if element_id:
                            print(f"⏳ [{element_id}] {message}")
                        else:
                            print(f"⏳ {message}")
                            
                    elif event_type == 'llm_prompt':
                        element_id = data.get('element_id')
                        prompt = data.get('prompt', '')
                        print(f"📝 LLM Prompt ({element_id}):")
                        # Show first 300 chars of prompt
                        preview = prompt[:300] + "..." if len(prompt) > 300 else prompt
                        print(f"   {preview}")
                        
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        print(content, end='', flush=True)
                        
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                        
                        # Show outputs if not too large
                        for key, value in outputs.items():
                            if isinstance(value, str) and len(value) > 200:
                                print(f"   {key}: {value[:200]}...")
                            else:
                                print(f"   {key}: {value}")
                                
                    elif event_type == 'final_output':
                        print(f"\n🎯 Final output received")
                        final_output = data
                        text_output = data.get('text_output', '')
                        if text_output:
                            print(f"\nFinal Response:\n{'-'*40}")
                            print(text_output)
                            print(f"{'-'*40}")
                            
                    elif event_type == 'flow_completed':
                        print("\n✅ Flow completed successfully!")
                        break
                        
                    elif event_type == 'flow_error':
                        error = data.get('error', 'Unknown error')
                        print(f"\n❌ Flow error: {error}")
                        if 'traceback' in data:
                            print(f"Traceback:\n{data['traceback']}")
                        break
                        
            except websockets.exceptions.ConnectionClosed:
                print("\n⚠️  WebSocket connection closed")
            
            print(f"\n{'='*60}")
            print("FLOW EXECUTION COMPLETED")
            print(f"Total events processed: {len(events)}")
            print(f"{'='*60}\n")
            
            return {
                'events': events,
                'final_output': final_output,
                'success': event_type == 'flow_completed'
            }
            
    except Exception as e:
        print(f"\n❌ Error executing flow: {e}")
        import traceback
        traceback.print_exc()
        return {
            'events': [],
            'final_output': None,
            'success': False,
            'error': str(e)
        }

def main():
    parser = argparse.ArgumentParser(description='Execute a NeuraLabs flow from YAML file')
    parser.add_argument('yaml_file', help='Path to the YAML flow file')
    parser.add_argument('--url', default='ws://localhost:8001/ws/execute',
                       help='WebSocket URL for the execution engine (default: ws://localhost:8001/ws/execute)')
    parser.add_argument('--flow-id', help='Custom flow ID (default: auto-generated)')
    
    args = parser.parse_args()
    
    # Validate file exists
    yaml_path = Path(args.yaml_file)
    if not yaml_path.exists():
        print(f"Error: File not found: {yaml_path}")
        sys.exit(1)
    
    # Run the flow
    result = asyncio.run(execute_flow(
        yaml_path=str(yaml_path),
        websocket_url=args.url,
        flow_id=args.flow_id
    ))
    
    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)

if __name__ == "__main__":
    main()