# backend_2/application/routes/zk_login.py

"""
Authentication routes for zkLogin authentication and token management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import timedelta
import secrets
import base64
from ..modules.authentication.jwt.token import JWTHandler
from ..modules.authentication.jwt.redis_storage import RedisJWTStorage
from ..modules.authentication import get_current_user, security
from ..modules.database.postgresconn import PostgresConnection
from ..modules.zk_login.zk_login import get_or_create_salt , verify_zklogin_signature_graphql, get_or_create_zklogin_user

# Create router
router = APIRouter()

# Initialize JWT handler and Redis storage
jwt_handler = JWTHandler()
redis_jwt_storage = RedisJWTStorage()

class ZKLoginRequest(BaseModel):
    email: str = Field(..., description="User's email address")
    
class Zk_LoginResponse(BaseModel):
    salt: str

class ZkLoginSignatureRequest(BaseModel):
    bytes: str = Field(..., description="Base64-encoded authentication message bytes")
    signature: str = Field(..., description="Base64-encoded zkLogin signature")
    author: str = Field(..., description="zkLogin Sui address")
    intent_scope: int = Field(0, description="Intent scope (0 for personal message, 3 for transaction)")
    email: Optional[str] = Field(None, description="User's email for account linking")

class ZkLoginSignatureResponse(BaseModel):
    success: bool
    errors: Optional[list] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    user_id: Optional[str] = None

class ZkLoginTransactionVerifyRequest(BaseModel):
    bytes: str = Field(..., description="Base64-encoded transaction bytes")
    signature: str = Field(..., description="Base64-encoded zkLogin signature")
    author: str = Field(..., description="zkLogin Sui address")
    intent_scope: int = Field(3, description="Intent scope (3 for transaction)")

class ZkLoginMessageVerifyRequest(BaseModel):
    message: str = Field(..., description="Original message that was signed")
    signature: str = Field(..., description="Base64-encoded zkLogin signature")
    author: str = Field(..., description="zkLogin Sui address")
    email: Optional[str] = Field(None, description="User's email for account linking")

    
@router.post("/zklogin-salt", response_model=Zk_LoginResponse, status_code=status.HTTP_200_OK)
async def zk_login_salt(
    zk_login: ZKLoginRequest,
    request: Request
):
    """
    Get or create salt for zkLogin authentication
    
    Args:
        zk_login: ZK login request with email
        request: FastAPI request object
        
    Returns:
        Response with salt for the email
    """
    email = zk_login.email
    
    success, result = await get_or_create_salt(email)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving salt: {result}"
        )
    
    return {"salt": result}


@router.post("/zklogin-verify", response_model=ZkLoginSignatureResponse)
async def verify_zklogin_signature_and_authenticate(
    request: ZkLoginSignatureRequest
) -> ZkLoginSignatureResponse:
    """
    *** MAIN AUTHENTICATION ENDPOINT ***
    Verify zkLogin signature for authentication message and return JWT token
    
    This is used for LOGIN authentication, not transaction verification
    
    Args:
        request: zkLogin signature verification request with authentication message
        
    Returns:
        Verification result with JWT token for successful authentication
    """
    print("Received zkLogin signature verification request")
    print("Request data:", request)
    try:
        # Verify the zkLogin signature using GraphQL
        verification_result = await verify_zklogin_signature_graphql(
            bytes_b64=request.bytes,
            signature_b64=request.signature,
            author=request.author,
            intent_scope=request.intent_scope,  # Should be 0 for personal message
            network="devnet"  # Use appropriate network
        )
        
        print("Verification result:", verification_result)
        
        if not verification_result.get("success", False):
            return ZkLoginSignatureResponse(
                success=False,
                errors=verification_result.get("errors", ["Signature verification failed"])
            )
        
        # Signature is valid - now create user and JWT token
        if not request.email:
            # For authentication, email is required
            return ZkLoginSignatureResponse(
                success=False,
                errors=["Email is required for authentication"]
            )
        print("Signature verified successfully")
        # Get or create user in our database
        user_data = await get_or_create_zklogin_user(request.email, request.author)
        
        # Create JWT token with zkLogin-specific data
        token_data = {
            "sub": user_data["user_pub_key"],  # zkLogin address as subject
            "username": user_data["username"],
            "email": user_data["email"],
            "auth_method": "zklogin",
            "zklogin_address": request.author
        }
        
        # Generate the JWT token
        access_token = jwt_handler.create_access_token(token_data)
        
        print("Generated access token:", access_token)
        
        # Decode the token to get the session_id
        payload = jwt_handler.verify_token(access_token)
        session_id = payload.get("session_id", "")
        
        # Store token in Redis for session management
        success = redis_jwt_storage.store_token(access_token, user_data["user_pub_key"], session_id)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to store authentication session"
            )
        
        return ZkLoginSignatureResponse(
            success=True,
            access_token=access_token,
            expires_in=jwt_handler.access_token_expire_minutes * 60,
            user_id=user_data["user_pub_key"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Authentication error: {str(e)}"
        )


@router.post("/zklogin-verify-transaction")
async def verify_zklogin_transaction_signature(
    request: ZkLoginTransactionVerifyRequest
):
    """
    Verify zkLogin signature for TRANSACTIONS (not for authentication)
    
    This endpoint is for verifying transaction signatures, not for getting JWT tokens
    
    Args:
        request: ZkLogin transaction verification request
        
    Returns:
        Verification result (no JWT token)
    """
    
    try:
        # Verify the zkLogin signature using GraphQL
        verification_result = await verify_zklogin_signature_graphql(
            bytes_b64=request.bytes,
            signature_b64=request.signature,
            author=request.author,
            intent_scope=request.intent_scope,  # Should be 3 for transaction
            network="devnet"
        )
        
        return {
            "success": verification_result.get("success", False),
            "errors": verification_result.get("errors", []),
            "message": "Transaction signature verified" if verification_result.get("success") else "Transaction signature verification failed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transaction verification error: {str(e)}"
        )


@router.post("/zklogin-verify-message")
async def verify_zklogin_message_signature(
    request: ZkLoginMessageVerifyRequest
):
    """
    Verify zkLogin signature for MESSAGES (not for authentication)
    
    This endpoint is for verifying arbitrary message signatures, not for getting JWT tokens
    
    Args:
        request: ZkLogin message verification request
        
    Returns:
        Verification result (no JWT token)
    """
    
    try:
        # Convert message to base64
        message_bytes = request.message.encode('utf-8')
        message_b64 = base64.b64encode(message_bytes).decode('utf-8')
        
        # Verify the signature (using intent scope 0 for personal message)
        verification_result = await verify_zklogin_signature_graphql(
            bytes_b64=message_b64,
            signature_b64=request.signature,
            author=request.author,
            intent_scope=0,  # 0 for personal message
            network="devnet"
        )
        
        if not verification_result.get("success", False):
            return {
                "success": False,
                "errors": verification_result.get("errors", ["Message signature verification failed"])
            }
        
        # If signature is valid and email is provided, you can create/update user
        # But this doesn't return a JWT token - it's just for verification
        if request.email:
            user_data = await get_or_create_zklogin_user(request.email, request.author)
            return {
                "success": True,
                "user_id": user_data["user_pub_key"],
                "message": "Message signature verified successfully"
            }
        
        return {
            "success": True,
            "message": "Message signature verified successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Message verification error: {str(e)}"
        )


@router.post("/zklogin-logout", status_code=status.HTTP_200_OK)
async def zklogin_logout(
    current_user: str = Depends(get_current_user)
):
    """
    Logout zkLogin user and invalidate JWT token
    
    Args:
        current_user: Current authenticated user from JWT token
        
    Returns:
        Success message
    """
    try:
        # Invalidate all tokens for the user in Redis
        success = redis_jwt_storage.invalidate_all_user_tokens(current_user)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error logging out from zkLogin"
            )
        
        return {"detail": "Successfully logged out from zkLogin"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Logout error: {str(e)}"
        )


@router.get("/zklogin-validate", status_code=status.HTTP_200_OK)
async def validate_zklogin_token(
    current_user: str = Depends(get_current_user)
):
    """
    Validate the current zkLogin JWT token
    
    Args:
        current_user: Current authenticated user from JWT token
        
    Returns:
        User information if token is valid
    """
    try:
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
            "auth_method": "zklogin",
            "is_valid": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Token validation error: {str(e)}"
        )