import { Header } from './components/layout/Header'
import { cn } from './lib/utils'
import { Card } from './components/common/Card'
import { Button } from './components/common/Button'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        onNew={() => console.log('New')} 
        onSave={() => console.log('Save')} 
        onExport={() => console.log('Export')}
      />
      
      <main className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel - Editor */}
        <div className={cn(
          "w-1/2 border-r border-border p-6 overflow-y-auto",
          "bg-background"
        )}>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Element Editor</h2>
              <p className="text-muted-foreground">
                Create and configure your HPC Neura elements here.
              </p>
              <div className="mt-4 flex gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </Card>
            
            {/* Example form sections */}
            <Card>
              <h3 className="font-medium mb-3">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Element Type</label>
                  <input 
                    type="text" 
                    className={cn(
                      "w-full mt-1 px-3 py-2 rounded-md",
                      "border border-input bg-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                    placeholder="e.g., llm_text"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input 
                    type="text" 
                    className={cn(
                      "w-full mt-1 px-3 py-2 rounded-md",
                      "border border-input bg-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                    placeholder="Element name"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Right Panel - Preview */}
        <div className={cn(
          "w-1/2 p-6 overflow-y-auto",
          "bg-muted/30"
        )}>
          <div className="max-w-3xl mx-auto">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button size="sm" variant="outline">YAML</Button>
                  <Button size="sm" variant="outline">Visual</Button>
                  <Button size="sm" variant="outline">Levels</Button>
                </div>
                <div className="rounded-md bg-muted p-4 font-mono text-sm">
                  <pre className="text-muted-foreground">{`type: llm_text
node_description: "AI Text Generator"
input_schema:
  prompt:
    type: string
    required: true
    description: "Input prompt"
parameters:
  temperature: 0.7
  model: "llama-3.3"
hyperparameters:
  type:
    access: fixed
  parameters.temperature:
    access: edit
  parameters.model:
    access: fixed`}</pre>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
