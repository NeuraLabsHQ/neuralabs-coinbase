# Streaming Chat Integration Guide

## Overview

The new streaming chat system provides real-time flow execution through a WebSocket chain:

**Frontend → NeuraLabs Backend → HPC Execution Engine**

## Components Created

### 1. Backend WebSocket Route
- **File**: `/neuralabs-backend/application/routes/chat.py`
- **Endpoint**: `ws://localhost:8000/api/chat/execute/{agent_id}`
- **Features**:
  - Authentication via JWT or user_id
  - Database workflow retrieval (published/unpublished tables)
  - Format conversion (Frontend JSON → HPC YAML)
  - Real-time streaming proxy

### 2. Frontend API Client
- **File**: `/frontend/src/utils/flow-execution-api.js`
- **Exports**: `FlowExecutionAPI` class and `useFlowExecution` hook
- **Features**:
  - WebSocket connection management
  - Event-driven message handling
  - React hook for easy integration

### 3. Streaming Chat Interface
- **File**: `/frontend/src/components/chat_interface/StreamingChatInterface.jsx`
- **Features**:
  - Real-time chat with typing indicators
  - Connection status display
  - Error handling and retries
  - Auto-scrolling and message management

### 4. Streaming Chat Page
- **File**: `/frontend/src/pages/streaming_chat_page.jsx`
- **Route**: `/streaming-chat/:agentId`
- **Features**:
  - Chat history management
  - Agent-specific conversations
  - Integration with existing UI patterns

## Usage Examples

### Option 1: Replace existing chat (Recommended)
Update your existing chat routes to use the streaming interface:

```jsx
// In App.jsx, replace ChatInterfacePage with StreamingChatPage
<Route path="/chat/:agentId" element={
  <Layout>
    <StreamingChatPage />
  </Layout>
} />
```

### Option 2: Add as new route
Keep both systems and use streaming for specific agents:

```jsx
// Access via: /streaming-chat/your-agent-id
<Route path="/streaming-chat/:agentId" element={
  <Layout>
    <StreamingChatPage />
  </Layout>
} />
```

### Option 3: Direct component usage
Use the StreamingChatInterface directly in any component:

```jsx
import StreamingChatInterface from '../components/chat_interface/StreamingChatInterface';

function MyComponent() {
  return (
    <StreamingChatInterface
      agentId="your-agent-id"
      userId="user-123"
      agentData={agentInfo}
      isLanding={true}
    />
  );
}
```

## Configuration

### Backend Requirements
1. **Dependencies**: Added `websockets==12.0` to requirements.txt
2. **Database**: Queries `agents`, `published`, and `unpublished` tables
3. **HPC Connection**: Connects to `ws://localhost:8001/ws/execute/{flow_id}`

### Frontend Environment
```env
REACT_APP_API_URL=http://localhost:8000
```

## Event Types Supported

The streaming system handles these real-time events:

- `status` - Connection and processing updates
- `flow_started` - Flow execution begins
- `element_started` - Individual node processing
- `llm_chunk` - Streaming AI response chunks
- `element_completed` - Node finished processing
- `final_output` - Complete response ready
- `flow_completed` - Successful completion
- `flow_error` - Error occurred

## Advantages Over Direct HPC Connection

1. **Authentication**: Proper user authentication and authorization
2. **Database Integration**: Automatic workflow retrieval from your database
3. **Format Conversion**: Seamless format conversion between frontend and HPC
4. **Error Handling**: Better error management and user feedback
5. **Scalability**: Centralized connection management
6. **Security**: No direct HPC exposure to frontend

## Migration from Existing Chat

To migrate from the existing ChatInterface to StreamingChatInterface:

1. **Replace the route** in App.jsx
2. **Update authentication** to pass real user IDs
3. **Test the flow** with your specific agent workflows
4. **Remove old WebSocket code** from ChatPage.jsx if not needed

The new system is designed to be a drop-in replacement with enhanced features and better architecture.