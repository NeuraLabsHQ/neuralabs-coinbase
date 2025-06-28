"""
Test file for RAG application using Titan embeddings with Nova models
"""

import asyncio
import json
import os
import sys
import time
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path

import boto3
from dotenv import load_dotenv

# Add the code_executor directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent / "code_executor"))

# Load environment variables
env_path = Path(__file__).parent.parent.parent / "code_executor" / ".env"
load_dotenv(env_path)


class TitanNovaRAG:
    """RAG implementation using Titan embeddings and Nova models"""
    
    def __init__(self, region_name: Optional[str] = None):
        """Initialize the RAG system with Titan and Nova models"""
        self.region_name = region_name or os.getenv("AWS_REGION", "us-east-2")
        
        # Initialize boto3 session
        session = boto3.Session(
            region_name=self.region_name,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
        
        # Initialize Bedrock runtime client
        self.bedrock_client = session.client('bedrock-runtime')
        
        # Model IDs
        self.titan_embed_model = "amazon.titan-embed-text-v2:0"
        self.nova_lite = "us.amazon.nova-lite-v1:0"
        self.nova_pro = "us.amazon.nova-pro-v1:0"
        
        # Document store for RAG
        self.documents = []
        self.embeddings = []
        
    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding using Titan model"""
        try:
            request_body = {"inputText": text}
            
            response = self.bedrock_client.invoke_model(
                modelId=self.titan_embed_model,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            return response_body.get("embedding")
            
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None
    
    def add_documents(self, documents: List[str]):
        """Add documents to the knowledge base"""
        print(f"Adding {len(documents)} documents to knowledge base...")
        
        for doc in documents:
            embedding = self.generate_embedding(doc)
            if embedding:
                self.documents.append(doc)
                self.embeddings.append(embedding)
                print(f"✓ Added document: {doc[:50]}...")
            else:
                print(f"✗ Failed to add document: {doc[:50]}...")
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        return float(dot_product / (norm1 * norm2))
    
    def find_relevant_documents(self, query: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """Find most relevant documents for a query"""
        query_embedding = self.generate_embedding(query)
        if not query_embedding:
            return []
        
        # Calculate similarities
        similarities = []
        for i, doc_embedding in enumerate(self.embeddings):
            similarity = self.cosine_similarity(query_embedding, doc_embedding)
            similarities.append((self.documents[i], similarity))
        
        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]
    
    def generate_with_context(self, query: str, model_id: str, use_rag: bool = True) -> Dict[str, Any]:
        """Generate response using Nova model with or without RAG context"""
        start_time = time.time()
        
        try:
            messages = []
            
            if use_rag:
                # Find relevant documents
                relevant_docs = self.find_relevant_documents(query, top_k=3)
                
                if relevant_docs:
                    # Create context from relevant documents
                    context = "\n\n".join([f"Document {i+1}: {doc}" 
                                         for i, (doc, score) in enumerate(relevant_docs)])
                    
                    # Add system message with context
                    system_prompt = f"""You are a helpful assistant with access to the following context information:

{context}

Please use this context to answer the user's question accurately. If the context doesn't contain relevant information, you can provide a general answer but mention that the specific information wasn't found in the provided context."""
                    
                    messages = [
                        {
                            "role": "user",
                            "content": [{"text": f"{system_prompt}\n\nQuestion: {query}"}]
                        }
                    ]
                    
                    # Store relevant docs info for response
                    context_info = {
                        "relevant_documents": [
                            {"content": doc[:100] + "...", "similarity": score}
                            for doc, score in relevant_docs
                        ]
                    }
                else:
                    # No relevant documents found
                    messages = [
                        {
                            "role": "user",
                            "content": [{"text": query}]
                        }
                    ]
                    context_info = {"relevant_documents": []}
            else:
                # No RAG, just the query
                messages = [
                    {
                        "role": "user",
                        "content": [{"text": query}]
                    }
                ]
                context_info = None
            
            # Call Nova model
            response = self.bedrock_client.converse(
                modelId=model_id,
                messages=messages,
                inferenceConfig={
                    "maxTokens": 1000,
                    "temperature": 0.3  # Lower temperature for more factual responses
                }
            )
            
            end_time = time.time()
            
            # Extract response
            response_text = response["output"]["message"]["content"][0]["text"]
            
            return {
                "status": "success",
                "query": query,
                "response": response_text,
                "model_id": model_id,
                "use_rag": use_rag,
                "context_info": context_info,
                "latency": end_time - start_time,
                "usage": response.get("usage", {})
            }
            
        except Exception as e:
            return {
                "status": "error",
                "query": query,
                "error": str(e),
                "model_id": model_id,
                "use_rag": use_rag,
                "latency": time.time() - start_time
            }


def main():
    """Main function to run RAG tests"""
    print("Titan + Nova RAG Test")
    print("=" * 60)
    
    # Initialize RAG system
    rag_system = TitanNovaRAG()
    
    # Sample knowledge base documents
    knowledge_base = [
        "Amazon Nova is a new family of foundation models that deliver frontier intelligence and industry leading price-performance.",
        "Nova models include Nova Micro for text-only tasks, Nova Lite for multimodal processing, and Nova Pro for complex reasoning.",
        "Amazon Bedrock supports Retrieval Augmented Generation (RAG) through Knowledge Bases, allowing models to access external data.",
        "Titan embeddings models are designed for text similarity searches and can generate high-quality vector representations.",
        "The maximum context length for Nova models is 300,000 tokens for both Lite and Pro versions.",
        "Nova models excel at agentic applications and can be integrated with Amazon Bedrock Knowledge Bases for enhanced RAG capabilities.",
        "Fine-tuning is supported for Nova Micro, Lite, and Pro models to customize them for specific use cases."
    ]
    
    # Add documents to knowledge base
    print("\n1. Building knowledge base with Titan embeddings:")
    print("-" * 40)
    rag_system.add_documents(knowledge_base)
    print(f"\n✓ Knowledge base built with {len(rag_system.documents)} documents")
    
    # Test queries
    test_queries = [
        "What are the different Nova model variants?",
        "What is the maximum context length for Nova models?",
        "Can Nova models be fine-tuned?",
        "What is quantum computing?"  # Question not in knowledge base
    ]
    
    # Test with RAG
    print("\n2. Testing Nova Lite with RAG:")
    print("-" * 40)
    
    for query in test_queries[:2]:  # Test first two queries
        print(f"\nQuery: {query}")
        result = rag_system.generate_with_context(query, rag_system.nova_lite, use_rag=True)
        
        if result["status"] == "success":
            print(f"Relevant documents found: {len(result['context_info']['relevant_documents'])}")
            for i, doc in enumerate(result['context_info']['relevant_documents']):
                print(f"  - Doc {i+1} (similarity: {doc['similarity']:.3f}): {doc['content']}")
            print(f"\nResponse: {result['response']}")
            print(f"Latency: {result['latency']:.2f}s")
        else:
            print(f"Error: {result['error']}")
    
    # Compare with and without RAG
    print("\n3. Comparing responses with and without RAG:")
    print("-" * 40)
    
    comparison_query = "What is the maximum context length for Nova models?"
    print(f"\nQuery: {comparison_query}")
    
    # With RAG
    print("\nWith RAG (Nova Pro):")
    rag_result = rag_system.generate_with_context(comparison_query, rag_system.nova_pro, use_rag=True)
    if rag_result["status"] == "success":
        print(f"Response: {rag_result['response']}")
        print(f"Used {len(rag_result['context_info']['relevant_documents'])} context documents")
    
    # Without RAG
    print("\nWithout RAG (Nova Pro):")
    no_rag_result = rag_system.generate_with_context(comparison_query, rag_system.nova_pro, use_rag=False)
    if no_rag_result["status"] == "success":
        print(f"Response: {no_rag_result['response']}")
    
    # Test with out-of-domain query
    print("\n4. Testing out-of-domain query:")
    print("-" * 40)
    
    out_of_domain = "What is quantum computing?"
    print(f"\nQuery: {out_of_domain}")
    
    result = rag_system.generate_with_context(out_of_domain, rag_system.nova_lite, use_rag=True)
    if result["status"] == "success":
        print(f"Relevant documents found: {len(result['context_info']['relevant_documents'])}")
        if result['context_info']['relevant_documents']:
            print("Top relevant document similarities:")
            for doc in result['context_info']['relevant_documents']:
                print(f"  - Similarity: {doc['similarity']:.3f}")
        print(f"\nResponse: {result['response'][:300]}...")
    
    # Performance comparison
    print("\n5. Performance comparison (with vs without RAG):")
    print("-" * 40)
    
    perf_query = "What are the different Nova model variants?"
    
    # Time with RAG
    rag_result = rag_system.generate_with_context(perf_query, rag_system.nova_lite, use_rag=True)
    
    # Time without RAG  
    no_rag_result = rag_system.generate_with_context(perf_query, rag_system.nova_lite, use_rag=False)
    
    if rag_result["status"] == "success" and no_rag_result["status"] == "success":
        print(f"With RAG: {rag_result['latency']:.2f}s (includes embedding generation)")
        print(f"Without RAG: {no_rag_result['latency']:.2f}s")
        print(f"RAG overhead: {rag_result['latency'] - no_rag_result['latency']:.2f}s")
    
    print("\n" + "=" * 60)
    print("RAG test completed!")
    print(f"\nSummary:")
    print(f"- Documents in knowledge base: {len(rag_system.documents)}")
    print(f"- Embedding model: {rag_system.titan_embed_model}")
    print(f"- Generation models: {rag_system.nova_lite}, {rag_system.nova_pro}")


if __name__ == "__main__":
    main()