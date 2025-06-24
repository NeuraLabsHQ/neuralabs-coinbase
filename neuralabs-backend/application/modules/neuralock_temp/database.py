"""
Database operations for NEURALOCK_TEMP_STORE table
"""
import logging
from typing import Optional, Dict, Any, Tuple
from ..database.postgresconn import PostgresConnection
import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

class NeuralockTempDB:
    """
    Handle database operations for agent wallet storage
    """
    
    def __init__(self):
        """Initialize database connection"""
        self.db = PostgresConnection()
        self._encryption_key = self._get_encryption_key()
    
    def _get_encryption_key(self) -> bytes:
        """
        Generate encryption key from a secret
        In production, this should come from secure key management
        """
        # Use a combination of config values as salt
        salt = b'neuralabs_agent_wallet_salt_2025'  # This should be stored securely
        password = b'neuralabs_agent_wallet_encryption'  # This should come from env vars
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def _encrypt_private_key(self, private_key: str) -> str:
        """Encrypt private key before storing"""
        f = Fernet(self._encryption_key)
        encrypted = f.encrypt(private_key.encode())
        return base64.b64encode(encrypted).decode()
    
    def _decrypt_private_key(self, encrypted_key: str) -> str:
        """Decrypt private key after retrieving"""
        f = Fernet(self._encryption_key)
        encrypted_bytes = base64.b64decode(encrypted_key.encode())
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted.decode()
    
    async def get_agent_wallet(self, user_public_key: str) -> Optional[Dict[str, str]]:
        """
        Get agent wallet for a user
        
        Args:
            user_public_key: User's public key
            
        Returns:
            Dict with agent_public_key and agent_private_key (decrypted) or None
        """
        query = """
            SELECT agent_public_key, agent_private_key 
            FROM NEURALOCK_TEMP_STORE 
            WHERE user_public_key = %s
        """
        
        try:
            result = await self.db.execute_query(query, (user_public_key,))
            if result and len(result) > 0:
                row = result[0]
                return {
                    "agent_public_key": row["agent_public_key"],
                    "agent_private_key": self._decrypt_private_key(row["agent_private_key"])
                }
            return None
        except Exception as e:
            logger.error(f"Error getting agent wallet: {e}")
            return None
    
    async def create_agent_wallet(self, user_public_key: str, agent_public_key: str, 
                          agent_private_key: str) -> bool:
        """
        Store agent wallet for a user
        
        Args:
            user_public_key: User's public key
            agent_public_key: Agent's public key (address)
            agent_private_key: Agent's private key (will be encrypted)
            
        Returns:
            True if successful, False otherwise
        """
        # Encrypt private key before storing
        encrypted_private_key = self._encrypt_private_key(agent_private_key)
        
        query = """
            INSERT INTO NEURALOCK_TEMP_STORE (user_public_key, agent_public_key, agent_private_key)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_public_key) 
            DO UPDATE SET 
                agent_public_key = EXCLUDED.agent_public_key,
                agent_private_key = EXCLUDED.agent_private_key
        """
        
        try:
            # Use execute_query since it handles both INSERT and UPDATE
            await self.db.execute_query(query, (user_public_key, agent_public_key, encrypted_private_key))
            logger.info(f"Stored agent wallet for user {user_public_key}")
            return True
        except Exception as e:
            logger.error(f"Error storing agent wallet: {e}")
            return False
    
    async def delete_agent_wallet(self, user_public_key: str) -> bool:
        """
        Delete agent wallet for a user
        
        Args:
            user_public_key: User's public key
            
        Returns:
            True if successful, False otherwise
        """
        query = "DELETE FROM NEURALOCK_TEMP_STORE WHERE user_public_key = %s"
        
        try:
            await self.db.execute_query(query, (user_public_key,))
            logger.info(f"Deleted agent wallet for user {user_public_key}")
            return True
        except Exception as e:
            logger.error(f"Error deleting agent wallet: {e}")
            return False