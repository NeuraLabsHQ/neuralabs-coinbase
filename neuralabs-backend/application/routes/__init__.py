
"""
Routes module initialization
This module registers all API routes
"""
from fastapi import APIRouter
from .dashboard import router as dashboard_router
from .auth import router as auth_router
from .set_data import router as set_data_router
from .blockchain import router as blockchain_router
from .zk_login import router as zk_login_router
from .flowbuilder import router as flowbuilder_router
from .chat import router as chat_router

# Create main router
router = APIRouter()

# Include all application routes with their prefixes
router.include_router(flowbuilder_router, prefix="/flowbuilder", tags=["flowbuilder"])
router.include_router(zk_login_router, prefix="/zk-login", tags=["zk-login"])
router.include_router(auth_router, prefix="/auth", tags=["authentication"])
router.include_router(set_data_router, prefix="/set-data", tags=["data-management"])
router.include_router(blockchain_router, prefix="/set-blockchain-data", tags=["blockchain"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])