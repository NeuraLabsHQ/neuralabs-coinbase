#!/usr/bin/env python3
"""
Test script for the specific exported flow with ChatInput -> LLMText -> End
"""
import yaml
import json
import asyncio
import websockets
from datetime import datetime

# Save the exported YAML to a file first
exported_yaml_content = """flow_definition:
  nodes:
    Start_1748706882598:
      type: start
      name: Start
      node_description: Entry point of a flow that receives initial inputs and passes them forward
      description: Entry point of a flow that receives initial inputs and passes them forward
      processing_message: Starting flow...
      tags: []
      layer: 3
      position:
        x: 314
        y: 216
      original_id: node-1748706882598
      input_schema: {}
      output_schema: {}
    End_1748706883682:
      type: end
      name: End
      node_description: Exit point of a flow that collects final outputs including text and optional blockchain transactions
      description: Exit point of a flow that collects final outputs including text and optional blockchain transactions
      processing_message: Completing flow...
      tags: []
      layer: 3
      position:
        x: 288
        y: 873
      original_id: node-1748706883682
      input_schema:
        text_input:
          type: string
          description: Final text output of the flow
          required: true
        proposed_transaction:
          type: json
          description: Transaction data for blockchain interaction
          required: false
      output_schema:
        text_output:
          type: string
          description: Final text output
          required: true
        proposed_transaction:
          type: json
          description: Final transaction payload
          required: false
    llm_text_1748706885704:
      type: llm_text
      name: LLM Text
      node_description: Generates free-form text using a language model
      description: Generates free-form text using a language model
      processing_message: AI is generating response...
      tags: []
      layer: 3
      position:
        x: 281
        y: 576
      original_id: node-1748706885704
      parameters:
        model: us.deepseek.r1-v1:0
        max_tokens: 1000
        temperature: 0.7
        wrapper_prompt: |
          You are an expert Python programmer. 
          
          User request: {prompt}
          
          Please provide a well-commented, clean Python script that fulfills the user's request:
      input_schema:
        prompt:
          type: string
          description: The prompt for the LLM
          required: true
        context:
          type: list
          description: Previous conversation context
          required: false
        additional_data:
          type: json
          description: Additional data for the LLM
          required: false
      output_schema:
        llm_output:
          type: string
          description: Generated text response
          required: true
    chat_input_1748706891494:
      type: chat_input
      name: Chat Input
      node_description: Captures user text input for processing
      description: Captures user text input for processing
      processing_message: Receiving input...
      tags: []
      layer: 3
      position:
        x: 90
        y: 362
      original_id: node-1748706891494
      parameters:
        required: true
        max_length: 1000
        min_length: 1
        placeholder: Enter your message...
        validation_pattern: null
      input_schema: {}
      output_schema:
        chat_input:
          type: string
          description: The text entered by the user
          required: true
  connections:
    - from_id: Start_1748706882598
      to_id: chat_input_1748706891494
      connection_type: control
    - from_id: Start_1748706882598
      to_id: chat_input_1748706891494
      connection_type: data
      from_output: Start_1748706882598:Start
      to_input: chat_input_1748706891494:ChatInput
    - from_id: chat_input_1748706891494
      to_id: llm_text_1748706885704
      connection_type: control
    - from_id: chat_input_1748706891494
      to_id: llm_text_1748706885704
      connection_type: data
      from_output: chat_input_1748706891494:chat_input
      to_input: llm_text_1748706885704:prompt
    - from_id: llm_text_1748706885704
      to_id: End_1748706883682
      connection_type: control
    - from_id: llm_text_1748706885704
      to_id: End_1748706883682
      connection_type: data
      from_output: llm_text_1748706885704:llm_output
      to_input: End_1748706883682:text_input
  start_element: Start_1748706882598
metadata:
  flow_name: Exported Flow
  version: 1.0.0
  description: Flow exported from Neuralabs
  author: NeuraLabs
  tags:
    - exported
  created_at: 2025-05-31T15:56:05.537Z
  exported_at: 2025-05-31T15:56:05.537Z
  export_source: neuralabs-frontend
"""

