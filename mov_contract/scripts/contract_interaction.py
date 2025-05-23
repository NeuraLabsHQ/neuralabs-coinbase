#!/usr/bin/env python3
"""
NeuraLabs Contract Interaction Script
Provides helper functions for interacting with the deployed NFT contract
"""

import os
import json
import subprocess
from typing import Dict, Any, Optional
from datetime import datetime

class NeuraLabsContract:
    def __init__(self, package_id: str, collection_id: Optional[str] = None):
        self.package_id = package_id
        self.collection_id = collection_id
        self.module = "nft"
    
    def create_collection(self) -> Dict[str, Any]:
        """Create a new NFT collection and return the CollectionCap"""
        cmd = [
            "sui", "client", "call",
            "--package", self.package_id,
            "--module", self.module,
            "--function", "create_collection",
            "--gas-budget", "10000000"
        ]
        return self._execute_command(cmd)
    
    def create_nft(self, name: str, description: str, level: int) -> Dict[str, Any]:
        """Create a new NFT with specified access level"""
        if not self.collection_id:
            raise ValueError("Collection ID not set")
        
        # Clock object ID on testnet
        clock_id = "0x6"
        
        cmd = [
            "sui", "client", "call",
            "--package", self.package_id,
            "--module", self.module,
            "--function", "create_nft",
            "--args", self.collection_id, f'"{name}"', f'"{description}"', str(level), clock_id,
            "--gas-budget", "10000000"
        ]
        return self._execute_command(cmd)
    
    def grant_access(self, token_id: int, user: str, level: int) -> Dict[str, Any]:
        """Grant access to a user for a specific NFT"""
        if not self.collection_id:
            raise ValueError("Collection ID not set")
        
        clock_id = "0x6"
        
        cmd = [
            "sui", "client", "call",
            "--package", self.package_id,
            "--module", self.module,
            "--function", "grant_access",
            "--args", self.collection_id, str(token_id), user, str(level), clock_id,
            "--gas-budget", "10000000"
        ]
        return self._execute_command(cmd)
    
    def revoke_access(self, token_id: int, user: str) -> Dict[str, Any]:
        """Revoke access from a user"""
        if not self.collection_id:
            raise ValueError("Collection ID not set")
        
        clock_id = "0x6"
        
        cmd = [
            "sui", "client", "call",
            "--package", self.package_id,
            "--module", self.module,
            "--function", "revoke_access",
            "--args", self.collection_id, str(token_id), user, clock_id,
            "--gas-budget", "10000000"
        ]
        return self._execute_command(cmd)
    
    def add_encrypted_data(self, nft_object_id: str, walrus_blob_id: str, 
                          encrypted_key_id: str, file_hash: str, 
                          file_size: int, content_type: str,
                          threshold: int = 1, key_server_count: int = 2) -> Dict[str, Any]:
        """Add encrypted data reference to NFT"""
        if not self.collection_id:
            raise ValueError("Collection ID not set")
        
        clock_id = "0x6"
        
        # Convert encrypted_key_id to vector<u8> format
        key_id_vector = f'[{",".join(encrypted_key_id.split())}]'
        
        cmd = [
            "sui", "client", "call",
            "--package", self.package_id,
            "--module", self.module,
            "--function", "add_encrypted_data",
            "--args", 
            nft_object_id,
            self.collection_id,
            f'"{walrus_blob_id}"',
            key_id_vector,
            f'"{json.dumps({"threshold": threshold, "keyServers": key_server_count})}"',
            f'"{file_hash}"',
            str(file_size),
            f'"{content_type}"',
            str(threshold),
            str(key_server_count),
            clock_id,
            "--gas-budget", "20000000"
        ]
        return self._execute_command(cmd)
    
    def check_access_level(self, token_id: int, user: str) -> int:
        """Check access level for a user on a specific NFT"""
        if not self.collection_id:
            raise ValueError("Collection ID not set")
        
        cmd = [
            "sui", "client", "object", self.collection_id, "--json"
        ]
        result = self._execute_command(cmd)
        
        # Parse the access rights from the collection object
        # This is a simplified version - actual implementation would parse the JSON
        return 0  # Default to no access
    
    def _execute_command(self, cmd: list) -> Dict[str, Any]:
        """Execute a Sui CLI command and return parsed output"""
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Command failed: {result.stderr}")
        
        # Parse output to extract relevant information
        output = result.stdout
        
        # Extract transaction digest
        tx_digest = None
        for line in output.split('\n'):
            if 'Transaction Digest:' in line:
                tx_digest = line.split(':')[1].strip()
                break
        
        # Extract created objects
        created_objects = []
        in_created_section = False
        for line in output.split('\n'):
            if 'Created Objects:' in line:
                in_created_section = True
                continue
            if in_created_section and ' - ID:' in line:
                obj_id = line.split('ID:')[1].split(',')[0].strip()
                created_objects.append(obj_id)
            elif in_created_section and line.strip() == '':
                break
        
        return {
            'status': 'success',
            'transaction_digest': tx_digest,
            'created_objects': created_objects,
            'raw_output': output
        }

# Example usage
if __name__ == "__main__":
    # Load configuration
    package_id = os.getenv("PACKAGE_ID")
    collection_id = os.getenv("COLLECTION_ID")
    
    if not package_id:
        print("Error: PACKAGE_ID environment variable not set")
        exit(1)
    
    contract = NeuraLabsContract(package_id, collection_id)
    
    # Example: Create an NFT
    print("Creating test NFT...")
    result = contract.create_nft(
        name="Test AI Workflow",
        description="A test workflow for demonstration",
        level=6  # Absolute ownership
    )
    print(f"NFT created: {result}")
    
    # Example: Grant access
    if collection_id:
        print("\nGranting access to test user...")
        test_user = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        access_result = contract.grant_access(
            token_id=1,
            user=test_user,
            level=4  # VIEW_DOWNLOAD access
        )
        print(f"Access granted: {access_result}")