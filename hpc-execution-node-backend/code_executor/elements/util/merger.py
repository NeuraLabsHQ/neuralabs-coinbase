# elements/util/merger.py
from typing import Dict, Any, List, Optional, Union
import copy
import json

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs

class Merger(ElementBase):
    """Merger element for combining multiple data inputs."""
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="merger",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the merger element."""
        # Log execution
        logger.info(f"Executing merger element: {self.name} ({self.element_id})")
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for merger element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Collect all input values dynamically from the schema with their keys
        merged_data = {}
        for key in self.input_schema.keys():
            if key in self.inputs:
                merged_data[key] = self.inputs[key]
        
        # Convert merged data to JSON string
        merged_data_str = json.dumps(merged_data, indent=2)
        
        # Set output to the merged data as JSON string
        self.outputs = {"merged_data": merged_data_str}
        
        # Stream the merge info
        await executor._stream_event("merger", {
            "element_id": self.element_id,
            "merged_data_preview": str(merged_data)[:1000] + ("..." if len(str(merged_data)) > 1000 else "")
        })
        
        return self.outputs
    
    def _merge_multiple(self, data_list: List[Any]) -> Any:
        """Merge multiple data items iteratively."""
        if not data_list:
            return None
        if len(data_list) == 1:
            return copy.deepcopy(data_list[0])
        
        # Start with the first item and merge each subsequent item into the result
        result = copy.deepcopy(data_list[0])
        for data in data_list[1:]:
            result = self._merge_data(result, data)
        
        return result
    
    def _merge_data(self, data1: Any, data2: Any) -> Any:
        """Merge two data items based on their types following documented behavior."""
        # If either is None/undefined, return the non-null value
        if data1 is None:
            return copy.deepcopy(data2) if data2 is not None else None
        if data2 is None:
            return copy.deepcopy(data1)
        
        # Object + Object: Deep merge (recursive)
        if isinstance(data1, dict) and isinstance(data2, dict):
            result = copy.deepcopy(data1)
            for key, value in data2.items():
                if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                    # Recursively merge nested dictionaries
                    result[key] = self._merge_data(result[key], value)
                else:
                    # Otherwise data2 overwrites data1
                    result[key] = copy.deepcopy(value)
            return result
        
        # Array + Array: Concatenated array
        elif isinstance(data1, list) and isinstance(data2, list):
            return copy.deepcopy(data1) + copy.deepcopy(data2)
        
        # Object + Primitive: Object with primitive as property
        elif isinstance(data1, dict) and not isinstance(data2, (dict, list)):
            result = copy.deepcopy(data1)
            result['_merged_value'] = data2
            return result
        
        # Primitive + Object: Object with primitive as property
        elif not isinstance(data1, (dict, list)) and isinstance(data2, dict):
            result = copy.deepcopy(data2)
            result['_merged_value'] = data1
            return result
        
        # Primitive + Primitive: Object containing both
        elif not isinstance(data1, (dict, list)) and not isinstance(data2, (dict, list)):
            return {
                'data1': copy.deepcopy(data1),
                'data2': copy.deepcopy(data2)
            }
        
        # Mixed types (any other combination): Wrap in container object
        else:
            logger.debug(f"Merging mixed types {type(data1).__name__} and {type(data2).__name__}")
            return {
                'data1': copy.deepcopy(data1),
                'data2': copy.deepcopy(data2)
            }
