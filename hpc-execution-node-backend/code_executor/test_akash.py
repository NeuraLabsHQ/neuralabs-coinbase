#!/usr/bin/env python3
"""Test script for Akash Chat API integration"""

import asyncio
import os
import sys
from typing import Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from elements.akash.chat_api import ChatAPI
from services.akash import AkashService
from core.schema import HyperparameterSchema, AccessLevel


async def test_akash_service():
    """Test the Akash service directly"""
    print("Testing Akash Service...")
    
    # Set API key if not already set
    if not os.getenv("AKASH_API_KEY"):
        os.environ["AKASH_API_KEY"] = "sk-ToS6ruOEV9MNysvpumT0Dw"
    
    service = AkashService(model_id="Meta-Llama-3-1-8B-Instruct-FP8")
    
    # Test non-streaming
    print("\n1. Testing non-streaming generation:")
    response = await service.generate_text(
        prompt="Hello! Please introduce yourself briefly.",
        temperature=0.7,
        max_tokens=100
    )
    print(f"Response: {response[:200]}...")
    
    # Test streaming
    print("\n2. Testing streaming generation:")
    print("Response: ", end="", flush=True)
    async for chunk in service.generate_text_stream(
        prompt="Count from 1 to 5 slowly.",
        temperature=0.5,
        max_tokens=50
    ):
        print(chunk, end="", flush=True)
    print("\n")


async def test_chat_api_element():
    """Test the ChatAPI element"""
    print("\nTesting ChatAPI Element...")
    
    # Create element instance
    element = ChatAPI(
        element_id="test_akash_1",
        name="Test Akash Chat",
        description="Test instance of Akash Chat API",
        input_schema={
            "messages": {"type": "list", "required": True},
            "model": {"type": "string", "required": True},
            "system_prompt": {"type": "string", "required": False}
        },
        output_schema={
            "response": {"type": "string", "required": True},
            "model_used": {"type": "string", "required": True},
            "provider_info": {"type": "json", "required": True}
        }
    )
    
    # Set inputs
    element.inputs = {
        "messages": [
            {"role": "user", "content": "What is 2+2?"}
        ],
        "model": "Meta-Llama-3-1-8B-Instruct-FP8",
        "system_prompt": "You are a helpful math assistant."
    }
    
    # Mock executor with minimal required attributes
    class MockExecutor:
        flow_id = "test_flow_123"
        stream_manager = None  # No streaming for this test
        config = {
            "akash_api_key": os.getenv("AKASH_API_KEY", "sk-ToS6ruOEV9MNysvpumT0Dw")
        }
        
        async def _stream_event(self, event_type: str, data: Dict[str, Any]):
            print(f"[STREAM] {event_type}: {data.get('message', data.get('prompt', 'data'))[:100]}...")
    
    executor = MockExecutor()
    
    # Execute
    outputs = await element.execute(executor)
    
    print(f"\nOutputs:")
    print(f"- Response: {outputs['response'][:200]}...")
    print(f"- Model Used: {outputs['model_used']}")
    print(f"- Provider Info: {outputs['provider_info']}")
    print(f"- Usage: {outputs.get('usage', {})}")


async def main():
    """Run all tests"""
    print("=== Akash Chat API Integration Test ===\n")
    
    try:
        # Test service
        await test_akash_service()
        
        # Test element
        await test_chat_api_element()
        
        print("\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())