# Save to file
yaml_file_path = "exported_flow_test.yaml"
with open(yaml_file_path, 'w') as f:
    f.write(exported_yaml_content)

print(f"Saved flow to: {yaml_file_path}")

# Load and prepare the flow
with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

# Clean up the flow definition - remove frontend-specific fields
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

# Clean the flow definition
flow_definition = clean_flow_definition(flow_definition)

# Create flow ID from metadata
flow_id = f"exported-flow-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
print(f"Flow ID: {flow_id}")

# Prepare initial inputs - the chat_input node needs user input
# This is where you provide the actual user query/message
initial_inputs = {
    "chat_input_1748706891494": {
        "chat_input": "Create a Python function to calculate fibonacci numbers"  # <-- Your query goes here
    }
}

flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": initial_inputs
}

websocket_url = f"ws://localhost:8000/ws/execute/{flow_id}"
print(f"WebSocket URL: {websocket_url}")

async def test_exported_flow():
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
            await websocket.send(json.dumps(initial_inputs))
            print(f"Sent initial inputs: {json.dumps(initial_inputs, indent=2)}")
            
            ack2 = await websocket.recv()
            print(f"Server: {ack2}")
            
            # Send config
            await websocket.send("null")
            print("Sent null config")
            
            ack3 = await websocket.recv()
            print(f"Server: {ack3}")
            
            print("\n" + "="*60)
            print("FLOW EXECUTION STARTED")
            print("="*60 + "\n")
            
            # Process streaming events
            events = []
            llm_response = ""
            
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
                        element_type = data.get('element_type', '')
                        print(f"🔄 Started: {element_id} (type: {element_type})")
                    elif event_type == 'processing':
                        message = data.get('message', '')
                        element_id = data.get('element_id', '')
                        print(f"⏳ [{element_id}] {message}")
                    elif event_type == 'llm_prompt':
                        element_id = data.get('element_id')
                        prompt = data.get('prompt', '')
                        print(f"\n📝 LLM Prompt sent to {element_id}:")
                        print(f"{'='*50}")
                        print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
                        print(f"{'='*50}\n")
                    elif event_type == 'llm_chunk':
                        content = data.get('content', '')
                        llm_response += content
                        print(content, end='', flush=True)
                    elif event_type == 'element_completed':
                        element_id = data.get('element_id')
                        outputs = data.get('outputs', {})
                        print(f"\n✅ Completed: {element_id}")
                        
                        # For LLM, show the complete output
                        if 'llm_text' in element_id.lower():
                            print(f"\n📄 LLM Complete Response:")
                            print(f"{'='*50}")
                            if 'llm_output' in outputs:
                                print(outputs['llm_output'])
                            print(f"{'='*50}\n")
                    elif event_type == 'final_output':
                        print(f"\n🎯 Final output received")
                        final_output = data.get('text_output', '')
                        print(f"\n{'='*60}")
                        print("FINAL RESPONSE:")
                        print(f"{'='*60}")
                        print(final_output)
                        print(f"{'='*60}")
                    elif event_type == 'flow_completed':
                        print("\n✅ Flow completed successfully!")
                        break
                    elif event_type == 'flow_error':
                        error_msg = data.get('error', 'Unknown error')
                        print(f"\n❌ Flow error: {error_msg}")
                        if 'traceback' in data:
                            print(f"\nTraceback:\n{data['traceback']}")
                        break
                        
            except websockets.exceptions.ConnectionClosed:
                print("\nWebSocket connection closed")
            
            print("\n" + "="*60)
            print("FLOW TEST COMPLETED")
            print(f"Total events processed: {len(events)}")
            print("="*60)
            
            # Clean up
            import os
            if os.path.exists(yaml_file_path):
                os.remove(yaml_file_path)
                print(f"\nCleaned up temporary file: {yaml_file_path}")
            
            return events
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    result = asyncio.run(test_exported_flow())
    print(f"\nTest completed. Processed {len(result)} events.")