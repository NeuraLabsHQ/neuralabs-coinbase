import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { SimpleSelect } from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Textarea } from '@/components/common/Textarea';
import type { Schema, SchemaField, DataType } from '@/types/element';
import { Plus, Trash2, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaEditorProps {
  schema: Schema;
  onChange: (schema: Schema) => void;
}

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'int', label: 'Integer' },
  { value: 'float', label: 'Float' },
  { value: 'bool', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
  { value: 'list', label: 'List' },
];

export function SchemaEditor({ schema, onChange }: SchemaEditorProps) {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonValue, setJsonValue] = useState(JSON.stringify(schema, null, 2));
  
  const addField = () => {
    const newFieldName = `field_${Object.keys(schema).length + 1}`;
    onChange({
      ...schema,
      [newFieldName]: {
        type: 'string',
        required: false,
        description: '',
      }
    });
  };
  
  const updateField = (oldName: string, newName: string, field: SchemaField) => {
    const newSchema = { ...schema };
    if (oldName !== newName) {
      delete newSchema[oldName];
    }
    newSchema[newName] = field;
    onChange(newSchema);
  };
  
  const removeField = (fieldName: string) => {
    const newSchema = { ...schema };
    delete newSchema[fieldName];
    onChange(newSchema);
  };
  
  const toggleJsonMode = () => {
    if (jsonMode) {
      try {
        const parsed = JSON.parse(jsonValue);
        onChange(parsed);
        setJsonMode(false);
      } catch (e) {
        alert('Invalid JSON');
      }
    } else {
      setJsonValue(JSON.stringify(schema, null, 2));
      setJsonMode(true);
    }
  };
  
  if (jsonMode) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">JSON Mode</span>
          <Button size="sm" variant="outline" onClick={toggleJsonMode}>
            Switch to Form
          </Button>
        </div>
        <Textarea
          value={jsonValue}
          onChange={(e) => setJsonValue(e.target.value)}
          className="font-mono text-sm"
          rows={10}
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          size="sm"
          variant="outline"
          onClick={addField}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={toggleJsonMode}
          className="gap-2"
        >
          <Code className="h-4 w-4" />
          JSON Mode
        </Button>
      </div>
      
      {Object.entries(schema).map(([fieldName, field]) => (
        <SchemaFieldEditor
          key={fieldName}
          fieldName={fieldName}
          field={field}
          onUpdate={(newName, newField) => updateField(fieldName, newName, newField)}
          onRemove={() => removeField(fieldName)}
        />
      ))}
      
      {Object.keys(schema).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No fields defined. Click "Add Field" to get started.
        </div>
      )}
    </div>
  );
}

interface SchemaFieldEditorProps {
  fieldName: string;
  field: SchemaField;
  onUpdate: (fieldName: string, field: SchemaField) => void;
  onRemove: () => void;
}

function SchemaFieldEditor({ fieldName, field, onUpdate, onRemove }: SchemaFieldEditorProps) {
  const [name, setName] = useState(fieldName);
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className={cn(
      "border rounded-lg p-4 space-y-3",
      "bg-card"
    )}>
      <div className="flex items-center justify-between">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onUpdate(name, field)}
          className="font-medium max-w-[200px]"
          placeholder="Field name"
        />
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
                value={field.type}
                onValueChange={(value) => 
                  onUpdate(name, { ...field, type: value as DataType })
                }
                options={DATA_TYPES}
              />
            </div>
            
            <div className="flex items-end">
              <Checkbox
                checked={field.required}
                onCheckedChange={(checked) => 
                  onUpdate(name, { ...field, required: !!checked })
                }
                label="Required"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              value={field.description}
              onChange={(e) => onUpdate(name, { ...field, description: e.target.value })}
              placeholder="Field description"
              rows={2}
            />
          </div>
          
          {/* Type-specific constraints */}
          {field.type === 'string' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Min Length</label>
                <Input
                  type="number"
                  value={field.minLength || ''}
                  onChange={(e) => onUpdate(name, { 
                    ...field, 
                    minLength: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Length</label>
                <Input
                  type="number"
                  value={field.maxLength || ''}
                  onChange={(e) => onUpdate(name, { 
                    ...field, 
                    maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          )}
          
          {(field.type === 'int' || field.type === 'float') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Minimum</label>
                <Input
                  type="number"
                  value={field.min ?? ''}
                  onChange={(e) => onUpdate(name, { 
                    ...field, 
                    min: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Maximum</label>
                <Input
                  type="number"
                  value={field.max ?? ''}
                  onChange={(e) => onUpdate(name, { 
                    ...field, 
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