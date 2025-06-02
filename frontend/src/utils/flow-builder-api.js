// src/utils/flow-builder-api.js

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

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
      // console.log('response', response); 
      const result = await response.json();
      console.log('Fetched blockssssss:', result);
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
    // Get access info for common fields from hyperparameters
    const hyperParams = block.hyper_parameters || {};
    const descriptionAccess = hyperParams['description']?.access || 'fixed';
    const nameAccess = hyperParams['name']?.access || 'fixed';
    const processingMessageAccess = hyperParams['processing_message']?.access || 'fixed';
    const tagsAccess = hyperParams['tags']?.access || 'fixed';
    const inputSchemaAccess = hyperParams['input_schema']?.access || 'fixed';
    const outputSchemaAccess = hyperParams['output_schema']?.access || 'fixed';
    const parameters = block.parameters || {};
    const parameterSchema = block.parameter_schema_structure || {};
    
    console.log('Transforming block:', block.type, 'with parameters:', parameters);
    
    return {
      name: block.type,
      description: block.element_description,
      icon: block.icon,
      category: block.category,
      color: this.getCategoryColor(block.category),
      inputs: this.transformSchema(block.input_schema),
      outputs: this.transformSchema(block.output_schema),
      // Transform parameters (what users actually configure)
      parameters: this.transformParameters(
        parameterSchema,
        parameters,
        hyperParams
      ),
      processingMessage: block.processing_message || 'Processing...',
      tags: block.tags || [],
      // Access control info for UI fields
      fieldAccess: {
        description: descriptionAccess,
        name: nameAccess,
        processingMessage: processingMessageAccess,
        tags: tagsAccess,
        inputSchema: inputSchemaAccess,
        outputSchema: outputSchemaAccess
      },
      // Additional fields from the original block data
      id: block.id,
      type: block.type,
      createdAt: block.created_at,
      updatedAt: block.updated_at
    };
  }

  // Transform schema to match expected format
  transformSchema(schema) {
    if (!schema) return [];
    
    return Object.entries(schema).map(([key, config]) => {
      // Handle case where config might be null or not an object
      if (!config || typeof config !== 'object') {
        return {
          name: key,
          type: 'string',
          required: false,
          description: '',
          default: ''
        };
      }
      
      return {
        name: key,
        type: config.type || 'string',
        required: config.required || false,
        description: config.description || '',
        default: config.default,
        ...config
      };
    });
  }

  // Transform parameters to match expected format with access control from hyperparameters
  transformParameters(parameterSchema, parameters, hyperParams) {
    // Handle null/undefined or non-object schemas
    if (!parameterSchema || typeof parameterSchema !== 'object') {
      return [];
    }
    
    // If parameterSchema is empty object, return empty array (no parameters for this block)
    if (Object.keys(parameterSchema).length === 0) {
      return [];
    }
    
    // Create array of parameter configurations that users will see
    const parameterArray = [];
    
    // Process each parameter from schema
    Object.entries(parameterSchema).forEach(([key, schema]) => {
      // Skip if schema is not an object
      if (!schema || typeof schema !== 'object') {
        return;
      }
      
      // Get access control for this parameter from hyperparameters
      const paramAccessKey = `parameters.${key}`;
      const accessInfo = hyperParams?.[paramAccessKey] || { access: 'fixed' };
      const access = accessInfo.access || 'fixed';
      
      parameterArray.push({
        name: key,
        type: schema.type || 'string',
        required: schema.required || false,
        description: schema.description || '',
        default: schema.default,
        value: parameters?.[key] !== undefined ? parameters[key] : schema.default,
        access: access,
        editable: access === 'edit', // Only 'edit' access makes it editable
        appendable: access === 'append', // For tags and lists
        min: schema.min,
        max: schema.max,
        enum: schema.enum,
        ...schema
      });
    });
    
    return parameterArray;
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