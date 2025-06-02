"""
Dashboard routes for Neuralabs application
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime
import json
from ..modules.get_data.dashboard import (
    get_user_created_flows,
    get_user_accessed_flows,
    get_recently_opened_flows,
    get_under_development_flows,
    get_published_flows,
    get_shared_flows,
    get_flow_details
)
from ..modules.authentication import get_current_user, verify_access_permission


# Helper function to convert datetime objects to ISO format strings
def format_datetime(data):
    """Convert datetime objects to strings in the response data"""
    if isinstance(data, list):
        return [format_datetime(item) for item in data]
    elif isinstance(data, dict):
        return {
            key: (value.isoformat() if isinstance(value, datetime) else format_datetime(value))
            for key, value in data.items()
        }
    else:
        return data


# Helper function to sanitize data types
def sanitize_data(flow_data):
    """Ensure data conforms to expected types for the response models"""
    if isinstance(flow_data, list):
        return [sanitize_data(item) for item in flow_data]
    
    if not isinstance(flow_data, dict):
        return flow_data
    
    result = {}
    for key, value in flow_data.items():
        # Handle datetime objects
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        
        # Handle tags - convert from various formats to dictionary
        elif key == 'tags' and value is not None:
            if isinstance(value, str):
                try:
                    # Try parsing as JSON
                    result[key] = json.loads(value)
                except:
                    # If not JSON, create a dict with a single entry
                    result[key] = {"tags": value}
            elif isinstance(value, list):
                # Convert list to dictionary with indexed keys
                result[key] = {f"tag_{i}": tag for i, tag in enumerate(value)}
            else:
                # Keep dictionaries as is
                result[key] = value
        
        # Handle socials - convert from string to dictionary
        elif key == 'socials' and isinstance(value, str):
            socials_dict = {}
            # Split by pipe or comma
            parts = value.split('|') if '|' in value else value.split(',')
            for part in parts:
                part = part.strip()
                if ':' in part:
                    platform, handle = part.split(':', 1)
                    socials_dict[platform.strip()] = handle.strip()
                else:
                    socials_dict[f"social_{len(socials_dict)}"] = part
            result[key] = socials_dict
        
        # Handle nested structures
        elif isinstance(value, (dict, list)):
            result[key] = sanitize_data(value)
        
        # Pass through other values
        else:
            result[key] = value
    
    return result


# Define response models
class FlowBase(BaseModel):
    agent_id: str
    name: str
    description: Optional[str] = None
    status: str
    creation_date: str
    last_edited_time: Optional[str] = None
    access_level: Optional[int] = None
    access_level_name: Optional[str] = None


class DashboardResponse(BaseModel):
    my_flows: List[FlowBase]
    other_flows: Dict[str, List[FlowBase]]


class FlowDetailResponse(BaseModel):
    agent_id: str
    name: str
    description: Optional[str] = None
    status: str
    creation_date: str
    owner: str
    tags: Optional[Dict[str, Any]] = None
    license: Optional[str] = None
    fork: Optional[str] = None
    socials: Optional[Dict[str, Any]] = None
    last_edited_time: Optional[str] = None
    workflow: Optional[Dict[str, Any]] = None
    version: Optional[str] = None
    published_date: Optional[str] = None
    published_hash: Optional[str] = None
    contract_id: Optional[str] = None
    nft_id: Optional[str] = None
    chain: Optional[str] = None
    chain_status: Optional[str] = None
    chain_explorer: Optional[str] = None
    access_level: Optional[int] = None
    access_level_name: Optional[str] = None
    descriptions_and_permissions: Optional[Any] = None
    markdown_object: Optional[Dict[str, Any]] = None
    other_data: Optional[Dict[str, Any]] = None


# Create router
router = APIRouter()


@router.get("/all", response_model=DashboardResponse)
async def get_dashboard_data(request: Request, current_user: str = Depends(get_current_user)):
    """
    Get all dashboard data, including My Flows and Other Flows categorized by access level
    """
    my_flows = await get_user_created_flows(current_user)
    other_flows_by_level = await get_user_accessed_flows(current_user)
    
    # Sanitize data to ensure correct types
    my_flows = sanitize_data(my_flows)
    other_flows_by_level = sanitize_data(other_flows_by_level)
    
    # Convert numeric keys to strings for the response
    other_flows = {f"Access Level {k}": v for k, v in other_flows_by_level.items()}
    
    return {
        "my_flows": my_flows,
        "other_flows": other_flows
    }


@router.get("/flows/recent", response_model=List[FlowBase])
async def get_recent_flows(
    request: Request,
    limit: int = Query(10, description="Number of flows to return", ge=1, le=50),
    current_user: str = Depends(get_current_user)
):
    """
    Get recently opened flows for the dashboard's "Recently opened" section
    """
    flows = await get_recently_opened_flows(current_user, limit)
    # Sanitize data to ensure correct types
    flows = sanitize_data(flows)
    return flows


@router.get("/flows/underdevelopment", response_model=List[FlowBase])
async def get_underdevelopment_flows(request: Request, current_user: str = Depends(get_current_user)):
    """
    Get flows under development (from UNPUBLISHED_AGENT table)
    """
    flows = await get_under_development_flows(current_user)
    # Sanitize data to ensure correct types
    flows = sanitize_data(flows)
    return flows


@router.get("/flows/published", response_model=List[FlowBase])
async def get_active_flows(request: Request, current_user: str = Depends(get_current_user)):
    """
    Get published flows (from PUBLISHED_AGENT table)
    """
    flows = await get_published_flows(current_user)
    # Sanitize data to ensure correct types
    flows = sanitize_data(flows)
    return flows


@router.get("/flows/shared", response_model=List[FlowBase])
async def get_user_shared_flows(request: Request, current_user: str = Depends(get_current_user)):
    """
    Get shared flows (flows that have more than one user with access)
    """
    flows = await get_shared_flows(current_user)
    # Sanitize data to ensure correct types
    flows = sanitize_data(flows)
    return flows


@router.get("/flows/{agent_id}", response_model=FlowDetailResponse)
async def get_flow_detail(
    request: Request,
    agent_id: str = Path(..., description="ID of the agent/flow to retrieve"),
    current_user: str = Depends(get_current_user)
):
    """
    Get detailed information about a specific flow/NFT
    """
    # Check if user has access to this flow
    has_access = await verify_access_permission(current_user, agent_id)
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to access this flow"
        )
    
    flow_detail = await get_flow_details(agent_id, current_user)
    if not flow_detail:
        raise HTTPException(
            status_code=404,
            detail="Flow not found"
        )
    # log flow_detail
    
    # Sanitize data to ensure correct types
    flow_detail = sanitize_data(flow_detail)
    
    return flow_detail