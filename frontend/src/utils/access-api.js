// src/utils/access-api.js
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// Helper function for simulated data during development
const simulateApiCall = (response, delay = 600) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ data: response });
    }, delay);
  });
};

// Helper to get random creation date
const getRandomCreationDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

class AccessManagementAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization token
  getAuthToken() {
    console.log('Retrieving auth token for access management');
    const token = sessionStorage.getItem('wallet_auth_token') || sessionStorage.getItem('zklogin_jwt_token');
    return token;
  }

  // Make authenticated request
  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Token expired or invalid
        sessionStorage.removeItem('wallet_auth_token');
        sessionStorage.removeItem('wallet_user_id');
        sessionStorage.removeItem('zklogin_jwt_token');
        throw new Error('Authentication token expired. Please login again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

}

// Create instance of API class
const api = new AccessManagementAPI();

// Access Management API
export const accessManagementApi = {
  // Get all flows with categorization
  getAllFlowsData: async () => {
    try {
      const response = await api.makeAuthenticatedRequest(
        `${api.baseURL}/api/dashboard/all`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch flows data:', error);
      // Return empty structure if not authenticated
      if (error.message.includes('No authentication token')) {
        return { data: { my_flows: [], other_flows: {} } };
      }
      throw error;
    }
  },

  // Get recently opened flows
  getRecentFlows: async (limit = 10) => {
    try {
      const response = await api.makeAuthenticatedRequest(
        `${api.baseURL}/api/dashboard/flows/recent?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch recent flows:', error);
      throw error;
    }
  },

  // Get flows under development
  getUnderDevelopmentFlows: async () => {
    try {
      const response = await api.makeAuthenticatedRequest(
        `${api.baseURL}/api/dashboard/flows/underdevelopment`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch development flows:', error);
      throw error;
    }
  },

  // Get published flows
  getPublishedFlows: async () => {
    try {
      const response = await api.makeAuthenticatedRequest(
        `${api.baseURL}/api/dashboard/flows/published`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch published flows:', error);
      throw error;
    }
  },

  // Get shared flows
  getSharedFlows: async () => {
    try {
      const response = await api.makeAuthenticatedRequest(
        `${api.baseURL}/api/dashboard/flows/shared`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch shared flows:', error);
      throw error;
    }
  },

  // Get flow details
  getFlowDetails: async (agentId) => {
    try {
      const response = await api.makeAuthenticatedRequest(
        `${api.baseURL}/api/dashboard/flows/${agentId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch flow details:', error);
      throw error;
    }
  },

  // Get agent details (alias for getFlowDetails)
  getAgentDetails: async (agentId) => {
    try {
      const response = await api.makeAuthenticatedRequest(
        `${api.baseURL}/api/dashboard/flows/${agentId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch agent details:', error);
      throw error;
    }
  },

  // Get all access levels (kept for compatibility)
  getAccessLevels: () => simulateApiCall({
    levels: [
      { id: 6, name: "Owner", flows: [] },
      { id: 5, name: "Level 5", flows: [] },
      { id: 4, name: "Level 4", flows: [] },
      { id: 3, name: "Level 3", flows: [] },
      { id: 2, name: "Level 2", flows: [] },
      { id: 1, name: "Level 1", flows: []}
    ]
  }),
  
  // Get all flows (kept for backward compatibility)
  getAllFlows: async () => {
    // This method now calls getAllFlowsData and formats the response
    try {
      const response = await accessManagementApi.getAllFlowsData();
      const allFlows = [];
      
      // Add my flows
      if (response.data.my_flows) {
        allFlows.push(...response.data.my_flows.map(flow => ({
          id: flow.agent_id,
          name: flow.name,
          description: flow.description,
          icon: flow.name.charAt(0).toUpperCase(),
          accessLevel: flow.access_level || 6,
          creationDate: flow.creation_date,
          owner: flow.owner || "You",
          status: flow.status
        })));
      }
      
      // Add other flows
      if (response.data.other_flows) {
        Object.values(response.data.other_flows).forEach(levelFlows => {
          allFlows.push(...levelFlows.map(flow => ({
            id: flow.agent_id,
            name: flow.name,
            description: flow.description,
            icon: flow.name.charAt(0).toUpperCase(),
            accessLevel: flow.access_level,
            creationDate: flow.creation_date,
            status: flow.status
          })));
        });
      }
      
      return { data: allFlows };
    } catch (error) {
      console.error('Failed to get all flows:', error);
      return { data: [] };
    }
  },
  
  // Get details about a specific flow's access
  getFlowAccess: async (flowId) => {
    try {
      const response = await accessManagementApi.getFlowDetails(flowId);
      const flow = response.data;
      
      return {
        data: {
          id: flow.agent_id,
          name: flow.name,
          creationDate: flow.creation_date,
          owner: flow.owner,
          accessLevel: flow.access_level,
          status: flow.status,
          description: flow.description,
          lastEditedTime: flow.last_edited_time,
          version: flow.version,
          nftId: flow.nft_id,
          contractId: flow.contract_id,
          chain: flow.chain,
          tags: flow.tags,
          socials: flow.socials,
          license: flow.license
        }
      };
    } catch (error) {
      console.error('Failed to get flow access details:', error);
      throw error;
    }
  },
  
  // Update access for a flow (placeholder - implement when backend endpoint is available)
  updateFlowAccess: (flowId, data) => simulateApiCall({ 
    success: true, 
    message: "Access updated successfully" 
  }, 1000),
  
  // Add a new address to a flow (placeholder - implement when backend endpoint is available)
  addAddressToFlow: (flowId, address, level) => simulateApiCall({
    success: true,
    message: "Address added successfully"
  }, 1000),
  
  // Remove an address from a flow (placeholder - implement when backend endpoint is available)
  removeAddressFromFlow: (flowId, address) => simulateApiCall({
    success: true,
    message: "Address removed successfully"
  }, 1000)
};