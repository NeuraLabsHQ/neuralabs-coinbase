# elements/inputs/context_history.py
from typing import Dict, Any, List, Optional

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger

class ContextHistory(ElementBase):
    """Context History element for providing conversation context."""
    
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
        
        # Default hyperparameters for Context History element
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
            element_type="context_history",
            description=description,
            node_description=node_description or "Provides conversation history and context to downstream elements",
            processing_message=processing_message or "Loading conversation context...",
            tags=tags or ["input", "context", "memory"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the context history element."""
        # Log execution
        logger.info(f"Executing context history element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Get context history from inputs
        context_history = self.inputs.get("context_history", [])
        
        # Ensure it's a list
        if not isinstance(context_history, list):
            logger.warning(f"Context history input is not a list in element {self.element_id}, converting to list")
            if context_history:
                context_history = [str(context_history)]
            else:
                context_history = []
        
        # Set output to the context history
        self.outputs = {"context_history": context_history}
        
        # Stream the context history to provide visibility
        await executor._stream_event("context_history", {
            "element_id": self.element_id,
            "context_history": context_history
        })
        
        return self.outputs