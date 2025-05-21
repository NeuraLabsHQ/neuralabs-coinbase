from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import yaml
from pathlib import Path
from ...modules.database.postgresconn import PostgresConnection
import os
import base64

# create a function to will take generate a random salt for blockchain like 32257144233647606658666054490365 anf 

async def get_or_create_salt(email:str) -> Tuple[bool, Optional[str]]:
    """
    Get or create a numeric salt for the given email.
    
    Args:
        email (str): The email address to get or create a salt for.
    
    Returns:
        Tuple[bool, Optional[str]]: A tuple containing a boolean indicating success and the salt or error message.
    """
    pg_conn = PostgresConnection()
    
    # Check if the salt already exists
    check_query = "SELECT salt FROM SALT_EMAIL WHERE email = %s"
    result = await pg_conn.execute_query(check_query, (email,))
    # the email is the primary key in the table
    print("result", result)
    if result and len(result) > 0:
        # If the salt exists, return it (safely access the result)
        return True, result[0]["salt"]
    
    # Generate a new numeric salt
    # This generates a 32-digit numeric salt (you can adjust the length if needed)
    import random
    new_salt = ''.join(str(random.randint(0, 9)) for _ in range(32))
    
    # Insert the new salt into the database
    insert_query = "INSERT INTO SALT_EMAIL (email, salt) VALUES (%s, %s)"
    await pg_conn.execute_query(insert_query, (email, new_salt))
    
    return True, new_salt

