#!/usr/bin/env python3
import yaml
import json
import asyncio
import websockets
from datetime import datetime

# Test Flow 3: Comprehensive Assistant
yaml_file_path = "../code_executor/sample_flow_3_comprehensive_assistant.yaml"
print(f"Testing Flow 3: {yaml_file_path}")

with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

flow_id = "comprehensive-assistant-test"
print(f"Flow ID: {flow_id}")

flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": {
        "user_input": {
            "chat_input": "I'm having trouble with my account login and it's really frustrating. I can't access my premium features that I paid for."
        },
        "conversation_history": {
            "context_history": [
                "User: I tried resetting my password yesterday",
                "Assistant: Let me help you with the password reset process"
            ]
        }
    }
}

websocket_url = f"ws://localhost:8000/ws/execute/{flow_id}"
print(f"WebSocket URL: {websocket_url}")

async def test_comprehensive_assistant():
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
            print("FLOW 3 EXECUTION STARTED")
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
                    elif event_type == 'metadata':
                        metadata_info = data.get('metadata', {})
                        print(f"📊 Metadata loaded: {list(metadata_info.keys())}")
                    elif event_type == 'constants':
                        constants_info = data.get('constants', {})
                        print(f"⚙️  Constants loaded: {list(constants_info.keys())}")
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        print(content, end='', flush=True)
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                        
                        # Show structured output for analysis elements
                        if element_id == 'intent_and_sentiment' and 'structured_output' in outputs:
                            try:
                                structured = json.loads(outputs['structured_output'])
                                print(f"   📋 Analysis Results:")
                                print(f"      Intent: {structured.get('intent')} (confidence: {structured.get('intent_confidence')})")
                                print(f"      Sentiment: {structured.get('sentiment')} (score: {structured.get('sentiment_score')})")
                                print(f"      Urgency: {structured.get('urgency')}")
                                print(f"      Escalate: {structured.get('escalate_to_human')}")
                            except:
                                print(f"   📋 Structured output received")
                                
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
            print("FLOW 3 TEST COMPLETED")
            print("="*60)
            
            return events
            
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    result = asyncio.run(test_comprehensive_assistant())
    print(f"\nProcessed {len(result)} events")