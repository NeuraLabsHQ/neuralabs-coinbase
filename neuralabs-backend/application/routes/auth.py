"""
Authentication routes for user login, logout, and token management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import timedelta
import secrets
from ..modules.authentication.jwt.token import JWTHandler
from ..modules.authentication.jwt.redis_storage import RedisJWTStorage
from ..modules.authentication import get_current_user, security
from ..modules.database.postgresconn import PostgresConnection
from ..modules.zk_login.zk_login import get_or_create_salt
from ..modules.signature_verification.signature_verification import verify_sui_signature

# Create router
router = APIRouter()

# Initialize JWT handler and Redis storage
jwt_handler = JWTHandler()
redis_jwt_storage = RedisJWTStorage()


# Define request and response models
class LoginRequest(BaseModel):
    public_key: str = Field(..., description="User's public key")
    signature: Optional[str] = Field(None, description="Signature to verify (optional for now)")
    message: Optional[str] = Field(None, description="Message that was signed (optional for now)")
class ZKLoginRequest(BaseModel):
    email: str = Field(..., description="User's email address")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str

class Zk_LoginResponse(BaseModel):
    salt: str


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(login_data: LoginRequest):
    """
    Login endpoint that verifies user credentials and returns a JWT token

    Args:
        login_data: Public key, signature, and message data

    Returns:
        JWT token response if login successful

    Raises:
        HTTPException: If signature verification fails or database operations fail
    """
    # Verify the Sui wallet signature
    try:
        verify_sui_signature(login_data.public_key, login_data.signature, login_data.message)
    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions from signature verification
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during signature verification: {str(e)}"
        )

    # Check if user exists in the database
    pg_conn = PostgresConnection()
    query = "SELECT user_pub_key, username FROM USER_AUTH WHERE user_pub_key = %s"
    result = await pg_conn.execute_query(query, (login_data.public_key,))

    if not result:
        # If user doesn't exist, create a new one with default username
        username = f"user_{secrets.token_hex(4)}"
        insert_query = "INSERT INTO USER_AUTH (user_pub_key, username) VALUES (%s, %s)"
        await pg_conn.execute_query(insert_query, (login_data.public_key, username))
        user_data = {"user_pub_key": login_data.public_key, "username": username}
    else:
        user_data = result[0]

    # Create token with user's public key as the subject
    token_data = {
        "sub": user_data["user_pub_key"],
        "username": user_data.get("username", "unknown")
    }

    # Set token expiration (from config)
    expires_delta = timedelta(minutes=jwt_handler.access_token_expire_minutes)

    # Generate the JWT token
    access_token = jwt_handler.create_access_token(token_data, expires_delta)

    # Decode the token to get the session_id
    payload = jwt_handler.verify_token(access_token)
    session_id = payload.get("session_id", "")

    # Store token in Redis
    redis_jwt_storage.store_token(access_token, user_data["user_pub_key"], session_id)

    # Return the token
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": jwt_handler.access_token_expire_minutes * 60,  # in seconds
        "user_id": user_data["user_pub_key"]
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Logout endpoint that invalidates the current JWT token
    
    Args:
        credentials: JWT token from Authorization header
        response: FastAPI response object
        
    Returns:
        Success message
    """
    token = credentials.credentials
    
    # Invalidate token in Redis
    success = redis_jwt_storage.invalidate_token(token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error logging out"
        )
    
    return {"detail": "Successfully logged out"}


@router.post("/logout-all", status_code=status.HTTP_200_OK)
async def logout_all_sessions(
    current_user: str = Depends(get_current_user)
):
    """
    Logout from all sessions for the current user
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    # Invalidate all tokens for the user in Redis
    success = redis_jwt_storage.invalidate_all_user_tokens(current_user)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error logging out from all sessions"
        )
    
    return {"detail": "Successfully logged out from all sessions"}


@router.get("/validate-token", status_code=status.HTTP_200_OK)
async def validate_token(
    current_user: str = Depends(get_current_user)
):
    """
    Validate the current token
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User information if token is valid
    """
    # Get user information from database
    pg_conn = PostgresConnection()
    query = "SELECT user_pub_key, username, email FROM USER_AUTH WHERE user_pub_key = %s"
    result = await pg_conn.execute_query(query, (current_user,))
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_data = result[0]
    
    return {
        "user_id": user_data["user_pub_key"],
        "username": user_data.get("username", "unknown"),
        "email": user_data.get("email"),
        "is_valid": True
    }