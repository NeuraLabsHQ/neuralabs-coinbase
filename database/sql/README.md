# Database Schema for Conversation Storage

This directory contains SQL scripts for the conversation storage system.

## Tables

### conversations
Stores conversation metadata:
- `conversation_id` - Unique identifier for the conversation
- `user_id` - User who owns the conversation (or 'anonymous' for unauthenticated users)
- `title` - Display title of the conversation
- `agent_id` - Optional agent/flow ID associated with the conversation
- `created_at` - Timestamp when conversation was created
- `updated_at` - Timestamp when conversation was last updated

### messages
Stores individual messages within conversations:
- `message_id` - Unique identifier for the message
- `conversation_id` - Foreign key to conversations table
- `role` - Either 'user' or 'assistant'
- `content` - The message content
- `timestamp` - When the message was created
- `model` - Optional model ID used for this message
- `parent_message_id` - Optional reference to parent message
- `metadata` - JSONB field for additional metadata
- `thinking_state` - JSONB field storing the thinking UI state
- `transaction_data` - JSONB field storing blockchain transaction data

## Setup

To initialize the database tables, run:

```bash
psql -U $POSTGRES_USER -d $POSTGRES_DB -f init_conversations.sql
```

## Features

1. **Anonymous User Support**: Conversations can be created without authentication using 'anonymous' as the user_id
2. **Thinking State Persistence**: The thinking UI state (execution steps, timing, etc.) is saved with each message
3. **Transaction Storage**: Blockchain transactions proposed by the AI are stored and can be retrieved later
4. **Conversation History**: Full conversation history with all messages, thinking states, and transactions
5. **Automatic Timestamps**: Updated_at field is automatically updated via trigger