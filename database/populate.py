#!/usr/bin/env python3
"""
Database Population Script for NeuraLabs Flowbuilder Blocks

This script creates and populates the flowbuilder_blocks table using data
extracted from YAML configuration files in the element_structure directory.
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

def create_flowbuilder_blocks_table(cursor):
    """Create the flowbuilder_blocks table"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flowbuilder_blocks (
            id SERIAL PRIMARY KEY,
            type VARCHAR(255) NOT NULL UNIQUE,
            element_id VARCHAR(255),
            name VARCHAR(255),
            node_description TEXT NOT NULL,
            description TEXT,
            input_schema JSONB NOT NULL,
            output_schema JSONB NOT NULL,
            parameter_schema_structure JSONB NOT NULL DEFAULT '{}',
            parameters JSONB NOT NULL DEFAULT '{}',
            processing_message TEXT,
            tags JSONB NOT NULL DEFAULT '[]',
            layer VARCHAR(100),
            hyperparameters JSONB NOT NULL DEFAULT '{}',
            input_data JSONB DEFAULT NULL,
            output_data JSONB DEFAULT NULL,
            code TEXT DEFAULT NULL,
            flow_control JSONB DEFAULT NULL,
            icon VARCHAR(100) NOT NULL,
            category VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flowbuilder_blocks_category ON flowbuilder_blocks(category);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flowbuilder_blocks_type ON flowbuilder_blocks(type);")
    
    print("✅ Created flowbuilder_blocks table and indexes")

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
        all_blocks = get_fallback_blocks()
    
    if not all_blocks:
        print("❌ No blocks found. Using fallback blocks.")
        all_blocks = get_fallback_blocks()
    
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

def run_migration():
    """Run the complete migration"""
    try:
        print("🚀 Starting flowbuilder_blocks migration...")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create table
        create_flowbuilder_blocks_table(cursor)
        
        # Populate data
        populate_flowbuilder_blocks(cursor)
        
        # Commit changes
        conn.commit()
        
        # Verify insertion
        cursor.execute("SELECT COUNT(*) FROM flowbuilder_blocks")
        count = cursor.fetchone()[0]
        print(f"\n🎉 Migration completed successfully! Total blocks in database: {count}")
        
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
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise

def get_fallback_blocks():
    """Return fallback blocks if YAML extraction fails"""
    return [
        {
            'type': 'Start',
            'element_id': None,
            'name': None,
            'node_description': 'Entry point of a flow',
            'description': None,
            'input_schema': {},
            'output_schema': {},
            'parameter_schema_structure': {},
            'parameters': {},
            'processing_message': 'Starting flow...',
            'tags': ['flow-control', 'required'],
            'layer': None,
            'hyperparameters': {},
            'input_data': None,
            'output_data': None,
            'code': None,
            'flow_control': None,
            'icon': 'FiPlay',
            'category': 'Flow Control'
        },
        {
            'type': 'End',
            'element_id': None,
            'name': None,
            'node_description': 'Exit point of a flow',
            'description': None,
            'input_schema': {"text_input": {"type": "string", "description": "Text input to be output", "required": False}},
            'output_schema': {"text_output": {"type": "string", "description": "Final text output", "required": False}},
            'parameter_schema_structure': {},
            'parameters': {},
            'processing_message': 'Completing flow...',
            'tags': ['flow-control', 'required'],
            'layer': None,
            'hyperparameters': {},
            'input_data': None,
            'output_data': None,
            'code': None,
            'flow_control': None,
            'icon': 'FiSquare',
            'category': 'Flow Control'
        },
        {
            'type': 'ChatInput',
            'element_id': None,
            'name': None,
            'node_description': 'Capture user input text from chat interface',
            'description': None,
            'input_schema': {},
            'output_schema': {"chat_input": {"type": "string", "description": "User input text", "required": True}},
            'parameter_schema_structure': {},
            'parameters': {},
            'processing_message': 'Receiving input...',
            'tags': ['input', 'user-interaction'],
            'layer': None,
            'hyperparameters': {},
            'input_data': None,
            'output_data': None,
            'code': None,
            'flow_control': None,
            'icon': 'FiMessageCircle',
            'category': 'Input'
        },
        {
            'type': 'LLMText',
            'element_id': None,
            'name': None,
            'node_description': 'Generate free-form text using Large Language Models',
            'description': None,
            'input_schema': {"prompt": {"type": "string", "description": "Main prompt for text generation", "required": True}},
            'output_schema': {"llm_output": {"type": "string", "description": "Generated text from the LLM", "required": True}},
            'parameter_schema_structure': {"model": {"type": "string"}, "temperature": {"type": "float"}},
            'parameters': {"model": "llama-3.3-70b", "temperature": 0.7},
            'processing_message': 'AI is generating response...',
            'tags': ['ai', 'llm'],
            'layer': None,
            'hyperparameters': {},
            'input_data': None,
            'output_data': None,
            'code': None,
            'flow_control': None,
            'icon': 'FiType',
            'category': 'AI'
        },
        {
            'type': 'Custom',
            'element_id': None,
            'name': None,
            'node_description': 'Execute custom Python code',
            'description': None,
            'input_schema': {},
            'output_schema': {},
            'parameter_schema_structure': {},
            'parameters': {},
            'processing_message': 'Executing custom code...',
            'tags': ['custom', 'code'],
            'layer': None,
            'hyperparameters': {},
            'input_data': None,
            'output_data': None,
            'code': '',
            'flow_control': None,
            'icon': 'FiTerminal',
            'category': 'Custom'
        }
    ]

if __name__ == "__main__":
    run_migration()