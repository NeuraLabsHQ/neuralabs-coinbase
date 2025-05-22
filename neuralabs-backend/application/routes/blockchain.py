"""
Routes for setting data in the database
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Path, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from ..modules.authentication import get_current_user, verify_access_permission
from ..modules.set_data.blockchain import get_supported_chains, initialize_supported_chains


# Create router
router = APIRouter()

@router.get("/blockchain/chains")
async def get_blockchain_chains(
    current_user: str = Depends(get_current_user)
):
    """
    Get list of supported blockchain networks
    """
    chains = await get_supported_chains()
    return {"chains": chains}


@router.post("/blockchain/initialize-chains")
async def initialize_blockchain_chains(
    current_user: str = Depends(get_current_user)
):
    """
    Initialize all supported chains from the config file
    """
    success, error, count = await initialize_supported_chains()
    
    if not success:
        raise HTTPException(status_code=500, detail=error)
    
    return {
        "message": f"Successfully initialized {count} blockchain networks",
        "count": count
    }