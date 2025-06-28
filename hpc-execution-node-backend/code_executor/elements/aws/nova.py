# elements/aws/nova.py
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

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
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def find_relevant_contexts(self, 
                             query_embedding: List[float], 
                             embeddings: List[List[float]], 
                             source_texts: List[str],
                             threshold: float,
                             top_k: int) -> Tuple[List[str], List[float]]:
        """Find the most relevant contexts based on embedding similarity."""
        similarities = []
        
        for i, doc_embedding in enumerate(embeddings):
            similarity = self.cosine_similarity(query_embedding, doc_embedding)
            if similarity >= threshold:
                similarities.append((source_texts[i], similarity))
        
        # Sort by similarity descending and take top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        top_contexts = similarities[:top_k]
        
        # Return texts and scores separately
        texts = [ctx[0] for ctx in top_contexts]
        scores = [ctx[1] for ctx in top_contexts]
        
        return texts, scores
    
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
        embeddings = self.inputs.get("embeddings", [])
        source_texts = self.inputs.get("source_texts", [])
        
        # Get parameters
        model_id = self.parameters.get("model_id", "us.amazon.nova-lite-v1:0")
        temperature = self.parameters.get("temperature", 0.7)
        max_tokens = self.parameters.get("max_tokens", 1000)
        similarity_threshold = self.parameters.get("similarity_threshold", 0.7)
        top_k_contexts = self.parameters.get("top_k_contexts", 3)
        
        # Handle single embedding/text from Titan block
        if embeddings and isinstance(embeddings[0], (int, float)):
            # Single embedding vector passed directly
            embeddings = [embeddings]
        if source_texts and isinstance(source_texts, str):
            # Single source text passed directly
            source_texts = [source_texts]
        
        # Prepare context for RAG if embeddings are provided
        used_contexts = []
        rag_context = ""
        
        if embeddings and source_texts and len(embeddings) == len(source_texts):
            logger.info(f"RAG mode: Processing {len(embeddings)} embeddings")
            
            # First, we need to get the embedding for the prompt
            # For now, we'll use the first embedding as query (in practice, you'd embed the prompt)
            # Or we can find the most diverse contexts
            relevant_texts, scores = self.find_relevant_contexts(
                embeddings[0],  # Using first embedding as reference
                embeddings,
                source_texts,
                similarity_threshold,
                top_k_contexts
            )
            
            if relevant_texts:
                used_contexts = relevant_texts
                rag_context = "\n\n".join([f"Context {i+1}: {text}" 
                                         for i, text in enumerate(relevant_texts)])
                logger.info(f"Found {len(relevant_texts)} relevant contexts")
        
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
            # Initialize boto3 client
            session = boto3.Session(
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key
            )
            bedrock_client = session.client('bedrock-runtime')
            
            # Stream the response
            response_text = ""
            tokens_used = 0
            
            if executor.stream_manager:
                # Use streaming API
                response = bedrock_client.converse_stream(
                    modelId=model_id,
                    messages=messages,
                    inferenceConfig={
                        "maxTokens": max_tokens,
                        "temperature": temperature
                    }
                )
                
                # Stream chunks
                for event in response["stream"]:
                    if "contentBlockDelta" in event:
                        delta = event["contentBlockDelta"]["delta"]
                        if "text" in delta:
                            chunk = delta["text"]
                            response_text += chunk
                            
                            # Stream chunk to frontend
                            await executor._stream_event("llm_chunk", {
                                "element_id": self.element_id,
                                "content": chunk,
                                "metadata": {
                                    "element_id": self.element_id,
                                    "element_type": self.element_type,
                                    "element_name": self.name,
                                    "flow_id": executor.flow_id
                                }
                            })
                    
                    elif "metadata" in event:
                        # Extract token usage
                        usage = event["metadata"].get("usage", {})
                        tokens_used = usage.get("totalTokens", 0)
            else:
                # Non-streaming fallback
                response = bedrock_client.converse(
                    modelId=model_id,
                    messages=messages,
                    inferenceConfig={
                        "maxTokens": max_tokens,
                        "temperature": temperature
                    }
                )
                
                response_text = response["output"]["message"]["content"][0]["text"]
                tokens_used = response.get("usage", {}).get("totalTokens", 0)
            
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