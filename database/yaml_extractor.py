#!/usr/bin/env python3
"""
YAML Block Extractor

This script extracts block configuration data from YAML files in the element_structure directory
and converts them into a format suitable for database population.
"""

import os
import yaml
import json
from typing import Dict, List, Any
from pathlib import Path

def load_yaml_file(file_path: str) -> Dict[str, Any]:
    """Load and parse a YAML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return {}

def determine_category(element_type: str, tags: List[str]) -> str:
    """Determine the category based on element type and tags"""
    type_lower = element_type.lower()
    
    # Ensure tags is a list and convert to lowercase
    if not isinstance(tags, list):
        tags = []
    tags_lower = [tag.lower() if isinstance(tag, str) else str(tag).lower() for tag in tags]
    
    # Flow control elements
    if any(tag in ['flow-control', 'required'] for tag in tags_lower) or type_lower in ['start', 'end', 'case', 'flow_select']:
        return 'Flow Control'
    
    # Input elements
    if any(tag in ['input', 'user-interaction', 'configuration', 'static-data'] for tag in tags_lower) or type_lower in ['chat_input', 'context_history', 'datablocks', 'rest_api', 'metadata', 'constants']:
        return 'Input'
    
    # AI elements
    if any(tag in ['ai', 'llm', 'text-generation'] for tag in tags_lower) or type_lower.startswith('llm'):
        return 'AI'
    
    # Utility elements
    if any(tag in ['utility', 'data-manipulation'] for tag in tags_lower) or type_lower in ['selector', 'merger', 'random_generator', 'time']:
        return 'Utility'
    
    # Blockchain elements
    if any(tag in ['blockchain', 'onchain', 'sui', 'read-only'] for tag in tags_lower) or 'blockchain' in type_lower or 'transaction' in type_lower or type_lower == 'read_blockchain_data':
        return 'Blockchain'
    
    # Custom elements
    if any(tag in ['custom', 'code'] for tag in tags_lower) or type_lower == 'custom':
        return 'Custom'
    
    return 'Utility'  # Default category

def determine_icon(element_type: str, category: str) -> str:
    """Determine the icon based on element type and category"""
    icon_map = {
        # Flow Control
        'start': 'FiPlay',
        'end': 'FiSquare', 
        'case': 'FiGitBranch',
        'flow_select': 'FiShuffle',
        
        # Input
        'chat_input': 'FiMessageCircle',
        'context_history': 'FiClock',
        'datablocks': 'FiDatabase',
        'datablock': 'FiDatabase',
        'rest_api': 'FiGlobe',
        'metadata': 'FiInfo',
        'constants': 'FiLock',
        
        # AI
        'llm_text': 'FiType',
        'llm_structured': 'FiCode',
        
        # Utility
        'selector': 'FiFilter',
        'merger': 'FiGitMerge',
        'random_generator': 'FiRefreshCw',
        'time': 'FiClock',
        
        # Blockchain
        'read_blockchain_data': 'FiEye',
        'build_transaction': 'FiPackage',
        'build_transaction_json': 'FiPackage',
        
        # Custom
        'custom': 'FiTerminal'
    }
    
    return icon_map.get(element_type.lower(), 'FiBox')

def extract_parameters_from_yaml(yaml_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract hyperparameters from YAML data, combining parameter_schema_structure and parameters"""
    hyper_params = {}
    
    # Get parameter schema structure
    param_schema = yaml_data.get('parameter_schema_structure', {})
    
    # Get actual parameter values
    params = yaml_data.get('parameters', {})
    
    # Combine schema with values
    for param_name, schema_info in param_schema.items():
        param_config = {
            'type': schema_info.get('type', 'string'),
            'description': schema_info.get('description', f'Parameter {param_name}'),
            'required': schema_info.get('required', False)
        }
        
        # Add constraints if present
        for constraint in ['min', 'max', 'enum', 'default']:
            if constraint in schema_info:
                param_config[constraint] = schema_info[constraint]
        
        # Add current value if available
        if param_name in params:
            param_config['default'] = params[param_name]
            
        hyper_params[param_name] = param_config
    
    # Add any parameters not in schema but present in parameters
    for param_name, param_value in params.items():
        if param_name not in hyper_params:
            hyper_params[param_name] = {
                'type': 'any',
                'description': f'Parameter {param_name}',
                'required': False,
                'default': param_value
            }
    
    return hyper_params

