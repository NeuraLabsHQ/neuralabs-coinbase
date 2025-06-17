#!/usr/bin/env python3
"""
Database Population Script for NeuraLabs Flowbuilder Blocks

This script populates the flowbuilder_blocks table using data extracted from 
YAML configuration files in the blocks directory.

NOTE: Table creation is now handled by initiate.py. This script only populates data.
"""
import os
import sys
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import json
from datetime import datetime
from pathlib import Path
import yaml
from typing import Dict, List, Tuple, Any
import argparse

# Load environment variables
load_dotenv()

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST'),
        database=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        port=os.getenv('POSTGRES_PORT')
    )

def verify_flowbuilder_blocks_table(cursor):
    """Verify that the flowbuilder_blocks table exists"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'flowbuilder_blocks'
        );
    """)
    exists = cursor.fetchone()[0]
    
    if not exists:
        print("❌ flowbuilder_blocks table does not exist!")
        print("   Please run initiate.py first to create all database tables.")
        raise Exception("Required table 'flowbuilder_blocks' not found")
    
    print("✅ Verified flowbuilder_blocks table exists")

def get_existing_blocks(cursor) -> Dict[str, Dict]:
    """Get all existing blocks from the database"""
    cursor.execute("""
        SELECT type, element_id, name, node_description, description, 
               input_schema, output_schema, parameter_schema_structure, 
               parameters, processing_message, tags, layer, hyperparameters,
               input_data, output_data, code, flow_control, icon, category
        FROM flowbuilder_blocks
    """)
    
    existing_blocks = {}
    for row in cursor.fetchall():
        block_data = {
            'type': row[0],
            'element_id': row[1],
            'name': row[2],
            'node_description': row[3],
            'description': row[4],
            'input_schema': row[5],
            'output_schema': row[6],
            'parameter_schema_structure': row[7],
            'parameters': row[8],
            'processing_message': row[9],
            'tags': row[10],
            'layer': row[11],
            'hyperparameters': row[12],
            'input_data': row[13],
            'output_data': row[14],
            'code': row[15],
            'flow_control': row[16],
            'icon': row[17],
            'category': row[18]
        }
        existing_blocks[row[0]] = block_data
    
    return existing_blocks

def compare_blocks(existing_block: Dict, new_block: Dict) -> bool:
    """Compare two blocks to see if they are identical"""
    # Normalize JSON fields for comparison
    json_fields = ['input_schema', 'output_schema', 'parameter_schema_structure', 
                   'parameters', 'tags', 'hyperparameters', 'input_data', 
                   'output_data', 'flow_control']
    
    for field in json_fields:
        existing_val = existing_block.get(field)
        new_val = new_block.get(field)
        
        # Normalize both values
        if existing_val is not None and isinstance(existing_val, str):
            try:
                existing_val = json.loads(existing_val)
            except:
                pass
        
        # Compare normalized values
        if existing_val != new_val:
            return False
    
    # Compare non-JSON fields
    non_json_fields = ['type', 'element_id', 'name', 'node_description', 
                       'description', 'processing_message', 'layer', 'code', 
                       'icon', 'category']
    
    for field in non_json_fields:
        if existing_block.get(field) != new_block.get(field):
            return False
    
    return True

def show_block_diff(existing_block: Dict, new_block: Dict):
    """Show differences between two blocks"""
    print("\n📊 Block differences:")
    all_fields = set(existing_block.keys()) | set(new_block.keys())
    
    for field in sorted(all_fields):
        existing_val = existing_block.get(field)
        new_val = new_block.get(field)
        
        # Parse JSON fields for better display
        if isinstance(existing_val, str) and field in ['input_schema', 'output_schema', 
                                                       'parameter_schema_structure', 'parameters', 
                                                       'tags', 'hyperparameters', 'flow_control']:
            try:
                existing_val = json.loads(existing_val)
            except:
                pass
        
        if existing_val != new_val:
            print(f"\n  {field}:")
            print(f"    Current: {existing_val}")
            print(f"    New:     {new_val}")

