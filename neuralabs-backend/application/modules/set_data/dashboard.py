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


async def move_workflow_to_published(pg_conn, agent_id, user_pub_key) -> Tuple[bool, Optional[str]]:
    """
    Move workflow from UNPUBLISHED_AGENT to PUBLISHED_AGENT
    
    Args:
        pg_conn: PostgreSQL connection
        agent_id: ID of the agent
        user_pub_key: Public key of the user (owner)
        
    Returns:
        Tuple containing (success, error_message)
    """
    # Check if the agent has a workflow in the UNPUBLISHED_AGENT table
    unpublished_query = "SELECT workflow, md5 FROM UNPUBLISHED_AGENT WHERE agent_id = %s"
    unpublished_result = await pg_conn.execute_query(unpublished_query, (agent_id,))

    if not unpublished_result:
        return False, "Cannot publish agent without a workflow. Save a workflow first."
    
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
        await pg_conn.execute_query(published_update_query, (workflow_json, datetime.now(), md5, agent_id))
    else:
        # Insert new published agent
        published_insert_query = """
        INSERT INTO PUBLISHED_AGENT (agent_id, last_edited_time, workflow, md5)
        VALUES (%s, %s, %s, %s)
        """
        await pg_conn.execute_query(published_insert_query, (agent_id, datetime.now(), workflow_json, md5))
    
    # Delete from UNPUBLISHED_AGENT
    delete_query = "DELETE FROM UNPUBLISHED_AGENT WHERE agent_id = %s"
    await pg_conn.execute_query(delete_query, (agent_id,))
    
    return True, None


async def update_blockchain_data(pg_conn, agent_id, blockchain_data, chain_id) -> Tuple[bool, Optional[str], str]:
    """
    Update or insert blockchain data for an agent
    
    Args:
        pg_conn: PostgreSQL connection
        agent_id: ID of the agent
        blockchain_data: Blockchain publication details
        chain_id: ID of the blockchain
        
    Returns:
        Tuple containing (success, error_message, nft_id)
    """
    # Ensure the contract exists in CONTRACT_DETAILS
    contract_id = blockchain_data.get("contract_id")
    contract_success, contract_error = await create_or_get_contract_details(
        contract_id,
        chain_id,
        blockchain_data.get("contract_name", "NeuraSynthesis"),
        blockchain_data.get("contract_version", "1.0.0")
    )
    
    if not contract_success:
        return False, contract_error, ""
    
    # Get the NFT ID from the blockchain data
    nft_id = blockchain_data.get("nft_id")
    if not nft_id:
        return False, "NFT ID is required for publishing", ""
    
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
            nft_id,
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
            nft_id,
            blockchain_data.get("nft_mint_trx_id")
        )
        
        await pg_conn.execute_query(insert_query, params)
    
    return True, None, nft_id


