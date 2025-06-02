# utils/flow_transformer.py
from typing import Dict, Any, List, Optional
import uuid
import re
import json

def transform_flow_builder_to_backend(flow_builder_data: Dict[str, Any], 
                                    initial_inputs: Optional[Dict[str, Any]] = None,
                                    user_inputs: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Transform flow builder output format to backend executor format.
    
    Args:
        flow_builder_data: Raw output from flow builder
        initial_inputs: Optional initial inputs in old format (for backward compatibility)
        user_inputs: Optional user inputs from UI
        
    Returns:
        Transformed flow definition for backend executor
    """
    
    # Type name mapping
    TYPE_MAPPING = {
        "Start": "start",
        "End": "end", 
        "ChatInput": "chat_input",
        "ContextHistory": "context_history",
        "LLMText": "llm_text",
        "LLMStructured": "llm_structured",
        "RestAPI": "rest_api",
        "Selector": "selector",
        "Merger": "merger",
        "RandomGenerator": "random_generator",
        "TimeBlock": "time",
        "ReadBlockchainData": "read_blockchain_data",
        "BuildTransactionJSON": "build_transaction_json",
        "Custom": "custom",
        "Constants": "constants",
        "Datablocks": "datablock",
        "Metadata": "metadata",
        "Case": "case",
        "FlowSelect": "flow_select"
    }
    
    # Generate flow ID
    flow_id = f"flow_{str(uuid.uuid4()).replace('-', '_')}"
    
    # Transform nodes to elements
    elements = {}
    node_id_mapping = {}  # Map flow builder IDs to clean keys
    start_element_id = None
    element_type_counts = {}  # Track duplicates of same type
    
    for node in flow_builder_data.get("nodes", []):
        # Generate element type
        element_type = TYPE_MAPPING.get(node["type"], node["type"].lower())
        
        # Generate clean key for elements dictionary
        if element_type in element_type_counts:
            element_type_counts[element_type] += 1
            clean_key = f"{element_type}_{element_type_counts[element_type]}"
        else:
            element_type_counts[element_type] = 1
            clean_key = element_type
        
        # Generate full element_id (keeps the original ID for uniqueness)
        full_element_id = f"{element_type}_{node['id'].split('-')[-1]}"
        
        # Store mapping for connections (node ID -> clean key)
        node_id_mapping[node["id"]] = clean_key
        
        # Track start element
        if element_type == "start":
            start_element_id = clean_key
        
        # Transform inputs array to input_schema object
        input_schema = {}
        for input_item in node.get("inputs", []):
            input_schema[input_item["name"]] = {
                "type": _convert_type(input_item["type"]),
                "description": input_item.get("description", ""),
                "required": input_item.get("required", False)
            }
            
            # Add default value if specified
            if "default" in input_item:
                input_schema[input_item["name"]]["default"] = input_item["default"]
        
        # Transform outputs array to output_schema object  
        output_schema = {}
        for output_item in node.get("outputs", []):
            output_schema[output_item["name"]] = {
                "type": _convert_type(output_item["type"]),
                "description": output_item.get("description", ""),
                "required": output_item.get("required", False)
            }
        
        # Build element definition
        element_def = {
            "type": element_type,
            "element_id": full_element_id,  # Keep full ID for uniqueness
            "name": node.get("name", ""),
            "description": node.get("description", ""),
            "input_schema": input_schema,
            "output_schema": output_schema
        }
        
        # Add hyperparameters as direct properties
        for hyperparam in node.get("hyperparameters", []):
            param_name = hyperparam["name"]
            param_value = hyperparam.get("default") or hyperparam.get("value")
            param_type = hyperparam.get("type", "")
            
            # Try to parse string values that should be JSON objects
            if param_value and isinstance(param_value, str) and param_type == "object":
                try:
                    import json
                    # Handle special format like "{ contact:string , name : string}"
                    if param_name == "output_schema":
                        # Convert to proper JSON format and then parse
                        json_str = param_value.replace(" ", "").replace(":", '":"').replace("{", '{"').replace(",", '","').replace("}", '"}')
                        parsed_value = json.loads(json_str)
                        # Convert to proper schema format
                        schema_dict = {}
                        for key, value_type in parsed_value.items():
                            schema_dict[key] = {
                                "type": _convert_type(value_type),
                                "description": f"Generated {key}",
                                "required": True
                            }
                        param_value = schema_dict
                    else:
                        param_value = json.loads(param_value)
                except (json.JSONDecodeError, ValueError):
                    # If parsing fails, keep as string
                    pass
            
            # Handle special case for LLM structured output_schema
            if param_name == "output_schema" and element_type == "llm_structured":
                # Rename to custom_output_schema for LLM structured elements
                element_def["custom_output_schema"] = param_value
            else:
                element_def[param_name] = param_value
        
        elements[clean_key] = element_def  # Use clean key as dictionary key
    
    # Transform edges to connections
    connections = []
    for edge in flow_builder_data.get("edges", []):
        source_key = node_id_mapping.get(edge["source"])  # Clean key
        target_key = node_id_mapping.get(edge["target"])  # Clean key
        
        if not source_key or not target_key:
            continue
            
        connection = {
            "from_id": source_key,
            "to_id": target_key
        }
        
        # Try to infer data mappings
        if edge.get("mappings"):
            # If explicit mappings exist, use them
            for mapping in edge["mappings"]:
                connection["from_output"] = mapping.get("fromOutput")
                connection["to_input"] = mapping.get("toInput")
        else:
            # Auto-infer mappings based on element types and schemas
            source_element = elements.get(source_key, {})
            target_element = elements.get(target_key, {})
            
            mapping = _infer_data_mapping(source_element, target_element)
            if mapping:
                connection.update(mapping)
        
        connections.append(connection)
    
    # Build final flow definition
    flow_definition = {
        "flow_id": flow_id,
        "elements": elements,
        "connections": connections,
        "start_element_id": start_element_id or list(elements.keys())[0],  # Use clean key
        "metadata": {
            "name": f"Flow {flow_id}",
            "description": "Flow imported from flow builder",
            "created_from": "flow_builder"
        }
    }
    
    # Handle initial inputs
    final_initial_inputs = {}
    
    if user_inputs:
        # Create from user inputs (preferred method)
        final_initial_inputs = create_initial_inputs_from_ui(user_inputs, elements)
    elif initial_inputs:
        # Transform old format initial_inputs to new element IDs
        final_initial_inputs = transform_initial_inputs(initial_inputs, elements, node_id_mapping)
    
    return {
        "flow_id": flow_id,
        "flow_definition": flow_definition,
        "initial_inputs": final_initial_inputs
    }

def transform_initial_inputs(old_initial_inputs: Dict[str, Any], 
                           elements: Dict[str, Any],
                           node_id_mapping: Dict[str, str]) -> Dict[str, Dict[str, Any]]:
    """
    Transform initial_inputs from old format to new element keys.
    
    Args:
        old_initial_inputs: Initial inputs with old element keys
        elements: New elements dictionary with clean keys
        node_id_mapping: Not needed anymore since we use clean keys
        
    Returns:
        Initial inputs with correct element keys
    """
    new_initial_inputs = {}
    
    # With clean keys, old format should mostly work directly
    for old_element_key, inputs_data in old_initial_inputs.items():
        # Check if the key exists in the new elements
        if old_element_key in elements:
            new_initial_inputs[old_element_key] = inputs_data
        else:
            # Try to find by type (fallback for edge cases)
            for new_element_key, element_def in elements.items():
                element_type = element_def.get("type", "")
                
                # Match by type if direct key match fails
                if ((old_element_key == "chat_input" and element_type == "chat_input") or
                    (old_element_key == "context_history" and element_type == "context_history") or
                    (old_element_key == "metadata" and element_type == "metadata")):
                    new_initial_inputs[new_element_key] = inputs_data
                    break
    
    return new_initial_inputs

def _convert_type(flow_builder_type: str) -> str:
    """Convert flow builder types to backend types."""
    type_mapping = {
        "string": "string",
        "number": "float", 
        "integer": "int",
        "boolean": "bool",
        "array": "list",
        "object": "json",
        "any": "json"
    }
    return type_mapping.get(flow_builder_type, "string")

def _infer_data_mapping(source_element: Dict[str, Any], 
                       target_element: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """
    Infer data mapping between source and target elements.
    
    This uses common patterns and naming conventions to guess how data should flow.
    """
    source_outputs = source_element.get("output_schema", {})
    target_inputs = target_element.get("input_schema", {})
    
    if not source_outputs or not target_inputs:
        return None
    
    # Common mapping patterns - order matters (most specific first)
    patterns = [
        # Exact name matches first
        ("chat_input", "prompt"),
        ("context_history", "context"), 
        ("llm_output", "text_input"),
        ("structured_output", "additional_data"),
        ("llm_output", "prompt"),  # LLM chain
        ("data", "data"),
        ("value", "data"),
        ("random_data", "data"),
        ("time_data", "data"),
        # Generic patterns
        ("output", "input"),
        ("result", "data")
    ]
    
    # Try exact matches first
    for source_key in source_outputs:
        if source_key in target_inputs:
            return {
                "from_output": source_key,
                "to_input": source_key
            }
    
    # Try pattern matching
    for source_pattern, target_pattern in patterns:
        if source_pattern in source_outputs and target_pattern in target_inputs:
            return {
                "from_output": source_pattern,
                "to_input": target_pattern
            }
    
    # Special case: if source has multiple outputs, try to match by type
    if len(source_outputs) > 1 and len(target_inputs) > 1:
        for source_key, source_schema in source_outputs.items():
            source_type = source_schema.get("type", "")
            for target_key, target_schema in target_inputs.items():
                target_type = target_schema.get("type", "")
                # Match compatible types
                if (source_type == target_type or 
                    (source_type == "list" and target_type == "list") or
                    (source_type == "json" and target_type == "json")):
                    return {
                        "from_output": source_key,
                        "to_input": target_key
                    }
    
    # Fallback: connect first output to first input
    if source_outputs and target_inputs:
        first_output = list(source_outputs.keys())[0]
        first_input = list(target_inputs.keys())[0]
        return {
            "from_output": first_output,
            "to_input": first_input
        }
    
    return None

def create_initial_inputs_from_ui(user_inputs: Dict[str, Any], 
                                 elements: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Create initial_inputs format from user interface inputs.
    
    Args:
        user_inputs: Raw user inputs from UI  
        elements: Transformed elements dictionary with clean keys
        
    Returns:
        Properly formatted initial_inputs
    """
    initial_inputs = {}
    
    for element_key, element_def in elements.items():
        element_type = element_def.get("type", "")
        
        # Map UI inputs to element inputs using clean keys
        if element_type == "chat_input":
            # Look for user message in various possible keys
            user_message = (user_inputs.get("user_message") or 
                          user_inputs.get("chat_input") or 
                          user_inputs.get("message", ""))
            if user_message:
                initial_inputs[element_key] = {  # Use clean key directly
                    "chat_input": user_message
                }
        elif element_type == "context_history":
            # Look for conversation history in various possible keys
            conversation_history = (user_inputs.get("conversation_history") or 
                                  user_inputs.get("context_history") or 
                                  user_inputs.get("history", []))
            if conversation_history:
                initial_inputs[element_key] = {  # Use clean key directly
                    "context_history": conversation_history
                }
        elif element_type == "metadata":
            user_data = user_inputs.get("user_data", {})
            if user_data:
                initial_inputs[element_key] = user_data  # Use clean key directly
    
    return initial_inputs

# Example usage
if __name__ == "__main__":
    # Example flow builder data (your actual data)
    
    # import json
    
    with open("./test_files/flow_builder_2.json", "r") as f:
        flow_builder_data = json.load(f)
    
    # Example old format initial inputs - these will now work directly!
    old_initial_inputs = {
        "chat_input": {"chat_input": "How to write a python script?"},
        "context_history": {"context_history": ["Hello, I'm a user"]}
    }
    
    # Transform with old format initial inputs
    result = transform_flow_builder_to_backend(
        flow_builder_data=flow_builder_data,
        initial_inputs=old_initial_inputs
    )
    
    # dump the result to see the new format in json transformed_flow_2
    with open("./test_files/transformed_flow_2.json", "w") as f:
        json.dump(result, f, indent=2)

    
    print("=== NEW CLEAN KEY FORMAT ===")
    print("Elements keys:", list(result["flow_definition"]["elements"].keys()))
    print("Sample element:")
    for key, element in result["flow_definition"]["elements"].items():
        print(f"  Key: '{key}' -> element_id: '{element['element_id']}'")
        break
    
    print("Initial inputs keys:", list(result["initial_inputs"].keys()))
    print("Connections:", result["flow_definition"]["connections"])
    
    # This should now produce:
    # Elements: {"chat_input": {"element_id": "chat_input_123", ...}, "llm_text": {"element_id": "llm_text_456", ...}}
    # Initial inputs: {"chat_input": {"chat_input": "How to write..."}}
    # Connections: [{"from_id": "chat_input", "to_id": "llm_text", "from_output": "chat_input", "to_input": "prompt"}]