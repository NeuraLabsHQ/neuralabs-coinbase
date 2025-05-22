"""
Authentication routes for user login, logout, and token management
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
    bytes: str = Field(..., description="Base64-encoded transaction/message bytes")
    signature: str = Field(..., description="Base64-encoded zkLogin signature")
    author: str = Field(..., description="zkLogin Sui address")
    intent_scope: int = Field(3, description="Intent scope (3 for transaction)")
    email: Optional[str] = Field(None, description="User's email for account linking")


class ZkLoginSignatureResponse(BaseModel):
    success: bool
    errors: Optional[list] = None
    access_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    user_id: Optional[str] = None

class ZkLoginMessageVerifyRequest(BaseModel):
    message: str = Field(..., description="Original message that was signed")
    signature: str = Field(..., description="Base64-encoded zkLogin signature")
    author: str = Field(..., description="zkLogin Sui address")
    email: Optional[str] = Field(None, description="User's email for account linking")
    
@router.post("/zklogin-salt", response_model=Zk_LoginResponse, status_code=status.HTTP_200_OK)
async def zk_login(
    zk_login: ZKLoginRequest,
    request: Request
):
    """
    ZK login endpoint that verifies user credentials and returns a JWT token
    
    Args:
        zk_login: ZK login request with email
        request: FastAPI request object
        
    Returns:
        Response with salt and email
    """
    # Get email from request
    email = zk_login.email
    
    # Get or create salt for the email
    success, result = await get_or_create_salt(email)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving salt: {result}"
        )
    
    # Return the salt and email
    return {
        "salt": result  # Now correctly using the salt value from the tuple
    
    }
    

@router.post("/zklogin-verify", response_model=ZkLoginSignatureResponse)
async def verify_zklogin_signature(
    request: ZkLoginSignatureRequest
) -> ZkLoginSignatureResponse:
    """
    Verify zkLogin signature and return JWT token if valid
    
    Args:
        request: zkLogin signature verification request
        
    Returns:
        Verification result with optional JWT token
    """
    
    try:
        # Verify the zkLogin signature using GraphQL
        verification_result = await verify_zklogin_signature_graphql(
            bytes_b64=request.bytes,
            signature_b64=request.signature,
            author=request.author,
            intent_scope=request.intent_scope
        )
        
        if not verification_result.get("success", False):
            return ZkLoginSignatureResponse(
                success=False,
                errors=verification_result.get("errors", ["Signature verification failed"])
            )
        
        # If signature is valid and email is provided, create/update user and return JWT
        if request.email:
            user_data = await get_or_create_zklogin_user(request.email, request.author)
            
            # Create JWT token
            token_data = {
                "sub": user_data["user_pub_key"],
                "username": user_data["username"],
                "email": user_data["email"],
                "auth_method": "zklogin"
            }
            
            # Generate the JWT token
            access_token = jwt_handler.create_access_token(token_data)
            
            # Decode the token to get the session_id
            payload = jwt_handler.verify_token(access_token)
            session_id = payload.get("session_id", "")
            
            # Store token in Redis
            redis_jwt_storage.store_token(access_token, user_data["user_pub_key"], session_id)
            
            return ZkLoginSignatureResponse(
                success=True,
                access_token=access_token,
                expires_in=jwt_handler.access_token_expire_minutes * 60,
                user_id=user_data["user_pub_key"]
            )
        
        # If no email provided, just return verification success
        return ZkLoginSignatureResponse(success=True)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/zklogin-message-verify")
async def verify_zklogin_message_signature(
    request: ZkLoginMessageVerifyRequest
):
    """
    Verify zkLogin signature for a message (not transaction)
    
    Args:
        request: ZkLogin message verification request
        
    Returns:
        Verification result
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
            intent_scope=0  # 0 for personal message
        )
        
        if not verification_result.get("success", False):
            return {
                "success": False,
                "errors": verification_result.get("errors", ["Message signature verification failed"])
            }
        
        # If signature is valid and email is provided, create/update user
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
            detail=f"Internal server error: {str(e)}"
        )