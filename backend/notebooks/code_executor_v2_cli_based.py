import asyncio
import websockets
import json
import yaml
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime
import os

class FlowExecutionMonitor:
    def __init__(self, yaml_file_path):
        self.yaml_file_path = yaml_file_path
        self.flow_id = None
        self.flow_definition = None
        self.initial_inputs = None
        
        # Execution tracking
        self.elements = {}  # Store all element data
        self.execution_order = []
        self.current_execution = None
        self.llm_chunks = {}  # element_id -> accumulated chunks
        
        # Output file
        self.output_dir = "flow_outputs"
        self.output_file = None
        os.makedirs(self.output_dir, exist_ok=True)
        
    def setup_output_file(self):
        """Set up an output file with timestamp"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.output_file = os.path.join(self.output_dir, f"{self.flow_id}_{timestamp}.txt")
        
        # Write header to file
        with open(self.output_file, "w") as f:
            f.write(f"Flow Execution: {self.flow_id}\n")
            f.write(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 80 + "\n\n")
    
    def log_to_file(self, message):
        """Log a message to the output file"""
        if self.output_file:
            with open(self.output_file, "a") as f:
                f.write(f"{message}\n")
    
    def build_element_dictionary(self):
        """Build a dictionary of elements from the flow definition"""
        elements = self.flow_definition.get('elements', {})
        for element_id, element in elements.items():
            self.elements[element_id] = {
                'element_id': element_id,
                'name': element.get('name', element_id),
                'type': element.get('type', 'unknown'),
                'description': element.get('description', ''),
                'input_schema': element.get('input_schema', {}),
                'output_schema': element.get('output_schema', {}),
                'inputs': {},
                'outputs': {},
                'status': 'waiting',
                'streamed_data': '',
                'start_time': None,
                'end_time': None,
                'execution_time': None,
                'error': None
            }
    
    def handle_llm_chunk(self, data):
        """Handle LLM chunk data"""
        element_id = data.get('element_id')
        content = data.get('content', '')
        
        # Print to console
        print(content, end='', flush=True)
        
        # Accumulate chunks for the element
        if element_id not in self.llm_chunks:
            self.llm_chunks[element_id] = ''
        self.llm_chunks[element_id] += content
        
        # Update the element's streamed data
        if element_id in self.elements:
            self.elements[element_id]['streamed_data'] = self.llm_chunks[element_id]
    
    def handle_direct_data(self, event_type, data):
        """Handle direct data events (non-LLM events)"""
        event_data = {
            'type': event_type,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        
        # Print a simple indicator based on event type
        indicator = {
            'element_started': '▶️ ',
            'element_completed': '✅ ',
            'element_error': '❌ ',
            'flow_started': '🚀 ',
            'flow_completed': '🏁 ',
            'flow_error': '💥 '
        }.get(event_type, '   ')
        
        element_id = data.get('element_id', '')
        element_name = data.get('element_name', '')
        
        if event_type == 'element_started':
            print(f"\n{indicator} Started: {element_name} ({element_id})")
            self.log_to_file(f"\n___ {element_name} __{element_id}")
            
            # Print inputs if available
            if element_id in self.elements and self.elements[element_id]['inputs']:
                print(f"   Input: {self.elements[element_id]['inputs']}")
                self.log_to_file(f"Input __\n{json.dumps(self.elements[element_id]['inputs'], indent=2)}")
            
            # Print description
            if element_id in self.elements:
                description = self.elements[element_id]['description']
                if description:
                    print(f"   Description: {description}")
                    self.log_to_file(f"Description: {description}")
            
        elif event_type == 'element_completed':
            print(f"\n{indicator} Completed: {element_name} ({element_id})")
            
            # Print outputs
            outputs = data.get('outputs', {})
            if outputs:
                print(f"   Output: {outputs}")
                self.log_to_file(f"Output __\n{json.dumps(outputs, indent=2)}")
                
            # Add separator
            self.log_to_file("________________\n")
            
        elif event_type == 'element_error':
            error = data.get('error', 'Unknown error')
            print(f"\n{indicator} Error in {element_name} ({element_id}): {error}")
            self.log_to_file(f"ERROR: {error}")
            self.log_to_file("________________\n")
            
        elif event_type in ['flow_started', 'flow_completed', 'flow_error']:
            message = f"{indicator} Flow {event_type.split('_')[1]}"
            print(f"\n{message}")
            self.log_to_file(message)
            
            if event_type == 'flow_error':
                error = data.get('error', 'Unknown error')
                print(f"   Error: {error}")
                self.log_to_file(f"ERROR: {error}")
    
    def process_event(self, event):
        """Process an event from the websocket"""
        event_type = event.get('type', '')
        data = event.get('data', {})
        
        # Handle different event types
        if event_type == 'llm_chunk':
            self.handle_llm_chunk(data)
            
            # Log to file (only first few chars and last few if it's long)
            element_id = data.get('element_id')
            if element_id in self.elements:
                element = self.elements[element_id]
                if len(element['streamed_data']) <= 100:  # Only log once at the beginning
                    self.log_to_file(f"Streamed Data: (streaming...)")
        
        elif event_type == 'element_started':
            element_id = data.get('element_id')
            if element_id in self.elements:
                self.elements[element_id]['status'] = 'running'
                self.elements[element_id]['start_time'] = datetime.now()
                self.execution_order.append(element_id)
            self.handle_direct_data(event_type, data)
                
        elif event_type == 'element_completed':
            element_id = data.get('element_id')
            outputs = data.get('outputs', {})
            if element_id in self.elements:
                self.elements[element_id]['status'] = 'completed'
                self.elements[element_id]['end_time'] = datetime.now()
                self.elements[element_id]['outputs'] = outputs
                
                # Calculate execution time
                if self.elements[element_id]['start_time']:
                    start = self.elements[element_id]['start_time']
                    end = self.elements[element_id]['end_time']
                    self.elements[element_id]['execution_time'] = (end - start).total_seconds()
                    
                # If this element has streamed data (like LLM), log the final result
                if element_id in self.llm_chunks:
                    streamed_data = self.llm_chunks[element_id]
                    if streamed_data:
                        self.log_to_file(f"Streamed Data __\n{streamed_data}")
            
            self.handle_direct_data(event_type, data)
                
        elif event_type == 'element_error':
            element_id = data.get('element_id')
            error = data.get('error', 'Unknown error')
            if element_id in self.elements:
                self.elements[element_id]['status'] = 'error'
                self.elements[element_id]['end_time'] = datetime.now()
                self.elements[element_id]['error'] = error
                
                # Calculate execution time
                if self.elements[element_id]['start_time']:
                    start = self.elements[element_id]['start_time']
                    end = self.elements[element_id]['end_time']
                    self.elements[element_id]['execution_time'] = (end - start).total_seconds()
            
            self.handle_direct_data(event_type, data)
                
        elif event_type == 'flow_started':
            self.current_execution = {
                'flow_id': data.get('flow_id'),
                'start_time': datetime.now(),
                'end_time': None,
                'execution_time': None,
                'status': 'running',
                'error': None
            }
            self.handle_direct_data(event_type, data)
                
        elif event_type == 'flow_completed':
            if self.current_execution:
                self.current_execution['end_time'] = datetime.now()
                self.current_execution['status'] = 'completed'
                
                # Calculate execution time
                if self.current_execution['start_time']:
                    start = self.current_execution['start_time']
                    end = self.current_execution['end_time']
                    self.current_execution['execution_time'] = (end - start).total_seconds()
                    
                # Write summary to log
                self.log_to_file("\n" + "=" * 80)
                self.log_to_file(f"Flow completed in {self.current_execution['execution_time']:.2f} seconds")
                self.log_to_file(f"Elements executed: {len(self.execution_order)}")
                self.log_to_file("=" * 80)
            
            self.handle_direct_data(event_type, data)
                
        elif event_type == 'flow_error':
            error = data.get('error', 'Unknown error')
            if self.current_execution:
                self.current_execution['end_time'] = datetime.now()
                self.current_execution['status'] = 'error'
                self.current_execution['error'] = error
                
                # Calculate execution time
                if self.current_execution['start_time']:
                    start = self.current_execution['start_time']
                    end = self.current_execution['end_time']
                    self.current_execution['execution_time'] = (end - start).total_seconds()
                    
                # Write summary to log
                self.log_to_file("\n" + "=" * 80)
                self.log_to_file(f"Flow failed after {self.current_execution['execution_time']:.2f} seconds")
                self.log_to_file(f"Error: {error}")
                self.log_to_file("=" * 80)
            
            self.handle_direct_data(event_type, data)
    
    def print_summary(self):
        """Print a summary of the flow execution"""
        print("\n" + "=" * 80)
        print("FLOW EXECUTION SUMMARY")
        print("=" * 80)
        
        if self.current_execution:
            status = self.current_execution['status']
            time_str = f"{self.current_execution.get('execution_time', 0):.2f} seconds"
            
            print(f"Flow ID: {self.current_execution.get('flow_id', self.flow_id)}")
            print(f"Status: {status.upper()}")
            print(f"Execution Time: {time_str}")
            
            if status == 'error':
                print(f"Error: {self.current_execution.get('error', 'Unknown error')}")
            
            print("\nElement Execution:")
            for i, element_id in enumerate(self.execution_order, 1):
                if element_id in self.elements:
                    element = self.elements[element_id]
                    status_icon = "✅" if element['status'] == 'completed' else "❌"
                    time_str = f"{element.get('execution_time', 0):.2f}s"
                    print(f"  {i}. {status_icon} {element['name']} ({element_id}) - {time_str}")
                    
                    if element['status'] == 'error':
                        print(f"     Error: {element.get('error', 'Unknown error')}")
        
        print("\nOutput saved to:", self.output_file)
        print("=" * 80)
    
    def save_full_results(self):
        """Save the full structured results to a JSON file"""
        output_json = os.path.join(self.output_dir, f"{self.flow_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        results = {
            'flow_id': self.flow_id,
            'execution': self.current_execution,
            'elements': self.elements,
            'execution_order': self.execution_order
        }
        
        with open(output_json, 'w') as f:
            json.dump(results, f, indent=2, default=str)
            
        print(f"Full results saved to: {output_json}")
        
    async def connect_and_monitor(self):
        """Connect to the WebSocket and monitor the flow execution"""
        # Load the YAML flow file
        print(f"Loading flow from {self.yaml_file_path}...")
        try:
            with open(self.yaml_file_path, 'r') as file:
                yaml_data = yaml.safe_load(file)
            
            self.flow_id = yaml_data.get("flow_id", "flow-" + self.yaml_file_path.split("/")[-1].split(".")[0])
            print(f"Flow ID: {self.flow_id}")
            
            self.flow_definition = yaml_data.get("flow_definition")
            self.initial_inputs = yaml_data.get("initial_inputs", {})
            
            # Build element dictionary
            self.build_element_dictionary()
            
            # Set up output file
            self.setup_output_file()
            
        except Exception as e:
            print(f"Error loading YAML file: {e}")
            return
        
        # Connect to WebSocket using the flow_id from the YAML
        websocket_url = f"ws://localhost:8000/ws/execute/{self.flow_id}"
        print(f"Connecting to WebSocket at {websocket_url}")
        
        try:
            async with websockets.connect(websocket_url) as websocket:
                # Receive ready message
                ready_msg = await websocket.recv()
                print(f"Server: {ready_msg}")
                
                # Send flow definition
                flow_definition_str = json.dumps(self.flow_definition)
                await websocket.send(flow_definition_str)
                print("Sent flow definition")
                
                # Receive acknowledgment
                ack1 = await websocket.recv()
                print(f"Server: {ack1}")
                
                # Send initial inputs
                initial_inputs_str = json.dumps(self.initial_inputs)
                await websocket.send(initial_inputs_str)
                print("Sent initial inputs")
                
                # Receive acknowledgment
                ack2 = await websocket.recv()
                print(f"Server: {ack2}")
                
                # Send config (null in this case)
                await websocket.send("null")
                print("Sent null config")
                
                # Receive final acknowledgment
                ack3 = await websocket.recv()
                print(f"Server: {ack3}")
                
                print("Flow execution starting. Receiving events...")
                
                # Now receive streaming events
                try:
                    while True:
                        message = await websocket.recv()
                        event = json.loads(message)
                        
                        # Process the event
                        self.process_event(event)
                        
                        # Set inputs for elements
                        if event['type'] == 'element_started':
                            element_id = event['data'].get('element_id')
                            # Try to find inputs from dependencies
                            for dep_id in self.elements:
                                if self.elements[dep_id]['status'] == 'completed':
                                    # This is a simplification - in a real system, you'd track 
                                    # the specific input mappings between elements
                                    self.elements[element_id]['inputs'] = self.elements[dep_id]['outputs']
                                    
                except websockets.exceptions.ConnectionClosed:
                    print("\nWebSocket connection closed")
                
                # Print summary and save results
                self.print_summary()
                self.save_full_results()
        
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    # Default YAML file path
    yaml_file_path = "./execution_flows/simple-ai-flow.yaml"
    
    # Check if path is provided as argument
    if len(sys.argv) > 1:
        yaml_file_path = sys.argv[1]
    
    # Create and run monitor
    monitor = FlowExecutionMonitor(yaml_file_path)
    
    # Run the event loop
    asyncio.run(monitor.connect_and_monitor())