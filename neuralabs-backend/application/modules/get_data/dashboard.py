"""
Dashboard data retrieval functions
"""
from typing import List, Dict, Any, Optional
from ...modules.database.postgresconn import PostgresConnection


async def get_user_created_flows(user_pub_key: str) -> List[Dict[str, Any]]:
    """
    Get flows created by the user (My Flows)
    
    Args:
        user_pub_key: Public key of the user
        
    Returns:
        List of flows created by the user
    """
    pg_conn = PostgresConnection()
    query = """
        SELECT a.agent_id, a.name, a.description, a.status, a.creation_date, 
            COALESCE(pa.last_edited_time, ua.last_edited_time) as last_edited_time,
            al.access_level, al.access_level_name
        FROM AGENT a
        LEFT JOIN PUBLISHED_AGENT pa ON a.agent_id = pa.agent_id
        LEFT JOIN UNPUBLISHED_AGENT ua ON a.agent_id = ua.agent_id
        LEFT JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
        LEFT JOIN NFT_ACCESS na ON ba.nft_id = na.nft_id AND na.user_id = %s
        LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
        WHERE a.owner = %s
        ORDER BY COALESCE(pa.last_edited_time, ua.last_edited_time) DESC
    """
    result = await pg_conn.execute_query(query, (user_pub_key, user_pub_key))
    return result


