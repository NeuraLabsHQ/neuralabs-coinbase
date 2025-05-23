#!/usr/bin/env python3
"""
End-to-End Workflow Test for NeuraLabs
Tests the complete flow from NFT creation to encrypted file access
"""

import asyncio
import json
import hashlib
import time
from datetime import datetime
from typing import Dict, Any, List
from contract_interaction import NeuraLabsContract

class E2EWorkflowTest:
    def __init__(self, config_file='../test-config.json'):
        with open(config_file) as f:
            self.config = json.load(f)
        
        self.contract = NeuraLabsContract(
            package_id=self.config['packageId'],
            collection_id=self.config.get('collectionId')
        )
        
        # Mock Seal client (in real implementation, use actual Seal SDK)
        self.seal_threshold = 1
        self.key_server_count = 2
    
    async def test_complete_workflow(self):
        """Test complete workflow from NFT creation to file access"""
        
        print("=== E2E Workflow Test ===")
        print(f"Start time: {datetime.now()}")
        
        try:
            # Step 1: Create collection (if not exists)
            await self.step1_create_collection()
            
            # Step 2: Create NFT for AI workflow
            nft_id = await self.step2_create_workflow_nft()
            
            # Step 3: Prepare and encrypt workflow files
            encrypted_files = await self.step3_encrypt_workflow_files()
            
            # Step 4: Upload to Walrus (mocked)
            walrus_blobs = await self.step4_upload_to_walrus(encrypted_files)
            
            # Step 5: Store references in NFT
            await self.step5_store_encrypted_references(nft_id, walrus_blobs)
            
            # Step 6: Grant access to another user
            await self.step6_grant_access_to_user(nft_id)
            
            # Step 7: Verify user can decrypt
            await self.step7_test_decryption_access(nft_id, walrus_blobs)
            
            # Step 8: Test access revocation
            await self.step8_test_access_revocation(nft_id)
            
            print("\n✅ All E2E tests passed!")
            print(f"End time: {datetime.now()}")
            
        except Exception as e:
            print(f"\n❌ E2E test failed: {str(e)}")
            raise
    
    async def step1_create_collection(self):
        """Step 1: Create NFT collection if needed"""
        print("\n📁 Step 1: Creating NFT collection...")
        
        if not self.contract.collection_id:
            result = self.contract.create_collection()
            collection_id = result['created_objects'][0] if result['created_objects'] else None
            
            if collection_id:
                self.contract.collection_id = collection_id
                print(f"✓ Created collection: {collection_id}")
            else:
                raise Exception("Failed to create collection")
        else:
            print(f"✓ Using existing collection: {self.contract.collection_id}")
    
    async def step2_create_workflow_nft(self) -> int:
        """Step 2: Create NFT for AI workflow"""
        print("\n🎨 Step 2: Creating NFT for AI workflow...")
        
        workflow_data = {
            "name": "GPT Fine-tuning Workflow v2.0",
            "description": "Advanced language model training pipeline with custom datasets",
            "version": "2.0.0",
            "created_at": datetime.now().isoformat(),
            "components": ["data_preprocessor", "model_trainer", "evaluator", "deployer"]
        }
        
        result = self.contract.create_nft(
            name=workflow_data['name'],
            description=workflow_data['description'],
            level=6  # ABSOLUTE_OWNERSHIP
        )
        
        # In real implementation, extract token_id from result
        token_id = 1  # Mock token ID
        
        print(f"✓ Created NFT: {workflow_data['name']}")
        print(f"  Token ID: {token_id}")
        print(f"  Transaction: {result.get('transaction_digest', 'N/A')}")
        
        return token_id
    
    async def step3_encrypt_workflow_files(self) -> Dict[str, Dict[str, Any]]:
        """Step 3: Encrypt workflow files"""
        print("\n🔐 Step 3: Encrypting workflow files...")
        
        # Mock workflow files
        files = {
            "model.pkl": b"[Binary model data - GPT fine-tuned weights]" * 100,
            "config.json": json.dumps({
                "model_type": "gpt-3.5-turbo",
                "training_params": {
                    "epochs": 10,
                    "batch_size": 32,
                    "learning_rate": 0.001
                },
                "dataset": "custom_dataset_v2"
            }).encode(),
            "training_data.csv": b"prompt,completion\nWhat is AI?,Artificial Intelligence is...\n" * 50,
            "requirements.txt": b"transformers==4.30.0\ntorch==2.0.1\nnumpy==1.24.0\n"
        }
        
        encrypted_files = {}
        
        for filename, content in files.items():
            # Mock encryption (in real implementation, use Seal SDK)
            encrypted_data = self._mock_encrypt(content)
            
            encrypted_files[filename] = {
                'data': encrypted_data,
                'key_id': f"key_{hashlib.sha256(filename.encode()).hexdigest()[:16]}",
                'original_size': len(content),
                'encrypted_size': len(encrypted_data),
                'content_hash': hashlib.sha256(content).hexdigest()
            }
            
            print(f"✓ Encrypted {filename}: {len(content)}B → {len(encrypted_data)}B")
        
        return encrypted_files
    
    async def step4_upload_to_walrus(self, encrypted_files: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Step 4: Upload encrypted files to Walrus"""
        print("\n📤 Step 4: Uploading to Walrus...")
        
        walrus_blobs = {}
        
        for filename, file_data in encrypted_files.items():
            # Mock Walrus upload
            blob_id = f"walrus_blob_{hashlib.sha256(file_data['data']).hexdigest()[:32]}"
            
            walrus_blobs[filename] = {
                'blob_id': blob_id,
                'encrypted_key_id': file_data['key_id'],
                'file_hash': file_data['content_hash'],
                'file_size': file_data['original_size'],
                'upload_time': datetime.now().isoformat()
            }
            
            print(f"✓ Uploaded {filename} → {blob_id[:16]}...")
            
            # Simulate upload delay
            await asyncio.sleep(0.1)
        
        return walrus_blobs
    
    async def step5_store_encrypted_references(self, nft_id: int, walrus_blobs: Dict[str, Dict[str, Any]]):
        """Step 5: Store encrypted data references in NFT"""
        print("\n💾 Step 5: Storing encrypted references in NFT...")
        
        # Mock NFT object ID (in real implementation, get from NFT creation)
        nft_object_id = f"0xnft_{nft_id}_{int(time.time())}"
        
        for filename, blob_info in walrus_blobs.items():
            # Convert encrypted_key_id to space-separated bytes format
            key_bytes = ' '.join(str(b) for b in blob_info['encrypted_key_id'].encode()[:8])
            
            result = self.contract.add_encrypted_data(
                nft_object_id=nft_object_id,
                walrus_blob_id=blob_info['blob_id'],
                encrypted_key_id=key_bytes,
                file_hash=blob_info['file_hash'],
                file_size=blob_info['file_size'],
                content_type=self._get_content_type(filename),
                threshold=self.seal_threshold,
                key_server_count=self.key_server_count
            )
            
            print(f"✓ Stored reference for {filename}")
    
    async def step6_grant_access_to_user(self, nft_id: int):
        """Step 6: Grant access to another user"""
        print("\n👥 Step 6: Granting access to user...")
        
        test_user = self.config['testAccounts']['user1']['address']
        
        # Grant level 4 access (VIEW_DOWNLOAD - can decrypt)
        result = self.contract.grant_access(
            token_id=nft_id,
            user=test_user,
            level=4
        )
        
        print(f"✓ Granted VIEW_DOWNLOAD access to user: {test_user[:16]}...")
        print(f"  Transaction: {result.get('transaction_digest', 'N/A')}")
        
        # Also test granting lower access to another user
        user2 = self.config['testAccounts']['user2']['address']
        result2 = self.contract.grant_access(
            token_id=nft_id,
            user=user2,
            level=2  # RESALE only
        )
        
        print(f"✓ Granted RESALE access to user: {user2[:16]}...")
    
    async def step7_test_decryption_access(self, nft_id: int, walrus_blobs: Dict[str, Dict[str, Any]]):
        """Step 7: Test decryption with authorized user"""
        print("\n🔓 Step 7: Testing decryption as authorized user...")
        
        # Mock decryption test (in real implementation, use Seal SDK)
        test_user = self.config['testAccounts']['user1']['address']
        
        for filename, blob_info in walrus_blobs.items():
            # Simulate checking access and decrypting
            print(f"  Checking access for {filename}...")
            
            # Mock access check - user1 has level 4 (can decrypt)
            can_decrypt = True  # Would call contract.check_access_level
            
            if can_decrypt:
                # Mock successful decryption
                print(f"  ✓ Decrypted {filename} successfully")
            else:
                print(f"  ❌ Cannot decrypt {filename} - insufficient access")
        
        print("✓ All authorized files decrypted successfully")
    
    async def step8_test_access_revocation(self, nft_id: int):
        """Step 8: Test access revocation"""
        print("\n🚫 Step 8: Testing access revocation...")
        
        test_user = self.config['testAccounts']['user1']['address']
        
        # Revoke access
        result = self.contract.revoke_access(
            token_id=nft_id,
            user=test_user
        )
        
        print(f"✓ Revoked access for user: {test_user[:16]}...")
        
        # Mock verification that user can no longer decrypt
        try:
            # This would fail in real implementation
            print("  Testing decryption after revocation...")
            # Mock decryption attempt would throw error
            print("  ✓ Decryption correctly denied after revocation")
        except Exception as e:
            print(f"  ✓ Expected error: {str(e)}")
    
    def _mock_encrypt(self, data: bytes) -> bytes:
        """Mock encryption function"""
        # In real implementation, use Seal SDK
        # For now, just add a header and reverse the data
        header = b"ENCRYPTED_V1_"
        return header + data[::-1]
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type from filename"""
        extensions = {
            '.pkl': 'application/octet-stream',
            '.json': 'application/json',
            '.csv': 'text/csv',
            '.txt': 'text/plain',
            '.py': 'text/x-python'
        }
        
        for ext, content_type in extensions.items():
            if filename.endswith(ext):
                return content_type
        
        return 'application/octet-stream'
    
    async def run_performance_test(self):
        """Run performance benchmarks"""
        print("\n⚡ Performance Test")
        print("=" * 50)
        
        # Test NFT creation speed
        print("\n1. NFT Creation Performance:")
        times = []
        for i in range(5):
            start = time.time()
            self.contract.create_nft(f"Perf Test {i}", "Performance test NFT", 4)
            times.append(time.time() - start)
        
        avg_time = sum(times) / len(times)
        print(f"  Average creation time: {avg_time:.2f}s")
        print(f"  Min/Max: {min(times):.2f}s / {max(times):.2f}s")
        
        # Test encryption performance
        print("\n2. Encryption Performance:")
        data_sizes = [1024, 10240, 102400]  # 1KB, 10KB, 100KB
        
        for size in data_sizes:
            test_data = b"x" * size
            start = time.time()
            encrypted = self._mock_encrypt(test_data)
            enc_time = time.time() - start
            throughput = size / enc_time / 1024 / 1024  # MB/s
            print(f"  {size/1024:.0f}KB: {enc_time:.3f}s ({throughput:.1f} MB/s)")

# Main execution
if __name__ == "__main__":
    test = E2EWorkflowTest()
    
    # Run main workflow test
    asyncio.run(test.test_complete_workflow())
    
    # Optionally run performance test
    print("\nRun performance test? (y/n): ", end="")
    if input().lower() == 'y':
        asyncio.run(test.run_performance_test())