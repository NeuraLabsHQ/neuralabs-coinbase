# elements/util/selector.py
from typing import Dict, Any, List, Optional, Union
import re

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs

class Selector(ElementBase):
    """Selector element for selecting values from data based on a key."""
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="selector",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        # Extract parameters
        params = parameters or {}
        self.key = params.get("key", "")
        self.default_value = params.get("default_value", None)
        self.multiple_paths = params.get("multiple_paths", [])
        self.error_on_missing = params.get("error_on_missing", False)
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the selector element."""
        # Log execution
        logger.info(f"Executing selector element: {self.name} ({self.element_id})")
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for selector element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Get data from inputs
        data = self.inputs.get("data", {})
        
        # Determine paths to try
        paths_to_try = []
        if self.multiple_paths:
            paths_to_try.extend(self.multiple_paths)
        if self.key:
            paths_to_try.append(self.key)
        
        # Try each path until one succeeds
        selected_value = None
        found = False
        path_used = None
        
        for path in paths_to_try:
            try:
                value = self._select_by_path(data, path)
                if value is not None or path == paths_to_try[-1]:  # Found value or last path
                    selected_value = value
                    found = value is not None
                    path_used = path
                    break
            except Exception as e:
                logger.debug(f"Path '{path}' failed: {str(e)}")
                continue
        
        # If not found and error_on_missing is True, raise error
        if not found and self.error_on_missing:
            error_msg = f"No value found for paths: {paths_to_try}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Use default value if not found
        if not found:
            selected_value = self.default_value
        
        # Set outputs
        self.outputs = {
            "selected_value": selected_value,
            "found": found,
            "path_used": path_used
        }
        
        # Stream the selection info
        await executor._stream_event("selector", {
            "element_id": self.element_id,
            "paths_tried": paths_to_try,
            "path_used": path_used,
            "found": found,
            "selected_value_preview": str(selected_value)[:500] if selected_value is not None else None
        })
        
        return self.outputs
    
    def _select_by_path(self, data: Any, path: str) -> Any:
        """Select value from data using dot notation path with array support."""
        if not path:
            return data
        
        # Split path by dots but preserve array indices
        # e.g., "users[0].profile.name" -> ["users[0]", "profile", "name"]
        parts = []
        current = ""
        in_bracket = False
        
        for char in path:
            if char == '[':
                in_bracket = True
                current += char
            elif char == ']':
                in_bracket = False
                current += char
            elif char == '.' and not in_bracket:
                if current:
                    parts.append(current)
                    current = ""
            else:
                current += char
        
        if current:
            parts.append(current)
        
        # Navigate through the path
        result = data
        for part in parts:
            if result is None:
                return None
                
            # Check if this part has array index
            match = re.match(r'^([^[]*)\[(\d+)\]$', part)
            if match:
                # Handle array access like "items[0]"
                key = match.group(1)
                index = int(match.group(2))
                
                # If key is empty, it's just [0] - direct array access
                if key:
                    if isinstance(result, dict) and key in result:
                        result = result[key]
                    else:
                        return None
                
                # Now handle the array index
                if isinstance(result, list) and 0 <= index < len(result):
                    result = result[index]
                else:
                    return None
            else:
                # Regular property access
                if isinstance(result, dict) and part in result:
                    result = result[part]
                else:
                    return None
        
        return result