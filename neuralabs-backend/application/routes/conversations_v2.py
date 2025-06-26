"""
Conversations API routes v2 - Using single JSON document for conversation content
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import logging
import uuid
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

class UpdateThinkingStateRequest(BaseModel):
    thinking_state: Dict[str, Any]

@router.get("/conversations")
async def get_conversations(
    user_id: Optional[str] = Depends(get_optional_current_user),
    agent_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get all conversations for a user, optionally filtered by agent
    """
    if not user_id:
        # Return empty list for anonymous users
        return []
    
    try:
        pg_conn = PostgresConnection()
        
        # Build query with optional agent filter
        if agent_id:
            query = """
                SELECT 
                    c.conversation_id,
                    c.title,
                    c.created_at,
                    c.updated_at,
                    c.agent_id,
                    c.conversation_content,
                    CASE 
                        WHEN jsonb_array_length(c.conversation_content->'messages') > 0 
                        THEN c.conversation_content->'messages'->-1
                        ELSE NULL
                    END as last_message
                FROM conversations c
                WHERE c.user_id = %s AND c.agent_id = %s
                ORDER BY c.updated_at DESC
            """
            result = await pg_conn.execute_query(query, (user_id, agent_id))
        else:
            query = """
                SELECT 
                    c.conversation_id,
                    c.title,
                    c.created_at,
                    c.updated_at,
                    c.agent_id,
                    c.conversation_content,
                    CASE 
                        WHEN jsonb_array_length(c.conversation_content->'messages') > 0 
                        THEN c.conversation_content->'messages'->-1
                        ELSE NULL
                    END as last_message
                FROM conversations c
                WHERE c.user_id = %s
                ORDER BY c.updated_at DESC
            """
            result = await pg_conn.execute_query(query, (user_id,))
        
        conversations = []
        for row in result:
            last_msg = None
            if row["last_message"]:
                last_msg = {
                    'content': row["last_message"].get('content'),
                    'role': row["last_message"].get('role'),
                    'timestamp': row["last_message"].get('timestamp')
                }
            
            conversations.append({
                "id": row["conversation_id"],
                "title": row["title"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
                "agent_id": row["agent_id"],
                "last_message": last_msg
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
    Create a new conversation with empty message array
    """
    # Use 'anonymous' for unauthenticated users
    if not user_id:
        user_id = 'anonymous'
    
    try:
        pg_conn = PostgresConnection()
        
        # Generate conversation ID
        conversation_id = str(uuid.uuid4())
        
        query = """
            INSERT INTO conversations (
                conversation_id, user_id, title, agent_id, 
                created_at, updated_at, conversation_content
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING conversation_id, title, created_at, updated_at, agent_id
        """
        
        now = datetime.now(timezone.utc)
        initial_content = {"messages": []}
        
        result = await pg_conn.execute_query(
            query, 
            (conversation_id, user_id, request.title, request.agent_id, 
             now, now, json.dumps(initial_content))
        )
        
        if result and len(result) > 0:
            row = result[0]
            return {
                "id": row["conversation_id"],
                "title": row["title"],
                "created_at": row["created_at"].isoformat(),
                "updated_at": row["updated_at"].isoformat(),
                "agent_id": row["agent_id"],
                "messages": []
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
    Get a specific conversation with all messages from JSON content
    """
    try:
        pg_conn = PostgresConnection()
        
        # First verify the conversation belongs to the user
        if user_id:
            conv_query = """
                SELECT conversation_id, title, created_at, updated_at, 
                       agent_id, conversation_content
                FROM conversations
                WHERE conversation_id = %s AND user_id = %s
            """
            conv_result = await pg_conn.execute_query(conv_query, (conversation_id, user_id))
        else:
            # For anonymous users, only allow access to anonymous conversations
            conv_query = """
                SELECT conversation_id, title, created_at, updated_at, 
                       agent_id, conversation_content
                FROM conversations
                WHERE conversation_id = %s AND user_id = 'anonymous'
            """
            conv_result = await pg_conn.execute_query(conv_query, (conversation_id,))
        
        if not conv_result or len(conv_result) == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = conv_result[0]
        
        # Extract messages from the JSON content
        content = conversation["conversation_content"] or {"messages": []}
        messages = content.get("messages", [])
        
        # Transform messages to match frontend format
        formatted_messages = []
        for msg in messages:
            message_data = {
                "id": msg.get("id"),
                "role": msg.get("role"),
                "content": msg.get("content"),
                "timestamp": msg.get("timestamp"),
                "model": msg.get("model"),
                "parentMessageId": msg.get("parentMessageId")
            }
            
            # Add optional fields if they exist
            if msg.get("metadata"):
                message_data["metadata"] = msg["metadata"]
            if msg.get("thinkingState"):
                message_data["thinkingState"] = msg["thinkingState"]
            if msg.get("transaction"):
                message_data["transaction"] = msg["transaction"]
                
            formatted_messages.append(message_data)
        
        return {
            "id": conversation["conversation_id"],
            "title": conversation["title"],
            "created_at": conversation["created_at"].isoformat() if conversation["created_at"] else None,
            "updated_at": conversation["updated_at"].isoformat() if conversation["updated_at"] else None,
            "agent_id": conversation["agent_id"],
            "messages": formatted_messages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversation")

@router.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: str,
    request: AddMessageRequest,
    user_id: Optional[str] = Depends(get_optional_current_user)
) -> Dict[str, Any]:
    """
    Add a message to the conversation's JSON content
    """
    try:
        pg_conn = PostgresConnection()
        
        # Generate message ID
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Build the message object
        new_message = {
            "id": message_id,
            "role": request.role,
            "content": request.content,
            "timestamp": timestamp
        }
        
        # Add optional fields
        if request.model:
            new_message["model"] = request.model
        if request.parent_message_id:
            new_message["parentMessageId"] = request.parent_message_id
        if request.metadata:
            new_message["metadata"] = request.metadata
        if request.thinking_state:
            new_message["thinkingState"] = request.thinking_state
        if request.transaction_data:
            new_message["transaction"] = request.transaction_data
        
        # Update the conversation content by appending the message
        if user_id:
            update_query = """
                UPDATE conversations
                SET conversation_content = jsonb_set(
                    COALESCE(conversation_content, '{"messages": []}'::jsonb),
                    '{messages}',
                    COALESCE(conversation_content->'messages', '[]'::jsonb) || %s::jsonb
                ),
                updated_at = %s
                WHERE conversation_id = %s AND user_id = %s
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(
                update_query,
                (json.dumps(new_message), datetime.now(timezone.utc), conversation_id, user_id)
            )
        else:
            # For anonymous users
            update_query = """
                UPDATE conversations
                SET conversation_content = jsonb_set(
                    COALESCE(conversation_content, '{"messages": []}'::jsonb),
                    '{messages}',
                    COALESCE(conversation_content->'messages', '[]'::jsonb) || %s::jsonb
                ),
                updated_at = %s
                WHERE conversation_id = %s AND user_id = 'anonymous'
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(
                update_query,
                (json.dumps(new_message), datetime.now(timezone.utc), conversation_id)
            )
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Return the created message
        response = {
            "id": message_id,
            "role": request.role,
            "content": request.content,
            "timestamp": timestamp,
            "model": request.model,
            "parentMessageId": request.parent_message_id
        }
        
        if request.thinking_state:
            response["thinkingState"] = request.thinking_state
        if request.transaction_data:
            response["transaction"] = request.transaction_data
            
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail="Failed to create message")

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
    Delete a conversation
    """
    try:
        pg_conn = PostgresConnection()
        
        if user_id:
            query = """
                DELETE FROM conversations
                WHERE conversation_id = %s AND user_id = %s
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(query, (conversation_id, user_id))
        else:
            query = """
                DELETE FROM conversations
                WHERE conversation_id = %s AND user_id = 'anonymous'
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(query, (conversation_id,))
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")

@router.put("/conversations/{conversation_id}/messages/{message_id}/thinking-state")
async def update_message_thinking_state(
    conversation_id: str,
    message_id: str,
    request: UpdateThinkingStateRequest,
    user_id: Optional[str] = Depends(get_optional_current_user)
) -> Dict[str, str]:
    """
    Update the thinking state for a specific message in the conversation
    """
    try:
        pg_conn = PostgresConnection()
        
        # Build the JSONB path to update the specific message
        # We need to find the index of the message in the array and update it
        if user_id:
            query = """
                WITH message_index AS (
                    SELECT ordinality - 1 as idx
                    FROM conversations,
                    jsonb_array_elements(conversation_content->'messages') WITH ORDINALITY
                    WHERE conversation_id = %s 
                    AND user_id = %s
                    AND value->>'id' = %s
                )
                UPDATE conversations
                SET conversation_content = jsonb_set(
                    conversation_content,
                    array['messages', message_index.idx::text, 'thinkingState']::text[],
                    %s::jsonb
                ),
                updated_at = %s
                FROM message_index
                WHERE conversations.conversation_id = %s 
                AND conversations.user_id = %s
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(
                query,
                (conversation_id, user_id, message_id, json.dumps(request.thinking_state), 
                 datetime.now(timezone.utc), conversation_id, user_id)
            )
        else:
            # For anonymous users
            query = """
                WITH message_index AS (
                    SELECT ordinality - 1 as idx
                    FROM conversations,
                    jsonb_array_elements(conversation_content->'messages') WITH ORDINALITY
                    WHERE conversation_id = %s 
                    AND user_id = 'anonymous'
                    AND value->>'id' = %s
                )
                UPDATE conversations
                SET conversation_content = jsonb_set(
                    conversation_content,
                    array['messages', message_index.idx::text, 'thinkingState']::text[],
                    %s::jsonb
                ),
                updated_at = %s
                FROM message_index
                WHERE conversations.conversation_id = %s 
                AND conversations.user_id = 'anonymous'
                RETURNING conversation_id
            """
            result = await pg_conn.execute_query(
                query,
                (conversation_id, message_id, json.dumps(request.thinking_state), 
                 datetime.now(timezone.utc), conversation_id)
            )
        
        if not result or len(result) == 0:
            raise HTTPException(status_code=404, detail="Message not found in conversation")
        
        return {"message": "Thinking state updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating thinking state: {e}")
        raise HTTPException(status_code=500, detail="Failed to update thinking state")