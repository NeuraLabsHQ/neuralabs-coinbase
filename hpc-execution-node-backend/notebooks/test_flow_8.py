#!/usr/bin/env python3
import yaml
import json
import asyncio
import websockets

# Test Flow 8: Webhook Data Processor
yaml_file_path = "../code_executor/sample_flow_8_webhook_processor.yaml"
print(f"Testing Flow 8: {yaml_file_path}")

with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

flow_id = "webhook-processor-test"
print(f"Flow ID: {flow_id}")

flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": {}  # No inputs needed - uses constants for webhook data
}

websocket_url = f"ws://localhost:8000/ws/execute/{flow_id}"
print(f"WebSocket URL: {websocket_url}")

async def test_webhook_processor():
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
            print("FLOW 8 EXECUTION STARTED")
            print("="*60 + "\n")
            
            # Track webhook processing
            selector_results = []
            validation_result = None
            order_summary = None
            ack_status = None
            
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
                    elif event_type == 'constants':
                        constant_data = data.get('constants', {})
                        event_type_val = constant_data.get('event_type', '')
                        webhook_id = constant_data.get('webhook_id', '')
                        print(f"📥 Webhook Data Loaded:")
                        print(f"   Event Type: {event_type_val}")
                        print(f"   Webhook ID: {webhook_id}")
                    elif event_type == 'selector':
                        element_id = data.get('element_id', '')
                        found = data.get('found', False)
                        path_used = data.get('path_used', '')
                        paths_tried = data.get('paths_tried', [])
                        
                        selector_results.append({
                            "element_id": element_id,
                            "found": found,
                            "path": path_used,
                            "paths_tried": paths_tried
                        })
                        
                        if found:
                            print(f"🎯 Selector [{element_id}]: Found value at '{path_used}'")
                        else:
                            print(f"⚠️  Selector [{element_id}]: No value found after trying {paths_tried}")
                    elif event_type == 'merger':
                        element_id = data.get('element_id', '')
                        print(f"🔄 Merger [{element_id}]: Data merged")
                    elif event_type == 'api_request':
                        url = data.get('url', '')
                        method = data.get('method', '')
                        print(f"📤 Webhook ACK: {method} {url}")
                    elif event_type == 'api_response':
                        status = data.get('status_code', 0)
                        ack_status = status
                        print(f"✅ ACK Response: Status {status}")
                    elif event_type == 'api_error':
                        error = data.get('error', '')
                        print(f"❌ ACK Error: {error}")
                    elif event_type == 'metadata':
                        custom_data = data.get('custom_data', {})
                        print(f"📋 Metadata loaded: {len(custom_data)} fields")
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        print(content, end='', flush=True)
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                        
                        # Show validation results
                        if element_id == 'webhook_validator':
                            validation_result = outputs
                            is_valid = outputs.get('is_valid', False)
                            validations = outputs.get('validations', {})
                            print(f"   🔍 Webhook Validation: {'PASSED' if is_valid else 'FAILED'}")
                            for check, result in validations.items():
                                status = "✓" if result else "✗"
                                print(f"      {status} {check}")
                        
                        # Show order processing results
                        elif element_id == 'order_processor':
                            order_summary = outputs.get('order_summary', {})
                            total_items = order_summary.get('total_items', 0)
                            total = order_summary.get('total', 0)
                            print(f"   📦 Order Processed:")
                            print(f"      Items: {total_items}")
                            print(f"      Total: ${total}")
                            
                    elif event_type == 'final_output':
                        print(f"\n🎯 Final output received")
                        final_output = data.get('text_output', '')
                        print("="*60)
                        print("WEBHOOK PROCESSING REPORT")
                        print("="*60)
                        print(final_output)
                    elif event_type == 'flow_completed':
                        print("\n✅ Flow completed successfully!")
                        break
                    elif event_type == 'flow_error':
                        print(f"\n❌ Flow error: {data.get('error')}")
                        break
                        
            except websockets.exceptions.ConnectionClosed:
                print("\nWebSocket connection closed")
            
            print("\n" + "="*60)
            print("FLOW 8 EXECUTION SUMMARY")
            print("="*60)
            
            print(f"\n📈 Processing Statistics:")
            print(f"   Selectors Used: {len(selector_results)}")
            print(f"   Successful Selections: {sum(1 for s in selector_results if s['found'])}")
            
            print("\n🎯 Selector Performance:")
            for selector in selector_results:
                status = "✓" if selector['found'] else "✗"
                paths = selector.get('paths_tried', [])
                if len(paths) > 1:
                    print(f"   {status} {selector['element_id']}: tried {paths} → found at '{selector['path']}'")
                else:
                    print(f"   {status} {selector['element_id']}: {selector['path'] or 'not found'}")
            
            print("\n🔍 Validation Result:")
            if validation_result:
                print(f"   Overall: {'VALID' if validation_result.get('is_valid') else 'INVALID'}")
                print(f"   Message: {validation_result.get('validation_message', '')}")
            
            print("\n📤 Acknowledgment:")
            print(f"   Status Code: {ack_status or 'N/A'}")
            
            print("\n" + "="*60)
            print("FLOW 8 TEST COMPLETED")
            print("="*60)
            
            return events
            
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    result = asyncio.run(test_webhook_processor())
    print(f"\nProcessed {len(result)} events")