import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { SimpleSelect } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useElementStore } from '@/stores/elementStore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const ELEMENT_TYPES = [
  { value: 'llm_text', label: 'LLM Text' },
  { value: 'llm_structured', label: 'LLM Structured' },
  { value: 'selector', label: 'Selector' },
  { value: 'merger', label: 'Merger' },
  { value: 'case', label: 'Case' },
  { value: 'flow_select', label: 'Flow Select' },
  { value: 'custom', label: 'Custom' },
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
  { value: 'chat_input', label: 'Chat Input' },
  { value: 'rest_api', label: 'REST API' },
  { value: 'metadata', label: 'Metadata' },
  { value: 'constants', label: 'Constants' },
];

export function BasicInfoSection() {
  const { element, updateElement } = useElementStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <Card>
      <div 
        className="flex items-center justify-between cursor-pointer -m-6 p-6 pb-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">Basic Information</h3>
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </div>
      
      {!isCollapsed && (
        <div className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Element Type
            </label>
            <SimpleSelect
              value={element.type}
              onValueChange={(value) => updateElement({ type: value })}
              options={ELEMENT_TYPES}
              placeholder="Select element type"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">
              Name
              <span className="text-muted-foreground ml-1">(L2 customizable)</span>
            </label>
            <Input
              value={element.name || ''}
              onChange={(e) => updateElement({ name: e.target.value })}
              placeholder="Custom element name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">
              Node Description
              <span className="text-muted-foreground ml-1">(L1 fixed)</span>
            </label>
            <Textarea
              value={element.nodeDescription}
              onChange={(e) => updateElement({ nodeDescription: e.target.value })}
              placeholder="Base description of what this element does"
              rows={2}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">
              Description
              <span className="text-muted-foreground ml-1">(L2 customizable)</span>
            </label>
            <Textarea
              value={element.description || ''}
              onChange={(e) => updateElement({ description: e.target.value })}
              placeholder="Custom description for this instance"
              rows={2}
            />
          </div>
        </div>
      )}
    </Card>
  );
}