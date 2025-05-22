"""
JWT token generation and validation module
"""
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Dict, Optional
import os
import yaml
import secrets
from pathlib import Path


class JWTHandler:
    """
    Class to handle JWT token generation and validation
    """
    def __init__(self):
        """
        Initialize JWT handler with configuration
        """
        self.config = self._load_config()
        self.secret_key = self.config.get("jwt", {}).get("secret_key", self._generate_secret_key())
        self.algorithm = self.config.get("jwt", {}).get("algorithm", "HS256")
        self.access_token_expire_minutes = self.config.get("jwt", {}).get("access_token_expire_minutes", 1440)  # 24 hours
    
    def _load_config(self) -> Dict:
        """
        Load configuration from config.yaml
        
        Returns:
            Configuration dictionary
        """
        config_path = Path(__file__).parent.parent.parent.parent.parent / "config.yaml"
        with open(config_path, "r") as file:
            return yaml.safe_load(file)
    
    def _generate_secret_key(self) -> str:
        """
        Generate a secure random secret key if none is provided in the config
        
        Returns:
            A secure random string to use as secret key
        """
        return secrets.token_hex(32)
    
    def create_access_token(self, data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a new JWT access token
        
        Args:
            data: Payload data to encode in the token
            expires_delta: Optional custom expiration time
            
        Returns:
            JWT token string
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        to_encode.update({"iat": datetime.utcnow()})  # Issued at time
        
        # Generate a unique session ID
        to_encode.update({"session_id": secrets.token_hex(16)})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """
        Verify a JWT token and return its payload if valid
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None