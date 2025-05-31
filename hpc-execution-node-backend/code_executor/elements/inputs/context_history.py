# elements/inputs/context_history.py
from typing import Dict, Any, List, Optional
from datetime import datetime

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
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "max_messages": 10,
                "include_system": False,
                "format": "full",
                "filter_by_role": "all"
            }
        
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
                ),
                "parameters.max_messages": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Max Messages",
                    description="Maximum number of messages to retrieve"
                ),
                "parameters.include_system": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Include System",
                    description="Whether to include system messages"
                ),
                "parameters.format": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Format",
                    description="Output format for messages"
                ),
                "parameters.filter_by_role": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Filter By Role",
                    description="Filter messages by role"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "max_messages": {
                    "type": "int",
                    "description": "Maximum number of messages to retrieve",
                    "default": 10,
                    "required": False,
                    "min": 1,
                    "max": 100
                },
                "include_system": {
                    "type": "bool",
                    "description": "Whether to include system messages",
                    "default": False,
                    "required": False
                },
                "format": {
                    "type": "string",
                    "description": "Output format for messages",
                    "enum": ["full", "text_only", "structured"],
                    "default": "full",
                    "required": False
                },
                "filter_by_role": {
                    "type": "string",
                    "description": "Filter messages by role",
                    "enum": ["all", "user", "assistant", "system"],
                    "default": "all",
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="context_history",
            description=description,
            node_description=node_description or "Provides conversation history and context to downstream elements",
            processing_message=processing_message or "Loading conversation history...",
            tags=tags or ["input", "context", "history"],
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
        
        # Get parameters (with defaults)
        max_messages = self.parameters.get("max_messages", 10)
        include_system = self.parameters.get("include_system", False)
        format_type = self.parameters.get("format", "full")
        filter_by_role = self.parameters.get("filter_by_role", "all")
        
        # Get conversation history from session context or inputs
        # Priority: inputs -> session context -> create sample/default
        conversation_history = []
        
        # Try to get from inputs first
        if self.inputs and "context_history" in self.inputs:
            input_history = self.inputs["context_history"]
            if isinstance(input_history, list):
                conversation_history = input_history
            else:
                conversation_history = [str(input_history)]
        else:
            # Try to get from executor/session context (if available)
            if hasattr(executor, 'session_context') and executor.session_context:
                conversation_history = executor.session_context.get('conversation_history', [])
            else:
                # Create sample conversation history for demonstration
                conversation_history = [
                    {
                        "role": "user",
                        "content": "Hello, I need help with my account",
                        "timestamp": datetime.now().isoformat(),
                        "metadata": {"message_id": "msg_001", "session_id": "demo_session"}
                    },
                    {
                        "role": "assistant", 
                        "content": "I'd be happy to help you with your account. What specific issue are you experiencing?",
                        "timestamp": datetime.now().isoformat(),
                        "metadata": {"message_id": "msg_002", "session_id": "demo_session"}
                    }
                ]
        
        # Apply filtering by role
        if filter_by_role != "all":
            conversation_history = [
                msg for msg in conversation_history 
                if (isinstance(msg, dict) and msg.get("role") == filter_by_role) or
                   (isinstance(msg, str) and msg.lower().startswith(filter_by_role.lower()))
            ]
        
        # Apply system message filtering
        if not include_system:
            conversation_history = [
                msg for msg in conversation_history
                if not (isinstance(msg, dict) and msg.get("role") == "system")
            ]
        
        # Limit number of messages
        if len(conversation_history) > max_messages:
            conversation_history = conversation_history[-max_messages:]  # Get most recent messages
        
        # Format output based on format parameter
        formatted_history = self._format_history(conversation_history, format_type)
        
        # Set outputs
        self.outputs = {"history": formatted_history}
        
        # Stream the context history to provide visibility
        await executor._stream_event("context_history", {
            "element_id": self.element_id,
            "history": formatted_history,
            "message_count": len(formatted_history),
            "format": format_type,
            "filter_by_role": filter_by_role
        })
        
        return self.outputs
    
    def _format_history(self, history: List[Any], format_type: str) -> List[Any]:
        """Format conversation history based on the specified format."""
        if format_type == "text_only":
            # Convert to simple text format
            formatted = []
            for msg in history:
                if isinstance(msg, dict):
                    role = msg.get("role", "unknown").title()
                    content = msg.get("content", "")
                    formatted.append(f"{role}: {content}")
                else:
                    formatted.append(str(msg))
            return formatted
            
        elif format_type == "structured":
            # Organize for analysis with statistics
            user_messages = [msg for msg in history if isinstance(msg, dict) and msg.get("role") == "user"]
            assistant_messages = [msg for msg in history if isinstance(msg, dict) and msg.get("role") == "assistant"]
            
            return {
                "conversation_id": f"conv_{hash(str(history)) % 10000}",
                "session_count": len(history),
                "messages": history,
                "statistics": {
                    "total_messages": len(history),
                    "user_messages": len(user_messages),
                    "assistant_messages": len(assistant_messages),
                    "system_messages": len(history) - len(user_messages) - len(assistant_messages)
                }
            }
            
        else:  # format_type == "full" (default)
            # Return complete message objects with metadata
            formatted = []
            for msg in history:
                if isinstance(msg, dict):
                    # Ensure required fields exist
                    formatted_msg = {
                        "role": msg.get("role", "unknown"),
                        "content": msg.get("content", ""),
                        "timestamp": msg.get("timestamp", datetime.now().isoformat()),
                        "metadata": msg.get("metadata", {})
                    }
                    formatted.append(formatted_msg)
                else:
                    # Convert string to message format
                    formatted.append({
                        "role": "unknown",
                        "content": str(msg),
                        "timestamp": datetime.now().isoformat(),
                        "metadata": {}
                    })
            return formatted