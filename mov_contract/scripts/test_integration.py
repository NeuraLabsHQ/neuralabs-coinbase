#!/usr/bin/env python3
"""
Integration tests for NeuraLabs NFT contract with Seal
"""

import asyncio
import pytest
import json
import os
from typing import Dict, Any
from contract_interaction import NeuraLabsContract

class TestNeuraLabsIntegration:
    @pytest.fixture
    def setup(self):
        """Setup test environment"""
        # Load test configuration
        with open('../test-config.json') as f:
            self.config = json.load(f)
        
        self.contract = NeuraLabsContract(
            package_id=self.config['packageId'],
            collection_id=self.config.get('collectionId')
        )
        
        # Test accounts
        self.owner = self.config['testAccounts']['owner']['address']
        self.user1 = self.config['testAccounts']['user1']['address']
        self.user2 = self.config['testAccounts']['user2']['address']
    
    def test_nft_creation(self, setup):
        """Test NFT creation with different access levels"""
        test_cases = [
            ("Basic Model", "AI model with basic access", 1),
            ("Premium Model", "AI model with download access", 4),
            ("Enterprise Model", "AI model with full access", 6)
        ]
        
        for name, desc, level in test_cases:
            result = self.contract.create_nft(name, desc, level)
            assert result['status'] == 'success'
            assert len(result['created_objects']) > 0
            print(f"✓ Created NFT '{name}' with level {level}")
    
    def test_access_control_hierarchy(self, setup):
        """Test access control levels and permissions"""
        # Create NFT with absolute ownership
        nft_result = self.contract.create_nft(
            "Test Workflow",
            "Testing access control",
            6  # ABSOLUTE_OWNERSHIP
        )
        
        # Assume token_id is 1 for this test
        token_id = 1
        
        # Test granting different access levels
        access_tests = [
            (self.user1, 4, "VIEW_DOWNLOAD"),
            (self.user2, 2, "RESALE")
        ]
        
        for user, level, level_name in access_tests:
            result = self.contract.grant_access(token_id, user, level)
            assert result['status'] == 'success'
            print(f"✓ Granted {level_name} access to {user[:8]}...")
    
    def test_access_revocation(self, setup):
        """Test revoking access"""
        token_id = 1
        
        # Grant access first
        self.contract.grant_access(token_id, self.user1, 4)
        
        # Revoke access
        result = self.contract.revoke_access(token_id, self.user1)
        assert result['status'] == 'success'
        print("✓ Successfully revoked access")
    
    def test_encrypted_data_management(self, setup):
        """Test adding encrypted data references to NFT"""
        # Assume we have an NFT object ID
        nft_object_id = "0x1234567890abcdef"  # Replace with actual NFT object ID
        
        # Mock encrypted data
        encrypted_data = {
            "walrus_blob_id": "blob_123456789",
            "encrypted_key_id": "1 2 3 4 5 6 7 8",  # Space-separated bytes
            "file_hash": "sha256:abcdef123456",
            "file_size": 1024000,
            "content_type": "application/octet-stream"
        }
        
        result = self.contract.add_encrypted_data(
            nft_object_id=nft_object_id,
            **encrypted_data
        )
        
        assert result['status'] == 'success'
        print("✓ Added encrypted data reference to NFT")
    
    @pytest.mark.asyncio
    async def test_concurrent_operations(self, setup):
        """Test concurrent NFT operations"""
        async def create_nft_async(index):
            return self.contract.create_nft(
                f"Concurrent NFT {index}",
                f"Test concurrent creation {index}",
                4
            )
        
        # Create 5 NFTs concurrently
        tasks = [create_nft_async(i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        
        assert all(r['status'] == 'success' for r in results)
        print("✓ Successfully created 5 NFTs concurrently")
    
    def test_invalid_operations(self, setup):
        """Test error handling for invalid operations"""
        # Test invalid access level
        with pytest.raises(Exception):
            self.contract.create_nft("Invalid NFT", "Should fail", 7)  # Invalid level
        
        # Test granting access without permission
        # This would require switching accounts, which needs wallet integration
        print("✓ Invalid operations properly rejected")

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])