import colors from '../color.js';

// Function to convert color object to CSS variables
export const generateCSSVariables = (colorObj, prefix = '') => {
  let cssVars = '';
  
  const processColors = (obj, currentPrefix) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (value.light !== undefined && value.dark !== undefined) {
          // Handle light/dark theme colors
          cssVars += `  --${currentPrefix}-${key}: ${value.light};\n`;
        } else {
          // Recurse for nested objects
          processColors(value, currentPrefix ? `${currentPrefix}-${key}` : key);
        }
      } else if (typeof value === 'string') {
        // Direct color value
        cssVars += `  --${currentPrefix}-${key}: ${value};\n`;
      }
    });
  };
  
  processColors(colorObj, prefix);
  return cssVars;
};

// Generate dark theme CSS variables
export const generateDarkThemeCSSVariables = (colorObj, prefix = '') => {
  let cssVars = '';
  
  const processColors = (obj, currentPrefix) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (value.dark !== undefined) {
          // Handle dark theme color
          cssVars += `  --${currentPrefix}-${key}: ${value.dark};\n`;
        } else {
          // Recurse for nested objects
          processColors(value, currentPrefix ? `${currentPrefix}-${key}` : key);
        }
      }
    });
  };
  
  processColors(colorObj, prefix);
  return cssVars;
};

// Export all CSS variables for use in SCSS
export const exportColorVariables = () => {
  let output = '/* Auto-generated from color.js - DO NOT EDIT MANUALLY */\n\n';
  
  // Light theme (default)
  output += ':root {\n';
  output += '  /* Core color scales */\n';
  output += generateCSSVariables(colors.neutral, 'neutral');
  output += generateCSSVariables(colors.gray, 'gray');
  output += generateCSSVariables(colors.blue, 'blue');
  output += generateCSSVariables(colors.green, 'green');
  output += generateCSSVariables(colors.purple, 'purple');
  output += generateCSSVariables(colors.yellow, 'yellow');
  output += generateCSSVariables(colors.red, 'red');
  output += generateCSSVariables(colors.ocean, 'ocean');
  
  output += '\n  /* Component colors */\n';
  output += generateCSSVariables(colors.navbar, 'navbar');
  output += generateCSSVariables(colors.marketplace, 'marketplace');
  output += generateCSSVariables(colors.vizpanel, 'vizpanel');
  output += generateCSSVariables(colors.blockpanel, 'blockpanel');
  output += generateCSSVariables(colors.sidepanel, 'sidepanel');
  output += generateCSSVariables(colors.detailpanel, 'detailpanel');
  output += generateCSSVariables(colors.accessManagement, 'accessManagement');
  output += generateCSSVariables(colors.canvas, 'canvas');
  output += generateCSSVariables(colors.chat, 'chat');
  output += generateCSSVariables(colors.states, 'states');
  output += generateCSSVariables(colors.shadows, 'shadows');
  output += generateCSSVariables(colors.ports, 'ports');
  output += '}\n\n';
  
  // Dark theme
  output += '[data-theme="dark"] {\n';
  output += generateDarkThemeCSSVariables(colors.navbar, 'navbar');
  output += generateDarkThemeCSSVariables(colors.marketplace, 'marketplace');
  output += generateDarkThemeCSSVariables(colors.vizpanel, 'vizpanel');
  output += generateDarkThemeCSSVariables(colors.blockpanel, 'blockpanel');
  output += generateDarkThemeCSSVariables(colors.sidepanel, 'sidepanel');
  output += generateDarkThemeCSSVariables(colors.detailpanel, 'detailpanel');
  output += generateDarkThemeCSSVariables(colors.accessManagement, 'accessManagement');
  output += generateDarkThemeCSSVariables(colors.canvas, 'canvas');
  output += generateDarkThemeCSSVariables(colors.chat, 'chat');
  output += generateDarkThemeCSSVariables(colors.states, 'states');
  output += generateDarkThemeCSSVariables(colors.shadows, 'shadows');
  output += generateDarkThemeCSSVariables(colors.ports, 'ports');
  output += '}\n';
  
  return output;
};

// Helper to get color value with theme support
export const getColor = (path, theme = 'light') => {
  const keys = path.split('.');
  let value = colors;
  
  for (const key of keys) {
    if (value[key] !== undefined) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  if (typeof value === 'object' && value[theme] !== undefined) {
    return value[theme];
  }
  
  return value;
};