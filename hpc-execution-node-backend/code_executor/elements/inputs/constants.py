# elements/inputs/constants.py
from typing import Dict, Any, Optional, List
import json
import os

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger

class Constants(ElementBase):
    """Constants element for providing fixed values."""
    
    def __init__(self, 
                 element_id: str, 
                 name: str, 
                 description: str,
                 input_schema: Dict[str, Any], 
                 output_schema: Dict[str, Any],
                 node_description: Optional[str] = None,
                 processing_message: Optional[str] = None,
                 tags: Optional[List[str]] = None,
                 layer: int = 1,
                 parameters: Optional[Dict[str, Any]] = None,
                 hyperparameters: Optional[Dict[str, HyperparameterSchema]] = None,
                 parameter_schema_structure: Optional[Dict[str, Any]] = None):
        
        # Constants element uses parameters as the constant values themselves
        # Each key-value pair in parameters becomes a constant
        if parameters is None:
            parameters = {}
        
        # Default hyperparameters for Constants element
        if hyperparameters is None:
            hyperparameters = {
                "name": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Element Name",
                    description="Display name for this element"
                ),
                "description": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Description",
                    description="User-provided description"
                ),
                "processing_message": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Processing Message",
                    description="Message shown during execution"
                ),
                "parameters": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Constants",
                    description="Key-value pairs of constant values"
                )
            }
        
        # Parameter schema structure is dynamic based on the constants defined
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "note": {
                    "type": "string",
                    "description": "Constants are defined as dynamic key-value pairs in parameters",
                    "default": "Add any key-value pairs as constants",
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="constants",
            description=description,
            node_description=node_description or "Completely customizable key-value storage",
            processing_message=processing_message or "Loading constants...",
            tags=tags or ["configuration", "settings", "constants"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the constants element."""
        # Log execution
        logger.info(f"Executing constants element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        try:
            # Process all parameters as constants
            constants = {}
            
            for key, value in self.parameters.items():
                # Handle environment variable references
                if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
                    env_var = value[2:-1]  # Remove ${ and }
                    env_value = os.getenv(env_var)
                    if env_value is not None:
                        constants[key] = env_value
                    else:
                        logger.warning(f"Environment variable {env_var} not found, using original value")
                        constants[key] = value
                else:
                    constants[key] = value
            
            # Override with explicit inputs if any
            if self.inputs:
                constants.update(self.inputs)
            
            # Set outputs to all constants - each constant becomes an output field
            self.outputs = constants.copy()
            
            # Stream the constants information
            safe_constants = self._redact_sensitive_data(constants)
            await executor._stream_event("constants", {
                "element_id": self.element_id,
                "constants": safe_constants,
                "count": len(constants),
                "keys": list(constants.keys())
            })
            
            return self.outputs
            
        except Exception as e:
            logger.error(f"Error processing constants in element {self.element_id}: {str(e)}")
            
            # Return empty constants on error
            self.outputs = {}
            
            await executor._stream_event("constants_error", {
                "element_id": self.element_id,
                "error": str(e)
            })
            
            return self.outputs
    
    def _redact_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact sensitive data from constants."""
        if not isinstance(data, dict):
            return data
            
        sensitive_keys = ["password", "secret", "key", "token", "api_key", "private"]
        redacted = {}
        
        for k, v in data.items():
            if any(sensitive in k.lower() for sensitive in sensitive_keys):
                if isinstance(v, str) and len(v) > 8:
                    redacted[k] = v[:4] + "..." + v[-4:]
                else:
                    redacted[k] = "********"
            else:
                redacted[k] = v
                
        return redacted