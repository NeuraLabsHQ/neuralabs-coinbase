# elements/aws/titan.py
from typing import Dict, Any, List, Optional
import json

from core.element_base import ElementBase
from core.schema import HyperparameterSchema, AccessLevel
from services.bedrock import BedrockService
from utils.logger import logger
from config import settings

class Titan(ElementBase):
    """AWS Titan Embeddings Generation Element."""
    
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
                 # Titan specific parameters
                 param_text: str = "",
                 model_id: str = "amazon.titan-embed-text-v2:0",
                 embedding_dimension: int = 1024):
        
        # Set default parameters if not provided
        if parameters is None:
            parameters = {
                "param_text": param_text,
                "model_id": model_id,
                "embedding_dimension": embedding_dimension
            }
        
        # Default hyperparameters for Titan element
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
                "param_text": HyperparameterSchema(
                    access_level=AccessLevel.L1,
                    display_name="Parameter Text",
                    description="Text input from parameters"
                ),
                "model_id": HyperparameterSchema(
                    access_level=AccessLevel.L2,
                    display_name="Model ID",
                    description="Titan embedding model ID"
                ),
                "embedding_dimension": HyperparameterSchema(
                    access_level=AccessLevel.L3,
                    display_name="Embedding Dimension",
                    description="Expected dimension of embedding vector"
                )
            }
        
        # Default parameter schema structure
        if parameter_schema_structure is None:
            parameter_schema_structure = {
                "param_text": {
                    "type": "string",
                    "description": "Text input from parameters",
                    "default": "",
                    "required": False
                },
                "model_id": {
                    "type": "string",
                    "description": "Titan embedding model ID",
                    "default": "amazon.titan-embed-text-v2:0",
                    "required": False
                },
                "embedding_dimension": {
                    "type": "int",
                    "description": "Expected dimension of embedding vector",
                    "default": 1024,
                    "required": False,
                    "min": 256,
                    "max": 4096
                }
            }
        
        super().__init__(
            element_id=element_id,
            name=name,
            element_type="Titan",
            description=description,
            node_description=node_description or "AWS Titan embeddings model for generating text embeddings",
            processing_message=processing_message or "Generating embeddings with AWS Titan...",
            tags=tags or ["aws", "titan", "embeddings", "vector-search"],
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
        """Execute Titan embedding generation."""
        
        # Stream processing message
        if executor.stream_manager:
            await executor._stream_event("processing", {
                "element_id": self.element_id,
                "message": self.processing_message
            })
        
        # Get inputs
        input_text = self.inputs.get("input_text", "")
        param_text = self.parameters.get("param_text", "")
        
        # Merge texts
        texts_to_merge = []
        if input_text:
            texts_to_merge.append(input_text.strip())
        if param_text:
            texts_to_merge.append(param_text.strip())
        
        if not texts_to_merge:
            raise ValueError("At least one text input must be provided (either from input or parameters)")
        
        # Merge with space separator
        merged_text = " ".join(texts_to_merge)
        
        logger.info(f"Generating embedding for merged text (length: {len(merged_text)} chars)")
        
        # Get model parameters
        model_id = self.parameters.get("model_id", "amazon.titan-embed-text-v2:0")
        
        try:
            # Initialize Bedrock service
            bedrock_service = BedrockService(
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                model_id=model_id
            )
            
            # Prepare request body for Titan embeddings
            request_body = {
                "inputText": merged_text
            }
            
            # Invoke the model directly for embeddings
            response = bedrock_service.client.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json"
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            # Extract embedding
            embedding = response_body.get("embedding", [])
            token_count = response_body.get("inputTextTokenCount", 0)
            
            # Get actual embedding dimension
            embedding_dimension = len(embedding)
            
            # Log success
            logger.info(f"Successfully generated embedding with dimension: {embedding_dimension}")
            
            # Set outputs
            self.outputs = {
                "embedding": embedding,
                "source_text": merged_text,
                "embedding_dimension": embedding_dimension,
                "token_count": token_count
            }
            
            # Stream success
            if executor.stream_manager:
                await executor._stream_event("output", {
                    "element_id": self.element_id,
                    "outputs": {
                        "source_text": merged_text[:100] + "..." if len(merged_text) > 100 else merged_text,
                        "embedding_dimension": embedding_dimension,
                        "token_count": token_count,
                        "embedding": f"[{embedding_dimension}-dimensional vector]"  # Don't stream full vector
                    }
                })
            
            return self.outputs
            
        except Exception as e:
            error_msg = f"Error generating Titan embedding: {str(e)}"
            logger.error(error_msg)
            
            # Stream error
            if executor.stream_manager:
                await executor._stream_event("error", {
                    "element_id": self.element_id,
                    "error": error_msg
                })
            
            raise RuntimeError(error_msg)