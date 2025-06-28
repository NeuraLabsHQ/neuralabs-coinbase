# elements/aws/nova.py
from typing import Dict, Any, List, Optional

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from services.bedrock import BedrockService
from utils.logger import logger
from config import settings

class Nova(ElementBase):
    """AWS Nova Model for Chat and RAG-based Text Generation."""
    
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
                 # Nova specific parameters
                 model_id: str = "us.amazon.nova-lite-v1:0",
                 temperature: float = 0.7,
                 max_tokens: int = 1000,
                 similarity_threshold: float = 0.7,
                 top_k_contexts: int = 3):
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "model_id": model_id,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "similarity_threshold": similarity_threshold,
                "top_k_contexts": top_k_contexts
            }
        
        # Default hyperparameters for Nova element
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
                    description="Description of this element"
                ),
                "model_id": HyperparameterSchema(
                    access_level=AccessLevel.L1,
                    display_name="Model ID",
                    description="Nova model ID (lite or pro)"
                ),
                "temperature": HyperparameterSchema(
                    access_level=AccessLevel.L1,
                    display_name="Temperature",
                    description="Controls randomness in generation"
                ),
                "max_tokens": HyperparameterSchema(
                    access_level=AccessLevel.L1,
                    display_name="Max Tokens",
                    description="Maximum tokens to generate"
                ),
                "similarity_threshold": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Similarity Threshold",
                    description="Minimum similarity score for RAG context"
                ),
                "top_k_contexts": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Top K Contexts",
                    description="Maximum number of context pieces to include"
                )
            }
        
        # Default parameter schema structure
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "model_id": {
                    "type": "string",
                    "description": "Nova model ID (lite or pro)",
                    "default": "us.amazon.nova-lite-v1:0",
                    "required": False
                },
                "temperature": {
                    "type": "float",
                    "description": "Controls randomness (0.0 to 1.0)",
                    "default": 0.7,
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
                    "max": 4096
                },
                "similarity_threshold": {
                    "type": "float",
                    "description": "Minimum similarity score for including context",
                    "default": 0.7,
                    "required": False,
                    "min": 0.0,
                    "max": 1.0
                },
                "top_k_contexts": {
                    "type": "int",
                    "description": "Maximum number of context pieces",
                    "default": 3,
                    "required": False,
                    "min": 1,
                    "max": 10
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="Nova",
            description=description,
            node_description=node_description or "AWS Nova model for chat and RAG-based text generation",
            processing_message=processing_message or "Generating response with AWS Nova...",
            tags=tags or ["aws", "nova", "chat", "rag", "text-generation"],
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
        """Execute Nova text generation with optional RAG."""
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Validate inputs
        if not self.validate_inputs():
            missing_inputs = [name for name, schema in self.input_schema.items() 
                             if schema.get('required', False) and name not in self.inputs]
            raise ValueError(f"Missing required inputs for Nova element: {missing_inputs}")
        
        # Get inputs
        prompt = self.inputs.get("prompt", "")
        context = self.inputs.get("context", [])
        embedding = self.inputs.get("embedding", None)
        source_text = self.inputs.get("source_text", "")
        
        # Get parameters
        model_id = self.parameters.get("model_id", "us.amazon.nova-lite-v1:0")
        temperature = self.parameters.get("temperature", 0.7)
        max_tokens = self.parameters.get("max_tokens", 1000)
        
        # Prepare context for RAG if embedding is provided
        rag_context = ""
        used_contexts = []
        
        if embedding and source_text:
            logger.info(f"RAG mode: Using provided embedding and source text")
            # Simply use the provided source text as context
            rag_context = source_text
            used_contexts = [source_text]
            logger.info(f"Using source text as context: {source_text[:100]}...")
        
        # Format the final prompt
        messages = []
        
        # Build the prompt with context
        if rag_context:
            system_content = f"""You are a helpful assistant. Use the following context to answer the user's question:

{rag_context}

Please provide an accurate answer based on the given context. If the context doesn't contain relevant information, you can provide a general answer but mention that the specific information wasn't found in the provided context."""
            
            full_prompt = f"{system_content}\n\nUser: {prompt}"
        else:
            full_prompt = prompt
        
        # Add chat history if provided
        if context:
            for msg in context:
                if isinstance(msg, dict):
                    messages.append(msg)
                else:
                    messages.append({"role": "user", "content": [{"text": str(msg)}]})
        
        # Add current prompt
        messages.append({
            "role": "user",
            "content": [{"text": full_prompt}]
        })
        
        try:
            # Initialize Bedrock service
            bedrock_service = BedrockService(
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                model_id=model_id
            )
            
            # Format messages for BedrockService
            # The service expects a simple prompt, so we'll convert messages to text
            formatted_prompt = ""
            if len(messages) > 1:
                # Multiple messages - format as conversation
                for msg in messages[:-1]:
                    role = msg.get("role", "user")
                    content = msg.get("content", [])
                    if content and isinstance(content[0], dict):
                        text = content[0].get("text", "")
                        formatted_prompt += f"{role}: {text}\n\n"
                # Add the final message
                final_content = messages[-1].get("content", [])
                if final_content and isinstance(final_content[0], dict):
                    formatted_prompt += final_content[0].get("text", "")
            else:
                # Single message
                content = messages[0].get("content", [])
                if content and isinstance(content[0], dict):
                    formatted_prompt = content[0].get("text", "")
            
            # Stream the response
            response_text = ""
            tokens_used = 0
            
            if executor.stream_manager:
                # Use BedrockService streaming
                metadata = {
                    "element_id": self.element_id,
                    "element_type": self.element_type,
                    "element_name": self.name,
                    "flow_id": executor.flow_id
                }
                
                # Get streaming generator from BedrockService
                chunk_generator = bedrock_service.generate_text_stream(
                    prompt=formatted_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                # Stream chunks
                async for chunk in chunk_generator:
                    response_text += chunk
                    # Stream chunk to frontend
                    await executor._stream_event("llm_chunk", {
                        "element_id": self.element_id,
                        "content": chunk,
                        "metadata": metadata
                    })
                
                # Estimate token usage (BedrockService doesn't return exact usage in streaming)
                tokens_used = len(response_text.split()) * 1.3  # Rough estimate
            else:
                # Non-streaming fallback using BedrockService
                logger.warning("No stream manager available, using non-streaming generation")
                response_text = await bedrock_service.generate_text(
                    prompt=formatted_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                tokens_used = len(response_text.split()) * 1.3  # Rough estimate
            
            # Set outputs
            self.outputs = {
                "response": response_text,
                "tokens_used": tokens_used
            }
            
            # Add used contexts if any
            if used_contexts:
                self.outputs["used_context"] = used_contexts
            
            # Stream success
            if executor.stream_manager:
                await executor._stream_event("output", {
                    "element_id": self.element_id,
                    "outputs": {
                        "response": response_text[:100] + "..." if len(response_text) > 100 else response_text,
                        "tokens_used": tokens_used,
                        "contexts_used": len(used_contexts) if used_contexts else 0
                    }
                })
            
            return self.outputs
            
        except Exception as e:
            error_msg = f"Error generating Nova response: {str(e)}"
            logger.error(error_msg)
            
            # Stream error
            if executor.stream_manager:
                await executor._stream_event("error", {
                    "element_id": self.element_id,
                    "error": error_msg
                })
            
            raise RuntimeError(error_msg)