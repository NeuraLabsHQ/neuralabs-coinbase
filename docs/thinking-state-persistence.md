# Thinking State Persistence Documentation

## Overview
The NeuraLabs chat interface now supports full persistence of thinking UI states, allowing users to see the complete execution history when they return to previous conversations.

## How It Works

### 1. Data Flow
When a user sends a message:
1. User message is saved with `metadata: { hasThinkingState: true }`
2. WebSocket connection tracks execution steps in real-time
3. Thinking state is stored in `messageThinkingStates[messageId]`
4. When assistant responds, the thinking state is saved with the message

### 2. Database Schema
Messages table includes:
- `thinking_state` (JSONB): Stores complete thinking UI state
- `transaction_data` (JSONB): Stores proposed blockchain transactions
- `metadata` (JSONB): Additional message metadata
- `parent_message_id`: Links assistant messages to user messages

### 3. Thinking State Structure
```json
{
  "isThinking": false,
  "steps": [],
  "currentStep": null,
  "searchResults": [],
  "timeElapsed": 45,
  "executionSteps": [
    {
      "elementId": "llm_1",
      "elementName": "LLM",
      "elementType": "llm",
      "description": "Generating response",
      "status": "completed",
      "outputs": {},
      "executionTime": 12.3
    }
  ],
  "messageId": "user-message-id"
}
```

### 4. Frontend Implementation

#### ChatPage.jsx Changes:
- Tracks thinking states per message ID in `messageThinkingStates`
- Saves thinking state with assistant messages
- Restores thinking states when loading conversations

#### ChatInterface.jsx:
- Renders ThinkingUI for user messages with thinking states
- Passes `shouldPersist={true}` for saved states
- Handles transaction detection from execution steps

#### ThinkingUI Component:
- Displays execution steps from saved state
- Shows completed status for historical thinking
- Handles both live and saved thinking states

### 5. API Endpoints

#### Save Message with Thinking State:
```javascript
POST /api/conversations/{id}/messages
{
  "role": "assistant",
  "content": "Response text",
  "parent_message_id": "user-msg-id",
  "thinking_state": { /* thinking state object */ },
  "transaction_data": { /* optional transaction */ }
}
```

#### Retrieve Conversation with Thinking States:
```javascript
GET /api/conversations/{id}
// Returns messages with thinking_state and transaction_data fields
```

## Usage

### For Developers:
1. Run the migration script to ensure database has required columns:
   ```sql
   psql -d your_database -f database/migrations/add_thinking_state_columns.sql
   ```

2. Thinking states are automatically saved when:
   - Flow execution completes
   - Assistant message is generated
   - Transaction is detected

3. To test thinking state persistence:
   - Send a message that triggers thinking UI
   - Wait for completion
   - Navigate away and return to the conversation
   - Thinking state should be restored

### For Users:
- All thinking processes are automatically saved
- Previous conversations show complete execution history
- Transaction proposals are preserved and can be executed later
- No action required - it works automatically

## Technical Notes

1. **Message ID Mapping**: Thinking states are stored by user message ID, not assistant message ID
2. **Parent-Child Relationship**: Assistant messages reference their parent user message
3. **Transaction Detection**: Transactions in `end` blocks are automatically detected
4. **Performance**: Thinking states are loaded only when conversation is opened
5. **Backward Compatibility**: System handles messages without thinking states gracefully