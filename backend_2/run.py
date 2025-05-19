"""
Script to run the Neuralabs API
"""
import uvicorn
import os
import yaml
from pathlib import Path

def load_config():
    """
    Load configuration from config.yaml
    
    Returns:
        Configuration dictionary
    """
    config_path = Path(__file__).parent / "config.yaml"
    with open(config_path, "r") as file:
        return yaml.safe_load(file)

if __name__ == "__main__":
    config = load_config()
    server_config = config.get("server", {})
    
    # Get server configuration or use defaults
    host = server_config.get("host", "0.0.0.0")
    port = server_config.get("port", 8000)
    reload = server_config.get("reload", True)
    
    print(f"Starting Neuralabs API on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload
    )