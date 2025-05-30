#!/usr/bin/env python3
import yaml
import json
import asyncio
import websockets
import time
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

import nest_asyncio
nest_asyncio.apply()  # This allows asyncio.run() inside Jupyter

# Load the YAML flow file
yaml_file_path = "../code_executor/simple_ai_flow.yaml"  # Update this to your file location
print(f"Loading flow from {yaml_file_path}...")

with open(yaml_file_path, 'r') as file:
    yaml_data = yaml.safe_load(file)

# Extract flow_definition from the new structure
flow_definition = yaml_data.get("flow_definition", {})
metadata = yaml_data.get("metadata", {})

# Generate flow ID
flow_id = metadata.get("flow_name", "flow-" + yaml_file_path.split("/")[-1].split(".")[0]).replace(" ", "-").lower()
print(f"Flow ID: {flow_id}")

# Prepare the flow data in the format expected by the backend
flow_data = {
    "flow_id": flow_id,
    "flow_definition": flow_definition,
    "initial_inputs": {
        "start_node": {
            "prompt": "What is artificial intelligence and how does it work?",
            "context_history": ["Previous conversation about machine learning", "Discussion about neural networks"]
        }
    }
}

websocket_url = "ws://localhost:8000/ws/execute/" + flow_id
print(f"WebSocket URL: {websocket_url}")

