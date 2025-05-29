import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSize?: number;
}

export function SplitPane({ left, right, defaultSize = 50 }: SplitPaneProps) {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={defaultSize} minSize={30}>
        <div className="h-full overflow-y-auto bg-background p-6">
          {left}
        </div>
      </Panel>
      
      <PanelResizeHandle className="w-px bg-border hover:bg-primary/20 transition-colors" />
      
      <Panel minSize={30}>
        <div className="h-full overflow-y-auto bg-muted/30 p-6">
          {right}
        </div>
      </Panel>
    </PanelGroup>
  );
}