async def ensure_owner_access(pg_conn, user_pub_key, nft_id) -> Tuple[bool, Optional[str]]:
    """
    Ensure the owner has level 6 access to the NFT
    
    Args:
        pg_conn: PostgreSQL connection
        user_pub_key: Public key of the owner
        nft_id: ID of the NFT
        
    Returns:
        Tuple containing (success, error_message)
    """
    # First check if access level 6 exists, create if not
    access_level_check = "SELECT access_level FROM ACCESS_LEVEL_TABLE WHERE access_level = 6"
    access_level_result = await pg_conn.execute_query(access_level_check)
    
    if not access_level_result:
        # Create access level 6 (owner)
        create_access_level = """
        INSERT INTO ACCESS_LEVEL_TABLE (access_level, access_level_name, descriptions_and_permissions)
        VALUES (6, 'Owner', '{"description": "Full ownership rights", "permissions": ["read", "write", "execute", "transfer", "grant", "revoke"]}')
        """
        await pg_conn.execute_query(create_access_level)
    
    # Check if owner already has access
    access_check = "SELECT user_id FROM NFT_ACCESS WHERE user_id = %s AND nft_id = %s"
    access_result = await pg_conn.execute_query(access_check, (user_pub_key, nft_id))
    
    if access_result:
        # Update existing access to level 6
        update_access = """
        UPDATE NFT_ACCESS
        SET access_level = 6, timestamp = %s
        WHERE user_id = %s AND nft_id = %s
        """
        await pg_conn.execute_query(update_access, (datetime.now(), user_pub_key, nft_id))
    else:
        # Grant new access at level 6
        grant_access = """
        INSERT INTO NFT_ACCESS (user_id, nft_id, access_level, timestamp)
        VALUES (%s, %s, 6, %s)
        """
        await pg_conn.execute_query(grant_access, (user_pub_key, nft_id, datetime.now()))
    
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
    
    # Move workflow from unpublished to published
    workflow_success, workflow_error = await move_workflow_to_published(pg_conn, agent_id, user_pub_key)
    if not workflow_success:
        return False, workflow_error
    
    # Get the chain_id from the agent or from the blockchain data
    chain_id = blockchain_data.get("chain_id") or result[0].get("chain_id", 1)
    
    # Update blockchain data
    blockchain_success, blockchain_error, nft_id = await update_blockchain_data(pg_conn, agent_id, blockchain_data, chain_id)
    if not blockchain_success:
        return False, blockchain_error
    
    # Update agent status to Active
    update_status_query = """
    UPDATE AGENT
    SET status = 'Active'
    WHERE agent_id = %s
    """
    await pg_conn.execute_query(update_status_query, (agent_id,))
    
    # Ensure owner has level 6 access to the NFT
    access_success, access_error = await ensure_owner_access(pg_conn, user_pub_key, nft_id)
    if not access_success:
        return False, access_error
    
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
    
    # Verify that the user has owner access level (level 6) for this NFT
    owner_query = """
    SELECT na.access_level, a.owner
    FROM NFT_ACCESS na
    JOIN BLOCKCHAIN_AGENT_DATA ba ON na.nft_id = ba.nft_id
    JOIN AGENT a ON ba.agent_id = a.agent_id
    WHERE na.nft_id = %s AND na.user_id = %s
    """
    owner_result = await pg_conn.execute_query(owner_query, (nft_id, owner_pub_key))
    
    # Check if the user is the actual owner or has access level 6
    is_owner = False
    if owner_result:
        is_owner = owner_result[0]["access_level"] == 6
    else:
        # If no explicit access level, check if they're the agent owner
        agent_query = """
        SELECT a.owner
        FROM AGENT a
        JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
        WHERE ba.nft_id = %s
        """
        agent_result = await pg_conn.execute_query(agent_query, (nft_id,))
        
        if agent_result and agent_result[0]["owner"] == owner_pub_key:
            is_owner = True
    
    if not is_owner:
        return False, "You must have owner access (level 6) to grant access to this NFT"
    
    # Check if the target user exists
    user_query = "SELECT user_pub_key FROM USER_AUTH WHERE user_pub_key = %s"
    user_result = await pg_conn.execute_query(user_query, (target_user_id,))
    
    if not user_result:
        # Create user if it doesn't exist
        insert_user_query = "INSERT INTO USER_AUTH (user_pub_key, username) VALUES (%s, %s)"
        await pg_conn.execute_query(insert_user_query, (target_user_id, f"user_{target_user_id[:8]}"))
    
    # Verify access level exists and is not higher than the owner's level
    access_query = "SELECT access_level FROM ACCESS_LEVEL_TABLE WHERE access_level = %s"
    access_result = await pg_conn.execute_query(access_query, (access_level,))
    
    if not access_result:
        return False, f"Invalid access level: {access_level}"
    
    # Owner can't give higher access than their own level (6)
    if access_level > 6:
        return False, f"Cannot grant access level higher than owner level (6)"
    
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
    
    # Verify that the user has owner access level (level 6) for this NFT
    owner_query = """
    SELECT na.access_level
    FROM NFT_ACCESS na
    WHERE na.nft_id = %s AND na.user_id = %s
    """
    owner_result = await pg_conn.execute_query(owner_query, (nft_id, owner_pub_key))
    
    if not owner_result or owner_result[0]["access_level"] != 6:
        # If no access level 6, check if they're the agent owner as a fallback
        agent_query = """
        SELECT a.owner 
        FROM AGENT a
        JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
        WHERE ba.nft_id = %s
        """
        agent_result = await pg_conn.execute_query(agent_query, (nft_id,))
        
        if not agent_result or agent_result[0]["owner"] != owner_pub_key:
            return False, "You must have owner access (level 6) to revoke access to this NFT"
    
    # Prevent revocation of owner's own access
    if target_user_id == owner_pub_key:
        return False, "Cannot revoke owner's access to their own NFT"
    
    # Check if target user has level 6 access
    target_query = """
    SELECT access_level
    FROM NFT_ACCESS
    WHERE nft_id = %s AND user_id = %s
    """
    target_result = await pg_conn.execute_query(target_query, (nft_id, target_user_id))
    
    if target_result and target_result[0]["access_level"] == 6:
        # Check if this is the original creator
        agent_query = """
        SELECT a.owner 
        FROM AGENT a
        JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
        WHERE ba.nft_id = %s
        """
        agent_result = await pg_conn.execute_query(agent_query, (nft_id,))
        
        if agent_result and agent_result[0]["owner"] == target_user_id:
            return False, "Cannot revoke access from the original creator of the NFT"
    # check if the target user has access
    check_query = "SELECT user_id FROM NFT_ACCESS WHERE user_id = %s AND nft_id = %s"
    # if not then write "user does not have access"
    result = await pg_conn.execute_query(check_query, (target_user_id, nft_id))
    if not result:
        return False, "User does not have access to this NFT"
    
    # Delete access record
    delete_query = """
    DELETE FROM NFT_ACCESS
    WHERE user_id = %s AND nft_id = %s
    """
    
    await pg_conn.execute_query(delete_query, (target_user_id, nft_id))
    
    return True, None