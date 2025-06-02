# elements/util/random_generator.py
from typing import Dict, Any, Optional, List
import random
import string

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger

class RandomGenerator(ElementBase):
    """Random Generator element for generating random values."""
    
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
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "type": "string",
                "floating_point": False,
                "min": 0,
                "max": 100,
                "decimal": 2,
                "length": 10
            }
        
        # Default hyperparameters for Random Generator element
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
                "parameters.type": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Random Type",
                    description="Type of random value to generate"
                ),
                "parameters.floating_point": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Floating Point",
                    description="Whether to generate floating point numbers"
                ),
                "parameters.min": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Minimum Value",
                    description="Minimum value for numeric types"
                ),
                "parameters.max": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Maximum Value",
                    description="Maximum value for numeric types"
                ),
                "parameters.decimal": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Decimal Places",
                    description="Number of decimal places for float type"
                ),
                "parameters.length": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="String Length",
                    description="Length of generated string"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "type": {
                    "type": "string",
                    "description": "Type of random value to generate",
                    "enum": ["string", "int", "float"],
                    "default": "string",
                    "required": False
                },
                "floating_point": {
                    "type": "bool",
                    "description": "Whether to generate floating point numbers",
                    "default": False,
                    "required": False
                },
                "min": {
                    "type": "int",
                    "description": "Minimum value for numeric types",
                    "default": 0,
                    "required": False
                },
                "max": {
                    "type": "int",
                    "description": "Maximum value for numeric types",
                    "default": 100,
                    "required": False
                },
                "decimal": {
                    "type": "int",
                    "description": "Number of decimal places for float type",
                    "default": 2,
                    "required": False,
                    "min": 0,
                    "max": 10
                },
                "length": {
                    "type": "int",
                    "description": "Length of generated string",
                    "default": 10,
                    "required": False,
                    "min": 1,
                    "max": 1000
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="random_generator",
            description=description,
            node_description=node_description or "Generates random values of different types",
            processing_message=processing_message or "Generating random value...",
            tags=tags or ["utility", "random"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the random generator element."""
        # Log execution
        logger.info(f"Executing random generator element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Get parameters (with defaults)
        random_type = self.parameters.get("type", "string")
        floating_point = self.parameters.get("floating_point", False)
        min_val = self.parameters.get("min", 0)
        max_val = self.parameters.get("max", 100)
        decimal_places = self.parameters.get("decimal", 2)
        length = self.parameters.get("length", 10)
        
        # Generate random data based on type
        random_data = None
        
        try:
            if random_type == "string":
                random_data = self._generate_random_string(length)
            elif random_type == "int":
                random_data = self._generate_random_int(min_val, max_val)
            elif random_type == "float":
                random_data = self._generate_random_float(min_val, max_val, decimal_places)
            else:
                logger.warning(f"Unknown random data type '{random_type}', defaulting to string")
                random_data = self._generate_random_string(length)
                
        except Exception as e:
            logger.error(f"Error generating random data: {str(e)}")
            # Provide fallback values
            if random_type == "string":
                random_data = "error"
            elif random_type == "int":
                random_data = 0
            elif random_type == "float":
                random_data = 0.0
            else:
                random_data = None
        
        # Set output to the random data
        self.outputs = {"random_data": random_data}
        
        # Stream the random data
        await executor._stream_event("random_generator", {
            "element_id": self.element_id,
            "type": random_type,
            "random_data": random_data,
            "parameters": {
                "type": random_type,
                "min": min_val,
                "max": max_val,
                "length": length,
                "decimal": decimal_places
            }
        })
        
        return self.outputs
    
    def _generate_random_string(self, length: int) -> str:
        """Generate a random alphanumeric string of specified length."""
        # Use a mix of uppercase, lowercase, and digits
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))
    
    def _generate_random_int(self, min_val: int, max_val: int) -> int:
        """Generate a random integer within the specified range."""
        return random.randint(min_val, max_val)
    
    def _generate_random_float(self, min_val: int, max_val: int, decimal_places: int) -> float:
        """Generate a random float within the specified range."""
        # Generate a random float
        value = random.uniform(min_val, max_val)
        
        # Round to specified decimal places
        return round(value, decimal_places)