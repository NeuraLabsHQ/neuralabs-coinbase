// src/utils/agent-api.js

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

class AgentAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization token (you might need to implement this based on your auth system)
  getAuthToken() {
    // Replace this with your actual token retrieval logic
    // For example, from sessionStorage, context, or wherever you store the token
    console.log('Retrieving auth token');
    const token = sessionStorage.getItem('wallet_auth_token') || sessionStorage.getItem('zklogin_jwt_token');
    return token
  }

  // Create a new agent
  async createAgent(agentData) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/set-data/agent/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  // Get agent by ID
  async getAgent(agentId) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/get-data/agent/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw error;
    }
  }

  // Update agent
  async updateAgent(agentId, agentData) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/set-data/agent/update/${agentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  // Delete agent
  async deleteAgent(agentId) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/set-data/agent/delete/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  // Get all agents
  async getAllAgents() {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/get-data/agent/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching all agents:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const agentAPI = new AgentAPI();

// Export the class as well for potential custom usage
export default AgentAPI;