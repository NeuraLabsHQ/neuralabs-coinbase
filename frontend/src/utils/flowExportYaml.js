// src/utils/flowExportYaml.js
import yaml from 'js-yaml';

/**
 * Exports the flow canvas data as YAML according to the backend schema
 * @param {Array} nodes - The nodes in the flow
 * @param {Array} edges - The edges connecting the nodes
 * @param {Object} metadata - Optional metadata for the flow
 * @returns {Promise} - Promise that resolves with the YAML data
 */
export const exportFlowAsYAML = (nodes, edges, metadata = {}) => {
  return new Promise((resolve, reject) => {
    if (!nodes || nodes.length === 0) {
      reject(new Error("No flow content to export."));
      return;
    }

    try {
      // Find start element
      const startNode = nodes.find(node => node.type === 'start') || nodes[0];
      
      // Transform nodes to YAML element format
      const nodes_dict = {};
      nodes.forEach(node => {
        // Create element ID with format: NodeType_timestamp
        const nodeType = mapNodeTypeToElementType(node.type);
        const timestamp = node.id.split('-').pop() || Date.now();
        const elementId = `${nodeType}_${timestamp}`;
        
        // Convert frontend node to backend element format
        const element = {
          type: nodeType,
          name: node.name || node.id, // Preserve the original name
          node_description: node.description || `${node.type} element`,
          description: node.description || `${node.type} element`,
          processing_message: node.processing_message || node.processingMessage || 'Processing...',
          tags: node.tags || [],
          layer: node.layer || 3,
          // Add position data for reimporting
          position: {
            x: Number(node.x || node.position?.x || 0),
            y: Number(node.y || node.position?.y || 0)
          },
          original_id: node.id // Store original ID for connection mapping
        };

        // Add parameters (user-configurable values)
        // Priority: parametersObject > parameters array with values > parameters object
        if (node.parametersObject && Object.keys(node.parametersObject).length > 0) {
          // Use parametersObject if available (this is the object format stored by detail panel)
          element.parameters = node.parametersObject;
        } else if (node.parameters) {
          if (Array.isArray(node.parameters)) {
            // Convert from array format, prioritizing 'value' field over 'default'
            const params = {};
            node.parameters.forEach(param => {
              if (param.name) {
                // Use 'value' if defined, otherwise use 'default'
                const paramValue = param.value !== undefined ? param.value : param.default;
                if (paramValue !== undefined && paramValue !== '') {
                  params[param.name] = paramValue;
                }
              }
            });
            if (Object.keys(params).length > 0) {
              element.parameters = params;
            }
          } else if (typeof node.parameters === 'object') {
            // Already in object format
            element.parameters = node.parameters;
          }
        }

        // Add input/output schemas
        element.input_schema = convertInputsToSchema(node.inputs || []);
        element.output_schema = convertOutputsToSchema(node.outputs || []);

        // Add code for custom nodes
        if (node.code) {
          element.parameters = element.parameters || {};
          element.parameters.code = node.code;
        }

        nodes_dict[elementId] = element;
      });

      // Create a mapping from original IDs to new IDs for connections
      const idMapping = {};
      nodes.forEach(node => {
        const nodeType = mapNodeTypeToElementType(node.type);
        const timestamp = node.id.split('-').pop() || Date.now();
        const newId = `${nodeType}_${timestamp}`;
        idMapping[node.id] = newId;
      });

      // Transform edges to connections format with control and data types
      const connections = [];
      
      edges.forEach(edge => {
        // Map source and target IDs to new IDs
        const mappedSource = idMapping[edge.source] || edge.source;
        const mappedTarget = idMapping[edge.target] || edge.target;
        
        // Default connection type is 'both' (control and data)
        const connectionType = edge.connectionType || 'both';
        
        if (connectionType === 'both' || connectionType === 'control') {
          // Add control connection
          connections.push({
            from_id: mappedSource,
            to_id: mappedTarget,
            connection_type: 'control'
          });
        }
        
        // Add data connections only if there are mappings
        if ((connectionType === 'both' || connectionType === 'data') && 
            (edge.mappings && edge.mappings.length > 0)) {
          // Create a separate data connection for each mapping
          edge.mappings.forEach(mapping => {
            if (mapping.fromOutput && mapping.toInput) {
              connections.push({
                from_id: mappedSource,
                to_id: mappedTarget,
                connection_type: 'data',
                from_output: `${mappedSource}:${mapping.fromOutput}`,
                to_input: `${mappedTarget}:${mapping.toInput}`
              });
            }
          });
        } else if ((connectionType === 'both' || connectionType === 'data') && 
                   edge.sourceName && edge.targetName) {
          // Legacy support: If no mappings array but has sourceName/targetName
          connections.push({
            from_id: mappedSource,
            to_id: mappedTarget,
            connection_type: 'data',
            from_output: `${mappedSource}:${edge.sourceName}`,
            to_input: `${mappedTarget}:${edge.targetName}`
          });
        }
      });

      // Create the complete flow definition matching the new format
      const flowDefinition = {
        flow_definition: {
          nodes: nodes_dict,
          connections: connections,
          start_element: idMapping[startNode.id] || startNode.id
        },
        metadata: {
          flow_name: metadata.name || "Exported Flow",
          version: metadata.version || "1.0.0",
          description: metadata.description || "Flow exported from Neuralabs",
          author: metadata.author || "NeuraLabs",
          tags: metadata.tags || ["exported"],
          created_at: new Date().toISOString(),
          exported_at: new Date().toISOString(),
          export_source: "neuralabs-frontend"
        }
      };

      // Convert to YAML string with custom schema to prevent 'y' from being quoted
      const yamlString = yaml.dump(flowDefinition, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false,
        quotingType: '"',
        forceQuotes: false,
        schema: yaml.JSON_SCHEMA // Use JSON schema to prevent 'y' from being interpreted as boolean
      });

      // Create a blob and URL
      const blob = new Blob([yamlString], { type: 'application/x-yaml' });
      const url = URL.createObjectURL(blob);

      resolve({
        data: yamlString,
        url: url,
        filename: `${metadata.name || 'flow'}-export-${new Date().toISOString().split('T')[0]}.yaml`
      });
    } catch (error) {
      console.error("YAML Export error:", error);
      reject(new Error("An unexpected error occurred during YAML export: " + error.message));
    }
  });
};

