// src/utils/flowBeautifier.js

/**
 * Beautifies a flow graph by organizing nodes into layers and positioning them neatly
 * @param {Array} nodes - Array of node objects with positions
 * @param {Array} edges - Array of edge objects {source, target}
 * @returns {Object} - {nodes: rearranged nodes, layerMap: map of layers to node ids}
 */
export const beautifyFlow = (nodes, edges) => {
    if (!nodes.length) return { nodes: [], layerMap: {} };
  
    // 1. Create an adjacency map for the graph
    const outgoingMap = {}; // node -> outgoing nodes
    const incomingMap = {}; // node -> incoming nodes
    
    // Initialize maps
    nodes.forEach(node => {
      outgoingMap[node.id] = [];
      incomingMap[node.id] = [];
    });
    
    // Populate adjacency maps
    edges.forEach(edge => {
      if (edge.source && edge.target && outgoingMap[edge.source] && incomingMap[edge.target]) {
        outgoingMap[edge.source].push(edge.target);
        incomingMap[edge.target].push(edge.source);
      }
    });
    
    // 2. Find source nodes (nodes with no incoming edges)
    const sourceNodes = nodes
      .filter(node => incomingMap[node.id].length === 0)
      .map(node => node.id);
    
    // If no source nodes found, pick a random node as source
    if (sourceNodes.length === 0 && nodes.length > 0) {
      sourceNodes.push(nodes[0].id);
    }
    
    // 3. Assign layers using BFS from source nodes
    const nodeToLayer = {};
    const layerToNodes = {};
    const queue = sourceNodes.map(id => ({ id, layer: 0 }));
    const visited = new Set();
    
    while (queue.length > 0) {
      const { id, layer } = queue.shift();
      
      if (visited.has(id)) {
        // If we've seen this node before, update its layer to be the maximum
        const currentLayer = nodeToLayer[id];
        if (layer > currentLayer) {
          // Remove from old layer
          const oldLayerNodes = layerToNodes[currentLayer];
          if (oldLayerNodes) {
            const index = oldLayerNodes.indexOf(id);
            if (index > -1) {
              oldLayerNodes.splice(index, 1);
            }
          }
          
          // Add to new layer
          nodeToLayer[id] = layer;
          if (!layerToNodes[layer]) {
            layerToNodes[layer] = [];
          }
          layerToNodes[layer].push(id);
        }
        continue;
      }
      
      visited.add(id);
      nodeToLayer[id] = layer;
      
      // Add to layer map
      if (!layerToNodes[layer]) {
        layerToNodes[layer] = [];
      }
      layerToNodes[layer].push(id);
      
      // Add all outgoing nodes to queue with incremented layer
      if (outgoingMap[id]) {
        outgoingMap[id].forEach(targetId => {
          queue.push({ id: targetId, layer: layer + 1 });
        });
      }
    }
    
    // Handle nodes not visited in BFS (disconnected components)
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const layer = Math.max(...Object.values(nodeToLayer), 0) + 1;
        nodeToLayer[node.id] = layer;
        
        if (!layerToNodes[layer]) {
          layerToNodes[layer] = [];
        }
        layerToNodes[layer].push(node.id);
      }
    });
    
    // 3.5. Iterative refinement of layers
    // First calculate BFS height, then apply: min(child_nodes) - 1
    // Store the original BFS layers for reference
    const bfsLayers = { ...nodeToLayer };
    
    const refineNodeLayers = () => {
      let changed = true;
      let iterations = 0;
      const maxIterations = 35; // Set to 35 as requested
      
      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        
        // Process each node
        nodes.forEach(node => {
          const nodeId = node.id;
          const currentLayer = nodeToLayer[nodeId];
          const bfsLayer = bfsLayers[nodeId]; // Original BFS layer
          const children = outgoingMap[nodeId] || [];
          
          if (children.length > 0) {
            // Find minimum layer of all children
            const minChildLayer = Math.min(...children.map(childId => nodeToLayer[childId]));
            
            // Apply the formula: min(child_nodes) - 1
            // Allow negative layers during iteration
            const newLayer = minChildLayer - 1;
            
            if (newLayer !== currentLayer) {
              changed = true;
              
              // Remove from old layer
              const oldLayerNodes = layerToNodes[currentLayer];
              if (oldLayerNodes) {
                const index = oldLayerNodes.indexOf(nodeId);
                if (index > -1) {
                  oldLayerNodes.splice(index, 1);
                }
                // Remove empty layers
                if (oldLayerNodes.length === 0) {
                  delete layerToNodes[currentLayer];
                }
              }
              
              // Add to new layer
              nodeToLayer[nodeId] = newLayer;
              if (!layerToNodes[newLayer]) {
                layerToNodes[newLayer] = [];
              }
              layerToNodes[newLayer].push(nodeId);
            }
          }
        });
        
        console.log(`Refinement iteration ${iterations}: ${changed ? 'changes made' : 'no changes'}`);
      }
      
      if (iterations === maxIterations) {
        console.warn('Layer refinement reached maximum iterations');
      }
      
      // After all iterations, find the minimum layer value
      const allLayers = Object.values(nodeToLayer);
      const minLayer = Math.min(...allLayers);
      
      // If minimum layer is negative, apply offset to all nodes
      if (minLayer < 0) {
        const offset = -minLayer; // Make it positive
        console.log(`Applying offset of +${offset} to all layers (min layer was ${minLayer})`);
        
        // Create new layer mappings with offset
        const newNodeToLayer = {};
        const newLayerToNodes = {};
        
        Object.entries(nodeToLayer).forEach(([nodeId, layer]) => {
          const newLayer = layer + offset;
          newNodeToLayer[nodeId] = newLayer;
          
          if (!newLayerToNodes[newLayer]) {
            newLayerToNodes[newLayer] = [];
          }
          newLayerToNodes[newLayer].push(nodeId);
        });
        
        // Replace the old mappings
        Object.keys(nodeToLayer).forEach(key => delete nodeToLayer[key]);
        Object.keys(layerToNodes).forEach(key => delete layerToNodes[key]);
        Object.assign(nodeToLayer, newNodeToLayer);
        Object.assign(layerToNodes, newLayerToNodes);
      }
    };
    
    // Apply the iterative refinement
    refineNodeLayers();
    
    // 4. Calculate positions for each node
    const VERTICAL_SPACING = 200;
    const HORIZONTAL_SPACING = 250;
    const BASE_Y = 100;
    
    // Sort layers
    const sortedLayers = Object.keys(layerToNodes)
      .map(Number)
      .sort((a, b) => a - b);
    
    // Create updated nodes with new positions
    const updatedNodes = nodes.map(node => {
      const layer = nodeToLayer[node.id];
      const nodesInLayer = layerToNodes[layer] || [];
      const indexInLayer = nodesInLayer.indexOf(node.id);
      
      // If node not found in layer (shouldn't happen but defensive coding)
      if (indexInLayer === -1) {
        console.warn(`Node ${node.id} not found in its assigned layer ${layer}`);
        return node; // Return original position
      }
      
      // Calculate position in the layer
      const layerWidth = (nodesInLayer.length - 1) * HORIZONTAL_SPACING;
      const startX = -layerWidth / 2;
      
      const x = startX + indexInLayer * HORIZONTAL_SPACING;
      const y = BASE_Y + layer * VERTICAL_SPACING;
      
      return { ...node, x, y };
    });
    
    // Create a readable layer map for UI display
    const layerMap = {};
    sortedLayers.forEach(layer => {
      layerMap[layer] = layerToNodes[layer].map(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        return {
          id: nodeId,
          name: node.name,
          type: node.type
        };
      });
    });
    
    return { nodes: updatedNodes, layerMap };
  };