-- Add conversation_content column to store all messages as JSON
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS conversation_content JSONB DEFAULT '{"messages": []}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN conversations.conversation_content IS 'Stores all messages, thinking states, and transactions as a single JSON document';

-- Create index for better JSON query performance
CREATE INDEX IF NOT EXISTS idx_conversations_content_messages 
ON conversations USING GIN ((conversation_content -> 'messages'));

-- Example of how the JSON structure should look:
-- {
--   "messages": [
--     {
--       "id": "msg_123",
--       "role": "user",
--       "content": "Hello",
--       "timestamp": "2025-06-20T10:42:34.986041",
--       "model": "gpt-4"
--     },
--     {
--       "id": "msg_124",
--       "role": "assistant",
--       "content": "Hi there!",
--       "timestamp": "2025-06-20T10:42:40.038788",
--       "parentMessageId": "msg_123",
--       "thinkingState": {
--         "executionSteps": [...],
--         "timeElapsed": 5.2
--       },
--       "transaction": {
--         "to": "0x...",
--         "value": "100"
--       }
--     }
--   ]
-- }