# core/schema.py
from typing import Dict, Any, List, Optional, Type, Union
from pydantic import BaseModel, Field, validator, create_model, RootModel
import json
from enum import Enum

from utils.logger import logger

class ConnectionType(str, Enum):
    """Connection types between elements."""
    CONTROL = "control"
    DATA = "data"
    BOTH = "both"

class AccessLevel(str, Enum):
    """Access levels for hyperparameters."""
    L1 = "L1"  # Element template level
    L2 = "L2"  # Customized element level
    L3 = "L3"  # Instance with data level

class ElementSchemaItem(BaseModel):
    """Schema for a single element input or output field."""
    type: str
    description: Optional[str] = ""
    default: Optional[Any] = None
    required: bool = False
    example: Optional[Any] = None
    item_schema: Optional[Dict[str, Any]] = Field(None, alias="schema")  # Renamed to avoid conflict
    option: Optional[List[str]] = None
    
    class Config:
        populate_by_name = True  # Allow both 'schema' and 'item_schema'

class HyperparameterSchema(BaseModel):
    """Schema for hyperparameters defining access control."""
    access_level: AccessLevel
    display_name: Optional[str] = None
    description: Optional[str] = None

class ElementSchema(RootModel[Dict[str, ElementSchemaItem]]):
    """Schema for element inputs or outputs."""
    pass

def validate_schema(schema_dict: Dict[str, Any]) -> bool:
    """
    Validate that a schema dictionary is valid.
    
    Args:
        schema_dict: Schema dictionary to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        ElementSchema.model_validate(schema_dict)
        return True
    except Exception as e:
        logger.error(f"Invalid schema: {str(e)}")
        return False

def create_pydantic_model_from_schema(schema_dict: Dict[str, Any], model_name: str = "DynamicModel") -> Type[BaseModel]:
    """
    Create a Pydantic model from a schema dictionary.
    
    Args:
        schema_dict: Schema dictionary to convert
        model_name: Name for the generated model
        
    Returns:
        Pydantic model class
    """
    field_definitions = {}
    
    for field_name, field_schema in schema_dict.items():
        # Determine field type
        python_type: Type = Any
        if field_schema.get("type") == "string":
            python_type = str
        elif field_schema.get("type") == "int":
            python_type = int
        elif field_schema.get("type") == "float":
            python_type = float
        elif field_schema.get("type") == "bool":
            python_type = bool
        elif field_schema.get("type") == "json":
            python_type = Dict[str, Any]
        elif field_schema.get("type") == "list":
            python_type = List[Any]
        elif "|" in field_schema.get("type", ""):
            # Union type
            python_type = Union[str, int, float, bool, Dict[str, Any], List[Any]]
        
        # Set up default value
        default_value = field_schema.get("default")
        
        # Set up field definition
        if field_schema.get("required", False):
            # Required field
            field_def = (python_type, Field(..., description=field_schema.get("description", "")))
        else:
            # Optional field with default
            field_def = (Optional[python_type], Field(default=default_value, description=field_schema.get("description", "")))
        
        field_definitions[field_name] = field_def
    
    # Create the model
    model = create_model(model_name, **field_definitions)
    
    return model

class Connection(BaseModel):
    """Connection between elements."""
    from_id: str
    to_id: str
    connection_type: ConnectionType = ConnectionType.BOTH
    from_output: Optional[str] = None
    to_input: Optional[str] = None

class NodeDefinition(BaseModel):
    """Node definition in flow."""
    type: str
    node_description: Optional[str] = None  # Fixed description from L1
    description: Optional[str] = None  # Customizable description
    processing_message: Optional[str] = None
    tags: Optional[List[str]] = []
    layer: Optional[int] = 1
    parameters: Optional[Dict[str, Any]] = {}
    hyperparameters: Optional[Dict[str, HyperparameterSchema]] = {}
    input_schema: Optional[Dict[str, Any]] = {}
    output_schema: Optional[Dict[str, Any]] = {}
    parameter_schema_structure: Optional[Dict[str, Any]] = {}
    
    class Config:
        extra = "allow"  # Allow extra fields for backward compatibility

class FlowDefinition(BaseModel):
    """Flow definition structure."""
    nodes: Dict[str, NodeDefinition]
    connections: List[Connection]
    start_element: str

def validate_data_against_schema(data: Dict[str, Any], schema_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate data against a schema dictionary.
    
    Args:
        data: Data to validate
        schema_dict: Schema dictionary to validate against
        
    Returns:
        Dict with validation result and error message if any
    """
    try:
        # Create a model from the schema
        model = create_pydantic_model_from_schema(schema_dict)
        
        # Validate the data
        model(**data)
        
        return {"valid": True}
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }
