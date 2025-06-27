from typing import Any, AsyncGenerator, Dict, Optional
import os

from .llm.akash import AkashModel
from config import settings


class AkashService:
    """Service for interacting with Akash Chat API."""
    
    def __init__(self, 
                 model_id: str = "Meta-Llama-3-1-8B-Instruct-FP8",
                 api_key: Optional[str] = None,
                 base_url: Optional[str] = None):
        """
        Initialize the Akash service.
        
        Args:
            model_id: Akash model ID
            api_key: API key for Akash (defaults to env var)
            base_url: Base URL for Akash API (defaults to env var)
        """
        self.model_id = model_id
        self.api_key = api_key or settings.akash_api_key or os.getenv("AKASH_API_KEY", "sk-xxxxxxxx")
        self.base_url = base_url or settings.akash_base_url or os.getenv("AKASH_BASE_URL", "https://chatapi.akash.network/api/v1")
        
        # Initialize the Akash model
        self.model = AkashModel(
            client=None,  # Not used for Akash
            model_id=self.model_id,
            api_key=self.api_key,
            base_url=self.base_url
        )
    
    async def generate_text(self, 
                          prompt: str, 
                          temperature: float = 0.7,
                          max_tokens: int = 1000) -> str:
        """Generate text from the model (non-streaming)."""
        return await self.model.generate_text(prompt, temperature, max_tokens)
    
    async def generate_text_stream(self, 
                                 prompt: str, 
                                 temperature: float = 0.7,
                                 max_tokens: int = 1000) -> AsyncGenerator[str, None]:
        """Generate text from the model with streaming."""
        async for token in self.model.generate_text_stream(prompt, temperature, max_tokens):
            yield token
    
    async def generate_structured_output(self, 
                                       prompt: str, 
                                       output_schema: Dict[str, Any],
                                       temperature: float = 0.3,
                                       max_tokens: int = 1000) -> Dict[str, Any]:
        """Generate structured output according to a schema."""
        return await self.model.generate_structured_output(prompt, output_schema, temperature, max_tokens)