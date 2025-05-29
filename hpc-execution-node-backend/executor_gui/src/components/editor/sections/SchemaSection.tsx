import { Card } from '@/components/common/Card';
import { SchemaEditor } from '../SchemaEditor';
import { useElementStore } from '@/stores/elementStore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SchemaSectionProps {
  type: 'input' | 'output';
}

export function SchemaSection({ type }: SchemaSectionProps) {
  const { element, updateSchema } = useElementStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const schema = type === 'input' ? element.inputSchema : element.outputSchema;
  const title = type === 'input' ? 'Input Schema' : 'Output Schema';
  
  return (
    <Card>
      <div 
        className="flex items-center justify-between cursor-pointer -m-6 p-6 pb-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </div>
      
      {!isCollapsed && (
        <div className="mt-6">
          <SchemaEditor
            schema={schema}
            onChange={(newSchema) => updateSchema(type, newSchema)}
          />
        </div>
      )}
    </Card>
  );
}