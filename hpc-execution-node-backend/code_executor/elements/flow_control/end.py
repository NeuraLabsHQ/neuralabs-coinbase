# elements/flow_control/end.py
from typing import Dict, Any, Optional, List

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger
from utils.validators import validate_inputs

class End(ElementBase):
    """End element for flow execution."""
    
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
        
        # Default hyperparameters for End element
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
                )
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="end",
            description=description,
            node_description=node_description or "Terminal point of the flow execution",
            processing_message=processing_message or "Finalizing flow execution...",
            tags=tags or ["flow-control", "exit-point"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the end element."""
        # Log execution
        logger.info(f"Executing end element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for end element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Process inputs
        text_output = self.inputs.get("text_input")
        proposed_transaction = self.inputs.get("proposed_transaction")
        
        # Set outputs
        self.outputs = {
            "text_output": text_output,
            "proposed_transaction": proposed_transaction
        }
        
        # Stream final output to Backend 2
        await executor._stream_event("final_output", {
            "flow_id": executor.flow_id,
            "text_output": text_output,
            "proposed_transaction": proposed_transaction
        })
        
        # End element marks the end of flow execution
        # The flow executor will handle finishing the flow
        return self.outputs