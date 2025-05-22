"""
Blockchain-related data management functions
"""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import yaml
from pathlib import Path
from ...modules.database.postgresconn import PostgresConnection


def load_config() -> Dict[str, Any]:
    """
    Load configuration from config.yaml
    
    Returns:
        Configuration dictionary
    """
    config_path = Path(__file__).parent.parent.parent.parent / "config.yaml"
    with open(config_path, "r") as file:
        return yaml.safe_load(file)


async def initialize_supported_chains() -> Tuple[bool, Optional[str], int]:
    """
    Initialize all supported chains from the config file
    
    Returns:
        Tuple containing (success, error_message, count_of_chains_initialized)
    """
    pg_conn = PostgresConnection()
    config = load_config()
    chains_initialized = 0
    
    try:
        for chain in config.get("blockchain", {}).get("supported_chains", []):
            chain_id = chain.get("chain_id")
            chain_explorer = chain.get("chain_explorer")
            
            if not chain_id:
                continue
                
            # Check if chain already exists
            check_query = "SELECT chain_id FROM CHAIN_DETAILS WHERE chain_id = %s"
            result = await pg_conn.execute_query(check_query, (chain_id,))
            
            if not result:
                # Insert new chain details
                insert_query = """
                INSERT INTO CHAIN_DETAILS (chain_id, chain, chain_status, chain_explorer)
                VALUES (%s, %s, %s, %s)
                """
                params = (
                    chain_id,
                    chain.get("name", f"Chain {chain_id}"),
                    chain.get("chainstatus", "Active"),
                    chain.get("chain_explorer", chain_explorer)
                )
                
                await pg_conn.execute_query(insert_query, params)
                chains_initialized += 1
        
        return True, None, chains_initialized
    except Exception as e:
        return False, f"Error initializing chains: {e}", chains_initialized


async def get_or_create_chain_details(chain_id: int) -> Tuple[bool, Optional[str]]:
    """
    Get chain details or create if they don't exist
    
    Args:
        chain_id: ID of the blockchain
        
    Returns:
        Tuple containing (success, error_message)
    """
    pg_conn = PostgresConnection()
    
    # Check if chain_id exists in the database
    check_query = "SELECT chain_id FROM CHAIN_DETAILS WHERE chain_id = %s"
    result = await pg_conn.execute_query(check_query, (chain_id,))
    
    if not result:
        # If not in database, try to find in config
        config = load_config()
        chain_found = False
        
        for chain in config.get("blockchain", {}).get("supported_chains", []):
            if chain.get("chain_id") == chain_id:
                chain_explorer = chain.get("chain_explorer")
                # Found in config, insert into database
                insert_query = """
                INSERT INTO CHAIN_DETAILS (chain_id, chain, chain_status, chain_explorer)
                VALUES (%s, %s, %s, %s)
                """
                params = (
                    chain_id,
                    chain.get("name", f"Chain {chain_id}"),
                    chain.get("chainstatus", "Active"),
                    chain.get("chain_explorer", chain_explorer)
                )   
                
                try:
                    await pg_conn.execute_query(insert_query, params)
                    chain_found = True
                    break
                except Exception as e:
                    return False, f"Error creating chain details: {e}"
        
        if not chain_found:
            return False, f"Chain ID {chain_id} not found in configuration"
    
    return True, None


async def create_or_get_contract_details(
    contract_id: str,
    chain_id: int = 101,
    contract_name: str = "NeuraSynthesis",
    contract_version: str = "1.0.0"
) -> Tuple[bool, Optional[str]]:
    """
    Create a new contract details entry or get existing one
    
    Args:
        contract_id: ID of the contract
        chain_id: ID of the blockchain
        contract_name: Name of the contract
        contract_version: Version of the contract
        
    Returns:
        Tuple containing (success, error_message)
    """
    pg_conn = PostgresConnection()
    
    # First, ensure chain_id exists
    chain_success, chain_error = await get_or_create_chain_details(chain_id)
    if not chain_success:
        return False, chain_error
    
    # Check if contract already exists
    check_query = "SELECT contract_id FROM CONTRACT_DETAILS WHERE contract_id = %s"
    result = await pg_conn.execute_query(check_query, (contract_id,))
    
    if not result:
        # Insert new contract
        insert_query = """
        INSERT INTO CONTRACT_DETAILS (contract_id, chain_id, contract_name, contract_version)
        VALUES (%s, %s, %s, %s)
        """
        params = (
            contract_id,
            chain_id,
            contract_name,
            contract_version
        )
        
        try:
            await pg_conn.execute_query(insert_query, params)
        except Exception as e:
            return False, f"Error creating contract details: {e}"
    
    return True, None


async def get_supported_chains() -> List[Dict[str, Any]]:
    """
    Get list of supported blockchain networks
    
    Returns:
        List of chain details
    """
    pg_conn = PostgresConnection()
    
    query = """
    SELECT chain_id, chain, chain_status, chain_explorer
    FROM CHAIN_DETAILS
    ORDER BY chain_id
    """
    
    result = await pg_conn.execute_query(query)
    return result