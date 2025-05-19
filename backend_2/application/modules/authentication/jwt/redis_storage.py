"""
Redis operations for JWT token storage and validation
"""
import redis
import yaml
import os
import json
from typing import Dict, Optional, Any
from pathlib import Path


class RedisJWTStorage:
    """
    Class to handle JWT token storage and retrieval in Redis
    """
    def __init__(self):
        """
        Initialize Redis connection for JWT operations
        """
        self.config = self._load_config()
        self.redis_client = self._get_redis_client()
        self.token_ttl = self.config.get("jwt", {}).get("access_token_expire_minutes", 1440) * 60  # Convert to seconds
    
    def _load_config(self) -> Dict:
        """
        Load configuration from config.yaml
        
        Returns:
            Configuration dictionary
        """
        config_path = Path(__file__).parent.parent.parent.parent.parent / "config.yaml"
        with open(config_path, "r") as file:
            return yaml.safe_load(file)
    
    def _get_redis_client(self) -> redis.Redis:
        """
        Create Redis client from configuration
        
        Returns:
            Redis client instance
        """
        redis_config = self.config.get("database", {}).get("redis", {})
        return redis.Redis(
            host=redis_config.get("host", "localhost"),
            port=redis_config.get("port", 6379),
            db=redis_config.get("db", 0),
            password=redis_config.get("password"),
            decode_responses=True
        )
    
    def store_token(self, token: str, user_id: str, session_id: str) -> bool:
        """
        Store JWT token in Redis
        
        Args:
            token: JWT token string
            user_id: User's public key
            session_id: Unique session identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = f"user_session:jwt:{token}"
            session_data = {
                "user_id": user_id,
                "session_id": session_id
            }
            
            # Store token data in Redis with TTL
            self.redis_client.hmset(key, session_data)
            self.redis_client.expire(key, self.token_ttl)
            
            # Also store a reference by user_id for faster lookups
            user_key = f"user_sessions:{user_id}"
            self.redis_client.sadd(user_key, token)
            self.redis_client.expire(user_key, self.token_ttl)
            
            return True
        except Exception as e:
            print(f"Error storing token: {e}")
            return False
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate if token exists in Redis and return its data
        
        Args:
            token: JWT token string
            
        Returns:
            Dictionary with token data if valid, None otherwise
        """
        try:
            key = f"user_session:jwt:{token}"
            token_data = self.redis_client.hgetall(key)
            
            if token_data:
                # Refresh token TTL on successful validation
                self.redis_client.expire(key, self.token_ttl)
                return token_data
            
            return None
        except Exception as e:
            print(f"Error validating token: {e}")
            return None
    
    def invalidate_token(self, token: str) -> bool:
        """
        Remove token from Redis (logout)
        
        Args:
            token: JWT token string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = f"user_session:jwt:{token}"
            # Get user_id first for cleanup
            user_id = self.redis_client.hget(key, "user_id")
            
            # Delete the token entry
            result = self.redis_client.delete(key)
            
            if user_id:
                # Convert bytes to string if necessary
                if isinstance(user_id, bytes):
                    user_id = user_id.decode('utf-8')
                
                # Remove from user's sessions
                user_key = f"user_sessions:{user_id}"
                self.redis_client.srem(user_key, token)
            
            # For debugging
            print(f"Token invalidation result: {result}")
            
            return True
        except Exception as e:
            print(f"Error invalidating token: {e}")
            return False
    
    def invalidate_all_user_tokens(self, user_id: str) -> bool:
        """
        Remove all tokens for a user (logout from all devices)
        
        Args:
            user_id: User's public key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            user_key = f"user_sessions:{user_id}"
            tokens = self.redis_client.smembers(user_key)
            
            # Delete each token
            for token in tokens:
                self.redis_client.delete(f"user_session:jwt:{token}")
            
            # Delete the set of user tokens
            self.redis_client.delete(user_key)
            
            return True
        except Exception as e:
            print(f"Error invalidating user tokens: {e}")
            return False