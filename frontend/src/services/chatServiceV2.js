/**
 * Chat Service V2 - API calls for managing chat conversations with JSON structure
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

class ChatServiceV2 {
  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const token = sessionStorage.getItem('wallet_auth_token');
    console.log('Using token:', token);
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'API request failed');
    }
    return response.json();
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/v2/conversations`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/v2/conversations/${conversationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title, agentId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/v2/conversations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ title, agent_id: agentId })
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Update conversation metadata (e.g., title)
   */
  async updateConversation(conversationId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/v2/conversations/${conversationId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/v2/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Add a message to a conversation
   * This appends to the conversation_content JSON array
   */
  async addMessage(conversationId, messageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/v2/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          role: messageData.role,
          content: messageData.content,
          model: messageData.model,
          parent_message_id: messageData.parentMessageId,
          metadata: messageData.metadata,
          thinking_state: messageData.thinkingState,
          transaction_data: messageData.transaction
        })
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Update a message's thinking state
   * This updates the thinking state for a specific message in the conversation
   */
  async updateMessageThinkingState(conversationId, messageId, thinkingState) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/v2/conversations/${conversationId}/messages/${messageId}/thinking-state`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          thinking_state: thinkingState
        })
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating message thinking state:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ChatServiceV2();