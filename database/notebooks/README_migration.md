# Database Migration for Thinking State Persistence

This migration adds the necessary columns to support full conversation history with thinking states and transaction data.

## Prerequisites

1. Install required Python packages:
```bash
pip install psycopg2-binary python-dotenv
```

2. Ensure you have a `.env` file in the `database/` directory with:
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=neuralabs
POSTGRES_USER=neuralabs_postgres
POSTGRES_PASSWORD=neurapass@2025
```

## Running the Migration

1. Navigate to the notebooks directory:
```bash
cd database/notebooks
```

2. Run the migration script:
```bash
python migration.py
```

## What This Migration Does

### Messages Table Updates:
- Adds `thinking_state` (JSONB) - Stores the complete thinking UI state
- Adds `transaction_data` (JSONB) - Stores proposed blockchain transactions
- Adds `metadata` (JSONB) - Additional message metadata
- Adds `parent_message_id` (VARCHAR) - Links assistant messages to user messages
- Adds `model` (VARCHAR) - Stores the AI model used
- Renames `sender_type` to `role` (if needed)
- Renames `created_at` to `timestamp` (if needed)

### Conversations Table Updates:
- Adds `updated_at` (TIMESTAMP) - Track last update time
- Adds `agent_id` (VARCHAR) - Reference to the agent used

### Performance Improvements:
- Creates index on `messages.conversation_id`
- Creates index on `messages.parent_message_id`
- Updates constraints for the renamed columns

## Verification

After running the migration, the script will verify that all columns exist:

```
Verifying migration...
Checking messages table columns:
  ✓ message_id
  ✓ conversation_id
  ✓ role
  ✓ content
  ✓ timestamp
  ✓ model
  ✓ parent_message_id
  ✓ metadata
  ✓ thinking_state
  ✓ transaction_data

Checking conversations table columns:
  ✓ conversation_id
  ✓ user_id
  ✓ title
  ✓ created_at
  ✓ updated_at
  ✓ agent_id

Checking indexes:
  ✓ idx_messages_conversation_id
  ✓ idx_messages_parent_message_id
```

## Rollback

If you need to rollback the changes, you can manually drop the added columns:

```sql
-- Remove columns from messages table
ALTER TABLE messages DROP COLUMN IF EXISTS thinking_state;
ALTER TABLE messages DROP COLUMN IF EXISTS transaction_data;
ALTER TABLE messages DROP COLUMN IF EXISTS metadata;
ALTER TABLE messages DROP COLUMN IF EXISTS parent_message_id;
ALTER TABLE messages DROP COLUMN IF EXISTS model;

-- Remove columns from conversations table
ALTER TABLE conversations DROP COLUMN IF EXISTS updated_at;
ALTER TABLE conversations DROP COLUMN IF EXISTS agent_id;

-- Drop indexes
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_parent_message_id;
```

## Troubleshooting

1. **Connection Error**: Check your `.env` file and ensure PostgreSQL is running
2. **Permission Error**: Ensure your database user has ALTER TABLE permissions
3. **Column Already Exists**: The script safely handles existing columns