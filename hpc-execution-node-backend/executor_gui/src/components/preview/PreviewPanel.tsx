import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { YamlPreview } from './YamlPreview';
import { VisualPreview } from './VisualPreview';
import { LevelSimulator } from './LevelSimulator';
import { useElementStore } from '@/stores/elementStore';

export function PreviewPanel() {
  const { previewMode, setPreviewMode } = useElementStore();
  
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Preview</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={previewMode === 'yaml' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('yaml')}
            >
              YAML
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'visual' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('visual')}
            >
              Visual
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'levels' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('levels')}
            >
              Levels
            </Button>
          </div>
        </div>
        
        <div className="min-h-[400px]">
          {previewMode === 'yaml' && <YamlPreview />}
          {previewMode === 'visual' && <VisualPreview />}
          {previewMode === 'levels' && <LevelSimulator />}
        </div>
      </Card>
    </div>
  );
}