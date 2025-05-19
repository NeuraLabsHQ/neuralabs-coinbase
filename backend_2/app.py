"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yaml
import os
from application.routes import router as api_router

# Load configuration
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
    with open(config_path, "r") as file:
        return yaml.safe_load(file)

config = load_config()

# Create FastAPI application
app = FastAPI(
    title="Neuralabs API",
    description="API for Neuralabs Dashboard and Flow Builder",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get("cors", {}).get("allow_origins", ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify the API is running
    """