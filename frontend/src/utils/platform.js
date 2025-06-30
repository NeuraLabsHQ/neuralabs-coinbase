// Platform detection utilities for cross-platform keyboard shortcuts

export const isMac = () => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
         navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
};

export const isWindows = () => {
  return navigator.platform.toUpperCase().indexOf('WIN') >= 0 ||
         navigator.userAgent.toUpperCase().indexOf('WINDOWS') >= 0;
};

export const isLinux = () => {
  return navigator.platform.toUpperCase().indexOf('LINUX') >= 0 ||
         navigator.userAgent.toUpperCase().indexOf('LINUX') >= 0;
};

export const isTouchDevice = () => {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
};

// Get the appropriate modifier key label for the platform
export const getModifierKey = () => {
  return isMac() ? 'Cmd' : 'Ctrl';
};

// Get the appropriate modifier key symbol for the platform
export const getModifierSymbol = () => {
  return isMac() ? '⌘' : 'Ctrl';
};

// Check if the appropriate modifier key is pressed for the platform
export const isModifierKeyPressed = (event) => {
  return isMac() ? event.metaKey : event.ctrlKey;
};

// Get platform-specific keyboard shortcut text
export const getShortcutText = (baseKey) => {
  const modifier = getModifierKey();
  return `${modifier}+${baseKey}`;
};

// Get platform-specific keyboard shortcut with symbol
export const getShortcutSymbol = (baseKey) => {
  const modifier = getModifierSymbol();
  return `${modifier}${baseKey}`;
};

// Common keyboard shortcuts with platform-specific modifiers
export const shortcuts = {
  save: () => getShortcutText('S'),
  copy: () => getShortcutText('C'),
  paste: () => getShortcutText('V'),
  cut: () => getShortcutText('X'),
  undo: () => getShortcutText('Z'),
  redo: () => isMac() ? getShortcutText('Shift+Z') : getShortcutText('Y'),
  selectAll: () => getShortcutText('A'),
  delete: () => isMac() ? 'Delete' : 'Del',
  // Flow builder specific
  dragNode: () => `Hold ${getModifierKey()} + Drag`,
  skipDetailsPanel: () => `${getModifierKey()} + Click`,
  cancelConnection: () => 'ESC',
};

// Export all platform detection and shortcut utilities
export default {
  isMac,
  isWindows,
  isLinux,
  isTouchDevice,
  getModifierKey,
  getModifierSymbol,
  isModifierKeyPressed,
  getShortcutText,
  getShortcutSymbol,
  shortcuts
};