def convert_yaml_to_block_data(yaml_data: Dict[str, Any], filename: str) -> Dict[str, Any]:
    """Convert YAML data to database block format"""
    element_type = yaml_data.get('type', filename.replace('.yaml', ''))
    tags = yaml_data.get('tags', [])
    category = determine_category(element_type, tags)
    icon = determine_icon(element_type, category)
    
    # Convert type to proper case for database
    type_mapping = {
        'chat_input': 'ChatInput',
        'context_history': 'ContextHistory', 
        'rest_api': 'RestAPI',
        'llm_text': 'LLMText',
        'llm_structured': 'LLMStructured',
        'random_generator': 'RandomGenerator',
        'time': 'TimeBlock',
        'read_blockchain_data': 'ReadBlockchainData',
        'build_transaction': 'BuildTransaction',
        'build_transaction_json': 'BuildTransaction',
        'flow_select': 'FlowSelect',
        'datablocks': 'Datablocks',
        'datablock': 'Datablocks',  # Add support for singular form
        'constants': 'Constants',
        'metadata': 'Metadata',
        'selector': 'Selector',
        'merger': 'Merger',
        'custom': 'Custom',
        'start': 'Start',
        'end': 'End',
        'case': 'Case'
    }
    
    db_type = type_mapping.get(element_type.lower(), element_type.title())
    
    # Extract all fields from YAML
    block_data = {
        'type': db_type,
        'element_id': yaml_data.get('element_id'),
        'name': yaml_data.get('name'),
        'node_description': yaml_data.get('node_description', f'{db_type} element'),
        'description': yaml_data.get('description'),
        'input_schema': yaml_data.get('input_schema', {}),
        'output_schema': yaml_data.get('output_schema', {}),
        'parameter_schema_structure': yaml_data.get('parameter_schema_structure', {}),
        'parameters': yaml_data.get('parameters', {}),
        'processing_message': yaml_data.get('processing_message'),
        'tags': tags,
        'layer': yaml_data.get('layer'),
        'hyperparameters': yaml_data.get('hyperparameters', {}),
        'input_data': yaml_data.get('input'),
        'output_data': yaml_data.get('output'),
        'code': yaml_data.get('code'),
        'flow_control': yaml_data.get('flow_control'),
        'icon': icon,
        'category': category
    }
    
    return block_data

def extract_all_blocks(element_structure_dir: str) -> List[Dict[str, Any]]:
    """Extract all blocks from YAML files in the element_structure directory"""
    blocks = []
    
    if not os.path.exists(element_structure_dir):
        print(f"Directory not found: {element_structure_dir}")
        return blocks
    
    yaml_files = [f for f in os.listdir(element_structure_dir) if f.endswith('.yaml')]
    
    for yaml_file in yaml_files:
        file_path = os.path.join(element_structure_dir, yaml_file)
        yaml_data = load_yaml_file(file_path)
        
        if yaml_data:
            try:
                block_data = convert_yaml_to_block_data(yaml_data, yaml_file)
                blocks.append(block_data)
                print(f"✅ Extracted: {block_data['type']} ({yaml_file})")
            except Exception as e:
                print(f"❌ Error processing {yaml_file}: {e}")
    
    return blocks

def save_blocks_to_json(blocks: List[Dict[str, Any]], output_file: str = None):
    """Save extracted blocks to JSON file for inspection"""
    if output_file is None:
        output_file = os.path.join(os.path.dirname(__file__), 'extracted_blocks.json')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(blocks, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved {len(blocks)} blocks to {output_file}")

if __name__ == "__main__":
    # Get the project root directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    element_structure_dir = os.path.join(project_root, 'hpc-execution-node-backend', 'element_structure')
    
    print(f"🔍 Extracting blocks from: {element_structure_dir}")
    
    # Extract all blocks
    blocks = extract_all_blocks(element_structure_dir)
    
    if blocks:
        # Save to JSON file for inspection
        save_blocks_to_json(blocks)
        print(f"\n📊 Summary:")
        print(f"Total blocks extracted: {len(blocks)}")
        
        # Group by category
        categories = {}
        for block in blocks:
            category = block['category']
            if category not in categories:
                categories[category] = []
            categories[category].append(block['type'])
        
        for category, types in categories.items():
            print(f"  {category}: {len(types)} blocks - {', '.join(types)}")
    else:
        print("❌ No blocks extracted")