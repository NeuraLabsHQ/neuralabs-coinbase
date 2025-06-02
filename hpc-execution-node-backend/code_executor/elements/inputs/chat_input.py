# elements/inputs/chat_input.py
from typing import Dict, Any, Optional, List
import re

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger

class ChatInput(ElementBase):
    """Chat Input element for retrieving user input."""
    
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
                 parameter_schema_structure: Optional[Dict[str, Any]] = None,
                 # ChatInput specific parameters
                 placeholder: str = "Enter your message...",
                 max_length: int = 1000,
                 min_length: int = 1,
                 validation_pattern: Optional[str] = None,
                 required: bool = True):
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "placeholder": placeholder,
                "max_length": max_length,
                "min_length": min_length,
                "validation_pattern": validation_pattern,
                "required": required
            }
        
        # Default hyperparameters for ChatInput element
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
                "parameters.placeholder": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Placeholder Text",
                    description="Placeholder text shown in chat input"
                ),
                "parameters.max_length": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Maximum Length",
                    description="Maximum allowed character length"
                ),
                "parameters.min_length": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Minimum Length",
                    description="Minimum required character length"
                ),
                "parameters.validation_pattern": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Validation Pattern",
                    description="Regex pattern for input validation"
                ),
                "parameters.required": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Required",
                    description="Whether input is mandatory"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "placeholder": {
                    "type": "string",
                    "description": "Placeholder text for the input field",
                    "default": "Enter your message...",
                    "required": False
                },
                "max_length": {
                    "type": "int",
                    "description": "Maximum character length allowed",
                    "default": 1000,
                    "required": False,
                    "min": 1,
                    "max": 10000
                },
                "min_length": {
                    "type": "int",
                    "description": "Minimum character length required",
                    "default": 1,
                    "required": False,
                    "min": 0,
                    "max": 1000
                },
                "validation_pattern": {
                    "type": "string",
                    "description": "Regex pattern for input validation",
                    "default": None,
                    "required": False
                },
                "required": {
                    "type": "bool",
                    "description": "Whether the input is mandatory",
                    "default": True,
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="chat_input",
            description=description,
            node_description=node_description or "Captures user text input as the primary interface",
            processing_message=processing_message or "Capturing user input...",
            tags=tags or ["input", "user-interaction", "chat"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the chat input element."""
        # Log execution
        logger.info(f"Executing chat input element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Get parameters (with defaults)
        max_length = self.parameters.get("max_length", 1000)
        min_length = self.parameters.get("min_length", 1)
        validation_pattern = self.parameters.get("validation_pattern")
        required = self.parameters.get("required", True)
        
        # Chat input should already be provided in the initial inputs
        chat_input = self.inputs.get("chat_input", "")
        
        # Validate input
        validation_errors = []
        
        if required and not chat_input.strip():
            validation_errors.append("Chat input is required but was empty")
        
        if chat_input and len(chat_input) > max_length:
            validation_errors.append(f"Chat input exceeds maximum length of {max_length} characters")
        
        if chat_input and len(chat_input) < min_length:
            validation_errors.append(f"Chat input is below minimum length of {min_length} characters")
        
        if chat_input and validation_pattern:
            try:
                if not re.match(validation_pattern, chat_input):
                    validation_errors.append(f"Chat input does not match required pattern: {validation_pattern}")
            except re.error as e:
                logger.warning(f"Invalid regex pattern '{validation_pattern}': {str(e)}")
        
        if validation_errors:
            error_msg = "; ".join(validation_errors)
            logger.error(f"Chat input validation failed for element {self.element_id}: {error_msg}")
            raise ValueError(f"Chat input validation failed: {error_msg}")
        
        # Set output to the validated chat input
        self.outputs = {"chat_input": chat_input}
        
        # Stream the chat input to the flow
        await executor._stream_event("chat_input", {
            "element_id": self.element_id,
            "chat_input": chat_input,
            "validation_passed": True
        })
        
        return self.outputs