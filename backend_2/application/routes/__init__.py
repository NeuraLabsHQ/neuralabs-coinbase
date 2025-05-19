
"""
Routes module initialization
This module registers all API routes
"""
from fastapi import APIRouter
from .dashboard import router as dashboard_router
# from .chat import router as chat_router
# from .flowbuilder import router as flowbuilder_router

# Create main router
router = APIRouter()

# Include all application routes with their prefixes
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
# router.include_router(chat_router, prefix="/chat", tags=["chat"])
# router.include_router(flowbuilder_router, prefix="/flowbuilder", tags=["flowbuilder"])