def ask_user_confirmation(block_type: str, action: str) -> bool:
    """Ask user for confirmation"""
    while True:
        response = input(f"\n{action} block '{block_type}'? (y/n): ").lower().strip()
        if response == 'y':
            return True
        elif response == 'n':
            return False
        else:
            print("Please enter 'y' for yes or 'n' for no.")

def load_blocks_from_directory():
    """Load all block YAML files from the blocks directory"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    blocks_dir = os.path.join(current_dir, 'blocks')
    all_blocks = []
    
    print(f"📁 Loading blocks from: {blocks_dir}")
    
    # Traverse all subdirectories in blocks folder
    for category in sorted(os.listdir(blocks_dir)):
        category_path = os.path.join(blocks_dir, category)
        if os.path.isdir(category_path):
            # Load all YAML files in this category
            for filename in sorted(os.listdir(category_path)):
                if filename.endswith('.yaml'):
                    file_path = os.path.join(category_path, filename)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            block_data = yaml.safe_load(f)
                            all_blocks.append(block_data)
                            print(f"  ✅ Loaded: {category}/{filename}")
                    except Exception as e:
                        print(f"  ❌ Error loading {category}/{filename}: {e}")
    
    return all_blocks

def populate_flowbuilder_blocks(cursor, auto_confirm=False):
    """Populate the table with blocks extracted from YAML files"""
    
    # Load blocks from the new directory structure
    try:
        all_blocks = load_blocks_from_directory()
    except Exception as e:
        print(f"❌ Error loading blocks from directory: {e}")
        return None
    
    print(f"\n📊 Found {len(all_blocks)} blocks to process")
    
    # Get existing blocks from database
    existing_blocks = get_existing_blocks(cursor)
    print(f"📊 Found {len(existing_blocks)} existing blocks in database")
    
    # Track changes
    created = []
    modified = []
    unchanged = []
    skipped = []
    
    for block in all_blocks:
        block_type = block['type']
        
        if block_type in existing_blocks:
            # Block exists - check if it needs updating
            if compare_blocks(existing_blocks[block_type], block):
                unchanged.append(block_type)
                print(f"\n✅ {block_type}: No changes needed")
            else:
                # Block has changes
                print(f"\n⚠️  {block_type}: Changes detected")
                show_block_diff(existing_blocks[block_type], block)
                
                if auto_confirm or ask_user_confirmation(block_type, "Update"):
                    try:
                        cursor.execute("""
                            UPDATE flowbuilder_blocks SET
                                element_id = %s,
                                name = %s,
                                node_description = %s,
                                description = %s,
                                input_schema = %s,
                                output_schema = %s,
                                parameter_schema_structure = %s,
                                parameters = %s,
                                processing_message = %s,
                                tags = %s,
                                layer = %s,
                                hyperparameters = %s,
                                input_data = %s,
                                output_data = %s,
                                code = %s,
                                flow_control = %s,
                                icon = %s,
                                category = %s,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE type = %s
                        """, (
                            block.get('element_id'),
                            block.get('name'),
                            block['node_description'],
                            block.get('description'),
                            json.dumps(block['input_schema']),
                            json.dumps(block['output_schema']),
                            json.dumps(block.get('parameter_schema_structure', {})),
                            json.dumps(block.get('parameters', {})),
                            block.get('processing_message'),
                            json.dumps(block.get('tags', [])),
                            block.get('layer'),
                            json.dumps(block.get('hyperparameters', {})),
                            json.dumps(block.get('input_data')) if block.get('input_data') else None,
                            json.dumps(block.get('output_data')) if block.get('output_data') else None,
                            block.get('code'),
                            json.dumps(block.get('flow_control')) if block.get('flow_control') else None,
                            block['icon'],
                            block['category'],
                            block_type
                        ))
                        modified.append(block_type)
                        print(f"  ✅ Updated {block_type}")
                    except Exception as e:
                        print(f"  ❌ Failed to update {block_type}: {e}")
                        skipped.append(block_type)
                else:
                    skipped.append(block_type)
                    print(f"  ⏭️  Skipped {block_type}")
        else:
            # New block
            print(f"\n🆕 {block_type}: New block")
            if auto_confirm or ask_user_confirmation(block_type, "Create"):
                try:
                    cursor.execute("""
                        INSERT INTO flowbuilder_blocks 
                        (type, element_id, name, node_description, description, input_schema, output_schema, 
                         parameter_schema_structure, parameters, processing_message, tags, layer, 
                         hyperparameters, input_data, output_data, code, flow_control, icon, category)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        block['type'],
                        block.get('element_id'),
                        block.get('name'),
                        block['node_description'],
                        block.get('description'),
                        json.dumps(block['input_schema']),
                        json.dumps(block['output_schema']),
                        json.dumps(block.get('parameter_schema_structure', {})),
                        json.dumps(block.get('parameters', {})),
                        block.get('processing_message'),
                        json.dumps(block.get('tags', [])),
                        block.get('layer'),
                        json.dumps(block.get('hyperparameters', {})),
                        json.dumps(block.get('input_data')) if block.get('input_data') else None,
                        json.dumps(block.get('output_data')) if block.get('output_data') else None,
                        block.get('code'),
                        json.dumps(block.get('flow_control')) if block.get('flow_control') else None,
                        block['icon'],
                        block['category']
                    ))
                    created.append(block_type)
                    print(f"  ✅ Created {block_type}")
                except Exception as e:
                    print(f"  ❌ Failed to create {block_type}: {e}")
                    skipped.append(block_type)
            else:
                skipped.append(block_type)
                print(f"  ⏭️  Skipped {block_type}")
    
    # Print summary tables
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    
    print(f"\n✅ Created ({len(created)} blocks):")
    if created:
        for block in sorted(created):
            print(f"  - {block}")
    else:
        print("  None")
    
    print(f"\n🔄 Modified ({len(modified)} blocks):")
    if modified:
        for block in sorted(modified):
            print(f"  - {block}")
    else:
        print("  None")
    
    print(f"\n⏸️  Unchanged ({len(unchanged)} blocks):")
    if unchanged:
        for block in sorted(unchanged):
            print(f"  - {block}")
    else:
        print("  None")
    
    if skipped:
        print(f"\n⏭️  Skipped ({len(skipped)} blocks):")
        for block in sorted(skipped):
            print(f"  - {block}")

