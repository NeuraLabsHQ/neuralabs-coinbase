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
      const elements = {};
      nodes.forEach(node => {
        const elementId = node.id;
        
        // Convert frontend node to backend element format
        const element = {
          type: mapNodeTypeToElementType(node.type),
          element_id: elementId,
          name: node.name || `${node.type} element`,
          description: node.description || `${node.type} element`,
          input_schema: convertInputsToSchema(node.inputs || []),
          output_schema: convertOutputsToSchema(node.outputs || []),
          // Add position data for layout preservation
          position: {
            x: node.x || 0,
            y: node.y || 0
          }
        };

        // Add hyperparameters directly to the element (not nested)
        if (node.hyperparameters && Array.isArray(node.hyperparameters)) {
          // Convert array of hyperparameter objects to direct properties
          node.hyperparameters.forEach(param => {
            if (param.name) {
              // Use the value if provided by user, otherwise use default, otherwise empty string
              const paramValue = param.value !== undefined ? param.value : 
                                (param.default !== undefined ? param.default : '');
              element[param.name] = paramValue;
            }
          });
        }

        // Add optional fields if they exist
        if (node.processing_message) {
          element.processing_message = node.processing_message;
        }
        if (node.tags && node.tags.length > 0) {
          element.tags = node.tags;
        }
        if (node.layer) {
          element.layer = node.layer;
        }
        if (node.code) {
          element.code = node.code;
        }

        elements[elementId] = element;
      });

      // Transform edges to connections format
      const connections = [];
      
      edges.forEach(edge => {
        if (edge.mappings && edge.mappings.length > 0) {
          // Create a separate connection for each mapping in the edge
          edge.mappings.forEach(mapping => {
            if (mapping.fromOutput && mapping.toInput) {
              connections.push({
                from_id: edge.source,
                to_id: edge.target,
                from_output: mapping.fromOutput,
                to_input: mapping.toInput
              });
            }
          });
        } else if (edge.sourceName && edge.targetName) {
          // If no mappings array but has sourceName/targetName, use those
          connections.push({
            from_id: edge.source,
            to_id: edge.target,
            from_output: edge.sourceName,
            to_input: edge.targetName
          });
        } else {
          // If no mappings at all, create a basic connection without ports
          connections.push({
            from_id: edge.source,
            to_id: edge.target
          });
        }
      });

      // Create the complete flow definition
      const flowDefinition = {
        flow_id: metadata.flow_id || `flow_${Date.now()}`,
        flow_definition: {
          flow_id: metadata.flow_id || `flow_${Date.now()}`,
          elements: elements,
          connections: connections,
          start_element_id: startNode.id,
          metadata: {
            name: metadata.name || "Exported Flow",
            description: metadata.description || "Flow exported from Neuralabs",
            version: metadata.version || "1.0.0",
            created_at: new Date().toISOString(),
            exported_at: new Date().toISOString(),
            export_source: "neuralabs-frontend"
          }
        }
      };

      // Convert to YAML string
      const yamlString = yaml.dump(flowDefinition, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false
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
      const elements = flowDef.elements || {};
      const connections = flowDef.connections || [];

      // Convert elements to frontend nodes
      const nodes = Object.entries(elements).map(([elementId, element]) => {
        return {
          id: elementId,
          type: mapElementTypeToNodeType(element.type),
          name: element.name || elementId,
          description: element.description || '',
          x: element.position?.x || Math.random() * 400 + 100, // Use saved position or random
          y: element.position?.y || Math.random() * 400 + 100,
          inputs: convertSchemaToInputs(element.input_schema || {}),
          outputs: convertSchemaToOutputs(element.output_schema || {}),
          hyperparameters: extractHyperparameters(element),
          processing_message: element.processing_message || '',
          tags: element.tags || [],
          layer: element.layer || 0,
          code: element.code || '',
          metadata: {
            originalElementId: elementId,
            importedAt: new Date().toISOString()
          }
        };
      });

      // Convert connections to frontend edges
      // Group connections by source-target pair to handle multiple mappings
      const edgeMap = new Map();
      
      connections.forEach((conn, index) => {
        const edgeKey = `${conn.from_id}-${conn.to_id}`;
        
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            id: `edge_${edgeMap.size}`,
            source: conn.from_id,
            target: conn.to_id,
            sourceName: '', // Will be set from first mapping or left empty
            targetName: '', // Will be set from first mapping or left empty
            mappings: [],
            sourcePort: 0,
            targetPort: 0
          });
        }
        
        const edge = edgeMap.get(edgeKey);
        
        // Add mapping if both output and input are specified
        if (conn.from_output && conn.to_input) {
          edge.mappings.push({
            fromOutput: conn.from_output,
            toInput: conn.to_input
          });
          
          // Set sourceName/targetName from first mapping (for legacy compatibility)
          if (!edge.sourceName && !edge.targetName) {
            edge.sourceName = conn.from_output;
            edge.targetName = conn.to_input;
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
    'output_schema', 'processing_message', 'tags', 'layer', 'code'
  ];
  
  const hyperparameters = {};
  Object.entries(element).forEach(([key, value]) => {
    if (!standardFields.includes(key)) {
      hyperparameters[key] = value;
    }
  });
  
  return hyperparameters;
}