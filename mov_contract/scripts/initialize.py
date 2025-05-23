#!/usr/bin/env python3
"""
Initialize the NeuraLabs NFT contract by creating the AccessRegistry
"""
import json
import subprocess
import sys

def run_command(cmd):
    """Run a command and return the output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(f"Error: {result.stderr}")
        sys.exit(1)
    return result.stdout

def main():
    # Load deployment config
    with open('../deployment-config.json', 'r') as f:
        config = json.load(f)
    
    package_id = config['packageId']
    
    print("Initializing NeuraLabs NFT Contract...")
    print(f"Package ID: {package_id}")
    
    # Create access registry
    print("\n1. Creating AccessRegistry...")
    cmd = f"sui client call --package {package_id} --module access --function init_registry --gas-budget 10000000"
    output = run_command(cmd)
    print("AccessRegistry created successfully!")
    
    # Parse the transaction output to find the created AccessRegistry object
    lines = output.split('\n')
    registry_id = None
    
    for i, line in enumerate(lines):
        if "Created Objects:" in line:
            # Look for the AccessRegistry object in the next few lines
            for j in range(i+1, min(i+10, len(lines))):
                if "ObjectType:" in lines[j] and "::access::AccessRegistry" in lines[j]:
                    # Found it, now get the ID from previous lines
                    for k in range(j-1, i, -1):
                        if "ObjectID:" in lines[k]:
                            registry_id = lines[k].split("ObjectID:")[1].strip()
                            break
                    break
    
    if registry_id:
        print(f"\nAccessRegistry ID: {registry_id}")
        print("\n✅ Initialization complete!")
        print(f"\nIMPORTANT: Save this AccessRegistry ID for future use: {registry_id}")
        
        # Update deployment config with registry ID
        config['objects']['accessRegistry'] = registry_id
        with open('../deployment-config.json', 'w') as f:
            json.dump(config, f, indent=2)
        print("\nUpdated deployment-config.json with AccessRegistry ID")
    else:
        print("\n⚠️  Could not find AccessRegistry ID in transaction output")
        print("Please check the transaction on Sui Explorer")

if __name__ == "__main__":
    main()