async def get_user_accessed_flows(user_pub_key: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Get flows the user has access to but didn't create (Other Flows)
    Grouped by access level
    
    Args:
        user_pub_key: Public key of the user
        
    Returns:
        Dictionary of flows grouped by access level
    """
    pg_conn = PostgresConnection()
    query = """
    SELECT a.agent_id, a.name, a.description, a.status, a.creation_date, 
           COALESCE(pa.last_edited_time, ua.last_edited_time) as last_edited_time,
           al.access_level, al.access_level_name
    FROM AGENT a
    LEFT JOIN PUBLISHED_AGENT pa ON a.agent_id = pa.agent_id
    LEFT JOIN UNPUBLISHED_AGENT ua ON a.agent_id = ua.agent_id
    LEFT JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    JOIN NFT_ACCESS na ON ba.nft_id = na.nft_id
    JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    WHERE na.user_id = %s AND a.owner != %s
    ORDER BY al.access_level DESC, COALESCE(pa.last_edited_time, ua.last_edited_time) DESC
    """
    result = await pg_conn.execute_query(query, (user_pub_key, user_pub_key))
    
    # Group flows by access level
    flows_by_level = {}
    for flow in result:
        level = flow["access_level"]
        if level not in flows_by_level:
            flows_by_level[level] = []
        flows_by_level[level].append(flow)
    
    return flows_by_level


async def get_recently_opened_flows(user_pub_key: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recently accessed flows for the dashboard's "Recently opened" section
    
    Args:
        user_pub_key: Public key of the user
        limit: Number of flows to return
        
    Returns:
        List of recently accessed flows
    """
    pg_conn = PostgresConnection()
    query = """
    SELECT a.agent_id, a.name, a.description, a.status, a.creation_date, 
           COALESCE(pa.last_edited_time, ua.last_edited_time) as last_edited_time,
           al.access_level, al.access_level_name
    FROM AGENT a
    LEFT JOIN PUBLISHED_AGENT pa ON a.agent_id = pa.agent_id
    LEFT JOIN UNPUBLISHED_AGENT ua ON a.agent_id = ua.agent_id
    LEFT JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    LEFT JOIN NFT_ACCESS na ON ba.nft_id = na.nft_id AND na.user_id = %s
    LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    WHERE (a.owner = %s OR na.user_id = %s)
    ORDER BY COALESCE(pa.last_edited_time, ua.last_edited_time) DESC
    LIMIT %s
    """
    result = await pg_conn.execute_query(query, (user_pub_key, user_pub_key, user_pub_key, limit))
    return result


async def get_under_development_flows(user_pub_key: str) -> List[Dict[str, Any]]:
    """
    Get flows under development (from UNPUBLISHED_AGENT table)
    
    Args:
        user_pub_key: Public key of the user
        
    Returns:
        List of unpublished flows
    """
    pg_conn = PostgresConnection()
    query = """
    SELECT a.agent_id, a.name, a.description, a.status, a.creation_date, 
           ua.last_edited_time, al.access_level, al.access_level_name
    FROM AGENT a
    JOIN UNPUBLISHED_AGENT ua ON a.agent_id = ua.agent_id
    LEFT JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    LEFT JOIN NFT_ACCESS na ON ba.nft_id = na.nft_id AND na.user_id = %s
    LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    WHERE (a.owner = %s OR na.user_id = %s) AND a.status = 'Not Published'
    ORDER BY ua.last_edited_time DESC
    """
    result = await pg_conn.execute_query(query, (user_pub_key, user_pub_key, user_pub_key))
    return result


async def get_published_flows(user_pub_key: str) -> List[Dict[str, Any]]:
    """
    Get published flows (from PUBLISHED_AGENT table)
    
    Args:
        user_pub_key: Public key of the user
        
    Returns:
        List of published flows
    """
    pg_conn = PostgresConnection()
    query = """
    SELECT a.agent_id, a.name, a.description, a.status, a.creation_date, 
           pa.last_edited_time, al.access_level, al.access_level_name
    FROM AGENT a
    JOIN PUBLISHED_AGENT pa ON a.agent_id = pa.agent_id
    LEFT JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    LEFT JOIN NFT_ACCESS na ON ba.nft_id = na.nft_id AND na.user_id = %s
    LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    WHERE (a.owner = %s OR na.user_id = %s) AND a.status = 'Active'
    ORDER BY pa.last_edited_time DESC
    """
    result = await pg_conn.execute_query(query, (user_pub_key, user_pub_key, user_pub_key))
    return result


async def get_shared_flows(user_pub_key: str) -> List[Dict[str, Any]]:
    """
    Get shared flows (flows that have more than one user with access)
    
    Args:
        user_pub_key: Public key of the user
        
    Returns:
        List of shared flows
    """
    pg_conn = PostgresConnection()
    query = """
    SELECT a.agent_id, a.name, a.description, a.status, a.creation_date, 
           COALESCE(pa.last_edited_time, ua.last_edited_time) as last_edited_time,
           al.access_level, al.access_level_name
    FROM AGENT a
    LEFT JOIN PUBLISHED_AGENT pa ON a.agent_id = pa.agent_id
    LEFT JOIN UNPUBLISHED_AGENT ua ON a.agent_id = ua.agent_id
    LEFT JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    JOIN NFT_ACCESS na ON ba.nft_id = na.nft_id
    LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    WHERE (a.owner = %s OR na.user_id = %s)
    AND ba.nft_id IN (
        SELECT nft_id 
        FROM NFT_ACCESS 
        GROUP BY nft_id 
        HAVING COUNT(*) > 1
    )
    ORDER BY COALESCE(pa.last_edited_time, ua.last_edited_time) DESC
    """
    result = await pg_conn.execute_query(query, (user_pub_key, user_pub_key))
    return result


async def get_flow_details(agent_id: str, user_pub_key: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed information about a specific flow/NFT
    
    Args:
        agent_id: ID of the agent/flow
        user_pub_key: Public key of the user requesting details
        
    Returns:
        Details of the flow if the user has access, None otherwise
    """
    pg_conn = PostgresConnection()
    query = """
    SELECT a.agent_id, a.name, a.description, a.status, a.creation_date, 
           a.owner, a.tags, a.license, a.fork, a.socials,
           COALESCE(pa.last_edited_time, ua.last_edited_time) as last_edited_time,
           COALESCE(pa.workflow, ua.workflow) as workflow,
           ba.version, ba.published_date, ba.published_hash, ba.contract_id, ba.nft_id,
           c.chain, c.chain_status, c.chain_explorer,
           al.access_level, al.access_level_name, al.descriptions_and_permissions,
           m.markdown_object
    FROM AGENT a
    LEFT JOIN PUBLISHED_AGENT pa ON a.agent_id = pa.agent_id
    LEFT JOIN UNPUBLISHED_AGENT ua ON a.agent_id = ua.agent_id
    LEFT JOIN BLOCKCHAIN_AGENT_DATA ba ON a.agent_id = ba.agent_id
    LEFT JOIN CHAIN_DETAILS c ON a.chain_id = c.chain_id
    LEFT JOIN NFT_ACCESS na ON ba.nft_id = na.nft_id AND na.user_id = %s
    LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    LEFT JOIN METADATA m ON a.agent_id = m.agent_id
    WHERE a.agent_id = %s AND (a.owner = %s OR na.user_id = %s)
    """
    result = await pg_conn.execute_query(query, (user_pub_key, agent_id, user_pub_key, user_pub_key))
    
    print(result)
    
    if result:
        return result[0]
    return None