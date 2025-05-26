// src/utils/flow-builder-api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class FlowBuilderAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization token
  getAuthToken() {
    console.log('Retrieving auth token for flow builder');
    const token = sessionStorage.getItem('wallet_auth_token');
    return token;
  }

  // Get all flowbuilder blocks
  async getAllBlocks() {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/flowbuilder/blocks`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      console.error('Error fetching blocks:', error);
      throw error;
    }
  }

  // Get blocks by category
  async getBlocksByCategory(category) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/flowbuilder/blocks/category/${encodeURIComponent(category)}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      console.error('Error fetching blocks by category:', error);
      throw error;
    }
  }

  // Get block by type
  async getBlockByType(blockType) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/flowbuilder/blocks/type/${encodeURIComponent(blockType)}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      console.error('Error fetching block by type:', error);
      throw error;
    }
  }

  // Get all categories with block counts
  async getCategories() {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/flowbuilder/categories`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Search blocks
  async searchBlocks(searchTerm) {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/flowbuilder/blocks/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      console.error('Error searching blocks:', error);
      throw error;
    }
  }

  // Get blocks grouped by category
  async getBlocksGroupedByCategory() {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/flowbuilder/blocks/grouped`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      console.error('Error fetching grouped blocks:', error);
      throw error;
    }
  }

  // Get block icons mapping
  async getBlockIcons() {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${this.baseURL}/api/flowbuilder/blocks/icons`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      console.error('Error fetching block icons:', error);
      throw error;
    }
  }

  // Transform API block data to match the expected nodeType format
  transformBlockToNodeType(block) {
    return {
      name: block.type,
      description: block.element_description,
      icon: block.icon,
      category: block.category,
      color: this.getCategoryColor(block.category),
      inputs: this.transformSchema(block.input_schema),
      outputs: this.transformSchema(block.output_schema),
      hyperparameters: this.transformHyperParameters(block.hyper_parameters),
      // Additional fields from the original block data
      id: block.id,
      createdAt: block.created_at,
      updatedAt: block.updated_at
    };
  }

  // Transform schema to match expected format
  transformSchema(schema) {
    if (!schema) return [];
    
    return Object.entries(schema).map(([key, config]) => ({
      name: key,
      type: config.type || 'string',
      required: config.required || false,
      description: config.description || '',
      default: config.default,
      ...config
    }));
  }

  // Transform hyperparameters to match expected format
  transformHyperParameters(hyperParams) {
    if (!hyperParams) return [];
    
    return Object.entries(hyperParams).map(([key, config]) => ({
      name: key,
      type: config.type || 'string',
      required: config.required || false,
      description: config.description || '',
      default: config.default,
      ...config
    }));
  }

  // Get color based on category
  getCategoryColor(category) {
    const colorMap = {
      'AI': '#9F7AEA',
      'Input': '#4299E1',
      'Output': '#48BB78',
      'Flow Control': '#ED8936',
      'Data Processing': '#38B2AC',
      'Utilities': '#DD6B20',
      'Custom': '#E53E3E',
      'Blockchain': '#805AD5',
      'On-Chain': '#805AD5'
    };
    
    return colorMap[category] || '#718096';
  }

  // Get all blocks and transform them for use in BlocksPanel
  async getBlocksForPanel() {
    try {
      const blocks = await this.getAllBlocks();
      const categories = await this.getCategories();
      
      // Transform blocks into nodeTypes format
      const nodeTypes = {};
      blocks.forEach(block => {
        nodeTypes[block.type] = this.transformBlockToNodeType(block);
      });
      
      // Transform categories into nodeCategories format
      const nodeCategories = categories.map((cat, index) => ({
        id: cat.category.toLowerCase().replace(/\s+/g, '-'),
        name: cat.category,
        nodes: blocks
          .filter(block => block.category === cat.category)
          .map(block => block.type)
      }));
      
      return { nodeTypes, nodeCategories };
    } catch (error) {
      console.error('Error getting blocks for panel:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const flowBuilderAPI = new FlowBuilderAPI();

// Export the class as well for potential custom usage
export default FlowBuilderAPI;