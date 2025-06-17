#!/usr/bin/env python3
"""
Database Population Script for NeuraLabs Flowbuilder Blocks

This script populates the flowbuilder_blocks table using data extracted from 
YAML configuration files in the element_structure directory.

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

# Add the current directory to Python path to import yaml_extractor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from yaml_extractor import extract_all_blocks
except ImportError as e:
    print(f"❌ Error importing yaml_extractor: {e}")
    print("Make sure yaml_extractor.py is in the same directory as this script")
    sys.exit(1)

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

def populate_flowbuilder_blocks(cursor):
    """Populate the table with blocks extracted from YAML files"""
    
    # Get the element structure directory path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    element_structure_dir = os.path.join(project_root, 'hpc-execution-node-backend', 'element_structure')
    
    print(f"📁 Loading blocks from: {element_structure_dir}")
    
    # Extract blocks from YAML files
    try:
        all_blocks = extract_all_blocks(element_structure_dir)
    except Exception as e:
        print(f"❌ Error extracting blocks from YAML: {e}")
        print("Falling back to hardcoded blocks...")
        return None
    
    
    print(f"📊 Found {len(all_blocks)} blocks to populate")
    
    # Insert blocks
    successful_inserts = 0
    failed_inserts = 0
    
    for block in all_blocks:
        try:
            cursor.execute("""
                INSERT INTO flowbuilder_blocks 
                (type, element_id, name, node_description, description, input_schema, output_schema, 
                 parameter_schema_structure, parameters, processing_message, tags, layer, 
                 hyperparameters, input_data, output_data, code, flow_control, icon, category)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (type) DO UPDATE SET
                    element_id = EXCLUDED.element_id,
                    name = EXCLUDED.name,
                    node_description = EXCLUDED.node_description,
                    description = EXCLUDED.description,
                    input_schema = EXCLUDED.input_schema,
                    output_schema = EXCLUDED.output_schema,
                    parameter_schema_structure = EXCLUDED.parameter_schema_structure,
                    parameters = EXCLUDED.parameters,
                    processing_message = EXCLUDED.processing_message,
                    tags = EXCLUDED.tags,
                    layer = EXCLUDED.layer,
                    hyperparameters = EXCLUDED.hyperparameters,
                    input_data = EXCLUDED.input_data,
                    output_data = EXCLUDED.output_data,
                    code = EXCLUDED.code,
                    flow_control = EXCLUDED.flow_control,
                    icon = EXCLUDED.icon,
                    category = EXCLUDED.category,
                    updated_at = CURRENT_TIMESTAMP
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
            successful_inserts += 1
            print(f"  ✅ {block['type']} ({block['category']})")
        except Exception as e:
            failed_inserts += 1
            print(f"  ❌ Failed to insert {block.get('type', 'Unknown')}: {e}")
    
    print(f"\n📊 Summary: {successful_inserts} successful, {failed_inserts} failed")

def run_population():
    """Run the complete population process"""
    try:
        print("🚀 Starting flowbuilder_blocks population...")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify table exists
        verify_flowbuilder_blocks_table(cursor)
        
        # Populate data
        populate_flowbuilder_blocks(cursor)
        
        # Commit changes
        conn.commit()
        
        # Verify insertion
        cursor.execute("SELECT COUNT(*) FROM flowbuilder_blocks")
        count = cursor.fetchone()[0]
        print(f"\n🎉 Population completed successfully! Total blocks in database: {count}")
        
        # Show category breakdown
        cursor.execute("""
            SELECT category, COUNT(*) as count 
            FROM flowbuilder_blocks 
            GROUP BY category 
            ORDER BY category
        """)
        categories = cursor.fetchall()
        
        print("\n📊 Category breakdown:")
        for category, count in categories:
            print(f"  {category}: {count} blocks")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Population failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise



if __name__ == "__main__":
    run_population()