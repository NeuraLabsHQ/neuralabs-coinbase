"""
Neuralock Temp Routes - Agent wallet management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging
import asyncio
from ..modules.authentication import get_current_user
from ..modules.neuralock_temp import CDPWalletManager, NeuralockTempDB

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize managers
wallet_manager = CDPWalletManager()
db_manager = NeuralockTempDB()

# Request/Response models
class AgentWalletResponse(BaseModel):
    agent_public_key: str = Field(..., description="Agent wallet public key (address)")
    created: bool = Field(..., description="Whether a new wallet was created")
    
class AgentWalletError(BaseModel):
    detail: str = Field(..., description="Error message")

@router.post("/agent-wallet", 
            response_model=AgentWalletResponse,
            responses={
                400: {"model": AgentWalletError, "description": "Bad request"},
                401: {"model": AgentWalletError, "description": "Unauthorized"},
                500: {"model": AgentWalletError, "description": "Internal server error"}
            })
async def get_or_create_agent_wallet(
    current_user: str = Depends(get_current_user)
):
    """
    Get existing agent wallet or create a new one for the authenticated user
    
    This endpoint will:
    1. Check if the user already has an agent wallet
    2. If yes, return the public key
    3. If no, create a new CDP wallet and store the keys
    
    Returns:
        AgentWalletResponse with agent public key and creation status
    """
    try:
        user_public_key = current_user
        if not user_public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        # Check if agent wallet already exists
        existing_wallet = await db_manager.get_agent_wallet(user_public_key)
        if existing_wallet:
            logger.info(f"Found existing agent wallet for user {user_public_key}")
            return AgentWalletResponse(
                agent_public_key=existing_wallet['agent_public_key'],
                created=False
            )
        
        # Create new agent wallet
        logger.info(f"Creating new agent wallet for user {user_public_key}")
        try:
            agent_public_key, agent_private_key = await wallet_manager.create_agent_wallet(user_public_key)
        except Exception as e:
            logger.error(f"Failed to create CDP wallet: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create agent wallet: {str(e)}"
            )
        
        # Store in database
        success = await db_manager.create_agent_wallet(
            user_public_key=user_public_key,
            agent_public_key=agent_public_key,
            agent_private_key=agent_private_key
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store agent wallet in database"
            )
        
        logger.info(f"Successfully created agent wallet {agent_public_key} for user {user_public_key}")
        
        return AgentWalletResponse(
            agent_public_key=agent_public_key,
            created=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in agent wallet creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )

@router.get("/agent-wallet/details",
           responses={
               401: {"model": AgentWalletError, "description": "Unauthorized"},
               404: {"model": AgentWalletError, "description": "Agent wallet not found"}
           })
async def get_agent_wallet_details(
    current_user: str = Depends(get_current_user)
):
    """
    Get agent wallet details for the authenticated user
    
    Returns:
        Agent wallet public key and network information
    """
    try:
        user_public_key = current_user
        if not user_public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        # Get agent wallet from database
        wallet_info = await db_manager.get_agent_wallet(user_public_key)
        if not wallet_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent wallet not found for this user"
            )
        
        # Get additional wallet details if needed
        wallet_details = await wallet_manager.get_wallet_details(wallet_info['agent_public_key'])
        
        return {
            "agent_public_key": wallet_info['agent_public_key'],
            "network": wallet_details.get('network', 'base-sepolia') if wallet_details else 'base-sepolia'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent wallet details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent wallet details"
        )

@router.delete("/agent-wallet",
              responses={
                  401: {"model": AgentWalletError, "description": "Unauthorized"},
                  404: {"model": AgentWalletError, "description": "Agent wallet not found"}
              })
async def delete_agent_wallet(
    current_user: str = Depends(get_current_user)
):
    """
    Delete agent wallet for the authenticated user (for testing purposes)
    
    Returns:
        Success message
    """
    try:
        user_public_key = current_user
        if not user_public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        # Check if wallet exists
        existing_wallet = await db_manager.get_agent_wallet(user_public_key)
        if not existing_wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No agent wallet found for this user"
            )
        
        # Delete from database
        success = await db_manager.delete_agent_wallet(user_public_key)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete agent wallet"
            )
        
        return {"message": "Agent wallet deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agent wallet: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete agent wallet"
        )