/**
 * Imports YAML flow data and converts it to frontend format
 * @param {string} yamlContent - The YAML content to import
 * @returns {Promise} - Promise that resolves with nodes and edges
 */
export const importFlowFromYAML = (yamlContent) => {
  return new Promise((resolve, reject) => {
    try {
      // Parse YAML content
      const flowData = yaml.load(yamlContent);
      
      if (!flowData || !flowData.flow_definition) {
        throw new Error("Invalid YAML format: missing flow_definition");
      }

      const flowDef = flowData.flow_definition;
      const elements = flowDef.nodes || flowDef.elements || {}; // Support both 'nodes' and 'elements' for backward compatibility
      const connections = flowDef.connections || [];

      // Convert elements to frontend nodes
      const nodes = Object.entries(elements).map(([elementId, element]) => {
        // Convert parameters from object format to array format for UI
        let parametersArray = [];
        if (element.parameters && typeof element.parameters === 'object') {
          parametersArray = Object.entries(element.parameters).map(([key, value]) => ({
            name: key,
            value: value,
            type: typeof value === 'boolean' ? 'boolean' : 
                  typeof value === 'number' ? 'number' : 'string',
            editable: true
          }));
        }

        // Generate a unique ID for the node (use original_id if available, otherwise generate new)
        const nodeId = element.original_id || `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Create a readable name based on element type
        let nodeName = element.name;
        if (!nodeName || nodeName === nodeId || nodeName.startsWith('node-')) {
          // If no name or generic name, create one based on type
          const nodeType = mapElementTypeToNodeType(element.type);
          // Convert snake_case to Title Case with special handling for acronyms
          nodeName = nodeType
            .split('_')
            .map(part => {
              // Handle special cases
              const specialCases = {
                'llm': 'LLM',
                'api': 'API',
                'rest': 'REST',
                'json': 'JSON'
              };
              return specialCases[part.toLowerCase()] || 
                     part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            })
            .join(' ');
        }

        return {
          id: nodeId,
          type: mapElementTypeToNodeType(element.type),
          name: nodeName,
          description: element.description || '',
          x: Number(element.position?.x) || Math.random() * 400 + 100, // Use saved position or random
          y: Number(element.position?.y) || Math.random() * 400 + 100,
          inputs: convertSchemaToInputs(element.input_schema || {}),
          outputs: convertSchemaToOutputs(element.output_schema || {}),
          parameters: parametersArray, // Array format for UI
          parametersObject: element.parameters || {}, // Object format for storage
          hyperparameters: extractHyperparameters(element), // Legacy support
          processing_message: element.processing_message || '',
          processingMessage: element.processing_message || '', // Support both formats
          tags: element.tags || [],
          layer: element.layer || 0,
          code: element.code || '',
          metadata: {
            originalElementId: elementId, // Store the YAML key as metadata
            importedAt: new Date().toISOString()
          }
        };
      });

      // Create a mapping from YAML element IDs to actual node IDs
      const elementToNodeId = {};
      nodes.forEach(node => {
        elementToNodeId[node.metadata.originalElementId] = node.id;
      });

      // Convert connections to frontend edges
      // Group connections by source-target pair to handle multiple mappings
      const edgeMap = new Map();
      
      connections.forEach((conn) => {
        // Map YAML element IDs to actual node IDs
        const sourceNodeId = elementToNodeId[conn.from_id] || conn.from_id;
        const targetNodeId = elementToNodeId[conn.to_id] || conn.to_id;
        
        const edgeKey = `${sourceNodeId}-${targetNodeId}`;
        
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            id: `edge_${edgeMap.size}`,
            source: sourceNodeId,
            target: targetNodeId,
            sourceName: '', // Will be set from first mapping or left empty
            targetName: '', // Will be set from first mapping or left empty
            mappings: [],
            connectionType: 'both', // Default to both
            sourcePort: 0,
            targetPort: 0
          });
        }
        
        const edge = edgeMap.get(edgeKey);
        
        // Update connection type based on the connections we see
        if (conn.connection_type === 'control') {
          // If we haven't seen any data connections yet, set to control only
          if (edge.mappings.length === 0) {
            edge.connectionType = 'control';
          }
        } else if (conn.connection_type === 'data') {
          // If we see a data connection, update type accordingly
          if (edge.connectionType === 'control') {
            edge.connectionType = 'both';
          } else {
            edge.connectionType = 'data';
          }
        }
        
        // Add mapping if both output and input are specified
        if (conn.from_output && conn.to_input) {
          // Extract the actual output/input names (remove the element ID prefix)
          const fromOutput = conn.from_output.split(':').pop();
          const toInput = conn.to_input.split(':').pop();
          
          edge.mappings.push({
            fromOutput: fromOutput,
            toInput: toInput
          });
          
          // Set sourceName/targetName from first mapping (for legacy compatibility)
          if (!edge.sourceName && !edge.targetName) {
            edge.sourceName = fromOutput;
            edge.targetName = toInput;
          }
        }
      });
      
      // Convert map to array
      const edges = Array.from(edgeMap.values());

      resolve({
        nodes,
        edges,
        metadata: flowDef.metadata || {}
      });
    } catch (error) {
      console.error("YAML Import error:", error);
      reject(new Error("Failed to import YAML: " + error.message));
    }
  });
};

/**
 * Maps frontend node types to backend element types
 */
function mapNodeTypeToElementType(nodeType) {
  const typeMap = {
    'start': 'start',
    'end': 'end',
    'chat_input': 'chat_input',
    'context_history': 'context_history',
    'datablock': 'datablock',
    'constants': 'constants',
    'rest_api': 'rest_api',
    'metadata': 'metadata',
    'selector': 'selector',
    'merger': 'merger',
    'random_generator': 'random_generator',
    'time': 'time',
    'llm_text': 'llm_text',
    'llm_structured': 'llm_structured',
    'read_blockchain_data': 'read_blockchain_data',
    'build_transaction_json': 'build_transaction_json',
    'custom': 'custom',
    'case': 'case',
    'flow_select': 'flow_select'
  };
  
  return typeMap[nodeType] || nodeType;
}

/**
 * Maps backend element types to frontend node types
 */
function mapElementTypeToNodeType(elementType) {
  // This is essentially the reverse of the above mapping
  const typeMap = {
    'start': 'start',
    'end': 'end',
    'chat_input': 'chat_input',
    'context_history': 'context_history',
    'datablock': 'datablock',
    'constants': 'constants',
    'rest_api': 'rest_api',
    'metadata': 'metadata',
    'selector': 'selector',
    'merger': 'merger',
    'random_generator': 'random_generator',
    'time': 'time',
    'llm_text': 'llm_text',
    'llm_structured': 'llm_structured',
    'read_blockchain_data': 'read_blockchain_data',
    'build_transaction_json': 'build_transaction_json',
    'custom': 'custom',
    'case': 'case',
    'flow_select': 'flow_select'
  };
  
  return typeMap[elementType] || elementType;
}

/**
 * Converts frontend inputs array to backend input schema
 */
function convertInputsToSchema(inputs) {
  const schema = {};
  inputs.forEach(input => {
    schema[input.name] = {
      type: input.type || 'string',
      description: input.description || '',
      required: input.required !== false
    };
  });
  return schema;
}

/**
 * Converts frontend outputs array to backend output schema
 */
function convertOutputsToSchema(outputs) {
  const schema = {};
  outputs.forEach(output => {
    schema[output.name] = {
      type: output.type || 'string',
      description: output.description || '',
      required: output.required !== false
    };
  });
  return schema;
}

/**
 * Converts backend input schema to frontend inputs array
 */
function convertSchemaToInputs(schema) {
  return Object.entries(schema).map(([name, config]) => ({
    name,
    type: config.type || 'string',
    description: config.description || '',
    required: config.required !== false
  }));
}

/**
 * Converts backend output schema to frontend outputs array
 */
function convertSchemaToOutputs(schema) {
  return Object.entries(schema).map(([name, config]) => ({
    name,
    type: config.type || 'string',
    description: config.description || '',
    required: config.required !== false
  }));
}

/**
 * Extracts hyperparameters from element, excluding standard fields
 */
function extractHyperparameters(element) {
  const standardFields = [
    'type', 'element_id', 'name', 'description', 'input_schema', 
    'output_schema', 'processing_message', 'tags', 'layer', 'code',
    'position', 'parameters', 'original_id', 'node_description' // Exclude all standard fields
  ];
  
  const hyperparameters = {};
  Object.entries(element).forEach(([key, value]) => {
    if (!standardFields.includes(key)) {
      hyperparameters[key] = value;
    }
  });
  
  return hyperparameters;
}