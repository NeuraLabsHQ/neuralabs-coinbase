import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useElementStore } from '@/stores/elementStore';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export function MetadataSection() {
  const { element, updateElement, addTag, removeTag } = useElementStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const handleAddTag = () => {
    if (newTag.trim() && !element.tags.includes(newTag.trim())) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };
  
  return (
    <Card>
      <div 
        className="flex items-center justify-between cursor-pointer -m-6 p-6 pb-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">Metadata</h3>
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </div>
      
      {!isCollapsed && (
        <div className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Processing Message
              <span className="text-muted-foreground ml-1">(Shown during execution)</span>
            </label>
            <Input
              value={element.processingMessage || ''}
              onChange={(e) => updateElement({ processingMessage: e.target.value })}
              placeholder="Processing your request..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Layer</label>
            <Input
              value={element.layer || ''}
              onChange={(e) => updateElement({ layer: e.target.value })}
              placeholder="e.g., input, processing, output"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} size="sm">
                Add
              </Button>
            </div>
            
            {element.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {element.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}