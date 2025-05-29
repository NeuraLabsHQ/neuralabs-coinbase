import { useElementStore } from '@/stores/elementStore';
import { Card } from '@/components/common/Card';
import { cn } from '@/lib/utils';

export function VisualPreview() {
  const { element } = useElementStore();
  
  const getElementIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'llm_text': '🤖',
      'llm_structured': '📝',
      'selector': '🎯',
      'merger': '🔀',
      'case': '🔀',
      'flow_select': '⚡',
      'custom': '⚙️',
      'start': '▶️',
      'end': '⏹️',
      'chat_input': '💬',
      'rest_api': '🌐',
      'metadata': '📋',
      'constants': '📌',
    };
    return iconMap[type] || '📦';
  };
  
  const inputFields = Object.keys(element.inputSchema);
  const outputFields = Object.keys(element.outputSchema);
  const parameterCount = Object.keys(element.parameters).length;
  
  return (
    <div className="space-y-4">
      {/* Element Card */}
      <Card className="relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{getElementIcon(element.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold truncate">
                {element.name || element.type}
              </h3>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                {element.type}
              </span>
            </div>
            
            {element.nodeDescription && (
              <p className="text-sm text-muted-foreground mb-3">
                {element.nodeDescription}
              </p>
            )}
            
            {element.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {element.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600 dark:text-blue-400">
                  {inputFields.length}
                </div>
                <div className="text-muted-foreground">Inputs</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600 dark:text-green-400">
                  {outputFields.length}
                </div>
                <div className="text-muted-foreground">Outputs</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600 dark:text-purple-400">
                  {parameterCount}
                </div>
                <div className="text-muted-foreground">Parameters</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Connection Ports Preview */}
      <div className="grid grid-cols-2 gap-4">
        {/* Input Ports */}
        <Card>
          <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">Input Ports</h4>
          <div className="space-y-2">
            {inputFields.length > 0 ? (
              inputFields.map((field) => (
                <div
                  key={field}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded border",
                    "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">{field}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {element.inputSchema[field].type}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No input fields defined
              </div>
            )}
          </div>
        </Card>
        
        {/* Output Ports */}
        <Card>
          <h4 className="font-medium mb-3 text-green-600 dark:text-green-400">Output Ports</h4>
          <div className="space-y-2">
            {outputFields.length > 0 ? (
              outputFields.map((field) => (
                <div
                  key={field}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded border",
                    "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">{field}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {element.outputSchema[field].type}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No output fields defined
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Parameters Preview */}
      {parameterCount > 0 && (
        <Card>
          <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Parameters</h4>
          <div className="space-y-2">
            {Object.entries(element.parameters).map(([name, value]) => (
              <div
                key={name}
                className="flex items-center justify-between p-2 rounded bg-muted"
              >
                <span className="text-sm font-medium">{name}</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}