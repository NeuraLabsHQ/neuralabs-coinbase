// src/utils/flowImportJSON.js
import { importFlowFromYAML } from './flowExportYaml';

/**
 * Imports flow data from JSON and reconstructs the flow
 * Supports both old format and new YAML-like format
 * @param {Object} jsonData - The JSON data to import
 * @param {Function} setNodes - Function to update nodes state
 * @param {Function} setEdges - Function to update edges state
 * @returns {Promise} - Promise that resolves when import is complete
 */
export const importFlowFromJSON = (jsonData, setNodes, setEdges) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if this is the new YAML-like format
        if (jsonData.flow_definition) {
          // New format - handle it directly here
          const flowDef = jsonData.flow_definition;
          const elements = flowDef.nodes || flowDef.elements || {};
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

            const nodeType = mapElementTypeToNodeType(element.type);
            
            return {
              id: nodeId,
              type: nodeType,
              name: element.name || elementId,
              description: element.description || '',
              x: Number(element.position?.x) || Math.random() * 400 + 100,
              y: Number(element.position?.y) || Math.random() * 400 + 100,
              inputs: convertSchemaToInputs(element.input_schema || {}),
              outputs: convertSchemaToOutputs(element.output_schema || {}),
              parameters: parametersArray,
              parametersObject: element.parameters || {},
              hyperparameters: extractHyperparameters(element),
              processing_message: element.processing_message || '',
              processingMessage: element.processing_message || '',
              tags: element.tags || [],
              layer: element.layer || 0,
              code: element.code || '',
              metadata: {
                originalElementId: elementId,
                importedAt: new Date().toISOString()
              },
              // Preserve fieldAccess from the element data
              fieldAccess: element.fieldAccess || element.field_access || {}
            };
          });

          // Create a mapping from YAML element IDs to actual node IDs
          const elementToNodeId = {};
          nodes.forEach(node => {
            elementToNodeId[node.metadata.originalElementId] = node.id;
          });

          // Convert connections to frontend edges
          const edgeMap = new Map();
          
          connections.forEach((conn) => {
            const sourceNodeId = elementToNodeId[conn.from_id] || conn.from_id;
            const targetNodeId = elementToNodeId[conn.to_id] || conn.to_id;
            
            const edgeKey = `${sourceNodeId}-${targetNodeId}`;
            
            if (!edgeMap.has(edgeKey)) {
              edgeMap.set(edgeKey, {
                id: `edge_${edgeMap.size}`,
                source: sourceNodeId,
                target: targetNodeId,
                sourceName: '',
                targetName: '',
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
              // If already 'data' or 'both', upgrade to 'both'
              else if (edge.connectionType === 'data') {
                edge.connectionType = 'both';
              }
            } else if (conn.connection_type === 'data') {
              // If we see a data connection, update type accordingly
              if (edge.connectionType === 'control') {
                edge.connectionType = 'both';
              }
              // If already 'both', keep it as 'both'
              else if (edge.connectionType !== 'both') {
                edge.connectionType = 'data';
              }
            }
            
            if (conn.from_output && conn.to_input) {
              const fromOutput = conn.from_output.split(':').pop();
              const toInput = conn.to_input.split(':').pop();
              
              edge.mappings.push({
                fromOutput: fromOutput,
                toInput: toInput
              });
              
              if (!edge.sourceName && !edge.targetName) {
                edge.sourceName = fromOutput;
                edge.targetName = toInput;
              }
            }
          });
          
          const edges = Array.from(edgeMap.values());
          
          // Update state
          setNodes(nodes);
          setEdges(edges);
          
          resolve({
            nodes,
            edges,
            metadata: jsonData.metadata || {}
          });
          return;
        }
        
        // Old format - handle legacy JSON imports
        if (!jsonData || !jsonData.nodes || !jsonData.edges) {
          reject(new Error("Invalid JSON format: Missing nodes or edges"));
          return;
        }
  
        // Process nodes (old format)
        const importedNodes = jsonData.nodes.map(node => ({
          id: node.id,
          type: node.type,
          name: node.name,
          x: node.x || 0,
          y: node.y || 0,
          inputs: node.inputs || [],
          outputs: node.outputs || [],
          parameters: node.parameters || [], // Array format for UI
          parametersObject: node.parametersObject || {}, // Object format for storage
          hyperparameters: node.hyperparameters || [], // Legacy support
          description: node.description || '',
          processing_message: node.processing_message || node.processingMessage || '',
          processingMessage: node.processing_message || node.processingMessage || '', // Support both formats
          layer: node.layer || 0,
          tags: node.tags || [],
          code: node.code || '',
          metadata: node.metadata || {},
          templateId: node.templateId || null
        }));
  
        // Process edges (old format)
        const importedEdges = jsonData.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceName: edge.sourceName || '',
          targetName: edge.targetName || '',
          mappings: edge.mappings || [],
          connectionType: edge.connectionType || 'both',
          sourcePort: edge.sourcePort || 0,
          targetPort: edge.targetPort || 0
        }));
  
        // Validate that all edge sources and targets exist in nodes
        const nodeIds = new Set(importedNodes.map(node => node.id));
        const invalidEdges = importedEdges.filter(edge => 
          !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
        );
  
        if (invalidEdges.length > 0) {
          reject(new Error("Invalid edges: Some source or target nodes not found"));
          return;
        }
  
        // Update state
        setNodes(importedNodes);
        setEdges(importedEdges);
  
        resolve({
          nodes: importedNodes,
          edges: importedEdges
        });
      } catch (error) {
        console.error("Import error:", error);
        reject(new Error("An unexpected error occurred during import: " + error.message));
      }
    });
  };

// Helper functions (same as in YAML import)
function mapElementTypeToNodeType(elementType) {
  const typeMap = {
    'start': 'Start',
    'end': 'End',
    'chat_input': 'ChatInput',
    'context_history': 'ContextHistory',
    'datablock': 'Datablock',
    'constants': 'Constants',
    'rest_api': 'RestAPI',
    'metadata': 'Metadata',
    'selector': 'Selector',
    'merger': 'Merger',
    'random_generator': 'RandomGenerator',
    'time': 'Time',
    'llm_text': 'LLMText',
    'llm_structured': 'LLMStructured',
    'read_blockchain_data': 'ReadBlockchainData',
    'build_transaction_json': 'BuildTransactionJSON',
    'custom': 'Custom',
    'case': 'Case',
    'flow_select': 'FlowSelect'
  };
  
  return typeMap[elementType] || elementType;
}

function convertSchemaToInputs(schema) {
  return Object.entries(schema).map(([name, config]) => ({
    name,
    type: config.type || 'string',
    description: config.description || '',
    required: config.required !== false,
    editable: config.editable || false,
    value: config.value,
    default: config.default,
    // Preserve any additional properties that might be needed
    ...config
  }));
}

function convertSchemaToOutputs(schema) {
  return Object.entries(schema).map(([name, config]) => ({
    name,
    type: config.type || 'string',
    description: config.description || '',
    required: config.required !== false,
    editable: config.editable || false,
    value: config.value,
    default: config.default,
    // Preserve any additional properties that might be needed
    ...config
  }));
}

function extractHyperparameters(element) {
  const standardFields = [
    'type', 'element_id', 'name', 'description', 'input_schema', 
    'output_schema', 'processing_message', 'tags', 'layer', 'code',
    'position', 'parameters', 'original_id', 'node_description'
  ];
  
  const hyperparameters = {};
  Object.entries(element).forEach(([key, value]) => {
    if (!standardFields.includes(key)) {
      hyperparameters[key] = value;
    }
  });
  
  return hyperparameters;
}