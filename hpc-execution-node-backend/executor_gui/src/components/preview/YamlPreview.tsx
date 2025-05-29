import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { useElementStore } from '@/stores/elementStore';
import { exportToYaml } from '@/lib/yaml-generator';
import { Copy, Download } from 'lucide-react';
import { saveAs } from 'file-saver';

export function YamlPreview() {
  const { element } = useElementStore();
  const [yaml, setYaml] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  useEffect(() => {
    setYaml(exportToYaml(element));
  }, [element]);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };
  
  const downloadYaml = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    saveAs(blob, `${element.type || 'element'}.yaml`);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={copyToClipboard}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          {copySuccess ? 'Copied!' : 'Copy'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={downloadYaml}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
      
      <div className="rounded-lg bg-muted p-4 overflow-x-auto">
        <pre className="text-sm font-mono whitespace-pre text-muted-foreground">
          <code>{yaml}</code>
        </pre>
      </div>
    </div>
  );
}