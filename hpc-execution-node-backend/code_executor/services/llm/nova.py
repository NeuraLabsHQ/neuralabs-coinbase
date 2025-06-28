"""Nova model implementation for AWS Bedrock."""

from typing import Any, AsyncGenerator, Dict
import json

class NovaModel:
    """Nova model implementation using Converse API."""
    
    def __init__(self, client, model_id: str):
        self.client = client
        self.model_id = model_id
    
    async def generate_text(self, prompt: str, temperature: float = 0.7, max_tokens: int = 1000) -> str:
        """Generate text using Nova model with Converse API."""
        
        # Use Converse API for Nova models
        response = self.client.converse(
            modelId=self.model_id,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": temperature
            }
        )
        
        # Extract text from response
        return response["output"]["message"]["content"][0]["text"]
    
    async def generate_text_stream(self, prompt: str, temperature: float = 0.7, max_tokens: int = 1000) -> AsyncGenerator[str, None]:
        """Generate text with streaming using Nova model with ConverseStream API."""
        
        # Use ConverseStream API for Nova models
        response = self.client.converse_stream(
            modelId=self.model_id,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": temperature
            }
        )
        
        # Stream the response
        for event in response["stream"]:
            if "contentBlockDelta" in event:
                delta = event["contentBlockDelta"]["delta"]
                if "text" in delta:
                    yield delta["text"]
    
    async def generate_structured_output(self, prompt: str, output_schema: Dict[str, Any], temperature: float = 0.3, max_tokens: int = 1000) -> Dict[str, Any]:
        """Generate structured output using Nova model."""
        
        # Add schema instructions to prompt
        schema_prompt = f"""{prompt}

Please provide your response in the following JSON format:
{json.dumps(output_schema, indent=2)}

Respond only with valid JSON that matches this schema."""
        
        response_text = await self.generate_text(schema_prompt, temperature, max_tokens)
        
        # Try to parse JSON response
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # If parsing fails, return as text
            return {"response": response_text}