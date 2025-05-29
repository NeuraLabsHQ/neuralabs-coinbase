import yaml from 'js-yaml';
import type { Element } from '@/types/element';

export function exportToYaml(element: Element): string {
  // Create a clean object for YAML export
  const yamlObject: any = {};
  
  // Add core properties
  if (element.type) yamlObject.type = element.type;
  if (element.elementId) yamlObject.element_id = element.elementId;
  if (element.name) yamlObject.name = element.name;
  if (element.nodeDescription) yamlObject.node_description = element.nodeDescription;
  if (element.description) yamlObject.description = element.description;
  
  // Add schemas
  if (element.inputSchema && Object.keys(element.inputSchema).length > 0) {
    yamlObject.input_schema = formatSchema(element.inputSchema);
  }
  
  if (element.outputSchema && Object.keys(element.outputSchema).length > 0) {
    yamlObject.output_schema = formatSchema(element.outputSchema);
  }
  
  // Add parameter schema structure
  if (element.parameterSchemaStructure && Object.keys(element.parameterSchemaStructure).length > 0) {
    yamlObject.parameter_schema_structure = element.parameterSchemaStructure;
  }
  
  // Add parameters
  if (element.parameters && Object.keys(element.parameters).length > 0) {
    yamlObject.parameters = element.parameters;
  }
  
  // Add UI properties
  if (element.processingMessage) yamlObject.processing_message = element.processingMessage;
  if (element.tags && element.tags.length > 0) yamlObject.tags = element.tags;
  if (element.layer) yamlObject.layer = element.layer;
  
  // Add special properties
  if (element.code) yamlObject.code = element.code;
  if (element.flowControl) yamlObject.flow_control = element.flowControl;
  
  // Add hyperparameters
  if (element.hyperparameters && Object.keys(element.hyperparameters).length > 0) {
    yamlObject.hyperparameters = {};
    Object.entries(element.hyperparameters).forEach(([path, rule]) => {
      yamlObject.hyperparameters[path] = {
        access: rule.access,
        ...(rule.comment && { comment: rule.comment }),
      };
    });
  }
  
  // Convert to YAML with nice formatting
  return yaml.dump(yamlObject, {
    indent: 2,
    lineWidth: 80,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  });
}

function formatSchema(schema: any): any {
  const formatted: any = {};
  Object.entries(schema).forEach(([key, field]: [string, any]) => {
    formatted[key] = { ...field };
    // Remove undefined values
    Object.keys(formatted[key]).forEach(prop => {
      if (formatted[key][prop] === undefined) {
        delete formatted[key][prop];
      }
    });
  });
  return formatted;
}