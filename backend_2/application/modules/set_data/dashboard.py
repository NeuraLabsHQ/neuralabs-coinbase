"""
Agent and NFT data modification functions
"""
from typing import Dict, Any, List, Optional, Tuple
import hashlib
import json
import time
from datetime import datetime
from ...modules.database.postgresconn import PostgresConnection
from ...modules.set_data.blockchain import create_or_get_contract_details


async def create_or_update_agent(
    agent_data: Dict[str, Any], 
    user_pub_key: str
) -> Tuple[bool, str, Optional[str]]:
    """
    Create a new agent or update an existing one
    
    Args:
        agent_data: Data for the agent
        user_pub_key: Public key of the user (owner)
        
    Returns:
        Tuple containing (success, agent_id, error_message)
    """
    pg_conn = PostgresConnection()
    
    # Generate agent_id if not provided (for new agents)
    agent_id = agent_data.get("agent_id")
    if not agent_id:
        # Create a deterministic agent_id based on user_pub_key and timestamp
        timestamp = str(int(time.time()))
        combined = f"{user_pub_key}{timestamp}"
        agent_id = hashlib.sha256(combined.encode()).hexdigest()[:64]
    
    # Check if updating existing agent and verify ownership
    query = "SELECT owner FROM AGENT WHERE agent_id = %s"
    result = await pg_conn.execute_query(query, (agent_id,))
    
    if result:
        # Agent exists, verify ownership
        if result[0]["owner"] != user_pub_key:
            return False, agent_id, "You don't have permission to update this agent"
        
        # Update existing agent
        update_query = """
        UPDATE AGENT 
        SET name = %s, description = %s, status = %s, tags = %s, 
            license = %s, socials = %s, chain_id = %s
        WHERE agent_id = %s AND owner = %s
        """
        params = (
            agent_data.get("name"),
            agent_data.get("description"),
            agent_data.get("status", "Not Published"),
            json.dumps(agent_data.get("tags", {})),
            agent_data.get("license"),
            json.dumps(agent_data.get("socials", {})),
            agent_data.get("chain_id", 101),  # Default to chain_id 1 if not specified
            agent_id,
            user_pub_key
        )
        
        await pg_conn.execute_query(update_query, params)
        return True, agent_id, None
    else:
        # Create new agent
        insert_query = """
        INSERT INTO AGENT (
            agent_id, creation_date, owner, status, 
            tags, license, fork, socials, description, name, chain_id
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            agent_id,
            datetime.now(),
            user_pub_key,
            agent_data.get("status", "Not Published"),
            json.dumps(agent_data.get("tags", {})),
            agent_data.get("license"),
            agent_data.get("fork"),
            json.dumps(agent_data.get("socials", {})),
            agent_data.get("description"),
            agent_data.get("name"),
            agent_data.get("chain_id", 101)  # Default to chain_id 1 if not specified
        )
        
        await pg_conn.execute_query(insert_query, params)
        return True, agent_id, None


async def save_agent_workflow(
    agent_id: str, 
    workflow: Dict[str, Any], 
    user_pub_key: str,
    is_published: bool = False
) -> Tuple[bool, Optional[str]]:
    """
    Save agent workflow to either UNPUBLISHED_AGENT or PUBLISHED_AGENT table
    
    Args:
        agent_id: ID of the agent
        workflow: Workflow data
        user_pub_key: Public key of the user (owner)
        is_published: If True, save to PUBLISHED_AGENT, otherwise to UNPUBLISHED_AGENT
        
    Returns:
        Tuple containing (success, error_message)
    """
    pg_conn = PostgresConnection()
    
    # Verify ownership
    query = "SELECT owner FROM AGENT WHERE agent_id = %s"
    result = await pg_conn.execute_query(query, (agent_id,))
    
    if not result:
        return False, "Agent not found"
    
    if result[0]["owner"] != user_pub_key:
        return False, "You don't have permission to update this agent"
    
    # Generate MD5 hash of workflow for integrity checking
    workflow_json = json.dumps(workflow, sort_keys=True)
    md5_hash = hashlib.md5(workflow_json.encode()).hexdigest()
    
    table_name = "PUBLISHED_AGENT" if is_published else "UNPUBLISHED_AGENT"
    
    # Check if workflow already exists
    check_query = f"SELECT agent_id FROM {table_name} WHERE agent_id = %s"
    result = await pg_conn.execute_query(check_query, (agent_id,))
    
    if result:
        # Update existing workflow
        update_query = f"""
        UPDATE {table_name}
        SET workflow = %s, last_edited_time = %s, md5 = %s
        WHERE agent_id = %s
        """
        params = (
            json.dumps(workflow),
            datetime.now(),
            md5_hash,
            agent_id
        )
        
        await pg_conn.execute_query(update_query, params)
    else:
        # Insert new workflow
        insert_query = f"""
        INSERT INTO {table_name} (agent_id, last_edited_time, workflow, md5)
        VALUES (%s, %s, %s, %s)
        """
        params = (
            agent_id,
            datetime.now(),
            json.dumps(workflow),
            md5_hash
        )
        
        await pg_conn.execute_query(insert_query, params)
    
    # If publishing, update agent status
    if is_published:
        update_status_query = """
        UPDATE AGENT
        SET status = 'Active'
        WHERE agent_id = %s
        """
        await pg_conn.execute_query(update_status_query, (agent_id,))
    
    return True, None


async def save_agent_metadata(
    agent_id: str, 
    markdown_object: Dict[str, Any], 
    user_pub_key: str
) -> Tuple[bool, Optional[str]]:
    """
    Save agent metadata (markdown documentation)
    
    Args:
        agent_id: ID of the agent
        markdown_object: Markdown documentation object
        user_pub_key: Public key of the user (owner)
        
    Returns:
        Tuple containing (success, error_message)
    """
    pg_conn = PostgresConnection()
    
    # Verify ownership
    query = "SELECT owner FROM AGENT WHERE agent_id = %s"
    result = await pg_conn.execute_query(query, (agent_id,))
    
    if not result:
        return False, "Agent not found"
    
    if result[0]["owner"] != user_pub_key:
        return False, "You don't have permission to update this agent metadata"
    
    # Check if metadata already exists
    check_query = "SELECT agent_id FROM METADATA WHERE agent_id = %s"
    result = await pg_conn.execute_query(check_query, (agent_id,))
    
    if result:
        # Update existing metadata
        update_query = """
        UPDATE METADATA
        SET markdown_object = %s
        WHERE agent_id = %s
        """
        params = (
            json.dumps(markdown_object),
            agent_id
        )
        
        await pg_conn.execute_query(update_query, params)
    else:
        # Insert new metadata
        insert_query = """
        INSERT INTO METADATA (agent_id, markdown_object)
        VALUES (%s, %s)
        """
        params = (
            agent_id,
            json.dumps(markdown_object)
        )
        
        await pg_conn.execute_query(insert_query, params)
    
    return True, None


async def publish_agent_to_blockchain(
    agent_id: str,
    blockchain_data: Dict[str, Any],
    user_pub_key: str
) -> Tuple[bool, Optional[str]]:
    """
    Publish agent data to blockchain and record details
    
    Args:
        agent_id: ID of the agent
        blockchain_data: Blockchain publication details
        user_pub_key: Public key of the user (owner)
        
    Returns:
        Tuple containing (success, error_message)
    """
    pg_conn = PostgresConnection()
    
    # Verify ownership
    query = "SELECT owner, chain_id FROM AGENT WHERE agent_id = %s"
    result = await pg_conn.execute_query(query, (agent_id,))
    
    if not result:
        return False, "Agent not found"
    
    if result[0]["owner"] != user_pub_key:
        return False, "You don't have permission to publish this agent"
    
    # First, check if the agent has a workflow in the UNPUBLISHED_AGENT table
    unpublished_query = "SELECT workflow, md5 FROM UNPUBLISHED_AGENT WHERE agent_id = %s"
    unpublished_result = await pg_conn.execute_query(unpublished_query, (agent_id,))

    if unpublished_result:
        # Move data from UNPUBLISHED_AGENT to PUBLISHED_AGENT
        workflow = unpublished_result[0]["workflow"]
        md5 = unpublished_result[0]["md5"]
        
        workflow_json = json.dumps(workflow, sort_keys=True)
        
        # Check if entry already exists in PUBLISHED_AGENT
        published_check_query = "SELECT agent_id FROM PUBLISHED_AGENT WHERE agent_id = %s"
        published_result = await pg_conn.execute_query(published_check_query, (agent_id,))
        
        if published_result:
            # Update existing published agent
            published_update_query = """
            UPDATE PUBLISHED_AGENT 
            SET workflow = %s, last_edited_time = %s, md5 = %s
            WHERE agent_id = %s
            """
            # No need to convert workflow to JSON string as it's already coming from the database
            await pg_conn.execute_query(published_update_query, (workflow_json, datetime.now(), md5, agent_id))
        else:
            # Insert new published agent
            published_insert_query = """
            INSERT INTO PUBLISHED_AGENT (agent_id, last_edited_time, workflow, md5)
            VALUES (%s, %s, %s, %s)
            """
            # No need to convert workflow to JSON string as it's already coming from the database
            await pg_conn.execute_query(published_insert_query, (agent_id, datetime.now(), workflow_json, md5))
        
        # Delete from UNPUBLISHED_AGENT
        delete_query = "DELETE FROM UNPUBLISHED_AGENT WHERE agent_id = %s"
        await pg_conn.execute_query(delete_query, (agent_id,))
    else:
        # No unpublished workflow found
        return False, "Cannot publish agent without a workflow. Save a workflow first."
    
    # Get the chain_id from the agent or from the blockchain data
    chain_id = blockchain_data.get("chain_id") or result[0].get("chain_id", 1)
    
    # Ensure the contract exists in CONTRACT_DETAILS
    contract_id = blockchain_data.get("contract_id")
    contract_success, contract_error = await create_or_get_contract_details(
        contract_id,
        chain_id,
        blockchain_data.get("contract_name", "NeuraSynthesis"),
        blockchain_data.get("contract_version", "1.0.0")
    )
    
    if not contract_success:
        return False, contract_error
    
    # Check if blockchain data already exists
    check_query = "SELECT agent_id FROM BLOCKCHAIN_AGENT_DATA WHERE agent_id = %s"
    result = await pg_conn.execute_query(check_query, (agent_id,))
    
    if result:
        # Update existing blockchain data
        update_query = """
        UPDATE BLOCKCHAIN_AGENT_DATA
        SET version = %s, published_date = %s, published_hash = %s, 
            contract_id = %s, nft_id = %s, nft_mint_trx_id = %s
        WHERE agent_id = %s
        """
        params = (
            blockchain_data.get("version"),
            datetime.now() if blockchain_data.get("published_date") is None else blockchain_data.get("published_date"),
            blockchain_data.get("published_hash"),
            contract_id,
            blockchain_data.get("nft_id"),
            blockchain_data.get("nft_mint_trx_id"),
            agent_id
        )
        
        await pg_conn.execute_query(update_query, params)
    else:
        # Insert new blockchain data
        insert_query = """
        INSERT INTO BLOCKCHAIN_AGENT_DATA (
            agent_id, version, published_date, published_hash, 
            contract_id, nft_id, nft_mint_trx_id
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            agent_id,
            blockchain_data.get("version"),
            datetime.now() if blockchain_data.get("published_date") is None else blockchain_data.get("published_date"),
            blockchain_data.get("published_hash"),
            contract_id,
            blockchain_data.get("nft_id"),
            blockchain_data.get("nft_mint_trx_id")
        )
        
        await pg_conn.execute_query(insert_query, params)
    
    # Update agent status to Active
    update_status_query = """
    UPDATE AGENT
    SET status = 'Active'
    WHERE agent_id = %s
    """
    await pg_conn.execute_query(update_status_query, (agent_id,))
    
    return True, None

