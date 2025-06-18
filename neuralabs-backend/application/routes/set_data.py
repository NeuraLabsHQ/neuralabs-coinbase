"""
Routes for setting data in the database
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Path, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from ..modules.authentication import get_current_user, verify_access_permission
from ..modules.set_data.dashboard import (
    create_or_update_agent,
    save_agent_workflow,
    save_agent_metadata,
    publish_agent_to_blockchain,
    grant_nft_access,
    revoke_nft_access
)


# Define request models
class AgentBase(BaseModel):
    name: str = Field(..., description="Name of the agent")
    description: Optional[str] = Field(None, description="Description of the agent")
    status: Optional[str] = Field("Not Published", description="Status of the agent")
    tags: Optional[Dict[str, Any]] = Field(None, description="Tags for the agent")
    license: Optional[str] = Field(None, description="License information")
    fork: Optional[str] = Field(None, description="Reference to forked agent if applicable")
    socials: Optional[Dict[str, Any]] = Field(None, description="Social media links")
    chain_id: Optional[int] = Field(84532, description="Blockchain ID")


class CreateAgentRequest(AgentBase):
    pass


class UpdateAgentRequest(AgentBase):
    agent_id: str = Field(..., description="ID of the agent to update")


class WorkflowRequest(BaseModel):
    workflow: Dict[str, Any] = Field(..., description="Workflow data")
    is_published: bool = Field(False, description="Whether to publish the workflow")


class MetadataRequest(BaseModel):
    markdown_object: Dict[str, Any] = Field(..., description="Markdown documentation")


class BlockchainDataRequest(BaseModel):
    version: str = Field(..., description="Version of the agent on blockchain")
    published_hash: str = Field(..., description="Hash of the published agent")
    contract_id: str = Field(..., description="Smart contract ID")
    nft_id: str = Field(..., description="NFT identifier")
    nft_mint_trx_id: Optional[str] = Field(None, description="Transaction ID for NFT minting")
    published_date: Optional[datetime] = Field(None, description="Date published to blockchain")
    other_data: Optional[Dict[str, Any]] = Field(None, description="Additional blockchain-related data (walrus, seal, encryption details)")


class GrantAccessRequest(BaseModel):
    target_user_id: str = Field(..., description="Public key of user to grant access to")
    access_level: int = Field(..., ge=1, description="Access level to grant")

class RevokeAccessRequest(BaseModel):
    target_user_id: str = Field(..., description="Public key of user to revoke access from")


# Create router
router = APIRouter()


@router.post("/agent/create", status_code=201)
async def create_agent(
    agent_data: CreateAgentRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Create a new agent
    """
    success, agent_id, error_message = await create_or_update_agent(agent_data.dict(), current_user)
    
    if not success:
        raise HTTPException(status_code=400, detail=error_message)
    
    return {"agent_id": agent_id, "message": "Agent created successfully"}


@router.put("/agent/update")
async def update_agent(
    agent_data: UpdateAgentRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Update an existing agent
    """
    success, agent_id, error_message = await create_or_update_agent(agent_data.dict(), current_user)
    
    if not success:
        raise HTTPException(status_code=400, detail=error_message)
    
    return {"agent_id": agent_id, "message": "Agent updated successfully"}


@router.put("/agent/{agent_id}/workflow")
async def update_workflow(
    agent_id: str = Path(..., description="ID of the agent"),
    data: WorkflowRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Save agent workflow
    """
    success, error_message = await save_agent_workflow(
        agent_id, 
        data.workflow, 
        current_user,
        data.is_published
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=error_message)
    
    status_message = "Agent published successfully" if data.is_published else "Workflow saved successfully"
    return {"agent_id": agent_id, "message": status_message}


@router.put("/agent/{agent_id}/metadata")
async def update_metadata(
    agent_id: str = Path(..., description="ID of the agent"),
    data: MetadataRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Save agent metadata (markdown documentation)
    """
    success, error_message = await save_agent_metadata(
        agent_id, 
        data.markdown_object, 
        current_user
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=error_message)
    
    return {"agent_id": agent_id, "message": "Metadata saved successfully"}


@router.post("/agent/{agent_id}/publish")
async def publish_to_blockchain(
    agent_id: str = Path(..., description="ID of the agent"),
    data: BlockchainDataRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Publish agent to blockchain and record transaction details
    """
    success, error_message = await publish_agent_to_blockchain(
        agent_id,
        data.dict(),
        current_user
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=error_message)
    
    return {"agent_id": agent_id, "message": "Agent published to blockchain successfully"}


@router.post("/nft/{nft_id}/grant-access")
async def grant_access_to_nft(
    nft_id: str = Path(..., description="NFT ID to grant access to"),
    data: GrantAccessRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Grant access to an NFT to another user
    """
    success, error_message = await grant_nft_access(
        nft_id,
        data.target_user_id,
        data.access_level,
        current_user
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=error_message)
    
    return {
        "nft_id": nft_id,
        "target_user": data.target_user_id,
        "access_level": data.access_level,
        "message": "Access granted successfully"
    }


@router.post("/nft/{nft_id}/revoke-access")
async def revoke_access_from_nft(
    nft_id: str = Path(..., description="NFT ID to revoke access from"),
    data : RevokeAccessRequest = Body(...),
    current_user: str = Depends(get_current_user)
):
    """
    Revoke access to an NFT from a user
    """
    success, error_message = await revoke_nft_access(
        nft_id,
        data.target_user_id,
        current_user
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=error_message)
    
    return {
        "nft_id": nft_id,
        "target_user": data.target_user_id,
        "message": "Access revoked successfully"
    }