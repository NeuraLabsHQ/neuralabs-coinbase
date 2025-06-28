"""
Test file for Amazon Nova models (Lite and Pro) using AWS Bedrock
"""

import asyncio
import json
import os
import sys
import time
from typing import Dict, Any, Optional, List
from pathlib import Path

import boto3
from dotenv import load_dotenv

# Add the code_executor directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent / "code_executor"))

# Load environment variables
env_path = Path(__file__).parent.parent.parent / "code_executor" / ".env"
load_dotenv(env_path)


class NovaModelTest:
    """Test class for Amazon Nova models"""
    
    def __init__(self, region_name: Optional[str] = None):
        """
        Initialize the Nova model test client.
        
        Args:
            region_name: AWS region name (defaults to env variable or us-east-2)
        """
        self.region_name = region_name or os.getenv("AWS_REGION", "us-east-2")
        self.aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        # Initialize boto3 session
        session = boto3.Session(
            region_name=self.region_name,
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key
        )
        
        # Initialize Bedrock runtime client
        self.bedrock_client = session.client('bedrock-runtime')
        
        # Nova model IDs
        self.nova_lite = "us.amazon.nova-lite-v1:0"
        self.nova_pro = "us.amazon.nova-pro-v1:0"
        
    def generate_text(self, prompt: str, model_id: str, max_tokens: int = 1000) -> Dict[str, Any]:
        """
        Generate text using the Converse API.
        
        Args:
            prompt: Input prompt
            model_id: Model ID to use (nova-lite or nova-pro)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict containing response and metadata
        """
        start_time = time.time()
        
        try:
            # Prepare messages for Converse API
            messages = [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ]
            
            # Call Converse API
            response = self.bedrock_client.converse(
                modelId=model_id,
                messages=messages,
                inferenceConfig={
                    "maxTokens": max_tokens,
                    "temperature": 0.7
                }
            )
            
            end_time = time.time()
            
            # Extract response content
            response_text = response["output"]["message"]["content"][0]["text"]
            
            return {
                "status": "success",
                "model_id": model_id,
                "prompt": prompt,
                "response": response_text,
                "usage": response.get("usage", {}),
                "latency": end_time - start_time,
                "stop_reason": response.get("stopReason")
            }
            
        except Exception as e:
            return {
                "status": "error",
                "model_id": model_id,
                "prompt": prompt,
                "error": str(e),
                "latency": time.time() - start_time
            }
    
    def generate_text_stream(self, prompt: str, model_id: str, max_tokens: int = 1000):
        """
        Generate text with streaming using ConverseStream API.
        
        Args:
            prompt: Input prompt
            model_id: Model ID to use
            max_tokens: Maximum tokens to generate
            
        Yields:
            Text chunks as they are generated
        """
        try:
            # Prepare messages
            messages = [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ]
            
            # Call ConverseStream API
            response = self.bedrock_client.converse_stream(
                modelId=model_id,
                messages=messages,
                inferenceConfig={
                    "maxTokens": max_tokens,
                    "temperature": 0.7
                }
            )
            
            # Stream the response
            for event in response["stream"]:
                if "contentBlockDelta" in event:
                    delta = event["contentBlockDelta"]["delta"]
                    if "text" in delta:
                        yield delta["text"]
                        
        except Exception as e:
            yield f"\nError: {str(e)}"
    
    async def generate_text_async(self, prompt: str, model_id: str, max_tokens: int = 1000) -> Dict[str, Any]:
        """
        Async version of generate_text.
        
        Args:
            prompt: Input prompt
            model_id: Model ID to use
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict containing response and metadata
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate_text, prompt, model_id, max_tokens)
    
    def compare_models(self, prompt: str, max_tokens: int = 1000) -> Dict[str, Any]:
        """
        Compare responses from Nova Lite and Pro models.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict containing both model responses and comparison
        """
        print(f"\nComparing models for prompt: '{prompt[:50]}...'")
        print("-" * 60)
        
        # Generate with Nova Lite
        print("Generating with Nova Lite...")
        lite_result = self.generate_text(prompt, self.nova_lite, max_tokens)
        
        # Generate with Nova Pro
        print("Generating with Nova Pro...")
        pro_result = self.generate_text(prompt, self.nova_pro, max_tokens)
        
        return {
            "prompt": prompt,
            "nova_lite": lite_result,
            "nova_pro": pro_result
        }


def main():
    """Main function to run tests"""
    print("Amazon Nova Models Test (Lite & Pro)")
    print("=" * 60)
    
    # Initialize test client
    test_client = NovaModelTest()
    
    # Test prompts
    test_prompts = [
        "Write a haiku about artificial intelligence.",
        "Explain quantum computing in simple terms.",
        "Generate a Python function to calculate fibonacci numbers with memoization.",
        "What are the main differences between machine learning and deep learning?"
    ]
    
    print("\n1. Testing Nova Lite:")
    print("-" * 40)
    result = test_client.generate_text(test_prompts[0], test_client.nova_lite)
    if result["status"] == "success":
        print(f"✓ Prompt: {result['prompt']}")
        print(f"✓ Response: {result['response']}")
        print(f"✓ Tokens used: {result['usage']}")
        print(f"✓ Latency: {result['latency']:.2f}s")
    else:
        print(f"✗ Error: {result['error']}")
    
    print("\n2. Testing Nova Pro:")
    print("-" * 40)
    result = test_client.generate_text(test_prompts[1], test_client.nova_pro)
    if result["status"] == "success":
        print(f"✓ Prompt: {result['prompt']}")
        print(f"✓ Response: {result['response'][:200]}...")
        print(f"✓ Tokens used: {result['usage']}")
        print(f"✓ Latency: {result['latency']:.2f}s")
    else:
        print(f"✗ Error: {result['error']}")
    
    print("\n3. Testing streaming with Nova Lite:")
    print("-" * 40)
    print(f"Prompt: {test_prompts[2]}")
    print("Response: ", end="", flush=True)
    for chunk in test_client.generate_text_stream(test_prompts[2], test_client.nova_lite):
        print(chunk, end="", flush=True)
    print()
    
    print("\n4. Model comparison test:")
    print("-" * 40)
    comparison = test_client.compare_models(test_prompts[3])
    
    if comparison["nova_lite"]["status"] == "success" and comparison["nova_pro"]["status"] == "success":
        print("\nNova Lite:")
        print(f"- Response length: {len(comparison['nova_lite']['response'])} chars")
        print(f"- Latency: {comparison['nova_lite']['latency']:.2f}s")
        print(f"- Tokens: {comparison['nova_lite']['usage']}")
        
        print("\nNova Pro:")
        print(f"- Response length: {len(comparison['nova_pro']['response'])} chars")
        print(f"- Latency: {comparison['nova_pro']['latency']:.2f}s")
        print(f"- Tokens: {comparison['nova_pro']['usage']}")
        
        # Calculate performance difference
        latency_diff = comparison['nova_pro']['latency'] - comparison['nova_lite']['latency']
        print(f"\nPerformance: Nova Lite is {abs(latency_diff):.2f}s {'faster' if latency_diff > 0 else 'slower'}")
    
    print("\n5. Testing async generation:")
    print("-" * 40)
    async def test_async():
        tasks = [
            test_client.generate_text_async(test_prompts[0], test_client.nova_lite),
            test_client.generate_text_async(test_prompts[0], test_client.nova_pro)
        ]
        results = await asyncio.gather(*tasks)
        
        for result in results:
            if result["status"] == "success":
                model_name = "Nova Lite" if "lite" in result["model_id"] else "Nova Pro"
                print(f"✓ {model_name} async completed in {result['latency']:.2f}s")
            else:
                print(f"✗ Async error: {result['error']}")
    
    asyncio.run(test_async())
    
    print("\n" + "=" * 60)
    print("Test completed!")
    
    # Summary
    print("\nModel IDs used:")
    print(f"- Nova Lite: {test_client.nova_lite}")
    print(f"- Nova Pro: {test_client.nova_pro}")
    print(f"- Region: {test_client.region_name}")


if __name__ == "__main__":
    main()