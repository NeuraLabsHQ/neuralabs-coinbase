# elements/inputs/datablocks.py
from typing import Dict, Any, Optional, List
import json
import csv
import io
import yaml

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger

class Datablocks(ElementBase):
    """Datablocks element for providing static data."""
    
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
                "data": None,
                "format": "json",
                "parse_csv": True,
                "csv_headers": None
            }
        
        # Default hyperparameters for Datablocks element
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
                "parameters.data": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Data",
                    description="The actual data to store"
                ),
                "parameters.format": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Format",
                    description="Data format type"
                ),
                "parameters.parse_csv": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Parse CSV",
                    description="Whether to parse CSV into objects"
                ),
                "parameters.csv_headers": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="CSV Headers",
                    description="Custom headers for CSV data"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "data": {
                    "type": "any",
                    "description": "The actual data to store",
                    "default": None,
                    "required": False
                },
                "format": {
                    "type": "string",
                    "description": "Data format type",
                    "enum": ["json", "csv", "text", "yaml"],
                    "default": "json",
                    "required": False
                },
                "parse_csv": {
                    "type": "bool",
                    "description": "Whether to parse CSV into objects",
                    "default": True,
                    "required": False
                },
                "csv_headers": {
                    "type": "list",
                    "description": "Custom headers for CSV data",
                    "default": None,
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="datablock",
            description=description,
            node_description=node_description or "Stores and provides static data for use in flows",
            processing_message=processing_message or "Loading data...",
            tags=tags or ["input", "static-data", "configuration"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the datablocks element."""
        # Log execution
        logger.info(f"Executing datablocks element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Get parameters (with defaults)
        data = self.parameters.get("data", None)
        format_type = self.parameters.get("format", "json")
        parse_csv = self.parameters.get("parse_csv", True)
        csv_headers = self.parameters.get("csv_headers", None)
        
        try:
            # Process data based on format
            processed_data = self._process_data(data, format_type, parse_csv, csv_headers)
            
            # Set output to the processed data
            self.outputs = {"data": processed_data}
            
            # Stream the datablock information
            data_info = self._get_data_info(processed_data, format_type)
            await executor._stream_event("datablock", {
                "element_id": self.element_id,
                "format": format_type,
                "data_info": data_info,
                "data_size": len(str(processed_data)) if processed_data is not None else 0
            })
            
            return self.outputs
            
        except Exception as e:
            logger.error(f"Error processing datablock in element {self.element_id}: {str(e)}")
            # Return appropriate empty data on error
            empty_data = self._get_empty_data(format_type)
            self.outputs = {"data": empty_data}
            
            await executor._stream_event("datablock_error", {
                "element_id": self.element_id,
                "error": str(e),
                "fallback_data": empty_data
            })
            
            return self.outputs
    
    def _process_data(self, data: Any, format_type: str, parse_csv: bool, csv_headers: Optional[List[str]]) -> Any:
        """Process data based on the specified format."""
        if data is None:
            return self._get_empty_data(format_type)
        
        if format_type == "json":
            return self._process_json_data(data)
        elif format_type == "csv":
            return self._process_csv_data(data, parse_csv, csv_headers)
        elif format_type == "text":
            return self._process_text_data(data)
        elif format_type == "yaml":
            return self._process_yaml_data(data)
        else:
            logger.warning(f"Unknown format type '{format_type}', returning raw data")
            return data
    
    def _process_json_data(self, data: Any) -> Any:
        """Process JSON data."""
        if isinstance(data, str):
            try:
                return json.loads(data)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON data: {str(e)}")
                return {}
        return data
    
    def _process_csv_data(self, data: Any, parse_csv: bool, csv_headers: Optional[List[str]]) -> Any:
        """Process CSV data."""
        if isinstance(data, str):
            if parse_csv:
                try:
                    # Use StringIO to read CSV from string
                    csv_file = io.StringIO(data)
                    
                    # Use custom headers if provided
                    if csv_headers:
                        reader = csv.DictReader(csv_file, fieldnames=csv_headers)
                    else:
                        reader = csv.DictReader(csv_file)
                    
                    return list(reader)
                except Exception as e:
                    logger.error(f"Error parsing CSV data: {str(e)}")
                    return []
            else:
                # Return as raw text if not parsing
                return data
        return data
    
    def _process_text_data(self, data: Any) -> str:
        """Process text data."""
        if isinstance(data, str):
            return data
        else:
            return str(data)
    
    def _process_yaml_data(self, data: Any) -> Any:
        """Process YAML data."""
        if isinstance(data, str):
            try:
                return yaml.safe_load(data)
            except yaml.YAMLError as e:
                logger.error(f"Error parsing YAML data: {str(e)}")
                return {}
        return data
    
    def _get_empty_data(self, format_type: str) -> Any:
        """Get appropriate empty data for the format type."""
        if format_type == "json":
            return {}
        elif format_type == "csv":
            return []
        elif format_type == "text":
            return ""
        elif format_type == "yaml":
            return {}
        else:
            return None
    
    def _get_data_info(self, data: Any, format_type: str) -> Dict[str, Any]:
        """Get information about the processed data."""
        info = {
            "format": format_type,
            "type": type(data).__name__
        }
        
        if isinstance(data, dict):
            info["keys"] = list(data.keys())[:10]  # First 10 keys
            info["key_count"] = len(data.keys())
        elif isinstance(data, list):
            info["length"] = len(data)
            if data and isinstance(data[0], dict):
                info["sample_keys"] = list(data[0].keys())[:5]  # First 5 keys of first item
        elif isinstance(data, str):
            info["length"] = len(data)
            info["preview"] = data[:100] + "..." if len(data) > 100 else data
        
        return info