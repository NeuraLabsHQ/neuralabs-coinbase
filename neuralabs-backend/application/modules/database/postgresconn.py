"""
PostgreSQL database connection manager
"""
import os
import yaml
import psycopg2
import psycopg2.extras
from typing import List, Dict, Any, Optional, Tuple

class PostgresConnection:
    """
    Class to manage connections to the PostgreSQL database
    """
    def __init__(self):
        """
        Initialize the PostgreSQL connection
        """
        self.config = self._load_config()
        self.connection_params = self._get_connection_params()
    
    def _load_config(self) -> Dict[str, Any]:
        """
        Load configuration from config.yaml
        
        Returns:
            Configuration dictionary
        """
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 
                                  "config.yaml")
        with open(config_path, "r") as file:
            return yaml.safe_load(file)
    
    def _get_connection_params(self) -> Dict[str, Any]:
        """
        Get PostgreSQL connection parameters from config
        
        Returns:
            Dictionary of connection parameters
        """
        db_config = self.config.get("database", {}).get("postgres", {})
        return {
            "host": db_config.get("host", "localhost"),
            "port": db_config.get("port", 5432),
            "user": db_config.get("user", "postgres"),
            "password": db_config.get("password", ""),
            "dbname": db_config.get("dbname", "neuralabs"),
        }
    
    async def execute_query(self, query: str, params: Optional[Tuple] = None) -> List[Dict[str, Any]]:
        """
        Execute a SQL query and return the results as a list of dictionaries
        
        Args:
            query: SQL query to execute
            params: Query parameters
            
        Returns:
            Query results as a list of dictionaries
        """
        conn = None
        try:
            conn = psycopg2.connect(**self.connection_params)
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                if cursor.description:
                    return cursor.fetchall()
                return []
        except Exception as e:
            print(f"Database error: {e}")
            # In a production environment, you would want to log this error
            # and possibly raise a custom exception
            return []
        finally:
            if conn:
                conn.commit()
                conn.close()
    
    async def execute_transaction(self, queries: List[Tuple[str, Optional[Tuple]]]) -> bool:
        """
        Execute multiple queries in a transaction
        
        Args:
            queries: List of tuples containing (query, params)
            
        Returns:
            True if the transaction was successful, False otherwise
        """
        conn = None
        try:
            conn = psycopg2.connect(**self.connection_params)
            with conn.cursor() as cursor:
                for query, params in queries:
                    cursor.execute(query, params)
            conn.commit()
            return True
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Transaction error: {e}")
            # In a production environment, you would want to log this error
            return False
        finally:
            if conn:
                conn.close()