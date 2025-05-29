import { create } from 'zustand';
import type { Element, HyperparameterRule, Schema, ParameterSchemaField, AccessLevel } from '@/types/element';

interface ElementState {
  element: Element;
  isDirty: boolean;
  validationErrors: Record<string, string>;
  previewMode: 'yaml' | 'visual' | 'levels';
  levelView: 'L1' | 'L2' | 'L3';
  
  // Actions
  updateElement: (updates: Partial<Element>) => void;
  updateSchema: (schemaType: 'input' | 'output', schema: Schema) => void;
  updateParameter: (name: string, value: any) => void;
  updateParameterSchema: (name: string, schema: ParameterSchemaField) => void;
  updateHyperparameter: (path: string, access: AccessLevel, comment?: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setPreviewMode: (mode: 'yaml' | 'visual' | 'levels') => void;
  setLevelView: (level: 'L1' | 'L2' | 'L3') => void;
  importYaml: (yaml: string) => void;
  reset: () => void;
}

const defaultElement: Element = {
  type: 'llm_text',
  name: 'AI Text Generator',
  nodeDescription: 'Generates text using Large Language Models with customizable parameters',
  description: 'A versatile text generation element that can be used for various AI-powered text creation tasks',
  inputSchema: {
    prompt: {
      type: 'string',
      required: true,
      description: 'The input prompt for text generation',
      minLength: 1,
      maxLength: 4000
    },
    context: {
      type: 'string',
      required: false,
      description: 'Additional context to guide the generation'
    }
  },
  outputSchema: {
    generated_text: {
      type: 'string',
      required: true,
      description: 'The generated text response'
    },
    token_count: {
      type: 'int',
      required: true,
      description: 'Number of tokens used in generation'
    }
  },
  parameterSchemaStructure: {
    temperature: {
      type: 'float',
      description: 'Controls randomness in generation',
      min: 0.0,
      max: 2.0
    },
    max_tokens: {
      type: 'int',
      description: 'Maximum tokens to generate',
      min: 1,
      max: 4000
    },
    model: {
      type: 'string',
      description: 'AI model to use for generation',
      enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-haiku', 'llama-3.3']
    }
  },
  parameters: {
    temperature: 0.7,
    max_tokens: 1000,
    model: 'llama-3.3'
  },
  processingMessage: 'Generating AI response...',
  tags: ['ai', 'text-generation', 'llm', 'core'],
  layer: 'processing',
  hyperparameters: {
    'type': { access: 'fixed', comment: 'Element type cannot be changed' },
    'element_id': { access: 'fixed', comment: 'Auto-generated ID' },
    'name': { access: 'edit', comment: 'L2 can provide custom name' },
    'description': { access: 'edit', comment: 'L2 can customize description' },
    'node_description': { access: 'fixed', comment: 'Base description is fixed' },
    'input_schema': { access: 'fixed', comment: 'Input structure is fixed' },
    'output_schema': { access: 'fixed', comment: 'Output structure is fixed' },
    'parameters.temperature': { access: 'edit', comment: 'L2 can adjust creativity level' },
    'parameters.max_tokens': { access: 'edit', comment: 'L2 can set response length limits' },
    'parameters.model': { access: 'fixed', comment: 'Model selection is fixed by L1' },
    'processing_message': { access: 'edit', comment: 'L2 can customize user-facing message' },
    'tags': { access: 'append', comment: 'L2 can add additional tags' }
  }
};

export const useElementStore = create<ElementState>((set, get) => ({
  element: defaultElement,
  isDirty: false,
  validationErrors: {},
  previewMode: 'yaml',
  levelView: 'L1',
  
  updateElement: (updates) => set((state) => ({
    element: { ...state.element, ...updates },
    isDirty: true
  })),
  
  updateSchema: (schemaType, schema) => set((state) => ({
    element: {
      ...state.element,
      [schemaType === 'input' ? 'inputSchema' : 'outputSchema']: schema
    },
    isDirty: true
  })),
  
  updateParameter: (name, value) => set((state) => ({
    element: {
      ...state.element,
      parameters: { ...state.element.parameters, [name]: value }
    },
    isDirty: true
  })),
  
  updateParameterSchema: (name, schema) => set((state) => ({
    element: {
      ...state.element,
      parameterSchemaStructure: {
        ...state.element.parameterSchemaStructure,
        [name]: schema
      }
    },
    isDirty: true
  })),
  
  updateHyperparameter: (path, access, comment) => set((state) => ({
    element: {
      ...state.element,
      hyperparameters: {
        ...state.element.hyperparameters,
        [path]: { access: access as AccessLevel, comment }
      }
    },
    isDirty: true
  })),
  
  addTag: (tag) => set((state) => ({
    element: {
      ...state.element,
      tags: [...state.element.tags, tag]
    },
    isDirty: true
  })),
  
  removeTag: (tag) => set((state) => ({
    element: {
      ...state.element,
      tags: state.element.tags.filter(t => t !== tag)
    },
    isDirty: true
  })),
  
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setLevelView: (level) => set({ levelView: level }),
  
  importYaml: (yaml) => {
    try {
      const parsed = JSON.parse(yaml); // For now, will implement YAML parsing later
      set({ element: parsed, isDirty: true });
    } catch (e) {
      console.error('Failed to parse YAML:', e);
    }
  },
  
  reset: () => set({
    element: { ...defaultElement },
    isDirty: false,
    validationErrors: {}
  })
}));