// src/utils/agent-api.js

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

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
      
      const response = await fetch(`${this.baseURL}/api/dashboard/flows/${agentId}`, {
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
      // The backend returns an array with a single RealDictRow object
      // Extract the first element if it's an array
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
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
      
      // Include agent_id in the payload as expected by the backend
      const payload = {
        ...agentData,
        agent_id: agentId
      };
      
      const response = await fetch(`${this.baseURL}/api/set-data/agent/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
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

  // Save workflow for an agent
  async saveWorkflow(agentId, workflowData, isPublished = false) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/set-data/agent/${agentId}/workflow`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: workflowData,
          is_published: isPublished
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw error;
    }
  }

  // Save metadata for an agent
  async saveMetadata(agentId, markdownObject) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/set-data/agent/${agentId}/metadata`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown_object: markdownObject
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const agentAPI = new AgentAPI();

// Export the class as well for potential custom usage
export default AgentAPI;