from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Tuple
import aiohttp
import asyncio
import base64
import json
from ...modules.database.postgresconn import PostgresConnection
from ...modules.authentication.jwt.token import JWTHandler
from ...modules.authentication.jwt.redis_storage import RedisJWTStorage
import requests
from pathlib import Path
import yaml

def load_config() -> Dict:
    """
    Load configuration from config.yaml
    
    Returns:
        Configuration dictionary
    """
    config_path = Path(__file__).parent.parent.parent.parent / "config.yaml"
    with open(config_path, "r") as file:
        return yaml.safe_load(file)

    
config = load_config()



# Initialize JWT handler and Redis storage
jwt_handler = JWTHandler()
redis_jwt_storage = RedisJWTStorage()

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


async def verify_zklogin_signature_graphql(
    bytes_b64: str, 
    signature_b64: str, 
    author: str, 
    intent_scope: str = "PERSONAL_MESSAGE",
    network: str = config["network_used"]["sui_network"] 
) -> Dict[str, Any]:
    """
    Verify zkLogin signature using Sui GraphQL endpoint
    
    Args:
        bytes_b64: Base64-encoded transaction/message bytes
        signature_b64: Base64-encoded zkLogin signature
        author: zkLogin Sui address
        intent_scope: Intent scope ("PERSONAL_MESSAGE" or "TRANSACTION_DATA")
        network: Network to use (mainnet, testnet, devnet)
        
    Returns:
        Dictionary with verification result
    """
    
    # GraphQL endpoints for different networks
    graphql_urls = {
        "mainnet": "https://sui-mainnet.mystenlabs.com/graphql",
        "testnet": "https://sui-testnet.mystenlabs.com/graphql", 
        "devnet": "https://sui-devnet.mystenlabs.com/graphql"
    }
    
    graphql_url = graphql_urls.get(network, graphql_urls[config["network_used"]["sui_network"]])
    print("bytes_b64", bytes_b64)
    print("signature_b64", signature_b64)
    print("author", author)
    print("intent_scope", intent_scope)
    
    print(f"Using GraphQL URL: {graphql_url}")
    query = """
    query VerifyZkloginSignature(
        $bytes: Base64!
        $signature: Base64!
        $intentScope: ZkLoginIntentScope!
        $author: SuiAddress!
    ) {
        verifyZkloginSignature(
            bytes: $bytes
            signature: $signature
            intentScope: $intentScope
            author: $author
        ) {
            success
            errors
        }
    }
    """
    
    variables = {
        "bytes": bytes_b64,
        "signature": signature_b64,
        "intentScope": "PERSONAL_MESSAGE",
        "author": author
    }
    print("variables", variables)
    
    try:
    
        
        response = requests.post(
            graphql_url,
            json={"query": query, "variables": variables},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"GraphQL request failed with status {response.status_code}"
            )
        
        result = response.json()
        
        if "errors" in result:
            raise HTTPException(
                status_code=400,
                detail=f"GraphQL errors: {result['errors']}"
            )
            
        print("GraphQL result:", result)
        return result["data"]["verifyZkloginSignature"]
            
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error during signature verification: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying zkLogin signature: {str(e)}"
        )


async def get_or_create_zklogin_user(email: str, zklogin_address: str) -> Dict[str, str]:
    """
    Get or create a user record for zkLogin authentication
    
    Args:
        email: User's email address
        zklogin_address: User's zkLogin Sui address
        
    Returns:
        Dictionary with user information
    """
    
    print("email", email)
    pg_conn = PostgresConnection()
    
    # First, try to find user by zkLogin address
    query = "SELECT user_pub_key, username, email FROM USER_AUTH WHERE user_pub_key = %s"
    result = await pg_conn.execute_query(query, (zklogin_address,))
    
    if result:
        user_data = result[0]
        # Update email if it's different
        if user_data.get("email") != email:
            update_query = "UPDATE USER_AUTH SET email = %s WHERE user_pub_key = %s"
            await pg_conn.execute_query(update_query, (email, zklogin_address))
        return {
            "user_pub_key": user_data["user_pub_key"],
            "username": user_data["username"],
            "email": email
        }
    
    # If not found, try to find by email (in case user had a traditional login before)
    if email:
        email_query = "SELECT user_pub_key, username, email FROM USER_AUTH WHERE email = %s"
        email_result = await pg_conn.execute_query(email_query, (email,))
        
        if email_result:
            # Update the existing record with zkLogin address
            update_query = "UPDATE USER_AUTH SET user_pub_key = %s WHERE email = %s"
            await pg_conn.execute_query(update_query, (zklogin_address, email))
            return {
                "user_pub_key": zklogin_address,
                "username": email_result[0]["username"],
                "email": email
            }
    
    # Create new user
    username = email.split('@')[0] if email else f"zklogin_{zklogin_address[:8]}"
    insert_query = "INSERT INTO USER_AUTH (user_pub_key, username, email) VALUES (%s, %s, %s)"
    await pg_conn.execute_query(insert_query, (zklogin_address, username, email))
    
    return {
        "user_pub_key": zklogin_address,
        "username": username,
        "email": email
    }