class Element:
    """
    Class to represent and process individual flow elements.
    """
    
    def __init__(self, element_id: str, element_type: str, element_name: str, processing_message: str = None):
        self.element_id = element_id
        self.element_type = element_type
        self.element_name = element_name
        self.description = ""
        self.processing_message = processing_message or f"Processing {element_name}"
        self.input_schema = {}
        self.output_schema = {}
        self.inputs = {}
        self.outputs = {}
        self.status = 'waiting'  # waiting, running, completed, error
        self.start_time = None
        self.end_time = None
        self.execution_time = None
        self.error = None
        self.backtracking = False
        
        # For LLM elements
        self.is_llm = element_type == 'llm_text'
        self.streamed_chunks = []  # Store for reference, but don't serialize
        self.complete_llm_output = ""  # Final complete output
        
    def start_execution(self, data: Dict[str, Any]):
        """Mark element as started and capture metadata."""
        self.status = 'running'
        self.start_time = datetime.now()
        self.backtracking = data.get('backtracking', False)
        
    def complete_execution(self, data: Dict[str, Any]):
        """Mark element as completed and capture outputs."""
        self.status = 'completed'
        self.end_time = datetime.now()
        self.outputs = data.get('outputs', {})
        self.backtracking = data.get('backtracking', False)
        
        if self.start_time and self.end_time:
            self.execution_time = (self.end_time - self.start_time).total_seconds()
            
        # For LLM elements, store the complete output
        if self.is_llm and 'llm_output' in self.outputs:
            self.complete_llm_output = self.outputs['llm_output']
    
    def error_execution(self, error: str, data: Dict[str, Any]):
        """Mark element as errored."""
        self.status = 'error'
        self.end_time = datetime.now()
        self.error = error
        self.backtracking = data.get('backtracking', False)
        
        if self.start_time and self.end_time:
            self.execution_time = (self.end_time - self.start_time).total_seconds()
    
    def add_llm_chunk(self, chunk: str):
        """Add LLM chunk (for streaming only, not stored)."""
        if self.is_llm:
            self.streamed_chunks.append(chunk)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert element to dictionary for serialization (excluding chunks)."""
        return {
            'element_id': self.element_id,
            'element_type': self.element_type,
            'element_name': self.element_name,
            'description': self.description,
            'processing_message': self.processing_message,
            'input_schema': self.input_schema,
            'output_schema': self.output_schema,
            'inputs': self.inputs,
            'outputs': self.outputs,
            'status': self.status,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'execution_time': self.execution_time,
            'error': self.error,
            'backtracking': self.backtracking,
            'is_llm': self.is_llm,
            'complete_llm_output': self.complete_llm_output if self.is_llm else None
        }


class FlowManager:
    """
    Class to manage flow execution, streaming, and event processing.
    """
    
    def __init__(self, flow_data: Dict[str, Any], websocket_url: Optional[str] = None):
        self.flow_definition = flow_data.get("flow_definition", {})
        self.initial_inputs = flow_data.get("initial_inputs", {})
        self.flow_id = flow_data.get("flow_id", str(uuid.uuid4()))
        
        # WebSocket URL
        self.websocket_url = websocket_url or f"ws://localhost:8000/ws/execute/{self.flow_id}"
        
        # Flow state
        self.elements = {}  # element_id -> Element instance
        self.execution_order = []
        self.flow_status = 'waiting'  # waiting, running, completed, error
        self.flow_start_time = None
        self.flow_end_time = None
        self.flow_execution_time = None
        self.flow_error = None
        self.final_output = None
        
        # Initialize elements from flow definition
        self._initialize_elements()
    
    def _initialize_elements(self):
        """Initialize Element instances from flow definition."""
        nodes_config = self.flow_definition.get('nodes', {})
        for element_id, config in nodes_config.items():
            # Extract processing_message from config
            element_name = config.get('name', element_id)
            processing_message = config.get('processing_message', f"Processing {element_name}")
            
            element = Element(
                element_id=element_id,
                element_type=config.get('type', 'unknown'),
                element_name=element_name,
                processing_message=processing_message
            )
            element.description = config.get('description', '')
            element.input_schema = config.get('input_schema', {})
            element.output_schema = config.get('output_schema', {})
            
            self.elements[element_id] = element
    
    def stream_json_event(self, event_type: str, data: Any):
        """
        Stream a JSON formatted event to frontend (currently prints).
        
        Args:
            event_type: Type of event
            data: Event data
        """
        event = {
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        
        # Print formatted JSON (replace with actual streaming to frontend)
        print(json.dumps(event))
        print()  # Add separator line
    
    def handle_flow_started(self, data: Dict[str, Any]):
        """Handle flow started event."""
        self.flow_status = 'running'
        self.flow_start_time = datetime.now()
        
        # Stream event to frontend
        self.stream_json_event("flow_started", {
            "flow_id": self.flow_id,
            "description": "Flow execution started",
            "timestamp": self.flow_start_time.isoformat()
        })
    
    def handle_flow_completed(self, data: Dict[str, Any]):
        """Handle flow completed event."""
        self.flow_status = 'completed'
        self.flow_end_time = datetime.now()
        
        if self.flow_start_time:
            self.flow_execution_time = (self.flow_end_time - self.flow_start_time).total_seconds()
        
        # Stream completion event
        self.stream_json_event("flow_completed", {
            "flow_id": self.flow_id,
            "description": "Flow execution completed successfully",
            "execution_time": self.flow_execution_time,
            "execution_order": self.execution_order,
            "timestamp": self.flow_end_time.isoformat()
        })
        
        # Stream final structured data
        self.stream_final_data()
    
    def handle_flow_error(self, data: Dict[str, Any]):
        """Handle flow error event."""
        self.flow_status = 'error'
        self.flow_end_time = datetime.now()
        self.flow_error = data.get('error', 'Unknown error')
        
        if self.flow_start_time:
            self.flow_execution_time = (self.flow_end_time - self.flow_start_time).total_seconds()
        
        # Stream error event
        self.stream_json_event("flow_error", {
            "flow_id": self.flow_id,
            "description": "Flow execution failed",
            "error": self.flow_error,
            "execution_time": self.flow_execution_time,
            "timestamp": self.flow_end_time.isoformat()
        })
    
    def handle_element_started(self, data: Dict[str, Any]):
        """Handle element started event."""
        element_id = data.get('element_id')
        if element_id in self.elements:
            element = self.elements[element_id]
            element.start_execution(data)
            
            if element_id not in self.execution_order:
                self.execution_order.append(element_id)
            
            # Stream element start event with processing_message
            self.stream_json_event("element_started", {
                "element_id": element_id,
                "element_name": element.element_name,
                "element_type": element.element_type,
                "description": element.processing_message,
                "backtracking": element.backtracking
            })
    
    def handle_element_completed(self, data: Dict[str, Any]):
        """Handle element completed event."""
        element_id = data.get('element_id')
        if element_id in self.elements:
            element = self.elements[element_id]
            element.complete_execution(data)
            
            # Stream element completion event
            self.stream_json_event("element_completed", {
                "element_id": element_id,
                "element_name": element.element_name,
                "element_type": element.element_type,
                "description": f"Completed {element.element_name}",
                "execution_time": element.execution_time,
                "outputs": element.outputs,
                "backtracking": element.backtracking
            })
    
    def handle_element_error(self, data: Dict[str, Any]):
        """Handle element error event."""
        element_id = data.get('element_id')
        error = data.get('error', 'Unknown error')
        
        if element_id in self.elements:
            element = self.elements[element_id]
            element.error_execution(error, data)
            
            # Stream element error event
            self.stream_json_event("element_error", {
                "element_id": element_id,
                "element_name": element.element_name,
                "element_type": element.element_type,
                "description": f"Error in {element.element_name}",
                "error": error,
                "execution_time": element.execution_time,
                "backtracking": element.backtracking
            })
    
    def handle_processing(self, data: Dict[str, Any]):
        """Handle processing message event."""
        element_id = data.get('element_id')
        message = data.get('message', '')
        
        # Stream processing event
        self.stream_json_event("processing", {
            "element_id": element_id,
            "message": message
        })
    
    def handle_llm_chunk(self, data: Dict[str, Any]):
        """Handle LLM chunk event."""
        element_id = data.get('element_id')
        content = data.get('content', '')
        
        # Print chunk to console (for user to see streaming)
        print(content, end='', flush=True)
        
        # Add chunk to element (for reference only)
        if element_id in self.elements:
            self.elements[element_id].add_llm_chunk(content)
    
    def handle_final_output(self, data: Dict[str, Any]):
        """Handle final output event."""
        self.final_output = data
        
        # Add newline after LLM output
        print("\n")
        
        # Stream final output event
        self.stream_json_event("final_output", {
            "flow_id": data.get('flow_id', self.flow_id),
            "description": "Final output generated",
            "text_output": data.get('text_output'),
            "proposed_transaction": data.get('proposed_transaction')
        })
    
    def stream_final_data(self):
        """Stream final structured data containing all elements."""
        structured_data = {
            "flow_id": self.flow_id,
            "flow_status": self.flow_status,
            "flow_execution_time": self.flow_execution_time,
            "execution_order": self.execution_order,
            "elements": {elem_id: elem.to_dict() for elem_id, elem in self.elements.items()},
            "final_output": self.final_output
        }
        
        self.stream_json_event("structured_data", {
            "description": "Complete flow execution data",
            "data": structured_data
        })
    
    def process_event(self, event: Dict[str, Any]):
        """
        Process incoming WebSocket event.
        
        Args:
            event: Raw event from WebSocket
        """
        event_type = event.get('type')
        data = event.get('data', {})
        
        # Route event to appropriate handler
        if event_type == 'flow_started':
            self.handle_flow_started(data)
        elif event_type == 'flow_completed':
            self.handle_flow_completed(data)
        elif event_type == 'flow_error':
            self.handle_flow_error(data)
        elif event_type == 'element_started':
            self.handle_element_started(data)
        elif event_type == 'element_completed':
            self.handle_element_completed(data)
        elif event_type == 'element_error':
            self.handle_element_error(data)
        elif event_type == 'processing':
            self.handle_processing(data)
        elif event_type == 'llm_chunk':
            self.handle_llm_chunk(data)
        elif event_type == 'final_output':
            self.handle_final_output(data)
        # Ignore other event types for now
    
    def get_serializable_data(self) -> Dict[str, Any]:
        """
        Get complete flow data for serialization/storage.
        
        Returns:
            Dictionary containing all flow and element data
        """
        return {
            "flow_id": self.flow_id,
            "flow_status": self.flow_status,
            "flow_start_time": self.flow_start_time.isoformat() if self.flow_start_time else None,
            "flow_end_time": self.flow_end_time.isoformat() if self.flow_end_time else None,
            "flow_execution_time": self.flow_execution_time,
            "flow_error": self.flow_error,
            "execution_order": self.execution_order,
            "elements": {elem_id: elem.to_dict() for elem_id, elem in self.elements.items()},
            "final_output": self.final_output
        }
    
    async def execute_and_stream(self) -> Dict[str, Any]:
        """
        Execute flow and stream events to frontend.
        
        Returns:
            Complete flow execution data
        """
        print(f"Connecting to WebSocket at {self.websocket_url}")
        
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                # WebSocket handshake
                ready_msg = await websocket.recv()
                print(f"Server: {ready_msg}")
                
                # Send flow definition
                await websocket.send(json.dumps(self.flow_definition))
                print("Sent flow definition")
                
                ack1 = await websocket.recv()
                print(f"Server: {ack1}")
                
                # Send initial inputs
                await websocket.send(json.dumps(self.initial_inputs))
                print("Sent initial inputs")
                
                ack2 = await websocket.recv()
                print(f"Server: {ack2}")
                
                # Send config
                await websocket.send("null")
                print("Sent null config")
                
                ack3 = await websocket.recv()
                print(f"Server: {ack3}")
                
                print("\n" + "="*60)
                print("FLOW EXECUTION STARTED - STREAMING EVENTS")
                print("="*60 + "\n")
                
                # Process streaming events
                try:
                    while True:
                        message = await websocket.recv()
                        event = json.loads(message)
                        
                        # Process the event
                        self.process_event(event)
                        
                        # Break on flow completion or error
                        if event.get('type') in ['flow_completed', 'flow_error']:
                            break
                            
                except websockets.exceptions.ConnectionClosed:
                    print("\nWebSocket connection closed")
                
                print("\n" + "="*60)
                print("FLOW EXECUTION COMPLETED")
                print("="*60)
                
                return self.get_serializable_data()
                
        except Exception as e:
            print(f"Error: {e}")
            return self.get_serializable_data()
        
        
async def execute_flow_from_dict(flow_data: Dict[str, Any], websocket_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Execute flow from dictionary.
    
    Args:
        flow_data: Flow configuration dictionary
        websocket_url: Optional WebSocket URL
        
    Returns:
        Complete flow execution data
    """
    try:
        flow_manager = FlowManager(flow_data, websocket_url)
        return await flow_manager.execute_and_stream()
        
    except Exception as e:
        print(f"Error executing flow: {e}")
        return {}


# Execute the flow
print("\nStarting flow execution...\n")
elements = asyncio.run(execute_flow_from_dict(flow_data, websocket_url))