# elements/ai/llm_text.py
from typing import Dict, Any, List, Optional
import json

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from services.bedrock import BedrockService
from utils.logger import logger

class LLMText(ElementBase):
    """LLM Text Generation Element."""
    
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
                 # LLM specific parameters
                 model: str = None, 
                 temperature: float = 0.65,
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
        
        # Default hyperparameters for LLM Text element
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
                    access_level=AccessLevel.L3,
                    display_name="Model ID",
                    description="AI model to use for generation"
                ),
                "parameters.temperature": HyperparameterSchema(
                    access_level=AccessLevel.L3,
                    display_name="Temperature",
                    description="Controls randomness in generation (0-1)"
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
                    "description": "Model ID or ARN for the AI model",
                    "default": None,
                    "required": False
                },
                "temperature": {
                    "type": "float",
                    "description": "Temperature for text generation (0-1)",
                    "default": 0.65,
                    "required": False,
                    "min": 0.0,
                    "max": 1.0
                },
                "max_tokens": {
                    "type": "int",
                    "description": "Maximum tokens to generate",
                    "default": 1000,
                    "required": False,
                    "min": 1,
                    "max": 100000
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
            element_type="llm_text",
            description=description,
            node_description=node_description or "Generates text using Large Language Models",
            processing_message=processing_message or "Generating AI response...",
            tags=tags or ["ai", "text-generation", "llm"],
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
        
        """Execute LLM text generation."""
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        if not self.validate_inputs():
            missing_inputs = [name for name, schema in self.input_schema.items() 
                             if schema.get('required', False) and name not in self.inputs]
            raise ValueError(f"Missing required inputs for LLM Text element: {missing_inputs}")
        
        # Get inputs
        prompt          = self.inputs.get("prompt", "")
        context         = self.inputs.get("context", [])
        additional_data = self.inputs.get("additional_data", {})
        
        # Get parameters (with defaults)
        model = self.parameters.get("model")
        temperature = self.parameters.get("temperature", 0.65)
        max_tokens = self.parameters.get("max_tokens", 1000)
        wrapper_prompt = self.parameters.get("wrapper_prompt", "")
        
        # Format the prompt with wrapper and context
        formatted_prompt = self._format_prompt(prompt, context, additional_data, wrapper_prompt)
        
        # Stream a log of the prompt being sent to the model
        await executor._stream_event("llm_prompt", {
            "element_id": self.element_id,
            "prompt": formatted_prompt,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens
        })
        
        # Initialize Bedrock service from config
        config = executor.config
        
        if model is None:
            model = config.get("default_model_id", "arn:aws:bedrock:us-east-2:559050205657:inference-profile/us.deepseek.r1-v1:0")
        
        bedrock_service = BedrockService(
            region_name=config.get("aws_region", "us-west-2"),
            aws_access_key_id=config.get("aws_access_key_id"),
            aws_secret_access_key=config.get("aws_secret_access_key"),
            model_id=model
        )
        
        # Stream the generation to Backend 2
        llm_output = ""
        
        if executor.stream_manager:
            metadata = {
                "element_id": self.element_id,
                "element_type": self.element_type,
                "element_name": self.name,
                "flow_id": executor.flow_id
            }
            
            # Get streaming generator
            chunk_generator = bedrock_service.generate_text_stream(
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
            logger.warning("No stream manager available, using non-streaming LLM generation")
            llm_output = await bedrock_service.generate_text(
                prompt=formatted_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
        
        # Set output
        self.outputs = {"llm_output": llm_output}
        
        # Validate output
        if not self.validate_outputs():
            missing_outputs = [name for name, schema in self.output_schema.items() 
                              if schema.get('required', False) and name not in self.outputs]
            raise ValueError(f"LLM output does not match required schema. Missing: {missing_outputs}")
        
        return self.outputs
    
    def _format_prompt(self, prompt: str, context: List[str], additional_data: Dict[str, Any], wrapper_prompt: str) -> str:
        """Format the prompt with wrapper, context, and additional data."""
        # Format context as string
        context_str = "\n".join(context) if context else ""
        
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
                formatted_prompt = wrapper_prompt.format(
                    prompt=prompt,
                    context=context_str,
                    additional_data=additional_data_str
                )
            except KeyError as e:
                logger.warning(f"Error formatting wrapper prompt: {str(e)}. Using default formatting.")
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