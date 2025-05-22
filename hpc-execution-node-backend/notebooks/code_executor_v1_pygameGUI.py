import pygame
import pygame.freetype
import asyncio
import websockets
import json
import sys
import yaml
from enum import Enum
import math
import time
from typing import Dict, List, Any, Optional, Tuple

# Node status colors
class NodeStatus(Enum):
    WAITING = (200, 200, 200)  # Gray
    RUNNING = (255, 165, 0)    # Orange
    COMPLETED = (100, 200, 100)  # Green
    ERROR = (255, 100, 100)    # Red

class Node:
    def __init__(self, element_id: str, element_type: str, name: str, description: str):
        self.element_id = element_id
        self.element_type = element_type
        self.name = name
        self.description = description
        self.status = NodeStatus.WAITING
        self.inputs = {}
        self.outputs = {}
        self.execution_time = 0
        self.start_time = None
        self.position = (0, 0)  # Will be set during layout
        self.width = 150
        self.height = 80
        self.connections = []  # List of nodes this node connects to
        self.selected = False
        self.streamed_output = ""  # For streaming outputs (like LLM chunks)

    def set_position(self, x: int, y: int):
        self.position = (x, y)

    def add_connection(self, node: 'Node'):
        if node not in self.connections:
            self.connections.append(node)

    def start_execution(self):
        self.status = NodeStatus.RUNNING
        self.start_time = time.time()

    def complete_execution(self, outputs):
        self.status = NodeStatus.COMPLETED
        self.outputs = outputs
        if self.start_time:
            self.execution_time = time.time() - self.start_time

    def set_error(self, error):
        self.status = NodeStatus.ERROR
        self.outputs = {"error": error}
        if self.start_time:
            self.execution_time = time.time() - self.start_time

    def contains_point(self, point):
        x, y = point
        node_x, node_y = self.position
        return (node_x <= x <= node_x + self.width and 
                node_y <= y <= node_y + self.height)

    def render(self, surface, font):
        x, y = self.position
        
        # Draw node background
        pygame.draw.rect(surface, self.status.value, 
                        (x, y, self.width, self.height), 
                        border_radius=10)
        
        # Draw node border (thicker if selected)
        border_width = 3 if self.selected else 1
        pygame.draw.rect(surface, (0, 0, 0), 
                        (x, y, self.width, self.height), 
                        width=border_width, border_radius=10)
        
        # Draw node name
        text_surface = font.render(f"{self.name} ({self.element_type})", True, (0, 0, 0))
        text_rect = text_surface.get_rect(center=(x + self.width // 2, y + 20))
        surface.blit(text_surface, text_rect)
        
        # Draw execution time if completed
        if self.status in [NodeStatus.COMPLETED, NodeStatus.ERROR]:
            time_text = font.render(f"{self.execution_time:.2f}s", True, (0, 0, 0))
            time_rect = time_text.get_rect(center=(x + self.width // 2, y + 50))
            surface.blit(time_text, time_rect)

class FlowVisualizer:
    def __init__(self, width=1200, height=800):
        self.width = width
        self.height = height
        self.screen = None
        self.nodes = {}  # Dict of element_id to Node
        self.selected_node = None
        self.font = None
        self.small_font = None
        self.running = True
        self.scroll_offset_x = 0
        self.scroll_offset_y = 0
        
        # For node dragging
        self.dragging = False
        self.drag_start = None
        self.drag_node = None
        
        # Details panel
        self.details_panel_height = 300
        self.details_panel_scroll = 0
        self.details_panel_max_scroll = 0
        
        # Flow definition and execution data
        self.flow_id = None
        self.flow_definition = None
        self.current_execution = {}
        self.llm_chunks = {}  # element_id -> accumulated chunks

    def initialize(self):
        pygame.init()
        pygame.display.set_caption("Flow Execution Visualizer")
        self.screen = pygame.display.set_mode((self.width, self.height))
        self.font = pygame.font.SysFont('Arial', 14)
        self.small_font = pygame.font.SysFont('Arial', 12)
        self.clock = pygame.time.Clock()

    def build_graph_from_flow_definition(self, flow_definition):
        self.flow_definition = flow_definition
        self.flow_id = flow_definition.get('flow_id')
        
        # Create nodes
        elements = flow_definition.get('elements', {})
        for element_id, element in elements.items():
            node = Node(
                element_id=element_id,
                element_type=element.get('type', 'unknown'),
                name=element.get('name', element_id),
                description=element.get('description', '')
            )
            self.nodes[element_id] = node
            
        # Create connections
        connections = flow_definition.get('connections', [])
        for connection in connections:
            from_id = connection.get('from_id')
            to_id = connection.get('to_id')
            if from_id in self.nodes and to_id in self.nodes:
                self.nodes[from_id].add_connection(self.nodes[to_id])
                
        # Layout the nodes
        self.layout_nodes()

    def layout_nodes(self):
        # Simple hierarchical layout based on connections
        # Start with the start element
        start_element_id = self.flow_definition.get('start_element_id')
        if not start_element_id or start_element_id not in self.nodes:
            # Just place nodes in a grid if no start element
            self.grid_layout()
            return
            
        # BFS to determine levels
        levels = {}
        visited = set()
        queue = [(start_element_id, 0)]
        while queue:
            node_id, level = queue.pop(0)
            if node_id in visited:
                continue
                
            visited.add(node_id)
            if level not in levels:
                levels[level] = []
            levels[level].append(node_id)
            
            # Add connections to queue
            node = self.nodes.get(node_id)
            if node:
                for connected_node in node.connections:
                    queue.append((connected_node.element_id, level + 1))
        
        # Position nodes based on levels
        max_nodes_per_level = max(len(nodes) for nodes in levels.values())
        level_height = 150
        level_margin = 50
        
        for level, node_ids in levels.items():
            level_width = min(200, (self.width - 100) / max(len(node_ids), 1))
            for i, node_id in enumerate(node_ids):
                x = 50 + i * (self.width - 100) / max(len(node_ids), 1)
                y = 50 + level * (level_height + level_margin)
                self.nodes[node_id].set_position(int(x), int(y))
                
        # For any nodes not placed (disconnected), place them at the bottom
        max_level = max(levels.keys()) if levels else 0
        disconnected = []
        for node_id, node in self.nodes.items():
            if node_id not in visited:
                disconnected.append(node_id)
                
        for i, node_id in enumerate(disconnected):
            x = 50 + i * (self.width - 100) / max(len(disconnected), 1)
            y = 50 + (max_level + 1) * (level_height + level_margin)
            self.nodes[node_id].set_position(int(x), int(y))

    def grid_layout(self):
        # Fallback layout: simple grid
        cols = math.ceil(math.sqrt(len(self.nodes)))
        rows = math.ceil(len(self.nodes) / cols)
        
        col_width = (self.width - 100) / max(cols, 1)
        row_height = (self.height - 100 - self.details_panel_height) / max(rows, 1)
        
        for i, (node_id, node) in enumerate(self.nodes.items()):
            col = i % cols
            row = i // cols
            x = 50 + col * col_width
            y = 50 + row * row_height
            node.set_position(int(x), int(y))

    def process_event(self, event):
        data = event.get('data', {})
        event_type = event.get('type', '')
        
        if event_type == 'element_started':
            element_id = data.get('element_id')
            if element_id in self.nodes:
                self.nodes[element_id].start_execution()
                
        elif event_type == 'element_completed':
            element_id = data.get('element_id')
            outputs = data.get('outputs', {})
            if element_id in self.nodes:
                self.nodes[element_id].complete_execution(outputs)
                
        elif event_type == 'element_error':
            element_id = data.get('element_id')
            error = data.get('error', 'Unknown error')
            if element_id in self.nodes:
                self.nodes[element_id].set_error(error)
                
        elif event_type == 'flow_started':
            self.current_execution = {}
            
        elif event_type == 'flow_completed':
            pass  # We already update nodes as they complete
            
        elif event_type == 'flow_error':
            error = data.get('error', 'Unknown flow error')
            print(f"Flow error: {error}")
            
        elif event_type == 'llm_chunk':
            element_id = data.get('element_id')
            content = data.get('content', '')
            
            # Accumulate chunks for the element
            if element_id not in self.llm_chunks:
                self.llm_chunks[element_id] = ''
            self.llm_chunks[element_id] += content
            
            # Update the node's streamed output
            if element_id in self.nodes:
                self.nodes[element_id].streamed_output = self.llm_chunks[element_id]

    def render(self):
        # Fill background
        self.screen.fill((240, 240, 240))
        
        # Draw connections between nodes
        for node in self.nodes.values():
            for connected_node in node.connections:
                start_x = node.position[0] + node.width
                start_y = node.position[1] + node.height // 2
                end_x = connected_node.position[0]
                end_y = connected_node.position[1] + connected_node.height // 2
                
                # Apply scroll offset
                start_x += self.scroll_offset_x
                start_y += self.scroll_offset_y
                end_x += self.scroll_offset_x
                end_y += self.scroll_offset_y
                
                # Draw the line
                pygame.draw.line(self.screen, (0, 0, 0), (start_x, start_y), (end_x, end_y), 2)
                
                # Draw an arrow at the end
                angle = math.atan2(end_y - start_y, end_x - start_x)
                arrow_size = 10
                pygame.draw.polygon(self.screen, (0, 0, 0), [
                    (end_x, end_y),
                    (end_x - arrow_size * math.cos(angle - math.pi/6), 
                     end_y - arrow_size * math.sin(angle - math.pi/6)),
                    (end_x - arrow_size * math.cos(angle + math.pi/6), 
                     end_y - arrow_size * math.sin(angle + math.pi/6)),
                ])
        
        # Draw nodes
        for node in self.nodes.values():
            # Apply scroll offset for rendering
            original_position = node.position
            node.position = (node.position[0] + self.scroll_offset_x, 
                             node.position[1] + self.scroll_offset_y)
            
            node.render(self.screen, self.font)
            
            # Restore original position
            node.position = original_position
            
        # Draw details panel if a node is selected
        if self.selected_node:
            self.render_details_panel()
            
        # Draw a simple status bar
        status_text = f"Flow ID: {self.flow_id or 'None'}"
        running_nodes = [n for n in self.nodes.values() if n.status == NodeStatus.RUNNING]
        completed_nodes = [n for n in self.nodes.values() if n.status == NodeStatus.COMPLETED]
        error_nodes = [n for n in self.nodes.values() if n.status == NodeStatus.ERROR]
        
        status_text += f" | Running: {len(running_nodes)} | Completed: {len(completed_nodes)} | Errors: {len(error_nodes)}"
        
        status_surface = self.font.render(status_text, True, (0, 0, 0))
        self.screen.blit(status_surface, (10, self.height - 20))
        
        pygame.display.flip()
        self.clock.tick(30)  # 30 FPS

    def render_details_panel(self):
        if not self.selected_node:
            return
            
        # Draw panel background
        panel_rect = (0, self.height - self.details_panel_height, 
                      self.width, self.details_panel_height)
        pygame.draw.rect(self.screen, (220, 220, 220), panel_rect)
        pygame.draw.line(self.screen, (0, 0, 0), 
                         (0, self.height - self.details_panel_height),
                         (self.width, self.height - self.details_panel_height), 2)
        
        # Draw node details
        node = self.selected_node
        title_text = f"Node: {node.name} ({node.element_type}) - {node.element_id}"
        title_surface = self.font.render(title_text, True, (0, 0, 0))
        self.screen.blit(title_surface, (10, self.height - self.details_panel_height + 10))
        
        status_text = f"Status: {node.status.name}"
        if node.execution_time:
            status_text += f" | Execution time: {node.execution_time:.2f}s"
        status_surface = self.font.render(status_text, True, (0, 0, 0))
        self.screen.blit(status_surface, (10, self.height - self.details_panel_height + 30))
        
        # Draw node description
        desc_text = f"Description: {node.description}"
        desc_surface = self.font.render(desc_text, True, (0, 0, 0))
        self.screen.blit(desc_surface, (10, self.height - self.details_panel_height + 50))
        
        # Draw inputs and outputs
        y_offset = self.height - self.details_panel_height + 70 + self.details_panel_scroll
        
        # Draw Inputs
        inputs_title = self.font.render("Inputs:", True, (0, 0, 0))
        self.screen.blit(inputs_title, (10, y_offset))
        y_offset += 20
        
        if not node.inputs:
            no_inputs = self.small_font.render("No inputs", True, (100, 100, 100))
            self.screen.blit(no_inputs, (20, y_offset))
            y_offset += 20
        else:
            for key, value in node.inputs.items():
                input_text = f"{key}: {str(value)[:100]}"
                input_surface = self.small_font.render(input_text, True, (0, 0, 0))
                self.screen.blit(input_surface, (20, y_offset))
                y_offset += 20
        
        y_offset += 10
        
        # Draw Outputs
        outputs_title = self.font.render("Outputs:", True, (0, 0, 0))
        self.screen.blit(outputs_title, (10, y_offset))
        y_offset += 20
        
        if not node.outputs and not node.streamed_output:
            no_outputs = self.small_font.render("No outputs", True, (100, 100, 100))
            self.screen.blit(no_outputs, (20, y_offset))
            y_offset += 20
        else:
            # Regular outputs
            for key, value in node.outputs.items():
                if isinstance(value, dict) or isinstance(value, list):
                    try:
                        value_str = json.dumps(value, indent=2)
                        lines = value_str.split('\n')
                        for i, line in enumerate(lines[:10]):  # Limit to 10 lines
                            output_surface = self.small_font.render(f"{line}", True, (0, 0, 0))
                            self.screen.blit(output_surface, (20, y_offset))
                            y_offset += 20
                        if len(lines) > 10:
                            more_text = self.small_font.render("...", True, (100, 100, 100))
                            self.screen.blit(more_text, (20, y_offset))
                            y_offset += 20
                    except:
                        output_text = f"{key}: {str(value)[:100]}"
                        output_surface = self.small_font.render(output_text, True, (0, 0, 0))
                        self.screen.blit(output_surface, (20, y_offset))
                        y_offset += 20
                else:
                    output_text = f"{key}: {str(value)[:100]}"
                    output_surface = self.small_font.render(output_text, True, (0, 0, 0))
                    self.screen.blit(output_surface, (20, y_offset))
                    y_offset += 20
            
            # Streamed output (e.g., from LLM chunks)
            if node.streamed_output:
                stream_title = self.font.render("Streamed Output:", True, (0, 0, 150))
                self.screen.blit(stream_title, (10, y_offset))
                y_offset += 20
                
                # Show the last few lines of streamed output
                lines = node.streamed_output.split('\n')
                for i, line in enumerate(lines[-10:]):  # Last 10 lines
                    stream_surface = self.small_font.render(line[:100], True, (0, 0, 150))
                    self.screen.blit(stream_surface, (20, y_offset))
                    y_offset += 20
        
        # Update max scroll
        self.details_panel_max_scroll = max(0, y_offset - self.height + 20)
        
        # Draw scroll indicators if needed
        if self.details_panel_max_scroll > 0:
            scroll_pct = -self.details_panel_scroll / self.details_panel_max_scroll
            scroll_height = max(30, self.details_panel_height * self.details_panel_height / (self.details_panel_height + self.details_panel_max_scroll))
            scroll_y = self.height - self.details_panel_height + scroll_pct * (self.details_panel_height - scroll_height)
            
            pygame.draw.rect(self.screen, (180, 180, 180), 
                            (self.width - 15, self.height - self.details_panel_height, 15, self.details_panel_height))
            pygame.draw.rect(self.screen, (120, 120, 120), 
                            (self.width - 15, scroll_y, 15, scroll_height))

    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # Left click
                    # Check if clicking on a node
                    clicked_node = None
                    for node in self.nodes.values():
                        # Adjust position for scroll
                        adjusted_pos = (node.position[0] + self.scroll_offset_x,
                                       node.position[1] + self.scroll_offset_y)
                        if (adjusted_pos[0] <= event.pos[0] <= adjusted_pos[0] + node.width and
                            adjusted_pos[1] <= event.pos[1] <= adjusted_pos[1] + node.height):
                            clicked_node = node
                            break
                    
                    # If clicking in details panel
                    if self.height - self.details_panel_height <= event.pos[1] <= self.height:
                        # Check if clicking on scroll bar
                        if self.width - 15 <= event.pos[0] <= self.width:
                            # Calculate new scroll position
                            scroll_pct = (event.pos[1] - (self.height - self.details_panel_height)) / self.details_panel_height
                            self.details_panel_scroll = -int(scroll_pct * self.details_panel_max_scroll)
                    else:
                        # If clicked on a node, select it and start potential drag
                        if clicked_node:
                            self.selected_node = clicked_node
                            for node in self.nodes.values():
                                node.selected = (node == clicked_node)
                            
                            self.dragging = True
                            self.drag_start = event.pos
                            self.drag_node = clicked_node
                        else:
                            # Click on empty space - start panning
                            self.dragging = True
                            self.drag_start = event.pos
                            self.drag_node = None
                
                elif event.button == 4:  # Scroll up
                    if self.height - self.details_panel_height <= event.pos[1] <= self.height:
                        # Scroll details panel
                        self.details_panel_scroll = min(0, self.details_panel_scroll + 20)
                    else:
                        # Scroll main view
                        self.scroll_offset_y += 20
                        
                elif event.button == 5:  # Scroll down
                    if self.height - self.details_panel_height <= event.pos[1] <= self.height:
                        # Scroll details panel
                        self.details_panel_scroll = max(-self.details_panel_max_scroll, self.details_panel_scroll - 20)
                    else:
                        # Scroll main view
                        self.scroll_offset_y -= 20
                        
            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:  # Left click release
                    self.dragging = False
                    self.drag_node = None
                    
            elif event.type == pygame.MOUSEMOTION:
                if self.dragging:
                    if self.drag_node:
                        # Move selected node
                        dx, dy = event.pos[0] - self.drag_start[0], event.pos[1] - self.drag_start[1]
                        self.drag_node.position = (self.drag_node.position[0] + dx, self.drag_node.position[1] + dy)
                    else:
                        # Pan the view
                        dx, dy = event.pos[0] - self.drag_start[0], event.pos[1] - self.drag_start[1]
                        self.scroll_offset_x += dx
                        self.scroll_offset_y += dy
                    
                    self.drag_start = event.pos

class FlowExecutionVisualizer:
    def __init__(self, yaml_file_path):
        self.yaml_file_path = yaml_file_path
        self.visualizer = FlowVisualizer()
        self.flow_definition = None
        self.initial_inputs = None
        self.flow_id = None
        
    async def connect_and_visualize(self):
        self.visualizer.initialize()
        
        # Load the YAML flow file
        print(f"Loading flow from {self.yaml_file_path}...")
        try:
            with open(self.yaml_file_path, 'r') as file:
                yaml_data = yaml.safe_load(file)
            
            self.flow_id = yaml_data.get("flow_id", "flow-" + self.yaml_file_path.split("/")[-1].split(".")[0])
            print(f"Flow ID: {self.flow_id}")
            
            self.flow_definition = yaml_data.get("flow_definition")
            self.initial_inputs = yaml_data.get("initial_inputs", {})
            
            # Set up visualizer with flow definition
            self.visualizer.build_graph_from_flow_definition(self.flow_definition)
        except Exception as e:
            print(f"Error loading YAML file: {e}")
            return
        
        # Start the visualization loop in a separate task
        visualization_task = asyncio.create_task(self.run_visualization())
        
        # Connect to WebSocket using the flow_id from the YAML
        websocket_url = f"ws://localhost:8000/ws/execute/{self.flow_id}"
        print(f"Connecting to WebSocket at {websocket_url}")
        
        # Connect to WebSocket and process events
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
                all_output = ""
                while True:
                    try:
                        message = await websocket.recv()
                        data = json.loads(message)
                        event_type = data.get("type", "unknown")
                        
                        # Process the event in the visualizer
                        self.visualizer.process_event(data)
                        
                        # Handle output similar to the original script
                        if event_type == "llm_chunk":
                            chunk = data.get("data", {}).get("content", "")
                            all_output += chunk
                            print(chunk, end="", flush=True)
                        elif event_type == "flow_completed":
                            print("\n\nFlow completed!")
                            # Don't break - keep visualization running
                        elif event_type == "element_error" or event_type == "flow_error":
                            error = data.get("data", {}).get("error", "Unknown error")
                            print(f"\nError: {error}")
                        
                        # Also print select events for debugging
                        if event_type in ['flow_started', 'flow_completed', 'flow_error']:
                            print(f"\nEvent: {event_type}")
                        elif event_type == 'element_started':
                            element_id = data.get("data", {}).get("element_id", "")
                            element_name = data.get("data", {}).get("element_name", "")
                            print(f"\nStarted: {element_name} ({element_id})")
                        elif event_type == 'element_completed':
                            element_id = data.get("data", {}).get("element_id", "")
                            element_name = data.get("data", {}).get("element_name", "")
                            print(f"\nCompleted: {element_name} ({element_id})")
                            
                    except websockets.exceptions.ConnectionClosed:
                        print("\nWebSocket connection closed")
                        break
                    except Exception as e:
                        print(f"\nError processing message: {e}")
                        break
                
                print("\n--- Complete LLM response ---\n")
                print(all_output)
        
        except Exception as e:
            print(f"WebSocket error: {e}")
        finally:
            # Wait for visualization to finish
            try:
                self.visualizer.running = False
                await visualization_task
            except asyncio.CancelledError:
                pass
    
    async def run_visualization(self):
        """Run the visualization loop"""
        while self.visualizer.running:
            self.visualizer.handle_input()
            self.visualizer.render()
            await asyncio.sleep(0.03)  # ~30 FPS
            
        pygame.quit()

if __name__ == "__main__":
    # Default YAML file path
    yaml_file_path = "./execution_flows/simple-ai-flow.yaml"
    
    # Check if path is provided as argument
    if len(sys.argv) > 1:
        yaml_file_path = sys.argv[1]
    
    # Create and run visualizer
    visualizer = FlowExecutionVisualizer(yaml_file_path)
    
    # Run the event loop
    asyncio.run(visualizer.connect_and_visualize())