"""
Conversations API routes for managing chat history
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import logging
from ..modules.database.postgresconn import PostgresConnection
from ..modules.authentication import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Optional authentication dependency
async def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[str]:
    """
    Get the current user if authenticated, otherwise return None for anonymous users
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic models for request bodies
class CreateConversationRequest(BaseModel):
    title: str
    agent_id: Optional[str] = None

class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None

class AddMessageRequest(BaseModel):
    role: str
    content: str
    model: Optional[str] = None
    parent_message_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    thinking_state: Optional[Dict[str, Any]] = None
    transaction_data: Optional[Dict[str, Any]] = None

@router.get("/conversations")
async def get_conversations(user_id: Optional[str] = Depends(get_optional_current_user)) -> List[Dict[str, Any]]:
    """
    Get all conversations for a user
    """
    if not user_id:
        # Return empty list for anonymous users
        return []
    
    try:
        pg_conn = PostgresConnection()
        
        query = """
            SELECT 
                c.conversation_id,
                c.title,
                c.created_at,
                c.updated_at,
                c.agent_id,
                (
                    SELECT json_build_object(
                        'content', m.content,
                        'role', m.role,
                        'timestamp', m.timestamp
                    )
                    FROM messages m
                    WHERE m.conversation_id = c.conversation_id
                    ORDER BY m.timestamp DESC
                    LIMIT 1
                ) as last_message
            FROM conversations c
            WHERE c.user_id = %s
            ORDER BY c.updated_at DESC
        """
        
        result = await pg_conn.execute_query(query, (user_id,))
        
        conversations = []
        for row in result:
            conversations.append({
                "id": row["conversation_id"],
                "title": row["title"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
                "agent_id": row["agent_id"],
                "last_message": row["last_message"]
            })
        
        return conversations
        
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")

@router.post("/conversations")
async def create_conversation(
    request: CreateConversationRequest,
    user_id: Optional[str] = Depends(get_optional_current_user)
) -> Dict[str, Any]:
    """
    Create a new conversation
    """
    # Use 'anonymous' for unauthenticated users
    if not user_id:
        user_id = 'anonymous'
    
    try:
        pg_conn = PostgresConnection()
        
        # Generate conversation ID
        import uuid
        conversation_id = str(uuid.uuid4())
        
        query = """
            INSERT INTO conversations (conversation_id, user_id, title, agent_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING conversation_id, title, created_at, updated_at, agent_id
        """
        
        now = datetime.now(timezone.utc)
        result = await pg_conn.execute_query(
            query, 
            (conversation_id, user_id, request.title, request.agent_id, now, now)
        )
        
        if result and len(result) > 0:
            row = result[0]
            return {
                "id": row["conversation_id"],
                "title": row["title"],
                "created_at": row["created_at"].isoformat(),
                "updated_at": row["updated_at"].isoformat(),
                "agent_id": row["agent_id"]
            }
        
        raise HTTPException(status_code=500, detail="Failed to create conversation")
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user_id: Optional[str] = Depends(get_optional_current_user)
) -> Dict[str, Any]:
    """
    Get a specific conversation with all messages
    """
    try:
        pg_conn = PostgresConnection()
        
        # First verify the conversation belongs to the user
        if user_id:
            conv_query = """
                SELECT conversation_id, title, created_at, updated_at, agent_id
                FROM conversations
                WHERE conversation_id = %s AND user_id = %s
            """
            conv_result = await pg_conn.execute_query(conv_query, (conversation_id, user_id))
        else:
            # For anonymous users, only allow access to anonymous conversations
            conv_query = """
                SELECT conversation_id, title, created_at, updated_at, agent_id
                FROM conversations
                WHERE conversation_id = %s AND user_id = 'anonymous'
            """
            conv_result = await pg_conn.execute_query(conv_query, (conversation_id,))
        
        if not conv_result or len(conv_result) == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = conv_result[0]
        
        # Get all messages for the conversation
        msg_query = """
            SELECT 
                message_id,
                role,
                content,
                timestamp,
                model,
                parent_message_id,
                metadata,
                thinking_state,
                transaction_data
            FROM messages
            WHERE conversation_id = %s
            ORDER BY timestamp ASC
        """
        
        msg_result = await pg_conn.execute_query(msg_query, (conversation_id,))
        
        messages = []
        for msg in msg_result:
            message_data = {
                "id": msg["message_id"],
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"].isoformat() if msg["timestamp"] else None,
                "model": msg["model"],
                "parentMessageId": msg["parent_message_id"]
            }
            
            # Add optional fields if they exist
            if msg["metadata"]:
                message_data["metadata"] = msg["metadata"]
            if msg["thinking_state"]:
                message_data["thinkingState"] = msg["thinking_state"]
            if msg["transaction_data"]:
                message_data["transaction"] = msg["transaction_data"]
                
            messages.append(message_data)
        
        return {
            "id": conversation["conversation_id"],
            "title": conversation["title"],
            "created_at": conversation["created_at"].isoformat() if conversation["created_at"] else None,
            "updated_at": conversation["updated_at"].isoformat() if conversation["updated_at"] else None,
            "agent_id": conversation["agent_id"],
            "messages": messages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversation")

@router.put("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    request: UpdateConversationRequest,
    user_id: Optional[str] = Depends(get_optional_current_user)
) -> Dict[str, Any]:
    """
    Update conversation metadata
    """
    try:
        pg_conn = PostgresConnection()
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if request.title is not None:
            update_fields.append("title = %s")
            params.append(request.title)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = %s")
        params.append(datetime.now(timezone.utc))
        
        # Add conversation_id and user_id for WHERE clause
        if user_id:
            params.extend([conversation_id, user_id])
            where_clause = "WHERE conversation_id = %s AND user_id = %s"
        else:
            params.extend([conversation_id, 'anonymous'])
            where_clause = "WHERE conversation_id = %s AND user_id = %s"
        
        query = f"""
            UPDATE conversations
            SET {', '.join(update_fields)}
            {where_clause}
            RETURNING conversation_id, title, created_at, updated_at, agent_id
        """
        
        result = await pg_conn.execute_query(query, tuple(params))
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        row = result[0]
        return {
            "id": row["conversation_id"],
            "title": row["title"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            "agent_id": row["agent_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update conversation")

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: Optional[str] = Depends(get_optional_current_user)
) -> Dict[str, str]:
    """
    Delete a conversation and all its messages
    """
    try:
        pg_conn = PostgresConnection()
        
        # Delete messages first (due to foreign key constraint)
        if user_id:
            msg_query = """
                DELETE FROM messages
                WHERE conversation_id IN (
                    SELECT conversation_id FROM conversations
                    WHERE conversation_id = %s AND user_id = %s
                )
            """
            await pg_conn.execute_query(msg_query, (conversation_id, user_id))
            
            # Delete the conversation
            conv_query = """
                DELETE FROM conversations
                WHERE conversation_id = %s AND user_id = %s
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(conv_query, (conversation_id, user_id))
        else:
            # For anonymous users
            msg_query = """
                DELETE FROM messages
                WHERE conversation_id IN (
                    SELECT conversation_id FROM conversations
                    WHERE conversation_id = %s AND user_id = 'anonymous'
                )
            """
            await pg_conn.execute_query(msg_query, (conversation_id,))
            
            conv_query = """
                DELETE FROM conversations
                WHERE conversation_id = %s AND user_id = 'anonymous'
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(conv_query, (conversation_id,))
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")

@router.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: str,
    request: AddMessageRequest,
    user_id: Optional[str] = Depends(get_optional_current_user)
) -> Dict[str, Any]:
    """
    Add a message to a conversation
    """
    try:
        pg_conn = PostgresConnection()
        
        # Verify conversation belongs to user
        if user_id:
            verify_query = """
                SELECT conversation_id FROM conversations
                WHERE conversation_id = %s AND user_id = %s
            """
            verify_result = await pg_conn.execute_query(verify_query, (conversation_id, user_id))
        else:
            # For anonymous users
            verify_query = """
                SELECT conversation_id FROM conversations
                WHERE conversation_id = %s AND user_id = 'anonymous'
            """
            verify_result = await pg_conn.execute_query(verify_query, (conversation_id,))
        
        if not verify_result or len(verify_result) == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Generate message ID
        import uuid
        message_id = str(uuid.uuid4())
        
        # Insert message
        query = """
            INSERT INTO messages (
                message_id, conversation_id, role, content, timestamp,
                model, parent_message_id, metadata, thinking_state, transaction_data
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING message_id, role, content, timestamp, model, parent_message_id
        """
        
        timestamp = datetime.now(timezone.utc)
        
        # Convert dicts to JSON strings for storage
        metadata_json = json.dumps(request.metadata) if request.metadata else None
        thinking_state_json = json.dumps(request.thinking_state) if request.thinking_state else None
        transaction_data_json = json.dumps(request.transaction_data) if request.transaction_data else None
        
        result = await pg_conn.execute_query(
            query,
            (
                message_id, conversation_id, request.role, request.content, timestamp,
                request.model, request.parent_message_id, metadata_json, thinking_state_json, transaction_data_json
            )
        )
        
        # Update conversation's updated_at timestamp
        update_query = """
            UPDATE conversations
            SET updated_at = %s
            WHERE conversation_id = %s
        """
        
        await pg_conn.execute_query(update_query, (timestamp, conversation_id))
        
        if result and len(result) > 0:
            row = result[0]
            response = {
                "id": row["message_id"],
                "role": row["role"],
                "content": row["content"],
                "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
                "model": row["model"],
                "parentMessageId": row["parent_message_id"]
            }
            
            if request.thinking_state:
                response["thinkingState"] = request.thinking_state
            if request.transaction_data:
                response["transaction"] = request.transaction_data
                
            return response
        
        raise HTTPException(status_code=500, detail="Failed to create message")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail="Failed to create message")