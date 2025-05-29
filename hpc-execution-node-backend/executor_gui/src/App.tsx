import { Header } from './components/layout/Header';
import { SplitPane } from './components/layout/SplitPane';
import { ElementForm } from './components/editor/ElementForm';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { useElementStore } from './stores/elementStore';
import { exportToYaml } from './lib/yaml-generator';
import { saveAs } from 'file-saver';

function App() {
  const { element, isDirty, reset } = useElementStore();
  
  const handleSave = () => {
    // Implement save logic - for now just log
    console.log('Saving element:', element);
    // You could implement localStorage saving here
    localStorage.setItem('hpc-element-builder-current', JSON.stringify(element));
  };
  
  const handleExport = () => {
    const yaml = exportToYaml(element);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    saveAs(blob, `${element.type || 'element'}.yaml`);
  };
  
  const handleNew = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to create a new element?')) {
        reset();
      }
    } else {
      reset();
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header 
        onNew={handleNew}
        onSave={handleSave}
        onExport={handleExport}
      />
      
      <main className="h-[calc(100vh-3.5rem)]">
        <SplitPane
          left={<ElementForm />}
          right={<PreviewPanel />}
          defaultSize={50}
        />
      </main>
    </div>
  );
}

export default App
