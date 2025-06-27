import json
import asyncio
from typing import Any, AsyncGenerator, Dict, Optional
import openai
from openai import AsyncOpenAI

from .base import BaseModel
from utils.logger import logger


class AkashModel(BaseModel):
    """Akash Chat API model implementation."""
    
    def __init__(self, client: Any, model_id: str, api_key: str, base_url: str):
        """
        Initialize the Akash model.
        
        Args:
            client: Not used for Akash, kept for compatibility
            model_id: The Akash model to use
            api_key: API key for Akash
            base_url: Base URL for Akash API
        """
        super().__init__(client, model_id)
        self.api_key = api_key
        self.base_url = base_url
        self.async_client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
    
    async def generate_text(self, 
                          prompt: str, 
                          temperature: float = 0.7,
                          max_tokens: int = 1000) -> str:
        """Generate text from the model (non-streaming)."""
        try:
            messages = [{"role": "user", "content": prompt}]
            
            response = await self.async_client.chat.completions.create(
                model=self.model_id,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating text with Akash model {self.model_id}: {str(e)}")
            raise
    
    async def generate_text_stream(self, 
                                 prompt: str, 
                                 temperature: float = 0.7,
                                 max_tokens: int = 1000) -> AsyncGenerator[str, None]:
        """Generate text from the model with streaming."""
        try:
            messages = [{"role": "user", "content": prompt}]
            
            stream = await self.async_client.chat.completions.create(
                model=self.model_id,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Error streaming text with Akash model {self.model_id}: {str(e)}")
            raise
    
    async def generate_structured_output(self, 
                                       prompt: str, 
                                       output_schema: Dict[str, Any],
                                       temperature: float = 0.3,
                                       max_tokens: int = 1000) -> Dict[str, Any]:
        """Generate structured output according to a schema."""
        try:
            # Create a prompt that includes the schema
            schema_json = json.dumps(output_schema, indent=2)
            structured_prompt = f"""{prompt}

Please respond with a JSON object that matches this schema:
```json
{schema_json}
```

Respond ONLY with valid JSON, no additional text."""
            
            messages = [{"role": "user", "content": structured_prompt}]
            
            response = await self.async_client.chat.completions.create(
                model=self.model_id,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            
            content = response.choices[0].message.content
            return self._parse_json_response(content)
            
        except Exception as e:
            logger.error(f"Error generating structured output with Akash model {self.model_id}: {str(e)}")
            raise