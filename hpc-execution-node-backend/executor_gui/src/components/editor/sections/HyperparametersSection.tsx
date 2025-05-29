import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { SimpleSelect } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useElementStore } from '@/stores/elementStore';
import { ChevronDown, ChevronUp, Lock, Edit, Plus, Eye } from 'lucide-react';

const ACCESS_LEVELS = [
  { value: 'fixed', label: 'Fixed', icon: Lock },
  { value: 'edit', label: 'Editable', icon: Edit },
  { value: 'append', label: 'Appendable', icon: Plus },
  { value: 'hidden', label: 'Hidden', icon: Eye },
];

export function HyperparametersSection() {
  const { element, updateHyperparameter } = useElementStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Get all possible paths from the element
  const getAllPaths = () => {
    const paths: string[] = [
      'type',
      'element_id',
      'name',
      'node_description',
      'description',
      'input_schema',
      'output_schema',
      'processing_message',
      'tags',
      'layer',
    ];
    
    // Add parameter paths
    Object.keys(element.parameters).forEach(param => {
      paths.push(`parameters.${param}`);
    });
    
    // Add special property paths
    if (element.code !== undefined) paths.push('code');
    if (element.flowControl !== undefined) paths.push('flow_control');
    
    return paths;
  };
  
  return (
    <Card>
      <div 
        className="flex items-center justify-between cursor-pointer -m-6 p-6 pb-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">Hyperparameters (Access Control)</h3>
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </div>
      
      {!isCollapsed && (
        <div className="space-y-2 mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Define who can modify each property. This controls what L2 developers can customize.
          </p>
          
          {getAllPaths().map(path => {
            const rule = element.hyperparameters[path] || { access: 'fixed' };
            const AccessIcon = ACCESS_LEVELS.find(l => l.value === rule.access)?.icon || Lock;
            
            return (
              <div
                key={path}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AccessIcon className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm font-mono">{path}</code>
                  </div>
                  <SimpleSelect
                    value={rule.access}
                    onValueChange={(value) => 
                      updateHyperparameter(path, value as any, rule.comment)
                    }
                    options={ACCESS_LEVELS}
                  />
                </div>
                
                <Input
                  value={rule.comment || ''}
                  onChange={(e) => 
                    updateHyperparameter(path, rule.access, e.target.value)
                  }
                  placeholder="Comment (optional)"
                  className="text-sm"
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}