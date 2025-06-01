# elements/ai/llm_structured.py
from typing import Dict, Any, List, Optional
import json

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from services.bedrock import BedrockService
from utils.logger import logger

class LLMStructured(ElementBase):
    """LLM Structured Output Generation Element."""
    
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
                 temperature: float = 0.3,
                 max_tokens: int = 1000, 
                 wrapper_prompt: str = "",
                 llm_hidden_prompt: str = ""):
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "wrapper_prompt": wrapper_prompt,
                "llm_hidden_prompt": llm_hidden_prompt
            }
        
        # Default hyperparameters for LLM Structured element
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
                ),
                "parameters.llm_hidden_prompt": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Hidden Prompt",
                    description="Hidden instructions for the LLM"
                ),
                "output_schema": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Output Schema",
                    description="JSON schema for structured output"
                )
            }
        
        # Default parameter schema structure if not provided
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "model": {
                    "type": "string",
                    "description": "Model ID or ARN for the AI model",
                    "default": "llama-3.3-70b",
                    "required": False
                },
                "temperature": {
                    "type": "float",
                    "description": "Temperature for text generation (0-1)",
                    "default": 0.3,
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
                },
                "llm_hidden_prompt": {
                    "type": "string",
                    "description": "Hidden instructions for the LLM (not visible to users)",
                    "default": "",
                    "required": False
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="llm_structured",
            description=description,
            node_description=node_description or "Generates structured data according to defined schemas",
            processing_message=processing_message or "Generating structured response...",
            tags=tags or ["ai", "structured-output", "llm"],
            layer=layer,
            input_schema=input_schema,
            output_schema=output_schema,
            parameters=parameters,
            hyperparameters=hyperparameters,
            parameter_schema_structure=parameter_schema_structure
        )
    
    async def execute(self, executor, backtracking=False) -> Dict[str, Any]:
        """Execute LLM structured output generation."""
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        if not self.validate_inputs():
            missing_inputs = [name for name, schema in self.input_schema.items() 
                             if schema.get('required', False) and name not in self.inputs]
            raise ValueError(f"Missing required inputs for LLM Structured element: {missing_inputs}")
        
        # Get inputs
        prompt = self.inputs.get("prompt", "")
        context = self.inputs.get("context", [])
        additional_data = self.inputs.get("additional_data", {})
        
        # Get parameters (with defaults)
        model = self.parameters.get("model")
        temperature = self.parameters.get("temperature", 0.3)
        max_tokens = self.parameters.get("max_tokens", 1000)
        wrapper_prompt = self.parameters.get("wrapper_prompt", "")
        llm_hidden_prompt = self.parameters.get("llm_hidden_prompt", "")
        
        # Format the complete prompt
        formatted_prompt = self._format_prompt(prompt, context, additional_data, wrapper_prompt, llm_hidden_prompt)
        
        # Stream event for the prompt
        await executor._stream_event("llm_prompt", {
            "element_id": self.element_id,
            "prompt": formatted_prompt,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens
        })
        
        # Initialize Bedrock service
        config = executor.config
        
        if model is None:
            model = config.get("default_model_id", "arn:aws:bedrock:us-east-2:559050205657:inference-profile/us.deepseek.r1-v1:0")
        
        bedrock_service = BedrockService(
            region_name=config.get("aws_region", "us-west-2"),
            aws_access_key_id=config.get("aws_access_key_id"),
            aws_secret_access_key=config.get("aws_secret_access_key"),
            model_id=model
        )
                                        
        # Generate structured output
        try:
            structured_output = await bedrock_service.generate_structured_output(
                prompt=formatted_prompt,
                output_schema=self.output_schema,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Check if there was an error in parsing
            if "error" in structured_output:
                error_msg = structured_output["error"]
                logger.error(f"Error generating structured output: {error_msg}")
                
                # Try to recover by extracting fields from raw response
                if "raw_response" in structured_output:
                    raw = structured_output["raw_response"]
                    await executor._stream_event("llm_warning", {
                        "element_id": self.element_id,
                        "warning": f"Failed to parse JSON response, attempting recovery: {error_msg}",
                        "raw_response": raw
                    })
                    
                    # Set up a default output structure based on output schema
                    recovered_output = {}
                    for key, schema in self.output_schema.items():
                        # Set default values based on type
                        if schema.get('type') == 'string':
                            recovered_output[key] = ""
                        elif schema.get('type') in ['int', 'float']:
                            recovered_output[key] = 0
                        elif schema.get('type') == 'bool':
                            recovered_output[key] = False
                        elif schema.get('type') in ['json', 'list']:
                            recovered_output[key] = {}
                    
                    structured_output = recovered_output
            
            # Set outputs directly from structured result
            if isinstance(structured_output, dict):
                self.outputs = structured_output.copy()
                
                # Also add the full structured output as a JSON string for compatibility
                self.outputs["structured_output"] = json.dumps(structured_output)
            else:
                # If not a dict, put the entire output in structured_output field
                self.outputs = {"structured_output": json.dumps(structured_output)}
            
            # Stream structured result
            await executor._stream_event("llm_structured_result", {
                "element_id": self.element_id,
                "structured_output": structured_output
            })
            
        except Exception as e:
            logger.error(f"Error in LLM structured generation: {str(e)}")
            await executor._stream_event("llm_error", {
                "element_id": self.element_id,
                "error": str(e)
            })
            raise
        
        # Validate output
        if not self.validate_outputs():
            missing_outputs = [name for name, schema in self.output_schema.items() 
                              if schema.get('required', False) and name not in self.outputs]
            raise ValueError(f"LLM structured output does not match required schema. Missing: {missing_outputs}")
        
        return self.outputs
    
    def _format_prompt(self, 
                       prompt           : str, 
                       context          : List[str], 
                       additional_data  : Dict[str, Any], 
                       wrapper_prompt   : str, 
                       llm_hidden_prompt: str
                       ) -> str:
        
        """Format the complete prompt for structured generation."""
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
        
        # Format output schema
        # schema_str = json.dumps(self.output_schema, indent=2)
        
        
        schema_dict = {}

        for i in self.output_schema:
            schema_dict[i] = self.output_schema[i]["type"]
        
        schema_str = json.dumps(schema_dict)
        
        # Combine user wrapper prompt with hidden prompt and schema
        user_part = ""
        if wrapper_prompt:
            try:
                user_part = wrapper_prompt.format(
                    prompt=prompt,
                    context=context_str,
                    additional_data=additional_data_str
                )
            except KeyError as e:
                logger.warning(f"Error formatting wrapper prompt: {str(e)}. Using default formatting.")
                user_part = self._default_format(prompt, context_str, additional_data_str)
        else:
            user_part = self._default_format(prompt, context_str, additional_data_str)
        
        # Combine with hidden prompt and schema instructions
        hidden_part = llm_hidden_prompt if llm_hidden_prompt else ""
        
        full_prompt = f"""
        
        
        
        
{user_part}

{hidden_part}

You must respond with a valid JSON object that follows this exact schema:
{schema_str}

Your JSON response should contain only the requested fields.
Do not include explanations or markdown formatting in your response, only the JSON object.
"""
        
        return full_prompt.strip()
    
    def _default_format(self, prompt: str, context_str: str, additional_data_str: str) -> str:
        """Default prompt formatting."""
        formatted_prompt = ""
        
        if context_str:
            formatted_prompt += f"Context Information:\n{context_str}\n\n"
        
        if additional_data_str:
            formatted_prompt += f"{additional_data_str}\n\n"
        
        formatted_prompt += f"User Request:\n{prompt}"
        
        return formatted_prompt