# Save this as: database/migrations/add_flowbuilder_blocks.py

"""
Migration script to add flowbuilder_blocks table and populate it with initial data
"""
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        port=os.getenv('POSTGRES_PORT', '5432')
    )

def create_flowbuilder_blocks_table(cursor):
    """Create the flowbuilder_blocks table"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flowbuilder_blocks (
            id SERIAL PRIMARY KEY,
            type VARCHAR(255) NOT NULL UNIQUE,
            element_description TEXT NOT NULL,
            input_schema JSONB NOT NULL,
            output_schema JSONB NOT NULL,
            hyper_parameters JSONB NOT NULL,
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
    """Populate the table with initial data"""
    
    # Flow Control Elements
    flow_control_blocks = [
        {
            'type': 'Start',
            'element_description': 'Entry point of a flow',
            'input_schema': {} ,
            'output_schema': {},
            'hyper_parameters': {},
            'icon': 'FiPlay',
            'category': 'Flow Control'
        },
        {
            'type': 'End',
            'element_description': 'Exit point of a flow',
            'input_schema': {"text_input": {"type": "string", "description": "Text input to be output", "required": False}, "proposed_transaction": {"type": "object", "description": "Optional transaction proposal", "required": False}},
            'output_schema': {"text_output": {"type": "string", "description": "Final text output", "required": False}, "proposed_transaction": {"type": "object", "description": "Optional transaction proposal", "required": False}},
            'hyper_parameters': {},
            'icon': 'FiSquare',
            'category': 'Flow Control'
        },
        {
            'type': 'Case',
            'element_description': 'Conditional branching based on multiple conditions',
            'input_schema': {"variables": {"type": "object", "description": "Dictionary of values to compare against conditions", "required": True}},
            'output_schema': {"result": {"type": "object", "description": "Dictionary mapping case IDs to boolean results", "required": True}},
            'hyper_parameters': {"cases": {"type": "array", "description": "List of condition configurations", "required": True, "items": {"type": "object", "properties": {"id": {"type": "string"}, "condition": {"type": "string"}, "operator": {"type": "string"}}}}},
            'icon': 'FiGitBranch',
            'category': 'Flow Control'
        },
        {
            'type': 'FlowSelect',
            'element_description': 'Choose between multiple flow paths dynamically',
            'input_schema': {"input_data": {"type": "any", "description": "Any input data to be passed through", "required": False}},
            'output_schema': {"output_data": {"type": "any", "description": "Same as inputs", "required": False}, "chosen_flow": {"type": "string", "description": "ID of the selected flow", "required": True}},
            'hyper_parameters': {"flows_to_switch": {"type": "array", "description": "List of available flow IDs", "required": True, "items": {"type": "string"}}},
            'icon': 'FiShuffle',
            'category': 'Flow Control'
        }
    ]
    
    # Input Elements
    input_blocks = [
        {
            'type': 'ChatInput',
            'element_description': 'Capture user input text from chat interface',
            'input_schema': {"chat_input": {"type": "string", "description": "User input text from chat", "required": True}},
            'output_schema': {"chat_input": {"type": "string", "description": "User input text", "required": True}},
            'hyper_parameters': {},
            'icon': 'FiMessageCircle',
            'category': 'Input'
        },
        {
            'type': 'ContextHistory',
            'element_description': 'Access conversation history and context',
            'input_schema': {"context_history": {"type": "array", "description": "List of previous conversation messages", "required": True, "items": {"type": "object"}}},
            'output_schema': {"context_history": {"type": "array", "description": "Conversation history", "required": True, "items": {"type": "object"}}},
            'hyper_parameters': {},
            'icon': 'FiClock',
            'category': 'Input'
        },
        {
            'type': 'Datablocks',
            'element_description': 'Provide constant data in JSON or CSV format',
            'input_schema': {},
            'output_schema': {"data": {"type": "any", "description": "The constant data based on specified type", "required": True}},
            'hyper_parameters': {"data_type": {"type": "string", "description": "Type of data (json, csv, text)", "required": True, "enum": ["json", "csv", "text"]}, "data": {"type": "any", "description": "The actual constant data", "required": True}},
            'icon': 'FiDatabase',
            'category': 'Input'
        },
        {
            'type': 'RestAPI',
            'element_description': 'Make external API calls and retrieve data',
            'input_schema': {"params": {"type": "object", "description": "Parameters for the API call", "required": False}},
            'output_schema': {"data": {"type": "any", "description": "Response data from the API", "required": True}, "status_code": {"type": "number", "description": "HTTP status code", "required": True}},
            'hyper_parameters': {"url": {"type": "string", "description": "API endpoint URL", "required": True}, "method": {"type": "string", "description": "HTTP method", "required": True, "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]}, "headers": {"type": "object", "description": "HTTP headers", "required": False}, "api_key": {"type": "string", "description": "API authentication key", "required": False}},
            'icon': 'FiGlobe',
            'category': 'Input'
        },
        {
            'type': 'Metadata',
            'element_description': 'Access user and environment metadata',
            'input_schema': {"input_data": {"type": "any", "description": "Any input data to be enriched with metadata", "required": False}},
            'output_schema': {"output_data": {"type": "any", "description": "Same as inputs plus metadata", "required": False}, "user_metadata": {"type": "object", "description": "User information", "required": True}, "environment_metadata": {"type": "object", "description": "Environment information", "required": True}},
            'hyper_parameters': {"data": {"type": "object", "description": "Additional metadata to include", "required": False}},
            'icon': 'FiInfo',
            'category': 'Input'
        },
        {
            'type': 'Constants',
            'element_description': 'Provide fixed constant values',
            'input_schema': {},
            'output_schema': {"data": {"type": "any", "description": "The constant value based on specified type", "required": True}},
            'hyper_parameters': {"data_type": {"type": "string", "description": "Type of constant", "required": True, "enum": ["string", "number", "boolean", "object", "array"]}, "data": {"type": "any", "description": "The constant value", "required": True}},
            'icon': 'FiLock',
            'category': 'Input'
        }
    ]
    
    # Continue with other categories...
    utility_blocks = [
        {
            'type': 'Selector',
            'element_description': 'Extract specific values from input data using keys',
            'input_schema': {"data": {"type": "any", "description": "Input data to extract values from", "required": True}},
            'output_schema': {"value": {"type": "any", "description": "Extracted data value", "required": True}},
            'hyper_parameters': {"key": {"type": "any", "description": "Key or path to extract (string or array)", "required": True}},
            'icon': 'FiFilter',
            'category': 'Utility'
        },
        {
            'type': 'Merger',
            'element_description': 'Combine multiple data inputs into a single output',
            'input_schema': {"data1": {"type": "any", "description": "First data input", "required": True}, "data2": {"type": "any", "description": "Second data input", "required": True}, "data3": {"type": "any", "description": "Third data input", "required": False}, "data4": {"type": "any", "description": "Fourth data input", "required": False}},
            'output_schema': {"merged_data": {"type": "any", "description": "Combined data from all inputs", "required": True}},
            'hyper_parameters': {"merge_strategy": {"type": "string", "description": "How to merge the data", "required": False, "enum": ["shallow", "deep", "array", "concatenate"], "default": "shallow"}},
            'icon': 'FiGitMerge',
            'category': 'Utility'
        },
        {
            'type': 'RandomGenerator',
            'element_description': 'Generate random values of various types',
            'input_schema': {},
            'output_schema': {"random_data": {"type": "any", "description": "Generated random value based on type", "required": True}},
            'hyper_parameters': {"type": {"type": "string", "description": "Type of random data to generate", "required": True, "enum": ["number", "string", "boolean", "uuid", "array"]}, "min": {"type": "number", "description": "Minimum value for numbers", "required": False}, "max": {"type": "number", "description": "Maximum value for numbers", "required": False}, "length": {"type": "number", "description": "Length for strings or arrays", "required": False}, "charset": {"type": "string", "description": "Character set for string generation", "required": False}},
            'icon': 'FiRefreshCw',
            'category': 'Utility'
        },
        {
            'type': 'TimeBlock',
            'element_description': 'Provide current time and date information',
            'input_schema': {},
            'output_schema': {"time_data": {"type": "any", "description": "Time/date information based on type", "required": True}},
            'hyper_parameters': {"type": {"type": "string", "description": "Type of time information", "required": True, "enum": ["timestamp", "date", "time", "iso", "unix"]}, "format": {"type": "string", "description": "Output format string", "required": False}, "timezone": {"type": "string", "description": "Target timezone", "required": False, "default": "UTC"}},
            'icon': 'FiClock',
            'category': 'Utility'
        }
    ]
    
    ai_blocks = [
        {
            'type': 'LLMText',
            'element_description': 'Generate free-form text using Large Language Models',
            'input_schema': {"prompt": {"type": "string", "description": "Main prompt for text generation", "required": True}, "context": {"type": "string", "description": "Additional context information", "required": False}, "additional_data": {"type": "any", "description": "Extra data to include in generation", "required": False}},
            'output_schema': {"llm_output": {"type": "string", "description": "Generated text from the LLM", "required": True}},
            'hyper_parameters': {"model": {"type": "string", "description": "LLM model to use", "required": True, "enum": ["gpt-4", "gpt-3.5-turbo", "claude-3", "llama-2"]}, "temperature": {"type": "number", "description": "Creativity level (0-1)", "required": False, "default": 0.7, "min": 0, "max": 1}, "max_tokens": {"type": "number", "description": "Maximum tokens to generate", "required": False, "default": 1000}, "wrapper_prompt": {"type": "string", "description": "Template to wrap the prompt", "required": False}},
            'icon': 'FiType',
            'category': 'AI'
        },
        {
            'type': 'LLMStructured',
            'element_description': 'Generate structured data using Large Language Models',
            'input_schema': {"prompt": {"type": "string", "description": "Main prompt for structured generation", "required": True}, "context": {"type": "string", "description": "Additional context information", "required": False}, "additional_data": {"type": "any", "description": "Extra data to include in generation", "required": False}},
            'output_schema': {"structured_output": {"type": "object", "description": "Generated structured data from the LLM", "required": True}},
            'hyper_parameters': {"model": {"type": "string", "description": "LLM model to use", "required": True, "enum": ["gpt-4", "gpt-3.5-turbo", "claude-3", "llama-2"]}, "temperature": {"type": "number", "description": "Creativity level (0-1)", "required": False, "default": 0.3, "min": 0, "max": 1}, "max_tokens": {"type": "number", "description": "Maximum tokens to generate", "required": False, "default": 1000}, "wrapper_prompt": {"type": "string", "description": "Template to wrap the prompt", "required": False}, "llm_hidden_prompt": {"type": "string", "description": "Hidden system prompt", "required": False}, "output_schema": {"type": "object", "description": "Expected output structure schema", "required": True}},
            'icon': 'FiCode',
            'category': 'AI'
        }
    ]
    
    blockchain_blocks = [
        {
            'type': 'ReadBlockchainData',
            'element_description': 'Read data from blockchain smart contracts',
            'input_schema': {"function_params": {"type": "object", "description": "Parameters for the blockchain function call", "required": False}},
            'output_schema': {"data": {"type": "any", "description": "Response data from blockchain", "required": True}, "transaction_hash": {"type": "string", "description": "Transaction hash if applicable", "required": False}},
            'hyper_parameters': {"node_url": {"type": "string", "description": "Blockchain node URL", "required": True}, "contract_address": {"type": "string", "description": "Smart contract address", "required": True}, "function_name": {"type": "string", "description": "Function to call on the contract", "required": True}, "function_args": {"type": "array", "description": "Arguments for the function", "required": False}},
            'icon': 'FiEye',
            'category': 'Blockchain'
        },
        {
            'type': 'BuildTransactionJSON',
            'element_description': 'Create transaction payload for blockchain submission',
            'input_schema': {"transaction_params": {"type": "object", "description": "Parameters for transaction building", "required": True}},
            'output_schema': {"transaction_json": {"type": "object", "description": "Complete transaction payload", "required": True}, "estimated_gas": {"type": "number", "description": "Estimated gas cost", "required": False}},
            'hyper_parameters': {"node_url": {"type": "string", "description": "Blockchain node URL", "required": True}, "contract_address": {"type": "string", "description": "Smart contract address", "required": True}, "function_name": {"type": "string", "description": "Function to call on the contract", "required": True}, "function_args": {"type": "array", "description": "Arguments for the function", "required": False}, "gas_limit": {"type": "number", "description": "Maximum gas to use", "required": False}},
            'icon': 'FiPackage',
            'category': 'Blockchain'
        }
    ]
    
    custom_blocks = [
        {
            'type': 'Custom',
            'element_description': 'Execute custom Python code with configurable inputs and outputs',
            'input_schema': {"custom_inputs": {"type": "object", "description": "Dynamic inputs based on input_schema", "required": False}},
            'output_schema': {"custom_outputs": {"type": "object", "description": "Dynamic outputs based on code implementation", "required": False}},
            'hyper_parameters': {"code": {"type": "string", "description": "Python code to execute", "required": True}, "hyperparameters": {"type": "object", "description": "Configuration parameters for the code", "required": False}, "constants": {"type": "object", "description": "Constant values available in code", "required": False}, "input_schema": {"type": "object", "description": "Schema defining expected inputs", "required": False}, "output_schema": {"type": "object", "description": "Schema defining expected outputs", "required": False}},
            'icon': 'FiTerminal',
            'category': 'Custom'
        }
    ]
    
    # Combine all blocks
    all_blocks = flow_control_blocks + input_blocks + utility_blocks + ai_blocks + blockchain_blocks + custom_blocks
    
    # Insert blocks
    for block in all_blocks:
        cursor.execute("""
            INSERT INTO flowbuilder_blocks 
            (type, element_description, input_schema, output_schema, hyper_parameters, icon, category)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (type) DO UPDATE SET
                element_description = EXCLUDED.element_description,
                input_schema = EXCLUDED.input_schema,
                output_schema = EXCLUDED.output_schema,
                hyper_parameters = EXCLUDED.hyper_parameters,
                icon = EXCLUDED.icon,
                category = EXCLUDED.category,
                updated_at = CURRENT_TIMESTAMP
        """, (
            block['type'],
            block['element_description'],
            json.dumps(block['input_schema']),
            json.dumps(block['output_schema']),
            json.dumps(block['hyper_parameters']),
            block['icon'],
            block['category']
        ))
    
    print(f"✅ Inserted {len(all_blocks)} flowbuilder blocks")

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
        print(f"✅ Migration completed successfully! Total blocks: {count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise

if __name__ == "__main__":
    run_migration()