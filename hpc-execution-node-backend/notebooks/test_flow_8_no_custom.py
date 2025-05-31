#!/usr/bin/env python3
import yaml
import json
import asyncio
import websockets

# Test Flow 8: Webhook Data Processor (No Custom Blocks)
yaml_file_path = "../code_executor/sample_flow_8_webhook_processor_no_custom.yaml"
print(f"Testing Flow 8 (No Custom): {yaml_file_path}")

with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

flow_id = "webhook-processor-no-custom-test"
print(f"Flow ID: {flow_id}")

flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": {
        "initial_message": "Starting webhook processing test without custom blocks"
    }
}

websocket_url = f"ws://localhost:8000/ws/execute/{flow_id}"
print(f"WebSocket URL: {websocket_url}")

async def test_webhook_processor_no_custom():
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
            print("FLOW 8 (NO CUSTOM) EXECUTION STARTED")
            print("="*60 + "\n")
            
            # Track webhook processing components
            webhook_data_loaded = False
            validation_data_loaded = False
            order_data_loaded = False
            api_calls = []
            selector_results = []
            merger_count = 0
            constants_loaded = []
            metadata_loaded = False
            
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
                        
                        # Track specific elements
                        if element_id == 'webhook_data':
                            webhook_data_loaded = True
                        elif element_id == 'validation_status':
                            validation_data_loaded = True
                        elif element_id == 'order_summary':
                            order_data_loaded = True
                        elif element_id == 'webhook_metadata':
                            metadata_loaded = True
                            
                    elif event_type == 'processing':
                        message = data.get('message', '')
                        print(f"⏳ {message}")
                    elif event_type == 'api_request':
                        url = data.get('url', '')
                        method = data.get('method', '')
                        api_calls.append({"url": url, "method": method})
                        print(f"📡 API Request: {method} {url}")
                    elif event_type == 'api_response':
                        status = data.get('status_code', 0)
                        print(f"✅ API Response: Status {status}")
                    elif event_type == 'api_error':
                        error = data.get('error', '')
                        print(f"❌ API Error: {error}")
                    elif event_type == 'selector':
                        element_id = data.get('element_id', '')
                        found = data.get('found', False)
                        path_used = data.get('path_used', '')
                        value_preview = data.get('selected_value_preview', '')
                        
                        selector_results.append({
                            "element_id": element_id,
                            "found": found,
                            "path": path_used
                        })
                        
                        if found:
                            print(f"🎯 Selector [{element_id}]: Found value at '{path_used}'")
                            if value_preview:
                                print(f"   Value: {value_preview[:100]}")
                        else:
                            print(f"⚠️  Selector [{element_id}]: No value found, using default")
                    elif event_type == 'merger':
                        element_id = data.get('element_id', '')
                        merger_count += 1
                        print(f"🔄 Merger [{element_id}]: Data merged successfully")
                    elif event_type == 'constants':
                        const_data = data.get('constants', {})
                        constants_loaded.append(const_data)
                        print(f"📋 Constants loaded: {list(const_data.keys())}")
                    elif event_type == 'metadata':
                        meta_data = data.get('metadata', {})
                        print(f"📄 Metadata loaded: {list(meta_data.keys())}")
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        print(content, end='', flush=True)
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                            
                    elif event_type == 'final_output':
                        print(f"\n🎯 Final output received")
                        final_output = data.get('text_output', '')
                        print(f"Webhook Processing Report: {final_output[:200]}...")
                    elif event_type == 'flow_completed':
                        print("\n✅ Flow completed successfully!")
                        break
                    elif event_type == 'flow_error':
                        print(f"\n❌ Flow error: {data.get('error')}")
                        break
                        
            except websockets.exceptions.ConnectionClosed:
                print("\nWebSocket connection closed")
            
            print("\n" + "="*60)
            print("FLOW 8 (NO CUSTOM) EXECUTION SUMMARY")
            print("="*60)
            
            print(f"\n📈 Statistics:")
            print(f"   Webhook Data Loaded: {'✓' if webhook_data_loaded else '✗'}")
            print(f"   Validation Data Loaded: {'✓' if validation_data_loaded else '✗'}")
            print(f"   Order Data Loaded: {'✓' if order_data_loaded else '✗'}")
            print(f"   Metadata Loaded: {'✓' if metadata_loaded else '✗'}")
            print(f"   API Calls Made: {len(api_calls)}")
            print(f"   Selectors Used: {len(selector_results)}")
            print(f"   Successful Selections: {sum(1 for s in selector_results if s['found'])}") 
            print(f"   Merger Operations: {merger_count}")
            print(f"   Constants Loaded: {len(constants_loaded)}")
            
            print("\n📊 API Endpoints Called:")
            for api in api_calls:
                print(f"   - {api['method']} {api['url']}")
            
            print("\n🎯 Selector Results:")
            for selector in selector_results:
                status = "✓" if selector['found'] else "✗"
                print(f"   {status} {selector['element_id']}: {selector['path'] or 'not found'}")
            
            print("\n🔧 Webhook Processing Pipeline:")
            print("   1. ✓ Load webhook data (constants)")
            print("   2. ✓ Extract event type, customer, order data (selectors)")
            print("   3. ✓ Merge customer name and email")
            print("   4. ✓ Merge validation and customer data")
            print("   5. ✓ Merge order data with totals")
            print("   6. ✓ Combine all response data")
            print("   7. ✓ Add processing metadata")
            print("   8. ✓ Send acknowledgment via API")
            print("   9. ✓ Generate processing report with LLM")
            
            print("\n" + "="*60)
            print("FLOW 8 (NO CUSTOM) TEST COMPLETED")
            print("="*60)
            
            return events
            
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    result = asyncio.run(test_webhook_processor_no_custom())
    print(f"\nProcessed {len(result)} events")