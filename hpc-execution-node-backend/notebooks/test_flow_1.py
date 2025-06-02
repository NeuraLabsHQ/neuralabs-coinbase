#!/usr/bin/env python3
import yaml
import json
import asyncio
import websockets
from datetime import datetime

# Test Flow 1: Intent Classifier
yaml_file_path = "../code_executor/sample_flow_1_intent_classifier.yaml"
print(f"Testing Flow 1: {yaml_file_path}")

with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

flow_id = "intent-classifier-test"
print(f"Flow ID: {flow_id}")

flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": {
        "chat_input": {
            "chat_input": "I need help with a refund for my order #12345. It's been 2 weeks and I haven't received my money back."
        }
    }
}

websocket_url = f"ws://localhost:8000/ws/execute/{flow_id}"
print(f"WebSocket URL: {websocket_url}")

async def test_intent_classifier():
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
            print("FLOW 1 EXECUTION STARTED")
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
                    elif event_type == 'llm_prompt':
                        element_id = data.get('element_id')
                        prompt = data.get('prompt', '')
                        print(f"📝 Prompt sent to {element_id}:")
                        print(f"   {prompt[:200]}...")  # Show first 200 chars
                    elif event_type == 'llm_warning':
                        warning = data.get('warning', '')
                        raw_response = data.get('raw_response', '')
                        print(f"⚠️  LLM Warning: {warning}")
                        print(f"🔍 Raw Response: {raw_response[:500]}...")  # Show first 500 chars
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        print(content, end='', flush=True)
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                        
                        # Show structured output for intent classifier
                        if element_id == 'intent_classifier':
                            print(f"📋 STRUCTURED OUTPUT:")
                            for key, value in outputs.items():
                                if key == 'structured_output':
                                    try:
                                        structured = json.loads(value)
                                        print(f"   🔍 Parsed JSON:")
                                        for k, v in structured.items():
                                            print(f"      {k}: {v}")
                                    except:
                                        print(f"   📄 Raw: {value}")
                                else:
                                    print(f"   {key}: {value}")
                    elif event_type == 'final_output':
                        print(f"\n🎯 Final output received")
                        final_output = data.get('text_output', '')
                        print(f"Final Response: {final_output}")
                    elif event_type == 'flow_completed':
                        print("\n✅ Flow completed successfully!")
                        break
                    elif event_type == 'flow_error':
                        print(f"\n❌ Flow error: {data.get('error')}")
                        break
                        
            except websockets.exceptions.ConnectionClosed:
                print("\nWebSocket connection closed")
            
            print("\n" + "="*60)
            print("FLOW 1 TEST COMPLETED")
            print("="*60)
            
            return events
            
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    result = asyncio.run(test_intent_classifier())
    print(f"\nProcessed {len(result)} events")