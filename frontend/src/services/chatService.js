/**
 * Chat Service - API calls for managing chat conversations and messages
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

class ChatService {
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
      const response = await fetch(`${API_BASE_URL}/api/conversations/conversations`, {
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
      const response = await fetch(`${API_BASE_URL}/api/conversations/conversations/${conversationId}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/conversations/conversations`, {
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
      const response = await fetch(`${API_BASE_URL}/api/conversations/conversations/${conversationId}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/conversations/conversations/${conversationId}`, {
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
   */
  async addMessage(conversationId, messageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/conversations/${conversationId}/messages`, {
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
   * Save thinking state for a message
   */
  async saveThinkingState(conversationId, messageId, thinkingState) {
    try {
      // This could be a separate endpoint or part of message update
      // For now, we'll handle it through message metadata
      return this.addMessage(conversationId, {
        id: messageId,
        thinkingState: thinkingState
      });
    } catch (error) {
      console.error('Error saving thinking state:', error);
      throw error;
    }
  }

  /**
   * Save transaction data for a message
   */
  async saveTransaction(conversationId, messageId, transactionData) {
    try {
      // This could be a separate endpoint or part of message update
      // For now, we'll handle it through message metadata
      return this.addMessage(conversationId, {
        id: messageId,
        transaction: transactionData
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ChatService();