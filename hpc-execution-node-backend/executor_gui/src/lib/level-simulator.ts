import type { Element } from '@/types/element';

export function simulateLevel(element: Element, level: 'L1' | 'L2' | 'L3') {
  if (level === 'L1') {
    return { editableFields: [], visibleProperties: element };
  }
  
  if (level === 'L2') {
    const editableFields: any[] = [];
    
    // Check each hyperparameter
    Object.entries(element.hyperparameters).forEach(([path, rule]) => {
      if (rule.access === 'edit' || rule.access === 'append') {
        // Parse the path to get the value
        const value = getValueByPath(element, path);
        editableFields.push({
          path,
          label: formatPathLabel(path),
          value,
          type: getFieldType(path, element),
          access: rule.access,
        });
      }
    });
    
    return { editableFields, visibleProperties: filterHiddenProperties(element) };
  }
  
  if (level === 'L3') {
    return { 
      editableFields: [], 
      visibleProperties: {
        inputSchema: element.inputSchema,
        processingMessage: element.processingMessage,
      }
    };
  }
  
  return { editableFields: [], visibleProperties: {} };
}

function getValueByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current?.[part] !== undefined) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function formatPathLabel(path: string): string {
  const parts = path.split('.');
  const last = parts[parts.length - 1];
  return last.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getFieldType(path: string, element: Element): string {
  if (path.includes('temperature') || path.includes('tokens')) return 'number';
  if (path.includes('tags')) return 'tags';
  if (path === 'type') return 'select';
  return 'text';
}

function filterHiddenProperties(element: Element): any {
  const filtered = { ...element };
  
  Object.entries(element.hyperparameters).forEach(([path, rule]) => {
    if (rule.access === 'hidden') {
      // Remove hidden properties
      removeByPath(filtered, path);
    }
  });
  
  return filtered;
}

function removeByPath(obj: any, path: string): void {
  const parts = path.split('.');
  const last = parts.pop()!;
  let current = obj;
  
  for (const part of parts) {
    if (current?.[part]) {
      current = current[part];
    } else {
      return;
    }
  }
  
  if (current && last in current) {
    delete current[last];
  }
}