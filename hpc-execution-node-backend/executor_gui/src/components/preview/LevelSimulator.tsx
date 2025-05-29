import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { SimpleSelect } from '@/components/common/Select';
import { useElementStore } from '@/stores/elementStore';
import { simulateLevel } from '@/lib/level-simulator';

export function LevelSimulator() {
  const { element } = useElementStore();
  const [selectedLevel, setSelectedLevel] = useState<'L1' | 'L2' | 'L3'>('L2');
  
  const simulatedView = simulateLevel(element, selectedLevel);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={selectedLevel === 'L1' ? 'default' : 'outline'}
          onClick={() => setSelectedLevel('L1')}
        >
          L1 View (Full)
        </Button>
        <Button
          size="sm"
          variant={selectedLevel === 'L2' ? 'default' : 'outline'}
          onClick={() => setSelectedLevel('L2')}
        >
          L2 View (Flow Dev)
        </Button>
        <Button
          size="sm"
          variant={selectedLevel === 'L3' ? 'default' : 'outline'}
          onClick={() => setSelectedLevel('L3')}
        >
          L3 View (User)
        </Button>
      </div>
      
      <Card>
        <h4 className="font-medium mb-3">
          {selectedLevel} - {
            selectedLevel === 'L1' ? 'Element Developer View' :
            selectedLevel === 'L2' ? 'Flow Developer View' :
            'End User View'
          }
        </h4>
        
        <div className="space-y-4">
          {selectedLevel === 'L1' && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Full access to all properties and configurations.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-sm mb-2">Core Properties</h5>
                  <div className="space-y-2 text-sm">
                    <div>Type: <code className="bg-muted px-1 rounded">{element.type}</code></div>
                    <div>Name: <code className="bg-muted px-1 rounded">{element.name || 'Not set'}</code></div>
                    <div>Description: <code className="bg-muted px-1 rounded">{element.nodeDescription || 'Not set'}</code></div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm mb-2">Configuration</h5>
                  <div className="space-y-2 text-sm">
                    <div>Input Fields: <code className="bg-muted px-1 rounded">{Object.keys(element.inputSchema).length}</code></div>
                    <div>Output Fields: <code className="bg-muted px-1 rounded">{Object.keys(element.outputSchema).length}</code></div>
                    <div>Parameters: <code className="bg-muted px-1 rounded">{Object.keys(element.parameters).length}</code></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedLevel === 'L2' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Can only see and edit properties marked as 'edit' or 'append'. 
                Hidden properties are not visible.
              </p>
              
              {/* Show editable fields */}
              {simulatedView.editableFields.length > 0 ? (
                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Editable Properties</h5>
                  {simulatedView.editableFields.map((field) => (
                    <div key={field.path} className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        {field.label}
                        <span className={`text-xs px-2 py-1 rounded ${
                          field.access === 'edit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {field.access}
                        </span>
                      </label>
                      {field.type === 'text' && (
                        <Input value={String(field.value || '')} disabled placeholder="Editable by L2" />
                      )}
                      {field.type === 'number' && (
                        <Input type="number" value={String(field.value || '')} disabled placeholder="Editable by L2" />
                      )}
                      {field.type === 'select' && (
                        <SimpleSelect 
                          value={String(field.value || '')} 
                          onValueChange={() => {}} 
                          options={[{ value: String(field.value || ''), label: String(field.value || '') }]}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No properties are editable by L2 developers.
                  <br />
                  <span className="text-xs">Configure hyperparameters to allow L2 customization.</span>
                </div>
              )}
            </>
          )}
          
          {selectedLevel === 'L3' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Runtime view showing only input fields and processing status.
              </p>
              
              {/* Show input fields */}
              {Object.keys(element.inputSchema).length > 0 ? (
                <div className="space-y-3">
                  <h5 className="font-medium text-sm">User Inputs</h5>
                  {Object.entries(element.inputSchema).map(([fieldName, field]) => (
                    <div key={fieldName} className="space-y-2">
                      <label className="text-sm font-medium">
                        {fieldName}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Input 
                        placeholder={field.description || `Enter ${fieldName}`}
                        disabled 
                      />
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No input fields defined.
                  <br />
                  <span className="text-xs">Users won't have any inputs to provide.</span>
                </div>
              )}
              
              {element.processingMessage && (
                <div className="mt-6">
                  <h5 className="font-medium text-sm mb-2">Processing Status</h5>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {element.processingMessage}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}