def check_tables_and_data(cursor):
    """Check what tables exist and show data counts"""
    print("\n📊 Database Status Check")
    print("="*60)
    
    # Check for all tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print(f"\n📋 Tables in database ({len(tables)}):")
    
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"  - {table_name}: {count} rows")
    
    # Detailed flowbuilder_blocks info
    if 'flowbuilder_blocks' in [t[0] for t in tables]:
        cursor.execute("""
            SELECT category, COUNT(*) as count 
            FROM flowbuilder_blocks 
            GROUP BY category 
            ORDER BY category
        """)
        categories = cursor.fetchall()
        
        if categories:
            print("\n📊 Flowbuilder blocks by category:")
            for category, count in categories:
                print(f"  - {category}: {count} blocks")

def run_population(check_only=False, auto_confirm=False):
    """Run the complete population process"""
    try:
        print("🚀 Starting flowbuilder_blocks population...")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if check_only:
            check_tables_and_data(cursor)
            cursor.close()
            conn.close()
            return
        
        # Verify table exists
        verify_flowbuilder_blocks_table(cursor)
        
        # Populate data
        populate_flowbuilder_blocks(cursor, auto_confirm)
        
        # Commit changes
        conn.commit()
        
        # Verify final state
        cursor.execute("SELECT COUNT(*) FROM flowbuilder_blocks")
        count = cursor.fetchone()[0]
        print(f"\n🎉 Population completed! Total blocks in database: {count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Population failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise

def main():
    parser = argparse.ArgumentParser(description='Populate flowbuilder_blocks table from YAML files')
    parser.add_argument('--check', action='store_true', help='Only check database status without making changes')
    parser.add_argument('--auto', action='store_true', help='Automatically confirm all changes without prompting')
    
    args = parser.parse_args()
    
    run_population(check_only=args.check, auto_confirm=args.auto)

if __name__ == "__main__":
    main()