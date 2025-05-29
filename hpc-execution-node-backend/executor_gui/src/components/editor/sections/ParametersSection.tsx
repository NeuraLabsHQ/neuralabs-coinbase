import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { SimpleSelect } from '@/components/common/Select';
import { useElementStore } from '@/stores/elementStore';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { DataType, ParameterSchemaField } from '@/types/element';

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'int', label: 'Integer' },
  { value: 'float', label: 'Float' },
  { value: 'bool', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
  { value: 'list', label: 'List' },
];

export function ParametersSection() {
  const { element, updateElement, updateParameter, updateParameterSchema } = useElementStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newParamName, setNewParamName] = useState('');
  
  const addParameter = () => {
    if (newParamName && !element.parameters[newParamName]) {
      updateParameter(newParamName, '');
      updateParameterSchema(newParamName, { type: 'string' });
      setNewParamName('');
    }
  };
  
  const removeParameter = (name: string) => {
    const newParams = { ...element.parameters };
    delete newParams[name];
    const newSchema = { ...element.parameterSchemaStructure };
    delete newSchema[name];
    
    updateElement({ 
      parameters: newParams,
      parameterSchemaStructure: newSchema
    });
  };
  
  return (
    <Card>
      <div 
        className="flex items-center justify-between cursor-pointer -m-6 p-6 pb-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">Parameters</h3>
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </div>
      
      {!isCollapsed && (
        <div className="space-y-4 mt-6">
          {/* Add parameter */}
          <div className="flex gap-2">
            <Input
              value={newParamName}
              onChange={(e) => setNewParamName(e.target.value)}
              placeholder="Parameter name"
              onKeyDown={(e) => e.key === 'Enter' && addParameter()}
            />
            <Button onClick={addParameter} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Parameter list */}
          {Object.entries(element.parameters).map(([name, value]) => (
            <ParameterEditor
              key={name}
              name={name}
              value={value}
              schema={element.parameterSchemaStructure?.[name]}
              onUpdateValue={(v) => updateParameter(name, v)}
              onUpdateSchema={(s) => updateParameterSchema(name, s)}
              onRemove={() => removeParameter(name)}
            />
          ))}
          
          {Object.keys(element.parameters).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No parameters defined. Add a parameter to get started.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface ParameterEditorProps {
  name: string;
  value: any;
  schema?: ParameterSchemaField;
  onUpdateValue: (value: any) => void;
  onUpdateSchema: (schema: ParameterSchemaField) => void;
  onRemove: () => void;
}

function ParameterEditor({ name, value, schema, onUpdateValue, onUpdateSchema, onRemove }: ParameterEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const currentSchema = schema || { type: 'string' };
  
  const renderValueInput = () => {
    switch (currentSchema.type) {
      case 'bool':
        return (
          <SimpleSelect
            value={value?.toString() || 'false'}
            onValueChange={(v) => onUpdateValue(v === 'true')}
            options={[
              { value: 'true', label: 'True' },
              { value: 'false', label: 'False' }
            ]}
          />
        );
      case 'int':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onUpdateValue(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="Integer value"
          />
        );
      case 'float':
        return (
          <Input
            type="number"
            step="0.01"
            value={value || ''}
            onChange={(e) => onUpdateValue(e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="Float value"
          />
        );
      case 'json':
        return (
          <Input
            value={typeof value === 'object' ? JSON.stringify(value) : value || ''}
            onChange={(e) => {
              try {
                onUpdateValue(JSON.parse(e.target.value));
              } catch {
                onUpdateValue(e.target.value);
              }
            }}
            placeholder='{"key": "value"}'
          />
        );
      case 'list':
        return (
          <Input
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => onUpdateValue(e.target.value.split(',').map(s => s.trim()))}
            placeholder="item1, item2, item3"
          />
        );
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onUpdateValue(e.target.value)}
            placeholder="Parameter value"
          />
        );
    }
  };
  
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <span className="font-medium">{name}</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <SimpleSelect
                value={currentSchema.type}
                onValueChange={(type) => 
                  onUpdateSchema({ ...currentSchema, type: type as DataType })
                }
                options={DATA_TYPES}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Value</label>
              {renderValueInput()}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Input
              value={currentSchema.description || ''}
              onChange={(e) => onUpdateSchema({ ...currentSchema, description: e.target.value })}
              placeholder="Parameter description"
            />
          </div>
          
          {/* Type-specific constraints */}
          {(currentSchema.type === 'int' || currentSchema.type === 'float') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Minimum</label>
                <Input
                  type="number"
                  value={currentSchema.min ?? ''}
                  onChange={(e) => onUpdateSchema({ 
                    ...currentSchema, 
                    min: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Maximum</label>
                <Input
                  type="number"
                  value={currentSchema.max ?? ''}
                  onChange={(e) => onUpdateSchema({ 
                    ...currentSchema, 
                    max: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}