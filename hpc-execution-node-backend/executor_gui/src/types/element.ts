// Core type definitions for HPC Neura Element Builder

export type DataType = 'string' | 'int' | 'float' | 'bool' | 'json' | 'list';
export type AccessLevel = 'fixed' | 'edit' | 'append' | 'hidden';

export interface SchemaField {
  type: DataType;
  required: boolean;
  description: string;
  default?: any;
  // Constraints
  enum?: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface Schema {
  [fieldName: string]: SchemaField;
}

export interface Parameter {
  name: string;
  value: any;
  type: DataType;
}

export interface ParameterSchemaField {
  type: DataType;
  description?: string;
  // Constraints for parameters
  min?: number;
  max?: number;
  enum?: any[];
  pattern?: string;
}

export interface HyperparameterRule {
  access: AccessLevel;
  comment?: string;
}

export interface FlowControlCase {
  id: string;
  condition: {
    variable1: string;
    variable2: string | number;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  };
  enableConnections?: string[];
  disableConnections?: string[];
}

export interface Element {
  // Core Properties
  type: string;
  elementId?: string;
  name?: string;
  nodeDescription: string;
  description?: string;
  
  // Schemas
  inputSchema: Schema;
  outputSchema: Schema;
  parameterSchemaStructure?: Record<string, ParameterSchemaField>;
  
  // Configuration
  parameters: Record<string, any>;
  
  // UI/UX
  processingMessage?: string;
  tags: string[];
  layer?: string;
  
  // Special Properties
  code?: string;
  flowControl?: {
    cases?: FlowControlCase[];
    flowOptions?: any[];
  };
  
  // Hyperparameters (Access Rules)
  hyperparameters: Record<string, HyperparameterRule>;
}