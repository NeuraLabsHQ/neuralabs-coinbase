"""
Authentication module for user authentication and authorization
"""
from fastapi import Depends, HTTPException, status, Header, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from .jwt.token import JWTHandler
from .jwt.redis_storage import RedisJWTStorage
from ...modules.database.postgresconn import PostgresConnection
# Create security scheme for JWT authentication
security = HTTPBearer()

# Initialize JWT handler and Redis storage
jwt_handler = JWTHandler()
redis_jwt_storage = RedisJWTStorage()


async def get_current_user_from_header(x_public_key: Optional[str] = Header(None)):
    """
    Get the current user from the x-public-key header (legacy method)
    
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


# async def get_current_user(
#     request: Request,
#     credentials: HTTPAuthorizationCredentials = Security(security)
# ) -> str:
#     """
#     Get the current user from JWT token in Authorization header
    
#     Args:
#         credentials: JWT token from Authorization header
#         request: FastAPI request object
        
#     Returns:
#         User's public key from the token
        
#     Raises:
#         HTTPException: If the token is invalid
#     """
#     token = credentials.credentials
    
#     # First, check if token exists in Redis (high speed check)
#     token_data = redis_jwt_storage.validate_token(token)
#     if not token_data:
#         # If not in Redis, try to decode and validate the token
#         payload = jwt_handler.verify_token(token)
#         if not payload:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid or expired token",
#                 headers={"WWW-Authenticate": "Bearer"},
#             )
        
#         # If token is valid but not in Redis (e.g., after server restart),
#         # restore it in Redis
#         user_id = payload.get("sub")
#         session_id = payload.get("session_id")
#         if user_id and session_id:
#             redis_jwt_storage.store_token(token, user_id, session_id)
#             return user_id
#         else:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid token payload",
#                 headers={"WWW-Authenticate": "Bearer"},
#             )
    
#     # If token exists in Redis, return the user_id
#     return token_data.get("user_id")
async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> str:
    """
    Get the current user from JWT token in Authorization header
    
    Args:
        credentials: JWT token from Authorization header
        request: FastAPI request object
        
    Returns:
        User's public key from the token
        
    Raises:
        HTTPException: If the token is invalid
    """
    token = credentials.credentials
    
    # First, check if token exists in Redis (high speed check)
    token_data = redis_jwt_storage.validate_token(token)
    if not token_data:
        # If token is not in Redis, it's considered invalid
        # This prevents users from using tokens after logout
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # If token exists in Redis, return the user_id
    return token_data.get("user_id")

# Optional: Flexible authentication that tries JWT first, then falls back to header
async def get_current_user_flexible(
    request: Request,
    x_public_key: Optional[str] = Header(None)
) -> str:
    """
    Get the current user from either JWT or header (for backward compatibility)
    
    Args:
        request: FastAPI request object
        x_public_key: User's public key from request header (optional)
        
    Returns:
        User's public key
        
    Raises:
        HTTPException: If neither authentication method is valid
    """
    # Try JWT authentication first
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            # Create mock credentials
            from fastapi.security.http import HTTPAuthorizationCredentials
            credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
            return await get_current_user(request, credentials)
        except HTTPException:
            # If JWT fails, fall back to header authentication
            pass
    
    # Fall back to x-public-key header authentication
    return await get_current_user_from_header(x_public_key)


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

    
    pg_conn = PostgresConnection()
    query = """
    SELECT al.access_level
    FROM AGENT a
    LEFT JOIN blockchain_agent_data bad ON a.agent_id = bad.agent_id
    LEFT JOIN NFT_ACCESS na ON bad.nft_id = na.nft_id AND na.user_id = %s
    LEFT JOIN ACCESS_LEVEL_TABLE al ON na.access_level = al.access_level
    WHERE a.agent_id = %s AND (a.owner = %s OR na.user_id = %s)
    """
    result = await pg_conn.execute_query(query, (user_pub_key, agent_id, user_pub_key, user_pub_key))
    
    if not result:
        return False
    
    if required_level is not None:
        return result[0]["access_level"] >= required_level
    
    return True