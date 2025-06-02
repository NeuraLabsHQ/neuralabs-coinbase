# elements/util/time_block.py
from typing import Dict, Any, Optional, List
import datetime
import time
import pytz

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from utils.logger import logger

class TimeBlock(ElementBase):
    """Time Block element for providing current date and time information."""
    
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
                "format": "iso",
                "custom_format": "%Y-%m-%d %H:%M:%S",
                "timezone": "UTC",
                "include_components": ["timestamp", "date", "time"]
            }
        
        # Default hyperparameters for Time Block element
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
                "parameters.format": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Format",
                    description="Output format for timestamp"
                ),
                "parameters.custom_format": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Custom Format",
                    description="Custom strftime format string"
                ),
                "parameters.timezone": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Timezone",
                    description="Timezone for output"
                ),
                "parameters.include_components": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Include Components",
                    description="List of time components to include in output"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "format": {
                    "type": "string",
                    "description": "Output format for timestamp",
                    "enum": ["iso", "unix", "custom"],
                    "default": "iso",
                    "required": False
                },
                "custom_format": {
                    "type": "string",
                    "description": "Custom strftime format string",
                    "default": "%Y-%m-%d %H:%M:%S",
                    "required": False
                },
                "timezone": {
                    "type": "string",
                    "description": "Timezone for output",
                    "default": "UTC",
                    "required": False
                },
                "include_components": {
                    "type": "list",
                    "description": "List of time components to include in output",
                    "default": ["timestamp", "date", "time"],
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="time",
            description=description,
            node_description=node_description or "Provides current date and time information in various formats",
            processing_message=processing_message or "Getting current time...",
            tags=tags or ["utility", "time", "datetime"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the time block element."""
        # Log execution
        logger.info(f"Executing time block element: {self.name} ({self.element_id})")
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Get parameters (with defaults)
        format_type = self.parameters.get("format", "iso")
        custom_format = self.parameters.get("custom_format", "%Y-%m-%d %H:%M:%S")
        timezone_str = self.parameters.get("timezone", "UTC")
        include_components = self.parameters.get("include_components", ["timestamp", "date", "time"])
        
        try:
            # Generate comprehensive time data
            time_data = self._generate_time_data(format_type, custom_format, timezone_str, include_components)
            
            # Set outputs based on included components
            self.outputs = time_data
            
            # Stream the time data
            await executor._stream_event("time_block", {
                "element_id": self.element_id,
                "format": format_type,
                "timezone": timezone_str,
                "components": list(time_data.keys()),
                "timestamp": time_data.get("timestamp")
            })
            
            return self.outputs
            
        except Exception as e:
            logger.error(f"Error generating time data: {str(e)}")
            # Return basic time data on error
            fallback_data = self._get_fallback_time_data()
            self.outputs = fallback_data
            
            await executor._stream_event("time_block_error", {
                "element_id": self.element_id,
                "error": str(e),
                "fallback_data": fallback_data
            })
            
            return self.outputs
    
    def _generate_time_data(self, format_type: str, custom_format: str, timezone_str: str, include_components: List[str]) -> Dict[str, Any]:
        """Generate comprehensive time data based on parameters."""
        # Parse timezone
        tz = self._parse_timezone(timezone_str)
        
        # Get current time in specified timezone
        now = datetime.datetime.now(tz)
        
        # Build output dictionary based on included components
        output = {}
        
        # Primary timestamp (always included if in components)
        if "timestamp" in include_components:
            if format_type == "iso":
                output["timestamp"] = now.isoformat()
            elif format_type == "unix":
                output["timestamp"] = str(int(now.timestamp()))
            elif format_type == "custom":
                output["timestamp"] = now.strftime(custom_format)
            else:
                output["timestamp"] = now.isoformat()
        
        # Unix timestamp
        if "unix_timestamp" in include_components:
            output["unix_timestamp"] = int(now.timestamp())
        
        # Date components
        if "date" in include_components:
            output["date"] = now.strftime("%Y-%m-%d")
        
        if "time" in include_components:
            output["time"] = now.strftime("%H:%M:%S")
        
        # Individual components
        if "year" in include_components:
            output["year"] = now.year
        
        if "month" in include_components:
            output["month"] = now.month
        
        if "day" in include_components:
            output["day"] = now.day
        
        if "hour" in include_components:
            output["hour"] = now.hour
        
        if "minute" in include_components:
            output["minute"] = now.minute
        
        if "second" in include_components:
            output["second"] = now.second
        
        # Day of week
        if "day_of_week" in include_components:
            output["day_of_week"] = now.strftime("%A")
        
        # Timezone info
        if "timezone" in include_components:
            output["timezone"] = str(now.tzinfo)
        
        return output
    
    def _parse_timezone(self, timezone_str: str) -> datetime.tzinfo:
        """Parse timezone string into timezone object."""
        try:
            # Try standard timezone names first
            return pytz.timezone(timezone_str)
        except pytz.exceptions.UnknownTimeZoneError:
            # Try UTC offset format (e.g., "UTC+8", "UTC-5")
            if timezone_str.upper().startswith("UTC"):
                try:
                    offset_str = timezone_str[3:]
                    if offset_str:
                        # Handle + or - prefix
                        if offset_str.startswith("+"):
                            offset_hours = int(offset_str[1:])
                        elif offset_str.startswith("-"):
                            offset_hours = -int(offset_str[1:])
                        else:
                            offset_hours = int(offset_str)
                        
                        return datetime.timezone(datetime.timedelta(hours=offset_hours))
                    else:
                        return datetime.timezone.utc
                except ValueError:
                    logger.warning(f"Invalid timezone offset: {timezone_str}, using UTC")
                    return datetime.timezone.utc
            else:
                # Try common timezone abbreviations
                common_timezones = {
                    "EST": "America/New_York",
                    "PST": "America/Los_Angeles", 
                    "CST": "America/Chicago",
                    "MST": "America/Denver",
                    "GMT": "GMT",
                    "CET": "Europe/Paris",
                    "JST": "Asia/Tokyo"
                }
                
                if timezone_str.upper() in common_timezones:
                    try:
                        return pytz.timezone(common_timezones[timezone_str.upper()])
                    except pytz.exceptions.UnknownTimeZoneError:
                        pass
                
                logger.warning(f"Unknown timezone: {timezone_str}, using UTC")
                return datetime.timezone.utc
    
    def _get_fallback_time_data(self) -> Dict[str, Any]:
        """Get basic fallback time data when errors occur."""
        now = datetime.datetime.now(datetime.timezone.utc)
        return {
            "timestamp": now.isoformat(),
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S")
        }