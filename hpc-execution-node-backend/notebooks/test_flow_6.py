#!/usr/bin/env python3
import yaml
import json
import asyncio
import websockets

# Test Flow 6: Dynamic Workflow Orchestrator
yaml_file_path = "../code_executor/sample_flow_6_dynamic_workflow.yaml"
print(f"Testing Flow 6: {yaml_file_path}")

with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

flow_id = "dynamic-workflow-test"
print(f"Flow ID: {flow_id}")

flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": {}  # No inputs needed - elements are self-generating
}

websocket_url = f"ws://localhost:8000/ws/execute/{flow_id}"
print(f"WebSocket URL: {websocket_url}")

async def test_dynamic_workflow():
    print(f"\nConnecting to WebSocket at {websocket_url}")
    
    try:
        async with websockets.connect(websocket_url) as websocket:
            # WebSocket handshake
            ready_msg = await websocket.recv()
            print(f"Server: {ready_msg}")
            
            # Send flow definition
            await websocket.send(json.dumps(flow_definition))
            print("Sent flow definition")
            
            ack1 = await websocket.recv()
            print(f"Server: {ack1}")
            
            # Send initial inputs
            await websocket.send(json.dumps(flow_data["initial_inputs"]))
            print("Sent initial inputs")
            
            ack2 = await websocket.recv()
            print(f"Server: {ack2}")
            
            # Send config
            await websocket.send("null")
            print("Sent null config")
            
            ack3 = await websocket.recv()
            print(f"Server: {ack3}")
            
            print("\n" + "="*60)
            print("FLOW 6 EXECUTION STARTED - DYNAMIC WORKFLOW ORCHESTRATION")
            print("="*60 + "\n")
            
            # Process streaming events
            events = []
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
                        print(f"🔄 Started: {element_id}")
                    elif event_type == 'processing':
                        message = data.get('message', '')
                        print(f"⏳ {message}")
                    elif event_type == 'time':
                        timestamp = data.get('timestamp')
                        day_of_week = data.get('day_of_week')
                        print(f"🕐 Execution timestamp: {timestamp} ({day_of_week})")
                    elif event_type == 'datablock':
                        format_type = data.get('format')
                        data_info = data.get('data_info', {})
                        print(f"📊 Workflow metadata loaded: {format_type} format")
                        print(f"   Workflow: {data_info.get('keys', [])}")
                    elif event_type == 'random_generator':
                        random_data = data.get('random_data')
                        print(f"🎲 Execution ID generated: {random_data}")
                    elif event_type == 'context_history':
                        history = data.get('history')
                        message_count = data.get('message_count', 0)
                        format_type = data.get('format', 'unknown')
                        print(f"💬 Session context loaded: {message_count} messages")
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        print(content, end='', flush=True)
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                        
                        # Show structured output for orchestrator
                        if element_id == 'workflow_orchestrator':
                            try:
                                print(f"   📋 Orchestration Plan:")
                                print(f"      Priority: {outputs.get('priority_level')}")
                                print(f"      Estimated Completion: {outputs.get('estimated_completion')}")
                                
                                exec_plan = outputs.get('execution_plan', {})
                                if isinstance(exec_plan, dict):
                                    print(f"      Strategy: {exec_plan.get('strategy', 'N/A')}")
                                    
                                resource_alloc = outputs.get('resource_allocation', {})
                                if isinstance(resource_alloc, dict):
                                    print(f"      Resources: {resource_alloc.get('allocation', 'N/A')}")
                                    
                                quality = outputs.get('quality_checkpoints', [])
                                print(f"      Quality Checkpoints: {len(quality) if isinstance(quality, list) else 0}")
                                
                                risk = outputs.get('risk_assessment', {})
                                if isinstance(risk, dict):
                                    print(f"      Risk Level: {risk.get('level', 'N/A')}")
                            except:
                                print(f"   📋 Orchestration completed")
                                
                    elif event_type == 'final_output':
                        print(f"\n🎯 Final output received")
                        final_output = data.get('text_output', '')
                        print(f"Execution Summary: {final_output[:300]}...")
                    elif event_type == 'flow_completed':
                        print("\n✅ Flow completed successfully!")
                        break
                    elif event_type == 'flow_error':
                        print(f"\n❌ Flow error: {data.get('error')}")
                        break
                        
            except websockets.exceptions.ConnectionClosed:
                print("\nWebSocket connection closed")
            
            print("\n" + "="*60)
            print("FLOW 6 TEST COMPLETED - DYNAMIC WORKFLOW ORCHESTRATION")
            print("="*60)
            
            return events
            
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    result = asyncio.run(test_dynamic_workflow())
    print(f"\nProcessed {len(result)} events")