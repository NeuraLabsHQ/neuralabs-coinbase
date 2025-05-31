# Save this as: neuralabs-backend/application/modules/get_data/flowbuilder.py

"""
Flowbuilder blocks data retrieval functions
"""
from typing import List, Dict, Any, Optional
from ...modules.database.postgresconn import PostgresConnection


async def get_all_flowbuilder_blocks() -> List[Dict[str, Any]]:
    """
    Get all flowbuilder blocks
    
    Returns:
        List of all flowbuilder blocks
    """
    pg_conn = PostgresConnection()
    query = """
        SELECT id, type, node_description as element_description, 
               COALESCE(input_schema, '{}'::jsonb) as input_schema, 
               COALESCE(output_schema, '{}'::jsonb) as output_schema, 
               COALESCE(hyperparameters, '{}'::jsonb) as hyper_parameters, 
               COALESCE(parameter_schema_structure, '{}'::jsonb) as parameter_schema_structure, 
               COALESCE(parameters, '{}'::jsonb) as parameters,
               processing_message, 
               COALESCE(tags, '[]'::jsonb) as tags, 
               icon, category, created_at, updated_at
        FROM flowbuilder_blocks
        ORDER BY category, type
    """
    result = await pg_conn.execute_query(query)
    # print(result)  # Debugging line to check the result
    return result


async def get_flowbuilder_blocks_by_category(category: str) -> List[Dict[str, Any]]:
    """
    Get flowbuilder blocks by category
    
    Args:
        category: Category to filter by
        
    Returns:
        List of flowbuilder blocks in the specified category
    """
    pg_conn = PostgresConnection()
    query = """
        SELECT id, type, node_description as element_description, 
               COALESCE(input_schema, '{}'::jsonb) as input_schema, 
               COALESCE(output_schema, '{}'::jsonb) as output_schema, 
               COALESCE(hyperparameters, '{}'::jsonb) as hyper_parameters, 
               COALESCE(parameter_schema_structure, '{}'::jsonb) as parameter_schema_structure, 
               COALESCE(parameters, '{}'::jsonb) as parameters,
               processing_message, 
               COALESCE(tags, '[]'::jsonb) as tags, 
               icon, category, created_at, updated_at
        FROM flowbuilder_blocks
        WHERE category = %s
        ORDER BY type
    """
    result = await pg_conn.execute_query(query, (category,))
    return result


async def get_flowbuilder_block_by_type(block_type: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific flowbuilder block by type
    
    Args:
        block_type: Type of the block to retrieve
        
    Returns:
        Flowbuilder block details if found, None otherwise
    """
    pg_conn = PostgresConnection()
    query = """
        SELECT id, type, node_description as element_description, 
               COALESCE(input_schema, '{}'::jsonb) as input_schema, 
               COALESCE(output_schema, '{}'::jsonb) as output_schema, 
               COALESCE(hyperparameters, '{}'::jsonb) as hyper_parameters, 
               COALESCE(parameter_schema_structure, '{}'::jsonb) as parameter_schema_structure, 
               COALESCE(parameters, '{}'::jsonb) as parameters,
               processing_message, 
               COALESCE(tags, '[]'::jsonb) as tags, 
               icon, category, created_at, updated_at
        FROM flowbuilder_blocks
        WHERE type = %s
    """
    result = await pg_conn.execute_query(query, (block_type,))
    
    if result:
        return result[0]
    return None


async def get_flowbuilder_categories() -> List[Dict[str, Any]]:
    """
    Get all unique categories with count of blocks in each
    
    Returns:
        List of categories with block counts
    """
    pg_conn = PostgresConnection()
    query = """
        SELECT category, COUNT(*) as block_count
        FROM flowbuilder_blocks
        GROUP BY category
        ORDER BY category
    """
    result = await pg_conn.execute_query(query)
    return result


async def search_flowbuilder_blocks(search_term: str) -> List[Dict[str, Any]]:
    """
    Search flowbuilder blocks by name or description
    
    Args:
        search_term: Term to search for
        
    Returns:
        List of matching flowbuilder blocks
    """
    pg_conn = PostgresConnection()
    query = """
        SELECT id, type, node_description as element_description, 
               COALESCE(input_schema, '{}'::jsonb) as input_schema, 
               COALESCE(output_schema, '{}'::jsonb) as output_schema, 
               COALESCE(hyperparameters, '{}'::jsonb) as hyper_parameters, 
               COALESCE(parameter_schema_structure, '{}'::jsonb) as parameter_schema_structure, 
               COALESCE(parameters, '{}'::jsonb) as parameters,
               processing_message, 
               COALESCE(tags, '[]'::jsonb) as tags, 
               icon, category, created_at, updated_at
        FROM flowbuilder_blocks
        WHERE type ILIKE %s OR node_description ILIKE %s
        ORDER BY category, type
    """
    search_pattern = f"%{search_term}%"
    result = await pg_conn.execute_query(query, (search_pattern, search_pattern))
    return result