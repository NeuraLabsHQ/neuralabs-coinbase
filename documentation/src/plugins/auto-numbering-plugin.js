const path = require('path');

module.exports = function autoNumberingPlugin(context, options) {
  return {
    name: 'auto-numbering-plugin',
    
    getClientModules() {
      return [path.resolve(__dirname, './client-auto-numbering.js')];
    },
  };
};