# elements/custom/custom.py
from typing import Dict, Any, Optional
import multiprocessing
import time
import psutil
import traceback
import json
import math
import statistics
import datetime
import re
import collections
import itertools
import hashlib
import base64
import urllib.parse
from RestrictedPython import compile_restricted, safe_globals, safe_builtins

from core.element_base import ElementBase
from utils.logger import logger
from utils.validators import validate_inputs, validate_outputs

class Custom(ElementBase):
    """Custom element for executing user-defined Python code with security restrictions."""
    
    def __init__(self, element_id: str, name: str, description: str,
                 input_schema: Dict[str, Any], output_schema: Dict[str, Any],
                 parameters: Dict[str, Any] = None, code: str = "", **kwargs):
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="custom",
            description=description,
            input_schema=input_schema,
            output_schema=output_schema
        )
        
        # Extract parameters
        params = parameters or {}
        self.hyperparameters = params.get("hyperparameters", {})
        self.constants = params.get("constants", {})
        
        # Code is passed separately in the flow definition
        self.code = code
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute the custom element."""
        # Log execution
        logger.info(f"Executing custom element: {self.name} ({self.element_id})")
        
        # Validate inputs
        validation_result = validate_inputs(self.inputs, self.input_schema)
        if not validation_result["valid"]:
            error_msg = f"Invalid inputs for custom element: {validation_result['error']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Check if custom code execution is allowed
        if not executor.config.get("allow_custom_code", False):
            error_msg = "Custom code execution is disabled in configuration"
            logger.error(error_msg)
            await executor._stream_event("custom_code_error", {
                "element_id": self.element_id,
                "error": error_msg
            })
            raise ValueError(error_msg)
        
        # Get resource limits from config (30 seconds as per documentation)
        max_memory_mb = executor.config.get("custom_code_max_memory_mb", 100)
        max_cpu_seconds = executor.config.get("custom_code_max_cpu_seconds", 30)
        
        # Stream code execution start
        await executor._stream_event("custom_code_start", {
            "element_id": self.element_id,
            "code_preview": self.code[:1000] + ("..." if len(self.code) > 1000 else "")
        })
        
        try:
            # Execute the custom code with restrictions
            result = self._execute_restricted_code(
                self.inputs,
                self.hyperparameters,
                self.constants,
                max_memory_mb,
                max_cpu_seconds
            )
            
            # Check result status
            if result["status"] == "error":
                error_msg = result["message"]
                logger.error(f"Error in custom code: {error_msg}")
                
                await executor._stream_event("custom_code_error", {
                    "element_id": self.element_id,
                    "error": error_msg
                })
                
                raise ValueError(f"Custom code execution failed: {error_msg}")
            
            # Set outputs
            self.outputs = result["output"]
            
            # Stream print outputs if any
            if "prints" in result and result["prints"]:
                await executor._stream_event("custom_code_prints", {
                    "element_id": self.element_id,
                    "prints": result["prints"]
                })
                # Also log prints for debugging
                for line in result["prints"]:
                    logger.debug(f"Custom code print: {line}")
            
            # Validate outputs
            validation_result = validate_outputs(self.outputs, self.output_schema)
            if not validation_result["valid"]:
                error_msg = f"Invalid outputs from custom code: {validation_result['error']}"
                logger.error(error_msg)
                
                await executor._stream_event("custom_code_error", {
                    "element_id": self.element_id,
                    "error": error_msg
                })
                
                raise ValueError(error_msg)
            
            # Stream code execution completion
            await executor._stream_event("custom_code_complete", {
                "element_id": self.element_id,
                "output_preview": str(self.outputs)[:1000] + ("..." if len(str(self.outputs)) > 1000 else ""),
                "has_prints": "prints" in result and bool(result["prints"])
            })
            
            return self.outputs
            
        except Exception as e:
            error_msg = f"Error executing custom code: {str(e)}"
            logger.error(error_msg)
            tb = traceback.format_exc()
            
            await executor._stream_event("custom_code_error", {
                "element_id": self.element_id,
                "error": error_msg,
                "traceback": tb
            })
            
            raise ValueError(error_msg)
    
    def _execute_restricted_code(self, inputs: Dict[str, Any], 
                               hyperparameters: Dict[str, Any],
                               constants: Dict[str, Any],
                               max_memory_mb: int,
                               max_cpu_seconds: int) -> Dict[str, Any]:
        """
        Execute code with restrictions on I/O, memory, and CPU time.
        
        Args:
            inputs: Input data dictionary
            hyperparameters: Hyperparameters dictionary
            constants: Constants dictionary
            max_memory_mb: Maximum memory in MB
            max_cpu_seconds: Maximum CPU time in seconds
        
        Returns:
            Dict with status and output or error message
        """
        # Define the restricted execution function
        def run_code(queue):
            # Collect print outputs
            printed_lines = []
            
            def safe_print(*args, **kwargs):
                """Capture print statements for debugging."""
                output = ' '.join(str(arg) for arg in args)
                printed_lines.append(output)
            
            # RestrictedPython setup
            restricted_globals = safe_globals.copy()
            restricted_globals['__builtins__'] = safe_builtins
            restricted_globals['_print_'] = safe_print  # Capture prints
            restricted_globals['print'] = safe_print  # Direct print access
            restricted_globals['_getiter_'] = iter  # For list comprehensions
            restricted_globals['_iter_unpack_sequence_'] = iter  # For unpacking
            
            # Add safe built-in functions as per documentation
            restricted_globals['abs'] = abs
            restricted_globals['min'] = min
            restricted_globals['max'] = max
            restricted_globals['sum'] = sum
            restricted_globals['round'] = round
            restricted_globals['len'] = len
            restricted_globals['sorted'] = sorted
            restricted_globals['range'] = range
            restricted_globals['list'] = list
            restricted_globals['dict'] = dict
            restricted_globals['set'] = set
            restricted_globals['tuple'] = tuple
            restricted_globals['str'] = str
            restricted_globals['int'] = int
            restricted_globals['float'] = float
            restricted_globals['bool'] = bool
            restricted_globals['enumerate'] = enumerate
            restricted_globals['zip'] = zip
            restricted_globals['map'] = map
            restricted_globals['filter'] = filter
            restricted_globals['all'] = all
            restricted_globals['any'] = any
            restricted_globals['isinstance'] = isinstance
            restricted_globals['type'] = type
            
            # Add safe standard library modules as per documentation
            restricted_globals['math'] = math
            restricted_globals['statistics'] = statistics
            restricted_globals['json'] = json
            restricted_globals['datetime'] = datetime
            restricted_globals['re'] = re
            restricted_globals['collections'] = collections
            restricted_globals['itertools'] = itertools
            restricted_globals['hashlib'] = hashlib
            restricted_globals['base64'] = base64
            restricted_globals['urllib'] = {'parse': urllib.parse}  # Only URL parsing
            
            # Create parameters dict with hyperparameters and constants
            parameters = {
                'hyperparameters': hyperparameters,
                'constants': constants
            }
            
            local_vars = {
                'inputs': inputs,
                'output': {},
                'parameters': parameters
            }
            
            try:
                # Compile the code with RestrictedPython
                compiled = compile_restricted(self.code, '<inline>', 'exec')
                
                if hasattr(compiled, 'errors') and compiled.errors:
                    raise ValueError(f"Code compilation errors: {compiled.errors}")
                    
                # Execute the compiled code
                exec(compiled, restricted_globals, local_vars)
                
                # Include print outputs if any
                result = {
                    "status": "success", 
                    "output": local_vars.get('output', {})
                }
                if printed_lines:
                    result["prints"] = printed_lines
                    
                queue.put(result)
            except Exception as e:
                queue.put({
                    "status": "error", 
                    "message": f"Execution failed: {str(e)}"
                })
        
        # Use multiprocessing for resource limits
        queue = multiprocessing.Queue()
        process = multiprocessing.Process(target=run_code, args=(queue,))
        process.start()
        
        # Monitor memory and enforce time limit
        start_time = time.time()
        while time.time() - start_time < max_cpu_seconds:
            if not process.is_alive():
                break
                
            try:
                p = psutil.Process(process.pid)
                mem = p.memory_info().rss / 1024 / 1024  # Memory in MB
                if mem > max_memory_mb:
                    process.terminate()
                    return {
                        "status": "error", 
                        "message": f"Memory limit exceeded ({mem:.2f} MB > {max_memory_mb} MB)",
                        "output": {}
                    }
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                # Process already terminated
                break
                
            time.sleep(0.1)
        
        # Check if process is still alive after time limit
        if process.is_alive():
            process.terminate()
            return {
                "status": "error", 
                "message": f"Time limit exceeded ({max_cpu_seconds} seconds)",
                "output": {}
            }
        
        # Get result from queue
        if queue.empty():
            return {
                "status": "error", 
                "message": "Process terminated without result",
                "output": {}
            }
            
        return queue.get()
