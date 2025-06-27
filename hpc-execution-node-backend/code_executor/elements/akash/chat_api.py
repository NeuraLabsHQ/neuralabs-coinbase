# elements/akash/chat_api.py
from typing import Dict, Any, List, Optional
import json

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from services.akash import AkashService
from utils.logger import logger


class ChatAPI(ElementBase):
    """Akash Chat API Element - Decentralized AI text generation."""
    
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
                 # Akash specific parameters
                 model: str = "Meta-Llama-3-1-8B-Instruct-FP8",
                 temperature: float = 0.7,
                 max_tokens: int = 1000,
                 wrapper_prompt: str = ""):
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "wrapper_prompt": wrapper_prompt
            }
        
        # Default hyperparameters for Akash Chat API element
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
                "parameters.model": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Model",
                    description="Akash AI model to use"
                ),
                "parameters.temperature": HyperparameterSchema(
                    access_level=AccessLevel.L3,
                    display_name="Temperature",
                    description="Controls randomness in generation (0-2)"
                ),
                "parameters.max_tokens": HyperparameterSchema(
                    access_level=AccessLevel.L3,
                    display_name="Max Tokens",
                    description="Maximum tokens to generate"
                ),
                "parameters.wrapper_prompt": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Wrapper Prompt",
                    description="Template to wrap user prompts"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "model": {
                    "type": "string",
                    "description": "Akash AI model to use",
                    "default": "Meta-Llama-3-1-8B-Instruct-FP8",
                    "required": False
                },
                "temperature": {
                    "type": "float",
                    "description": "Temperature for text generation (0-2)",
                    "default": 0.7,
                    "required": False,
                    "min": 0.0,
                    "max": 2.0
                },
                "max_tokens": {
                    "type": "int",
                    "description": "Maximum tokens to generate",
                    "default": 1000,
                    "required": False,
                    "min": 1,
                    "max": 4096
                },
                "wrapper_prompt": {
                    "type": "string",
                    "description": "Template to wrap prompts. Use {prompt}, {context}, {additional_data} placeholders",
                    "default": "",
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="ChatAPI",
            description=description,
            node_description=node_description or "Decentralized Chat API service running on Akash Network",
            processing_message=processing_message or "Connecting to decentralized Akash Network...",
            tags=tags or ["akash", "decentralized", "chat", "api", "web3"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, 
                      executor, 
                      backtracking=False) -> Dict[str, Any]:
        """Execute Akash Chat API call."""
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        if not self.validate_inputs():
            missing_inputs = [name for name, schema in self.input_schema.items() 
                             if schema.get('required', False) and name not in self.inputs]
            raise ValueError(f"Missing required inputs for Akash Chat API element: {missing_inputs}")
        
        # Get inputs (matching llm_text pattern)
        prompt = self.inputs.get("prompt", "")
        context = self.inputs.get("context", [])
        additional_data = self.inputs.get("additional_data", {})
        
        # Get parameters (with defaults)
        model = self.parameters.get("model", "Meta-Llama-3-1-8B-Instruct-FP8")
        temperature = self.parameters.get("temperature", 0.7)
        max_tokens = self.parameters.get("max_tokens", 1000)
        wrapper_prompt = self.parameters.get("wrapper_prompt", "")
        
        # Format the prompt with wrapper and context (same as llm_text)
        formatted_prompt = self._format_prompt(prompt, context, additional_data, wrapper_prompt)
        
        # Stream a log of the prompt being sent to the model
        await executor._stream_event("llm_prompt", {
            "element_id": self.element_id,
            "prompt": formatted_prompt,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens
        })
        
        # Initialize Akash service
        akash_service = AkashService(
            model_id=model,
            api_key=None,  # Will use env var from config
            base_url=None  # Will use default
        )
        
        # Stream the generation
        llm_output = ""
        
        if executor.stream_manager:
            metadata = {
                "element_id": self.element_id,
                "element_type": self.element_type,
                "element_name": self.name,
                "flow_id": executor.flow_id
            }
            
            # Get streaming generator
            chunk_generator = akash_service.generate_text_stream(
                prompt=formatted_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Accumulate output while streaming chunks
            async for chunk in chunk_generator:
                llm_output += chunk
                # Stream each chunk with metadata
                await executor._stream_event("llm_chunk", {
                    "element_id": self.element_id,
                    "content": chunk,
                    "metadata": metadata
                })
        else:
            # Non-streaming generation (fallback)
            logger.warning("No stream manager available, using non-streaming Akash generation")
            llm_output = await akash_service.generate_text(
                prompt=formatted_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
        
        # Set output (matching llm_text pattern)
        self.outputs = {"llm_output": llm_output}
        
        # Validate output
        if not self.validate_outputs():
            missing_outputs = [name for name, schema in self.output_schema.items() 
                              if schema.get('required', False) and name not in self.outputs]
            raise ValueError(f"Akash output does not match required schema. Missing: {missing_outputs}")
        
        return self.outputs
    
    def _format_prompt(self, prompt: str, context: List[Any], additional_data: Dict[str, Any], wrapper_prompt: str) -> str:
        """Format the prompt with wrapper, context, and additional data (same as llm_text)."""
        # Format context as string
        if context:
            # Handle both list of strings and list of message dictionaries
            if isinstance(context[0], dict):
                # Format conversation history from context_history element
                context_parts = []
                for msg in context:
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    context_parts.append(f"{role}: {content}")
                context_str = "\n".join(context_parts)
            else:
                # Simple list of strings
                context_str = "\n".join(str(item) for item in context)
        else:
            context_str = ""
        
        # Format additional data as JSON string
        additional_data_str = ""
        if additional_data:
            try:
                additional_data_str = f"\nAdditional Information:\n{json.dumps(additional_data, indent=2)}"
            except Exception as e:
                additional_data_str = f"\nAdditional Information: {str(additional_data)}"
                logger.warning(f"Error formatting additional data as JSON: {str(e)}")
        
        # Combine all parts
        if wrapper_prompt:
            # Use the wrapper prompt template if provided
            try:
                # Check if wrapper_prompt contains any placeholders
                if '{' in wrapper_prompt and '}' in wrapper_prompt:
                    # Create substitution dictionary with all inputs plus standard variables
                    substitution_vars = {
                        "prompt": prompt,
                        "context": context_str,
                        "additional_data": additional_data_str
                    }
                    
                    # Add all inputs as substitution variables
                    for key, value in self.inputs.items():
                        if key not in substitution_vars:  # Don't override standard variables
                            substitution_vars[key] = value
                    
                    formatted_prompt = wrapper_prompt.format(**substitution_vars)
                else:
                    # If no placeholders, append the user prompt to the wrapper prompt
                    if wrapper_prompt and prompt:
                        formatted_prompt = f"{wrapper_prompt}\n\nUser: {prompt}"
                    elif prompt:
                        formatted_prompt = prompt
                    else:
                        formatted_prompt = wrapper_prompt
            except KeyError as e:
                logger.warning(f"Error formatting wrapper prompt: {str(e)}. Missing variable in inputs. Using default formatting.")
                formatted_prompt = self._default_format(prompt, context_str, additional_data_str)
        else:
            # Default formatting if no wrapper is provided
            formatted_prompt = self._default_format(prompt, context_str, additional_data_str)
        
        return formatted_prompt.strip()
    
    def _default_format(self, prompt: str, context_str: str, additional_data_str: str) -> str:
        """Default prompt formatting."""
        formatted_prompt = ""
        
        if context_str:
            formatted_prompt += f"Context Information:\n{context_str}\n\n"
        
        if additional_data_str:
            formatted_prompt += f"{additional_data_str}\n\n"
        
        formatted_prompt += f"User Request:\n{prompt}"
        
        return formatted_prompt