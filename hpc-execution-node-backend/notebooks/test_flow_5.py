#!/usr/bin/env python3
import yaml
import json
import asyncio
import websockets

# Test Flow 5: Conversation Analyzer
yaml_file_path = "../code_executor/sample_flow_5_conversation_analyzer.yaml"
print(f"Testing Flow 5: {yaml_file_path}")

with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

flow_id = "conversation-analyzer-test"
print(f"Flow ID: {flow_id}")

flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": {}  # No inputs needed - elements are self-generating
}

websocket_url = f"ws://localhost:8000/ws/execute/{flow_id}"
print(f"WebSocket URL: {websocket_url}")

async def test_conversation_analyzer():
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
            print("FLOW 5 EXECUTION STARTED")
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
                    elif event_type == 'context_history':
                        history = data.get('history')
                        message_count = data.get('message_count', 0)
                        format_type = data.get('format', 'unknown')
                        print(f"💬 Context loaded: {message_count} messages in {format_type} format")
                    elif event_type == 'datablock':
                        format_type = data.get('format')
                        data_info = data.get('data_info', {})
                        print(f"📊 Analysis config loaded: {format_type} format")
                        print(f"   Keys: {data_info.get('keys', [])}")
                    elif event_type == 'random_generator':
                        random_data = data.get('random_data')
                        print(f"🎲 Analysis ID generated: {random_data}")
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        print(content, end='', flush=True)
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                        
                        # Show structured output for analyzer
                        if element_id == 'conversation_analyzer':
                            try:
                                print(f"   📋 Analysis Results:")
                                print(f"      Sentiment: {outputs.get('overall_sentiment')} (score: {outputs.get('sentiment_score')})")
                                print(f"      Topics: {outputs.get('primary_topics')}")
                                print(f"      Engagement: {outputs.get('engagement_level')}")
                                print(f"      Satisfaction: {outputs.get('satisfaction_score')}")
                                print(f"      Confidence: {outputs.get('confidence')}")
                            except:
                                print(f"   📋 Analysis completed")
                                
                    elif event_type == 'final_output':
                        print(f"\n🎯 Final output received")
                        final_output = data.get('text_output', '')
                        print(f"Executive Summary: {final_output[:200]}...")
                    elif event_type == 'flow_completed':
                        print("\n✅ Flow completed successfully!")
                        break
                    elif event_type == 'flow_error':
                        print(f"\n❌ Flow error: {data.get('error')}")
                        break
                        
            except websockets.exceptions.ConnectionClosed:
                print("\nWebSocket connection closed")
            
            print("\n" + "="*60)
            print("FLOW 5 TEST COMPLETED")
            print("="*60)
            
            return events
            
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    result = asyncio.run(test_conversation_analyzer())
    print(f"\nProcessed {len(result)} events")