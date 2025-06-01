// src/utils/flowExportJSON.js
import { exportFlowAsYAML } from './flowExportYaml';

/**
 * Exports the flow canvas data as JSON using the same format as YAML
 * @param {Array} nodes - The nodes in the flow
 * @param {Array} edges - The edges connecting the nodes
 * @param {Object} metadata - Optional metadata for the flow
 * @returns {Promise} - Promise that resolves with the JSON data
 */
export const exportFlowAsJSON = (nodes, edges, metadata = {}) => {
    return new Promise(async (resolve, reject) => {
      if (!nodes || nodes.length === 0) {
        reject(new Error("No flow content to export."));
        return;
      }
  
      try {
        // First, use the YAML export function to get the properly formatted data
        const yamlExport = await exportFlowAsYAML(nodes, edges, metadata);
        
        // Parse the YAML data to get the structured object
        const yamlString = yamlExport.data;
        
        // Instead of parsing YAML, let's build the same structure directly
        // This ensures we get the exact same format as YAML export
        
        // Find start element
        const startNode = nodes.find(node => node.type === 'start' || node.type === 'Start') || nodes[0];
        
        // Transform nodes to the same format as YAML
        const nodes_dict = {};
        const idMapping = {};
        
        nodes.forEach(node => {
          // Create element ID with format: NodeType_timestamp
          const nodeType = mapNodeTypeToElementType(node.type);
          const timestamp = node.id.split('-').pop() || Date.now();
          const elementId = `${nodeType}_${timestamp}`;
          idMapping[node.id] = elementId;
          
          // Convert frontend node to backend element format
          const element = {
            type: nodeType,
            name: node.name || node.id,
            node_description: node.description || `${node.type} element`,
            description: node.description || `${node.type} element`,
            processing_message: node.processing_message || node.processingMessage || 'Processing...',
            tags: node.tags || [],
            layer: node.layer || 3,
            position: {
              x: Number(node.x || node.position?.x || 0),
              y: Number(node.y || node.position?.y || 0)
            },
            original_id: node.id
          };

          // Add parameters
          if (node.parametersObject && Object.keys(node.parametersObject).length > 0) {
            element.parameters = node.parametersObject;
          } else if (node.parameters) {
            if (Array.isArray(node.parameters)) {
              const params = {};
              node.parameters.forEach(param => {
                if (param.name) {
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

          // Preserve fieldAccess for access control
          if (node.fieldAccess) {
            element.fieldAccess = node.fieldAccess;
          }

          nodes_dict[elementId] = element;
        });

        // Transform edges to connections format
        const connections = [];
        
        edges.forEach(edge => {
          const mappedSource = idMapping[edge.source] || edge.source;
          const mappedTarget = idMapping[edge.target] || edge.target;
          const connectionType = edge.connectionType || 'both';
          
          if (connectionType === 'both' || connectionType === 'control') {
            connections.push({
              from_id: mappedSource,
              to_id: mappedTarget,
              connection_type: 'control'
            });
          }
          
          if ((connectionType === 'both' || connectionType === 'data') && 
              (edge.mappings && edge.mappings.length > 0)) {
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
            connections.push({
              from_id: mappedSource,
              to_id: mappedTarget,
              connection_type: 'data',
              from_output: `${mappedSource}:${edge.sourceName}`,
              to_input: `${mappedTarget}:${edge.targetName}`
            });
          }
        });

        // Create the complete flow definition
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
            // Convert dates to ISO strings for JSON serialization
            created_at: new Date().toISOString(),
            exported_at: new Date().toISOString(),
            export_source: "neuralabs-frontend"
          }
        };
  
        // Convert to JSON string with formatting
        const jsonString = JSON.stringify(flowDefinition, null, 2);
        
        // Create a blob and URL
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        resolve({
          data: jsonString,
          url: url,
          filename: `${metadata.name || 'flow'}-export-${new Date().toISOString().split('T')[0]}.json`
        });
      } catch (error) {
        console.error("JSON Export error:", error);
        reject(new Error("An unexpected error occurred during JSON export: " + error.message));
      }
    });
  };

// Helper functions (same as in YAML export)
function mapNodeTypeToElementType(nodeType) {
  const typeMap = {
    'start': 'start',
    'Start': 'start',
    'end': 'end',
    'End': 'end',
    'chat_input': 'chat_input',
    'ChatInput': 'chat_input',
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
    'LLMText': 'llm_text',
    'llm_structured': 'llm_structured',
    'read_blockchain_data': 'read_blockchain_data',
    'build_transaction_json': 'build_transaction_json',
    'custom': 'custom',
    'case': 'case',
    'flow_select': 'flow_select'
  };
  
  return typeMap[nodeType] || nodeType.toLowerCase();
}

function convertInputsToSchema(inputs) {
  const schema = {};
  inputs.forEach(input => {
    schema[input.name] = {
      type: input.type || 'string',
      description: input.description || '',
      required: input.required !== false,
      // Preserve additional properties like editable, value, default
      ...(input.editable !== undefined && { editable: input.editable }),
      ...(input.value !== undefined && { value: input.value }),
      ...(input.default !== undefined && { default: input.default })
    };
  });
  return schema;
}

function convertOutputsToSchema(outputs) {
  const schema = {};
  outputs.forEach(output => {
    schema[output.name] = {
      type: output.type || 'string',
      description: output.description || '',
      required: output.required !== false,
      // Preserve additional properties like editable, value, default
      ...(output.editable !== undefined && { editable: output.editable }),
      ...(output.value !== undefined && { value: output.value }),
      ...(output.default !== undefined && { default: output.default })
    };
  });
  return schema;
}