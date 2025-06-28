"""
Test file for Amazon Titan Embeddings using AWS Bedrock
"""

import asyncio
import json
import os
import sys
from typing import List, Dict, Any, Optional
from pathlib import Path

import boto3
from dotenv import load_dotenv

# Add the code_executor directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent / "code_executor"))

# Load environment variables
env_path = Path(__file__).parent.parent.parent / "code_executor" / ".env"
load_dotenv(env_path)


class TitanEmbeddingsTest:
    """Test class for Amazon Titan Embeddings"""
    
    def __init__(self, region_name: Optional[str] = None):
        """
        Initialize the Titan Embeddings test client.
        
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
        
        # Titan embedding model ID (V2 only)
        self.default_model = "amazon.titan-embed-text-v2:0"
        
    def generate_embedding(self, text: str, model_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate embedding for a single text using Titan model.
        
        Args:
            text: Input text to generate embedding for
            model_id: Model ID to use (defaults to titan-embed-text-v2)
            
        Returns:
            Dict containing embedding and metadata
        """
        model_id = model_id or self.default_model
        
        print(f"Generating embedding for model: {model_id}")
        
        # Prepare request body
        request_body = {
            "inputText": text
        }
        
        try:
            # Invoke the model
            response = self.bedrock_client.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json"
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            return {
                "embedding": response_body.get("embedding"),
                "inputTextTokenCount": response_body.get("inputTextTokenCount"),
                "model_id": model_id,
                "status": "success"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "model_id": model_id,
                "status": "error"
            }
    
    def generate_batch_embeddings(self, texts: List[str], model_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts
            model_id: Model ID to use
            
        Returns:
            List of embedding results
        """
        results = []
        for text in texts:
            result = self.generate_embedding(text, model_id)
            result["input_text"] = text[:100] + "..." if len(text) > 100 else text
            results.append(result)
        return results
    
    async def generate_embedding_async(self, text: str, model_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Async version of generate_embedding.
        
        Args:
            text: Input text to generate embedding for
            model_id: Model ID to use
            
        Returns:
            Dict containing embedding and metadata
        """
        # Run the synchronous method in a thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate_embedding, text, model_id)
    
    def test_embedding_similarity(self, text1: str, text2: str, model_id: Optional[str] = None) -> float:
        """
        Test similarity between two text embeddings using cosine similarity.
        
        Args:
            text1: First text
            text2: Second text
            model_id: Model ID to use
            
        Returns:
            Cosine similarity score between -1 and 1
        """
        # Generate embeddings
        embed1_result = self.generate_embedding(text1, model_id)
        embed2_result = self.generate_embedding(text2, model_id)
        
        if embed1_result["status"] == "error" or embed2_result["status"] == "error":
            print(f"Error generating embeddings: {embed1_result.get('error')} {embed2_result.get('error')}")
            return 0.0
        
        embed1 = embed1_result["embedding"]
        embed2 = embed2_result["embedding"]
        
        # Calculate cosine similarity
        import numpy as np
        
        # Convert to numpy arrays
        vec1 = np.array(embed1)
        vec2 = np.array(embed2)
        
        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        similarity = dot_product / (norm1 * norm2)
        
        return float(similarity)


def main():
    """Main function to run tests"""
    print("Amazon Titan Embeddings Test")
    print("=" * 50)
    
    # Initialize test client
    test_client = TitanEmbeddingsTest()
    
    # Test texts
    test_texts = [
        "Machine learning is a subset of artificial intelligence.",
        "AI and ML are transforming the technology landscape.",
        "The weather today is sunny and warm.",
        "Python is a popular programming language for data science."
    ]
    
    print("\n1. Testing single embedding generation:")
    print("-" * 40)
    result = test_client.generate_embedding(test_texts[0], test_client.default_model)
    if result["status"] == "success":
        print(f" Successfully generated embedding for: '{test_texts[0]}'")
        print(f"  - Embedding dimension: {len(result['embedding'])}")
        print(f"  - Token count: {result['inputTextTokenCount']}")
        print(f"  - Model: {result['model_id']}")
    else:
        print(f"Error: {result['error']}")
    
    print("\n2. Testing batch embedding generation:")
    print("-" * 40)
    batch_results = test_client.generate_batch_embeddings(test_texts, test_client.default_model)
    for i, result in enumerate(batch_results):
        if result["status"] == "success":
            print(f"Text {i+1}: '{result['input_text']}'")
            print(f"  - Tokens: {result['inputTextTokenCount']}")
        else:
            print(f"Text {i+1} failed: {result['error']}")
    
    print("\n3. Testing embedding similarity:")
    print("-" * 40)
    # Test similar texts
    similarity1 = test_client.test_embedding_similarity(test_texts[0], test_texts[1], test_client.default_model)
    print(f"Similarity between:")
    print(f"  Text 1: '{test_texts[0]}'")
    print(f"  Text 2: '{test_texts[1]}'")
    print(f"  Score: {similarity1:.4f} (Higher score = more similar)")
    
    # Test dissimilar texts
    similarity2 = test_client.test_embedding_similarity(test_texts[0], test_texts[2], test_client.default_model)
    print(f"\nSimilarity between:")
    print(f"  Text 1: '{test_texts[0]}'")
    print(f"  Text 2: '{test_texts[2]}'")
    print(f"  Score: {similarity2:.4f} (Lower score = less similar)")
    
    # V2 testing removed as we're using V2 by default
    
    print("\n4. Testing async embedding generation:")
    print("-" * 40)
    async def test_async():
        result = await test_client.generate_embedding_async(test_texts[0], test_client.default_model)
        if result["status"] == "success":
            print(f"Async embedding generated successfully")
            print(f"  - Embedding dimension: {len(result['embedding'])}")
        else:
            print(f"Async error: {result['error']}")
    
    # Run async test
    asyncio.run(test_async())
    
    print("\n" + "=" * 50)
    print("Test completed!")


if __name__ == "__main__":
    main()