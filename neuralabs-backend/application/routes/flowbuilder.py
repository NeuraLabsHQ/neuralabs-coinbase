# Save this as: neuralabs-backend/application/routes/flowbuilder.py

"""
Flowbuilder routes for block management
"""
from fastapi import APIRouter, HTTPException, Query, Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import json
from ..modules.get_data.flowbuilder import (
    get_all_flowbuilder_blocks,
    get_flowbuilder_blocks_by_category,
    get_flowbuilder_block_by_type,
    get_flowbuilder_categories,
    search_flowbuilder_blocks
)


# Helper function to format datetime objects
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


# Response models
class FlowbuilderBlock(BaseModel):
    id: int
    type: str
    element_description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    hyper_parameters: Dict[str, Any]
    parameter_schema_structure: Dict[str, Any]
    parameters: Dict[str, Any]
    processing_message: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    icon: str
    category: str
    created_at: str
    updated_at: str


class CategoryInfo(BaseModel):
    category: str
    block_count: int


# Create router
router = APIRouter()


@router.get("/blocks", response_model=List[FlowbuilderBlock])
async def get_all_blocks():
    """
    Get all flowbuilder blocks
    """
    try:
        blocks = await get_all_flowbuilder_blocks()
        
        # print(blocks)  # Debugging line to check the result
        # Format datetime objects
        formatted_blocks = format_datetime(blocks)
        
        # print(formatted_blocks)  # Debugging line to check the formatted result
        return formatted_blocks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching blocks: {str(e)}")


@router.get("/blocks/category/{category}", response_model=List[FlowbuilderBlock])
async def get_blocks_by_category(
    category: str = Path(..., description="Category to filter blocks by")
):
    """
    Get flowbuilder blocks by category
    """
    try:
        blocks = await get_flowbuilder_blocks_by_category(category)
        if not blocks:
            raise HTTPException(status_code=404, detail=f"No blocks found for category: {category}")
        
        # Format datetime objects
        formatted_blocks = format_datetime(blocks)
        return formatted_blocks
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching blocks: {str(e)}")


@router.get("/blocks/type/{block_type}", response_model=FlowbuilderBlock)
async def get_block_by_type(
    block_type: str = Path(..., description="Type of the block to retrieve")
):
    """
    Get a specific flowbuilder block by type
    """
    try:
        block = await get_flowbuilder_block_by_type(block_type)
        if not block:
            raise HTTPException(status_code=404, detail=f"Block not found: {block_type}")
        
        # Format datetime objects
        formatted_block = format_datetime(block)
        return formatted_block
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching block: {str(e)}")


@router.get("/categories", response_model=List[CategoryInfo])
async def get_categories():
    """
    Get all flowbuilder categories with block counts
    """
    try:
        categories = await get_flowbuilder_categories()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")


@router.get("/blocks/search", response_model=List[FlowbuilderBlock])
async def search_blocks(
    q: str = Query(..., description="Search term for block name or description", min_length=1)
):
    """
    Search flowbuilder blocks by name or description
    """
    try:
        blocks = await search_flowbuilder_blocks(q)
        if not blocks:
            return []  # Return empty list instead of 404 for search
        
        # Format datetime objects
        formatted_blocks = format_datetime(blocks)
        return formatted_blocks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching blocks: {str(e)}")


@router.get("/blocks/grouped", response_model=Dict[str, List[FlowbuilderBlock]])
async def get_blocks_grouped_by_category():
    """
    Get all flowbuilder blocks grouped by category
    """
    try:
        all_blocks = await get_all_flowbuilder_blocks()
        
        # Group blocks by category
        grouped_blocks = {}
        for block in all_blocks:
            category = block["category"]
            if category not in grouped_blocks:
                grouped_blocks[category] = []
            grouped_blocks[category].append(block)
        
        # Format datetime objects in grouped structure
        formatted_grouped = {
            category: format_datetime(blocks) 
            for category, blocks in grouped_blocks.items()
        }
        
        return formatted_grouped
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching grouped blocks: {str(e)}")


@router.get("/blocks/icons", response_model=Dict[str, str])
async def get_block_icons():
    """
    Get a mapping of block types to their icons
    """
    try:
        blocks = await get_all_flowbuilder_blocks()
        
        # Create a mapping of type to icon
        icon_mapping = {block["type"]: block["icon"] for block in blocks}
        
        return icon_mapping
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching icons: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check endpoint for flowbuilder service
    """
    return {"status": "healthy", "service": "flowbuilder", "timestamp": datetime.now().isoformat()}