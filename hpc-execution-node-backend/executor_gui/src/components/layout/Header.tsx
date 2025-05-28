import { ThemeToggle } from "../theme/theme-toggle"
import { Save, Download, FileJson, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  onSave?: () => void;
  onExport?: () => void;
  onNew?: () => void;
}

export function Header({ onSave, onExport, onNew }: HeaderProps) {
  return (
    <header className={cn(
      "h-14 border-b border-border bg-background px-4",
      "flex items-center justify-between"
    )}>
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">HPC Neura Element Builder</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onNew}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-md",
            "text-sm font-medium",
            "hover:bg-accent hover:text-accent-foreground",
            "transition-colors"
          )}
        >
          <Plus className="h-4 w-4" />
          New
        </button>
        
        <button
          onClick={onSave}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-md",
            "text-sm font-medium",
            "hover:bg-accent hover:text-accent-foreground",
            "transition-colors"
          )}
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        
        <button
          onClick={onExport}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-md",
            "text-sm font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "transition-colors"
          )}
        >
          <FileJson className="h-4 w-4" />
          Export YAML
        </button>
        
        <div className="ml-2 h-6 w-px bg-border" />
        
        <ThemeToggle />
      </div>
    </header>
  )
}