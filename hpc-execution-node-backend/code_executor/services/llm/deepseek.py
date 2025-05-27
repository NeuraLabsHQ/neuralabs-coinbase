import json
import asyncio
from typing import Any, AsyncGenerator, Dict

from .base import BaseModel

class DeepSeekModel(BaseModel):
    """Model for interacting with DeepSeek models on AWS Bedrock."""
    
    def _build_request_body(self, 
                           prompt: str, 
                           temperature: float, 
                           max_tokens: int) -> Dict[str, Any]:
        """Build request body for DeepSeek models."""
        return {
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.9
        }
    
    async def generate_text(self, 
                          prompt: str, 
                          temperature: float = 0.7,
                          max_tokens: int = 1000) -> str:
        """Generate text from DeepSeek models (non-streaming)."""
        request_body = self._build_request_body(prompt, temperature, max_tokens)
        
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(request_body)
                )
            )
            
            response_body = json.loads(response['body'].read())
            print(f"DEBUG: Full response structure: {response_body}")
            
            # Try different response formats that DeepSeek might use
            text_result = ""
            
            # Format 1: OpenAI-style with choices array and message content
            if 'choices' in response_body and response_body['choices']:
                choice = response_body['choices'][0]
                if 'message' in choice and 'content' in choice['message']:
                    text_result = choice['message']['content']
                elif 'text' in choice:
                    text_result = choice['text']
            
            # Format 2: Direct content field
            elif 'content' in response_body:
                text_result = response_body['content']
            
            # Format 3: Direct text field
            elif 'text' in response_body:
                text_result = response_body['text']
            
            # Format 4: Message content at root level
            elif 'message' in response_body and 'content' in response_body['message']:
                text_result = response_body['message']['content']
            
            print(f"DEBUG: Extracted text length: {len(text_result)}")
            print(f"DEBUG: Extracted text preview: {text_result[:200]}...")
            
            return text_result
            
        except Exception as e:
            print(f"DEBUG: Error in generate_text: {str(e)}")
            print(f"DEBUG: Request body: {request_body}")
            return ""
    
    async def generate_text_stream(self, 
                                 prompt: str, 
                                 temperature: float = 0.7,
                                 max_tokens: int = 1000) -> AsyncGenerator[str, None]:
        """Generate text from DeepSeek models with streaming."""
        # Use the old format for streaming since it was working
        request_body = {
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.invoke_model_with_response_stream(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )
        )
        
        stream = response.get('body', None)
        if not stream:
            yield ""
            return
        
        for event in stream:
            if 'chunk' in event:
                chunk_bytes = event['chunk']['bytes']
                chunk_data = json.loads(chunk_bytes)
                
                choices = chunk_data.get('choices', [])
                if choices:
                    yield choices[0].get('text', '')
                else:
                    yield ""
                    
    # async def generate_text_stream_reasoning(self, 
    #                              prompt: str, 
    #                              temperature: float = 0.7,
    #                              max_tokens: int = 1000) -> AsyncGenerator[str, None]:
    #     """Generate text from DeepSeek models with streaming."""
    #     request_body = self._build_request_body(prompt, temperature, max_tokens)
        
    #     loop = asyncio.get_event_loop()
    #     response = await loop.run_in_executor(
    #         None,
    #         lambda: self.client.ConverseStream(
    #             modelId=self.model_id,
    #             body=json.dumps(request_body)
    #         )
    #     )
        
    #     stream = response.get('body', None)
    #     if not stream:
    #         yield ""
    #         return
        
    #     for event in stream:
    #         if 'chunk' in event:
    #             chunk_bytes = event['chunk']['bytes']
    #             chunk_data = json.loads(chunk_bytes)
                
    #             choices = chunk_data.get('choices', [])
    #             if choices:
    #                 yield choices[0].get('text', '')
    #             else:
    #                 yield ""    
                    
    async def generate_structured_output(self, 
                                       prompt: str, 
                                       output_schema: Dict[str, Any],
                                       temperature: float = 0.3,
                                       max_tokens: int = 1000) -> Dict[str, Any]:
        """Generate structured output according to a schema using DeepSeek models."""
        schema_prompt = json.dumps(output_schema, indent=2)
        
        structured_prompt = f"""
        You are a helpful assistant that generates structured data.
        Please respond with JSON that follows this schema:
        
        {schema_prompt}
        
        Human request: {prompt}
        
        Your JSON response:
        """
        
        print(f"DEBUG: Structured prompt being sent:")
        print(f"DEBUG: {structured_prompt}")
        print(f"DEBUG: Schema: {output_schema}")
        
        response = await self.generate_text(
            prompt=structured_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        print(f"DEBUG: Raw response from model: '{response}'")
        
        parsed_result = self._parse_json_response(response)
        print(f"DEBUG: Parsed result: {parsed_result}")
        
        return parsed_result