# elements/inputs/metadata.py
from typing import Dict, Any, Optional, List
import uuid
import os
from datetime import datetime

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger

class Metadata(ElementBase):
    """Metadata element for providing user and environment metadata."""
    
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
                 # Metadata specific parameters
                 data_filter: Optional[List[str]] = None,
                 include_all: bool = True,
                 custom_fields: Optional[Dict[str, Any]] = None):
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "data_filter": data_filter or [],
                "include_all": include_all,
                "custom_fields": custom_fields or {}
            }
        
        # Default hyperparameters for Metadata element
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
                "parameters.data_filter": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Data Filter",
                    description="List of specific metadata fields to include"
                ),
                "parameters.include_all": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Include All",
                    description="Whether to include all available metadata"
                ),
                "parameters.custom_fields": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Custom Fields",
                    description="Additional custom metadata fields"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "data_filter": {
                    "type": "list",
                    "description": "List of specific metadata fields to include (empty = all)",
                    "default": [],
                    "required": False
                },
                "include_all": {
                    "type": "bool",
                    "description": "Whether to include all available metadata fields",
                    "default": True,
                    "required": False
                },
                "custom_fields": {
                    "type": "json",
                    "description": "Additional custom metadata to include",
                    "default": {},
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="metadata",
            description=description,
            node_description=node_description or "Provides access to execution context automatically",
            processing_message=processing_message or "Loading execution metadata...",
            tags=tags or ["context", "user-data", "metadata"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the metadata element."""
        # Log execution
        logger.info(f"Executing metadata element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Get parameters (with defaults)
        data_filter = self.parameters.get("data_filter", [])
        include_all = self.parameters.get("include_all", True)
        custom_fields = self.parameters.get("custom_fields", {})
        
        # Generate metadata from various sources
        metadata = {}
        
        # System metadata
        if include_all or "execution_id" in data_filter:
            metadata["execution_id"] = str(uuid.uuid4())
        
        if include_all or "environment" in data_filter:
            metadata["environment"] = os.getenv("ENVIRONMENT", "development")
        
        # Session metadata (simulated for now)
        if include_all or "session_id" in data_filter:
            metadata["session_id"] = f"session_{str(uuid.uuid4())[:8]}"
        
        if include_all or "session_count" in data_filter:
            metadata["session_count"] = 1  # This would come from actual session storage
        
        # User metadata (simulated - would come from auth context)
        if include_all or "user_id" in data_filter:
            metadata["user_id"] = "user_12345"  # Would come from executor context
        
        if include_all or "user_name" in data_filter:
            metadata["user_name"] = "Demo User"  # Would come from executor context
        
        if include_all or "user_email" in data_filter:
            metadata["user_email"] = "demo@example.com"  # Would come from executor context
        
        if include_all or "wallet_address" in data_filter:
            metadata["wallet_address"] = "0x1234...abcd"  # Would come from executor context
        
        # Timestamp metadata
        if include_all or "timestamp" in data_filter:
            metadata["timestamp"] = datetime.now().isoformat()
        
        # Flow execution metadata
        if include_all or "flow_id" in data_filter:
            metadata["flow_id"] = executor.flow_id if hasattr(executor, 'flow_id') else "unknown"
        
        # Add custom fields
        if custom_fields:
            metadata.update(custom_fields)
        
        # Override with explicit inputs if any
        if self.inputs:
            metadata.update(self.inputs)
        
        # Filter metadata if data_filter is specified and include_all is False
        if not include_all and data_filter:
            filtered_metadata = {}
            for field in data_filter:
                if field in metadata:
                    filtered_metadata[field] = metadata[field]
            metadata = filtered_metadata
        
        # Set output
        self.outputs = metadata
        
        # Stream metadata information (with sensitive data redacted)
        safe_metadata = self._redact_sensitive_data(metadata)
        await executor._stream_event("metadata", {
            "element_id": self.element_id,
            "metadata": safe_metadata,
            "fields_included": list(metadata.keys())
        })
        
        return self.outputs
    
    def _redact_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact sensitive data like wallet addresses and tokens."""
        if not isinstance(data, dict):
            return data
            
        sensitive_keys = ["wallet", "address", "private", "secret", "key", "token", "password", "email"]
        redacted = {}
        
        for k, v in data.items():
            if any(sensitive in k.lower() for sensitive in sensitive_keys):
                # Hide part of the string for identifiers
                if isinstance(v, str) and len(v) > 8:
                    redacted[k] = v[:4] + "..." + v[-4:]
                else:
                    redacted[k] = "********"
            else:
                redacted[k] = v
                
        return redacted