async def grant_nft_access(
    nft_id: str,
    target_user_id: str,
    access_level: int,
    owner_pub_key: str
) -> Tuple[bool, Optional[str]]:
    """
    Grant access to an NFT to another user
    
    Args:
        nft_id: ID of the NFT
        target_user_id: Public key of the user to grant access to
        access_level: Access level to grant
        owner_pub_key: Public key of the owner granting access
        
    Returns:
        Tuple containing (success, error_message)
    """
    pg_conn = PostgresConnection()
    
    # Verify ownership by checking if the NFT is associated with an agent owned by owner_pub_key
    query = """
    SELECT a.agent_id, a.owner 
    FROM AGENT a
    JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    WHERE ba.nft_id = %s
    """
    result = await pg_conn.execute_query(query, (nft_id,))
    
    if not result:
        return False, "NFT not found"
    
    if result[0]["owner"] != owner_pub_key:
        return False, "You don't have permission to grant access to this NFT"
    
    # Check if the target user exists
    user_query = "SELECT user_pub_key FROM USER_AUTH WHERE user_pub_key = %s"
    user_result = await pg_conn.execute_query(user_query, (target_user_id,))
    
    if not user_result:
        # Create user if it doesn't exist
        insert_user_query = "INSERT INTO USER_AUTH (user_pub_key, username) VALUES (%s, %s)"
        await pg_conn.execute_query(insert_user_query, (target_user_id, f"user_{target_user_id[:8]}"))
    
    # Verify access level exists
    access_query = "SELECT access_level FROM ACCESS_LEVEL_TABLE WHERE access_level = %s"
    access_result = await pg_conn.execute_query(access_query, (access_level,))
    
    if not access_result:
        return False, f"Invalid access level: {access_level}"
    
    # Check if access already exists
    check_query = "SELECT user_id FROM NFT_ACCESS WHERE user_id = %s AND nft_id = %s"
    result = await pg_conn.execute_query(check_query, (target_user_id, nft_id))
    
    if result:
        # Update existing access
        update_query = """
        UPDATE NFT_ACCESS
        SET access_level = %s, timestamp = %s
        WHERE user_id = %s AND nft_id = %s
        """
        params = (
            access_level,
            datetime.now(),
            target_user_id,
            nft_id
        )
        
        await pg_conn.execute_query(update_query, params)
    else:
        # Insert new access
        insert_query = """
        INSERT INTO NFT_ACCESS (user_id, nft_id, access_level, timestamp)
        VALUES (%s, %s, %s, %s)
        """
        params = (
            target_user_id,
            nft_id,
            access_level,
            datetime.now()
        )
        
        await pg_conn.execute_query(insert_query, params)
    
    return True, None


async def revoke_nft_access(
    nft_id: str,
    target_user_id: str,
    owner_pub_key: str
) -> Tuple[bool, Optional[str]]:
    """
    Revoke access to an NFT from a user
    
    Args:
        nft_id: ID of the NFT
        target_user_id: Public key of the user to revoke access from
        owner_pub_key: Public key of the owner revoking access
        
    Returns:
        Tuple containing (success, error_message)
    """
    pg_conn = PostgresConnection()
    
    # Verify ownership
    query = """
    SELECT a.agent_id, a.owner 
    FROM AGENT a
    JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    WHERE ba.nft_id = %s
    """
    result = await pg_conn.execute_query(query, (nft_id,))
    
    if not result:
        return False, "NFT not found"
    
    if result[0]["owner"] != owner_pub_key:
        return False, "You don't have permission to revoke access to this NFT"
    
    # Delete access record
    delete_query = """
    DELETE FROM NFT_ACCESS
    WHERE user_id = %s AND nft_id = %s
    """
    
    await pg_conn.execute_query(delete_query, (target_user_id, nft_id))
    
    return True, None