#!/usr/bin/env python3
"""
Test script for the new simplified NeuraLabs NFT contract
"""
import json
import subprocess
import time
import sys

class NeuraLabsNFTTester:
    def __init__(self, config_file='../deployment-config.json'):
        # Use the new package ID
        self.package_id = "0x31717ba3482c33f3bfe0bab05b3f509053a206b01e727c3184c0bb791d74c7fe"
        try:
            with open(config_file, 'r') as f:
                self.config = json.load(f)
                self.registry_id = self.config.get('objects', {}).get('accessRegistry')
        except:
            self.registry_id = None
        
    def run_command(self, cmd):
        """Run a command and return the output"""
        print(f"\nRunning: {cmd}")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return None
        return result.stdout
    
    def get_clock(self):
        """Get the clock object ID"""
        return "0x0000000000000000000000000000000000000000000000000000000000000006"
    
    def mint_nft(self, name, description):
        """Mint a new NFT"""
        print(f"\n🎨 Minting NFT: {name}")
        cmd = f"""sui client call \
            --package {self.package_id} \
            --module nft \
            --function mint_to_sender \
            --args '"{name}"' '"{description}"' {self.get_clock()} \
            --gas-budget 10000000"""
        
        output = self.run_command(cmd)
        if output:
            # Parse NFT ID from output
            nft_id = self._parse_object_id(output, "::nft::NeuraLabsNFT")
            if nft_id:
                print(f"✅ NFT minted successfully! ID: {nft_id}")
                return nft_id
        return None
    
    def create_access_cap(self, nft_id):
        """Create access capability for NFT"""
        print(f"\n🔑 Creating AccessCap for NFT: {nft_id}")
        cmd = f"""sui client call \
            --package {self.package_id} \
            --module access \
            --function create_access_cap_entry \
            --args {nft_id} \
            --gas-budget 10000000"""
        
        output = self.run_command(cmd)
        if output:
            cap_id = self._parse_object_id(output, "::access::AccessCap")
            if cap_id:
                print(f"✅ AccessCap created! ID: {cap_id}")
                return cap_id
        return None
    
    def grant_access(self, cap_id, nft_id, user_address, access_level):
        """Grant access to a user"""
        if not self.registry_id:
            print("❌ AccessRegistry ID not found. Run initialize.py first!")
            return False
            
        print(f"\n👤 Granting access level {access_level} to {user_address}")
        cmd = f"""sui client call \
            --package {self.package_id} \
            --module access \
            --function grant_access \
            --args {self.registry_id} {cap_id} {nft_id} {user_address} {access_level} \
            --gas-budget 10000000"""
        
        output = self.run_command(cmd)
        if output:
            print(f"✅ Access granted successfully!")
            return True
        return False
    
    def upload_encrypted_data(self, nft_id, blob_id, seal_key_id, file_hash, file_size, content_type):
        """Upload encrypted data to NFT"""
        if not self.registry_id:
            print("❌ AccessRegistry ID not found. Run initialize.py first!")
            return False
            
        print(f"\n📤 Uploading encrypted data to NFT")
        
        # Convert seal_key_id to vector<u8> format
        seal_key_bytes = f'[{",".join(str(b) for b in seal_key_id)}]'
        
        cmd = f"""sui client call \
            --package {self.package_id} \
            --module storage \
            --function upload_encrypted_data \
            --args {nft_id} {self.registry_id} '"{blob_id}"' '{seal_key_bytes}' '"{file_hash}"' {file_size} '"{content_type}"' {self.get_clock()} \
            --gas-budget 10000000"""
        
        output = self.run_command(cmd)
        if output:
            print(f"✅ Encrypted data uploaded successfully!")
            return True
        return False
    
    def _parse_object_id(self, output, object_type):
        """Parse object ID from transaction output"""
        lines = output.split('\n')
        for i, line in enumerate(lines):
            if "Created Objects:" in line:
                for j in range(i+1, min(i+20, len(lines))):
                    if "ObjectType:" in lines[j] and object_type in lines[j]:
                        for k in range(j-1, i, -1):
                            if "ObjectID:" in lines[k]:
                                return lines[k].split("ObjectID:")[1].strip()
        return None
    
    def run_full_test(self):
        """Run a full test scenario"""
        print("\n🚀 Starting NeuraLabs NFT Contract Test")
        print("=" * 50)
        
        # Check if registry exists
        if not self.registry_id:
            print("\n❌ AccessRegistry not initialized. Please run initialize.py first!")
            return
        
        print(f"\n📋 Using AccessRegistry: {self.registry_id}")
        
        # 1. Mint an NFT
        nft_id = self.mint_nft("AI Workflow #1", "Advanced ML pipeline for data processing")
        if not nft_id:
            print("❌ Failed to mint NFT")
            return
        
        time.sleep(2)
        
        # 2. Create access cap
        cap_id = self.create_access_cap(nft_id)
        if not cap_id:
            print("❌ Failed to create AccessCap")
            return
        
        time.sleep(2)
        
        # 3. Grant access to another user (level 4 - can download)
        test_user = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        if not self.grant_access(cap_id, nft_id, test_user, 4):
            print("❌ Failed to grant access")
            return
        
        time.sleep(2)
        
        # 4. Upload encrypted data
        seal_key_id = [1, 2, 3, 4, 5, 6, 7, 8]  # Example key ID
        if not self.upload_encrypted_data(
            nft_id,
            "walrus_blob_12345",
            seal_key_id,
            "sha256:abcdef123456",
            1024000,
            "application/octet-stream"
        ):
            print("❌ Failed to upload encrypted data")
            return
        
        print("\n✅ All tests passed successfully!")
        print(f"\nSummary:")
        print(f"- NFT ID: {nft_id}")
        print(f"- AccessCap ID: {cap_id}")
        print(f"- User {test_user} has access level 4")
        print(f"- Encrypted data uploaded with blob ID: walrus_blob_12345")

if __name__ == "__main__":
    tester = NeuraLabsNFTTester()
    tester.run_full_test()