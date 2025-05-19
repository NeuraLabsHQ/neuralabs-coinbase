
"""
Authentication module for user authentication and authorization
"""
from fastapi import Depends, HTTPException, status, Header
from typing import Optional

async def get_current_user(x_public_key: Optional[str] = Header(None)):
    """
    Get the current user from the x-public-key header
    
    Args:
        x_public_key: User's public key from request header
        
    Returns:
        User's public key if valid
        
    Raises:
        HTTPException: If the public key is missing or invalid
    """
    if not x_public_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Public key not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # In a real implementation, you would validate the public key
    # and possibly verify a signature or JWT
    # For now, we'll just return the provided public key
    
    return x_public_key

async def verify_access_permission(user_pub_key: str, agent_id: str, required_level: int = None) -> bool:
    """
    Verify if a user has access to a specific agent/flow
    
    Args:
        user_pub_key: Public key of the user
        agent_id: ID of the agent/flow
        required_level: Minimum access level required (optional)
        
    Returns:
        True if the user has access, False otherwise
    """
    from ...modules.database.postgresconn import PostgresConnection
    
    pg_conn = PostgresConnection()
    query = """
    SELECT al.access_level
    FROM AGENT a
    LEFT JOIN NFT_ACCESS na ON a.agent_id = na.nft_id AND na.user_id = %s
    LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    WHERE a.agent_id = %s AND (a.owner = %s OR na.user_id = %s)
    """
    result = await pg_conn.execute_query(query, (user_pub_key, agent_id, user_pub_key, user_pub_key))
    
    if not result:
        return False
    
    if required_level is not None:
        return result[0]["access_level"] >= required_level
    
    return True