"""
Redis operations for payment session storage and validation
"""
import redis
import yaml
import json
from typing import Dict, Optional, Any
from pathlib import Path
from datetime import datetime


class PaymentSessionStorage:
    """
    Class to handle payment session storage and retrieval in Redis
    """
    def __init__(self):
        """
        Initialize Redis connection for payment session operations
        """
        self.config = self._load_config()
        self.redis_client = self._get_redis_client()
        self.session_ttl = 300  # 5 minutes in seconds
    
    def _load_config(self) -> Dict:
        """
        Load configuration from config.yaml
        
        Returns:
            Configuration dictionary
        """
        config_path = Path(__file__).parent.parent.parent.parent / "config.yaml"
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
    
    def store_payment_session(self, session_id: str, payment_data: Dict[str, Any]) -> bool:
        """
        Store payment session in Redis
        
        Args:
            session_id: Unique session identifier
            payment_data: Dictionary containing payment session data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = f"payment_session:{session_id}"
            
            # Prepare session data
            session_data = {
                "user_id": payment_data.get("user_id", ""),
                "agent_id": payment_data.get("agent_id", ""),
                "transaction_hash": payment_data.get("transaction_hash", ""),
                "payment_headers": json.dumps(payment_data.get("payment_headers", {})),
                "created_at": payment_data.get("created_at", datetime.utcnow()).isoformat()
            }
            
            # Store session data in Redis with TTL
            self.redis_client.hmset(key, session_data)
            self.redis_client.expire(key, self.session_ttl)
            
            return True
        except Exception as e:
            print(f"Error storing payment session: {e}")
            return False
    
    def get_payment_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve payment session from Redis
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            Dictionary with session data if valid, None otherwise
        """
        try:
            key = f"payment_session:{session_id}"
            session_data = self.redis_client.hgetall(key)
            
            if session_data:
                # Parse JSON fields
                if 'payment_headers' in session_data:
                    session_data['payment_headers'] = json.loads(session_data['payment_headers'])
                
                # Parse datetime
                if 'created_at' in session_data:
                    session_data['created_at'] = datetime.fromisoformat(session_data['created_at'])
                
                # Refresh TTL on successful retrieval
                self.redis_client.expire(key, self.session_ttl)
                
                return session_data
            
            return None
        except Exception as e:
            print(f"Error retrieving payment session: {e}")
            return None
    
    def delete_payment_session(self, session_id: str) -> bool:
        """
        Remove payment session from Redis
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = f"payment_session:{session_id}"
            result = self.redis_client.delete(key)
            
            # For debugging
            print(f"Payment session deletion result: {result}")
            
            return True
        except Exception as e:
            print(f"Error deleting payment session: {e}")
            return False
    
    def get_all_user_sessions(self, user_id: str) -> list:
        """
        Get all payment sessions for a user (for debugging/admin purposes)
        
        Args:
            user_id: User's public key
            
        Returns:
            List of session IDs for the user
        """
        try:
            # Scan for all payment session keys
            sessions = []
            cursor = 0
            pattern = "payment_session:*"
            
            while True:
                cursor, keys = self.redis_client.scan(cursor, match=pattern)
                for key in keys:
                    session_data = self.redis_client.hget(key, "user_id")
                    if session_data == user_id:
                        session_id = key.split(":")[-1]
                        sessions.append(session_id)
                
                if cursor == 0:
                    break
            
            return sessions
        except Exception as e:
            print(f"Error getting user sessions: {e}")
            return []