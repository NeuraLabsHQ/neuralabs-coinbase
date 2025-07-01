// src/components/flow_builder/FlowCanvas/FlowCanvas.jsx
import { Box, useColorMode, useColorModeValue } from '@chakra-ui/react';
import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import {
    FiActivity,
    FiDatabase,
    FiSliders
} from 'react-icons/fi';
// Define the icon mapping object
import ICON_MAP, { TYPE_TO_ICON_MAP } from '../Common/IconMap';
import colors from '../../../color.js';
import { isModifierKeyPressed, isMac, shortcuts } from '../../../utils/platform';

const FlowCanvas = ({ 
  nodes, 
  edges, 
  onAddNode, 
  onAddEdge, 
  onSelectNode, 
  selectedNode,
  onUpdateNodePosition,
  scale = 1,
  translate = { x: 0, y: 0 },
  setScale,
  setTranslate,
  svgRef: externalSvgRef, // Allow using an external ref if provided
  zoomBehaviorRef: externalZoomRef,
    // NEW PROPS for panel awareness
  leftPanelOpen = false,
  leftPanelWidth = 250,
  rightPanelOpen = false,
  rightPanelWidth = 350,
  detailsPanelOpen = false,
  detailsPanelWidth = 300,
  hideTextLabels,
  viewOnlyMode = false,
  nodeTypes = {},
  onImportFlow,
  onEdgeClick
}) => {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [connectingNode, setConnectingNode] = useState(null);
  const [connectingPort, setConnectingPort] = useState(null);
  const [connectingPath, setConnectingPath] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [highlightedConnections, setHighlightedConnections] = useState([]);
  const [dragStarted, setDragStarted] = useState(false);
  const [modifierKeyHeld, setModifierKeyHeld] = useState(false);
  
  const { colorMode } = useColorMode();
  const bgColor = useColorModeValue('canvas.body.light', 'canvas.body.dark');
  const nodeColor = useColorModeValue('white', 'gray.800');
  const nodeBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('black', 'white');
  const edgeColor = useColorModeValue('gray.400', 'gray.500');
  const edgeHighlightColor = useColorModeValue('blue.500', 'blue.300');
  

  // useEffect(() => {
  //   if (onImportFlow && typeof onImportFlow === 'function') {
  //     onImportFlow();
  //   }
  // }, [onImportFlow]);

  useEffect(() => {
    // Use external ref if provided, otherwise use internal ref
    const svgElement = externalSvgRef?.current || svgRef.current;
    if (!svgElement) return;
    
    const svg = d3.select(svgElement);
    const canvas = d3.select(canvasRef.current);
    
    // Use external zoom behavior if provided, otherwise create a new one
    let zoom;
    if (externalZoomRef?.current) {
      zoom = externalZoomRef.current;
    } else {
      zoom = d3.zoom()
        .scaleExtent([0.2, 4])
        .interpolate(d3.interpolateZoom);
      
      // Store the zoom behavior in the external ref if provided
      if (externalZoomRef) {
        externalZoomRef.current = zoom;
      }
    }
    
    // Configure zoom behavior
    zoom.on('zoom', (event) => {
      canvas.attr('transform', event.transform);
      
      // Batch state updates to prevent render loops
      const scaleChanged = Math.abs(event.transform.k - scale) > 0.001;
      const translateXChanged = Math.abs(event.transform.x - translate.x) > 0.001;
      const translateYChanged = Math.abs(event.transform.y - translate.y) > 0.001;
      
      if ((scaleChanged || translateXChanged || translateYChanged) && setScale && setTranslate) {
        // Use requestAnimationFrame to throttle updates
        requestAnimationFrame(() => {
          if (scaleChanged && setScale) {
            setScale(event.transform.k);
          }
          if ((translateXChanged || translateYChanged) && setTranslate) {
            setTranslate({ x: event.transform.x, y: event.transform.y });
          }
        });
      }
    });
    
    svg.call(zoom);
    
    // Handle drag and drop from the blocks panel
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      
      const nodeType = e.dataTransfer.getData('nodeType');
      if (nodeType) {
        // Calculate the position with respect to the canvas transform
        const svgRect = svgElement.getBoundingClientRect();
        const x = (e.clientX - svgRect.left - translate.x) / scale;
        const y = (e.clientY - svgRect.top - translate.y) / scale;
        
        // Create the node and automatically open details panel
        const newNode = onAddNode(nodeType, { x, y });
        
        // The onAddNode function in flow_builder.jsx has been updated to
        // automatically select the node and open the details panel
      }
    };
    
    svgElement.addEventListener('dragover', handleDragOver);
    svgElement.addEventListener('drop', handleDrop);
    
    return () => {
      // Clean up event listeners
      svg.on('.zoom', null);
      svgElement.removeEventListener('dragover', handleDragOver);
      svgElement.removeEventListener('drop', handleDrop);
    };
  }, [onAddNode, externalSvgRef, externalZoomRef, scale, translate, setScale, setTranslate]);

  useEffect(() => {
    if (selectedNode) {
      // Find all connections related to the selected node
      const relatedConnections = edges.filter(
        edge => edge.source === selectedNode.id || edge.target === selectedNode.id
      );
      setHighlightedConnections(relatedConnections.map(conn => conn.id));
      
      // Only center the node if we're in view-only mode
      // The handleLayerNodeClick function will handle centering when clicking from layer panel
      if (viewOnlyMode) {
        // Add a slight delay before centering to allow UI updates to complete
        const timerId = setTimeout(() => {
          centerNodeInView(selectedNode.id);
        }, 100);
        
        return () => clearTimeout(timerId);
      }
    } else {
      setHighlightedConnections([]);
    }
  }, [selectedNode, edges, viewOnlyMode]);

  // Track modifier key state globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isMac() ? e.metaKey : e.ctrlKey) {
        setModifierKeyHeld(true);
      }
    };

    const handleKeyUp = (e) => {
      if (isMac() ? !e.metaKey : !e.ctrlKey) {
        setModifierKeyHeld(false);
      }
    };

    const handleBlur = () => {
      setModifierKeyHeld(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Determine if a connection is highlighted
  const isConnectionHighlighted = (connectionId) => {
    return highlightedConnections.includes(connectionId);
  };





  // Handle node dragging with improved cross-platform support
  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0) return; // Only left mouse button
    
    e.stopPropagation();
    
    // Only start drag if Ctrl/Cmd is held
    if (!isModifierKeyPressed(e)) return;
    
    // Don't select node when starting to drag
    setDragStarted(false);
    
    const startNodeDrag = (e) => {
      setDragging(true);
      
      const svg = externalSvgRef?.current || svgRef.current;
      const svgRect = svg.getBoundingClientRect();
      
      // Find the node
      const nodeData = nodes.find(n => n.id === nodeId);
      if (!nodeData) return;
      
      // Get the starting position
      const startPos = {
        x: e.clientX,
        y: e.clientY
      };
      
      // Get the current node position
      const currentPos = {
        x: nodeData.x,
        y: nodeData.y
      };
      
      // Track the initial modifier key state
      const initialCtrlKey = e.ctrlKey;
      const initialMetaKey = e.metaKey;
      
      // Use a local variable to track the current position without causing rerenders
      let latestPosition = { ...currentPos };
      let isDragging = true;
      let hasMoved = false;
      
      const moveHandler = (e) => {
        if (!isDragging) return;
        
        // Calculate the new position with respect to the canvas transform
        const dx = (e.clientX - startPos.x) / scale;
        const dy = (e.clientY - startPos.y) / scale;
        
        // If mouse has moved more than a few pixels, consider it a drag
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          hasMoved = true;
          setDragStarted(true);
        }
        
        // Update the node position
        latestPosition = {
          x: currentPos.x + dx,
          y: currentPos.y + dy
        };
        
        // Update the node visually without causing a state update
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
          nodeElement.setAttribute('transform', `translate(${latestPosition.x}, ${latestPosition.y})`);
        }
      };
      
      const upHandler = (event) => {
        // Only process if this is our drag operation
        if (!isDragging) return;
        
        isDragging = false;
        
        // Clean up all event listeners
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        document.removeEventListener('keyup', keyUpHandler);
        document.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('blur', blurHandler);
        
        setDragging(false);
        
        // Reset drag started flag after a short delay
        setTimeout(() => setDragStarted(false), 100);
        
        // Only update state once at the end of drag
        if (onUpdateNodePosition && hasMoved) {
          onUpdateNodePosition(nodeId, latestPosition);
        }
      };
      
      // Handle key release to cancel drag if Ctrl/Cmd is released
      const keyUpHandler = (e) => {
        // Check if the modifier key that initiated the drag was released
        if (initialCtrlKey && !e.ctrlKey && e.key === 'Control') {
          upHandler();
        } else if (initialMetaKey && !e.metaKey && e.key === 'Meta') {
          upHandler();
        }
      };
      
      // Also handle keydown to catch Command key on Mac
      const keyDownHandler = (e) => {
        // If ESC is pressed, cancel the drag
        if (e.key === 'Escape') {
          // Reset position to original
          const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
          if (nodeElement) {
            nodeElement.setAttribute('transform', `translate(${currentPos.x}, ${currentPos.y})`);
          }
          hasMoved = false; // Don't save position
          upHandler();
        }
      };
      
      // Handle window blur (e.g., switching tabs)
      const blurHandler = () => {
        upHandler();
      };
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
      document.addEventListener('keyup', keyUpHandler);
      document.addEventListener('keydown', keyDownHandler);
      window.addEventListener('blur', blurHandler);
    };
    
    startNodeDrag(e);
  };

  // Add this function to your FlowCanvas component
const centerNodeInView = (nodeId) => {
  // Find the node to center
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  let leftOffset = 0;
  let rightOffset = 0;

  if (leftPanelOpen) leftOffset = leftPanelWidth;
  if (rightPanelOpen) rightOffset = rightPanelWidth;
  if (detailsPanelOpen) rightOffset = Math.max(rightOffset, detailsPanelWidth);
  
  // Get the SVG element and its dimensions
  const svg = externalSvgRef?.current || svgRef.current;
  if (!svg) return;
  
  const svgRect = svg.getBoundingClientRect();
  const svgWidth = svgRect.width;
  const svgHeight = svgRect.height;
  
  // Calculate visible canvas area, accounting for side panels
  // This requires knowing which panels are open and their widths
  // We'll pass this information as props
  const visibleWidth = svgWidth - leftOffset - rightOffset;
  const visibleHeight = svgHeight;
  
  // Calculate the center of the visible area
  const visibleCenterX = leftOffset + (visibleWidth / 2);
  const visibleCenterY = visibleHeight / 2;
  
  const newTranslateX = visibleCenterX - (node.x * scale);
  const newTranslateY = visibleCenterY - (node.y * scale);
  
  // Update the translate values, with animation
  if (externalZoomRef.current && svg) {
    const d3svg = d3.select(svg);
    d3svg.transition().duration(500).call(
      externalZoomRef.current.transform,
      d3.zoomIdentity.translate(newTranslateX, newTranslateY).scale(scale)
    );
  } else {
    // Fallback if d3 zoom isn't available
    setTranslate({
      x: newTranslateX,
      y: newTranslateY
    });
  }
};

  // Start connecting two nodes with improved cross-platform support
const handlePortMouseDown = (e, nodeId, portType, portIndex) => {
  if (e.button !== 0) return; // Only left mouse button
  
  e.stopPropagation();
  e.preventDefault(); // Prevent any default behavior
  
  // Require modifier key (Cmd on Mac, Ctrl on Windows/Linux) to start connection
  if (!isModifierKeyPressed(e)) {
    return;
  }
  
  // Add visual feedback - change the port color when clicked
  const clickedPort = e.target;
  const originalFill = clickedPort.getAttribute('fill');
  const originalStroke = clickedPort.getAttribute('stroke');
  const originalStrokeWidth = clickedPort.getAttribute('stroke-width') || '2';
  
  // Highlight the port when clicked
  clickedPort.setAttribute('fill', colors.ports?.active?.[colorMode] || (colorMode === 'dark' ? '#63B3ED' : '#3182CE')); // Active port color
  clickedPort.setAttribute('stroke', colors.green?.[900] || '#276749'); // Darker green stroke
  clickedPort.setAttribute('stroke-width', '3');
  
  const svg = externalSvgRef?.current || svgRef.current;
  const svgRect = svg.getBoundingClientRect();
  
  // Find the node
  const nodeData = nodes.find(n => n.id === nodeId);
  if (!nodeData) {
    // Reset port appearance if node not found
    clickedPort.setAttribute('fill', originalFill);
    clickedPort.setAttribute('stroke', originalStroke);
    clickedPort.setAttribute('stroke-width', originalStrokeWidth);
    return;
  }
  
  setConnectingNode(nodeId);
  setConnectingPort({ type: portType, index: portIndex });
  
  // Calculate the start position of the connection
  const startX = nodeData.x;
  let startY;
  
  if (portType === 'output') {
    startY = nodeData.y + 30 + (portIndex * 20);
  } else { // input
    startY = nodeData.y - 30 - (portIndex * 20); 
  }
  
  // Create a temporary path
  const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tempPath.setAttribute('stroke', colorMode === 'dark' ? 'white' : 'black');
  tempPath.setAttribute('stroke-width', '2');
  tempPath.setAttribute('stroke-dasharray', '5,5');
  tempPath.setAttribute('fill', 'none');
  tempPath.setAttribute('class', 'connecting-path');
  tempPath.setAttribute('d', `M ${startX} ${startY} L ${startX} ${startY}`); // Initialize with a point
  tempPath.style.pointerEvents = 'none'; // Make sure the path doesn't interfere with mouse events
  
  // Add the path to the canvas
  if (canvasRef.current) {
    canvasRef.current.appendChild(tempPath);
    setConnectingPath(tempPath);
  } else {
    console.error("Canvas ref is null");
    // Reset port appearance if canvas not found
    clickedPort.setAttribute('fill', originalFill);
    clickedPort.setAttribute('stroke', originalStroke);
    clickedPort.setAttribute('stroke-width', originalStrokeWidth);
    return;
  }
  
  let isConnecting = true;
  let lastValidElement = null;
  
  // Update the path as the mouse moves
  const moveHandler = (e) => {
    if (!tempPath || !isConnecting) return;
    
    // Update svgRect in case the window was resized
    const currentSvgRect = svg.getBoundingClientRect();
    
    // Calculate the mouse position with respect to the canvas transform
    const mouseX = (e.clientX - currentSvgRect.left - translate.x) / scale;
    const mouseY = (e.clientY - currentSvgRect.top - translate.y) / scale;
    
    // Update the mouse position state
    setMousePosition({ x: mouseX, y: mouseY });
    
    // Create a smooth bezier curve
    let pathData;
    
    if (portType === 'output') {
      pathData = `M ${startX} ${startY} C ${startX + 100} ${startY}, ${mouseX - 100} ${mouseY}, ${mouseX} ${mouseY}`;
    } else { // input
      pathData = `M ${startX} ${startY} C ${startX - 100} ${startY}, ${mouseX + 100} ${mouseY}, ${mouseX} ${mouseY}`;
    }
    
    tempPath.setAttribute('d', pathData);
    
    // Track the element under the mouse for better drop detection
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    lastValidElement = elementsAtPoint.find(el => 
      el.tagName === 'circle' && 
      el.hasAttribute('data-port-type')
    );
  };
  
  const cleanup = () => {
    isConnecting = false;
    
    // Remove all event listeners
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', upHandler);
    document.removeEventListener('touchmove', touchMoveHandler);
    document.removeEventListener('touchend', touchEndHandler);
    document.removeEventListener('keydown', keyHandler);
    window.removeEventListener('blur', blurHandler);
    
    // Reset the port appearance
    if (clickedPort && clickedPort.parentNode) { // Check if port still exists
      clickedPort.setAttribute('fill', originalFill);
      clickedPort.setAttribute('stroke', originalStroke);
      clickedPort.setAttribute('stroke-width', originalStrokeWidth);
    }
    
    // Remove the temporary path
    if (tempPath && tempPath.parentNode) {
      tempPath.parentNode.removeChild(tempPath);
    }
    
    setConnectingNode(null);
    setConnectingPort(null);
    setConnectingPath(null);
  };
  
  const handleConnection = (targetElement) => {
    if (!targetElement) return false;
    
    const targetNodeId = targetElement.getAttribute('data-node-id');
    const targetPortType = targetElement.getAttribute('data-port-type');
    const targetPortIndex = parseInt(targetElement.getAttribute('data-port-index'), 10);
    
    // Prevent connecting to the same node
    if (targetNodeId && targetNodeId !== nodeId) {
      // Validate connection compatibility (output -> input)
      if (
        (portType === 'output' && targetPortType === 'input') ||
        (portType === 'input' && targetPortType === 'output')
      ) {
        // Determine source and target based on the port types
        let source, target, sourcePort, targetPort;
        
        if (portType === 'output') {
          source = nodeId;
          target = targetNodeId;
          sourcePort = portIndex;
          targetPort = targetPortIndex;
        } else { // input
          source = targetNodeId;
          target = nodeId;
          sourcePort = targetPortIndex;
          targetPort = portIndex;
        }
        
        onAddEdge(source, target, sourcePort, targetPort);
        return true;
      }
    }
    return false;
  };
  
  const upHandler = (e) => {
    if (!isConnecting) return;
    
    // Try to use the last tracked element first (more reliable)
    if (lastValidElement && handleConnection(lastValidElement)) {
      cleanup();
      return;
    }
    
    // Fallback to elementsFromPoint
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    const portElement = elementsAtPoint.find(el => 
      el.tagName === 'circle' && 
      el.hasAttribute('data-port-type')
    );
    
    if (portElement) {
      handleConnection(portElement);
    }
    
    cleanup();
  };
  
  // Touch event handlers for touch devices
  const touchMoveHandler = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      moveHandler({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }
  };
  
  const touchEndHandler = (e) => {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      upHandler({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }
  };
  
  // Cancel connection if ESC is pressed or right mouse button
  const keyHandler = (e) => {
    if (e.key === 'Escape') {
      cleanup();
    }
  };
  
  // Cancel connection if window loses focus
  const blurHandler = () => {
    cleanup();
  };
  
  // Add event listeners
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', upHandler);
  document.addEventListener('touchmove', touchMoveHandler, { passive: false });
  document.addEventListener('touchend', touchEndHandler);
  document.addEventListener('keydown', keyHandler);
  window.addEventListener('blur', blurHandler);
};
  // Add helper function to get the icon component from string name or component
  const getIconComponent = (icon) => {
    if (typeof icon === 'function') {
      return icon; // Already a component
    }
    return ICON_MAP[icon] || FiActivity; // Get from map or default to Activity
  };
  
const getNodeIcon = (node) => {
  // First, check the TYPE_TO_ICON_MAP for the node type
  // Try exact match first
  let IconComponent = TYPE_TO_ICON_MAP[node.type];
  
  // If not found, try with first letter capitalized
  if (!IconComponent) {
    const capitalizedType = node.type.charAt(0).toUpperCase() + node.type.slice(1).toLowerCase();
    IconComponent = TYPE_TO_ICON_MAP[capitalizedType];
  }
  
  // If still not found, try special cases
  if (!IconComponent) {
    const typeMapping = {
      'nova': 'Nova',
      'titan': 'Titan',
      'guardrails': 'Guardrails',
      'chatapi': 'ChatAPI',
      'restapi': 'RestAPI',
      'llmtext': 'LLMText',
      'llmstructured': 'LLMStructured',
      'flowselect': 'FlowSelect',
      'fetchbalance': 'FetchBalance',
      'readcontract': 'ReadContract',
      'contexthistory': 'ContextHistory',
      'buildtransaction': 'BuildTransaction',
      'search': 'Search'
    };
    
    const mappedType = typeMapping[node.type.toLowerCase()];
    if (mappedType) {
      IconComponent = TYPE_TO_ICON_MAP[mappedType];
    }
  }
  
  // Use default if still not found
  if (!IconComponent) {
    IconComponent = TYPE_TO_ICON_MAP['default'];
  }
  
  // If it's a React component (not a string), render it directly
  if (typeof IconComponent === 'function') {
    return <IconComponent size={20} />;
  }
  
  // If it's a string, try to get it from ICON_MAP
  const MappedIcon = ICON_MAP[IconComponent];
  if (MappedIcon) {
    return <MappedIcon size={20} />;
  }
  
  // Final fallback
  return <FiActivity size={20} />;
};


  // Get node color - Using consistent vibrant colors regardless of theme
  const getNodeColors = (nodeType, isSelected) => {

    // FIX THIS to make it more readable and consistent
    const colors = {
      ringColor: '',
      bgColor: isSelected 
              ? (colorMode === 'dark' ? 'gray.700' : 'gray.50') 
              : (colorMode === 'dark' ? 'gray.800' : ''),
      iconColor: ''
    };
    
    switch (nodeType) {
      case 'data':
        colors.ringColor = isSelected ? 'blue.500' : 'blue.300';
        colors.iconColor = 'blue.500';
        break;
      case 'task':
        colors.ringColor = isSelected ? 'green.500' : 'green.300';
        colors.iconColor = 'green.500';
        break;
      case 'parameters':
        colors.ringColor = isSelected ? 'purple.500' : 'purple.300';
        colors.iconColor = 'purple.500';
        break;
      default:
        colors.ringColor = isSelected ? 'gray.500' : 'gray.300';
        colors.iconColor = 'gray.500';
    }
    
    return colors;
  };

// Only updating the renderNode function to handle the hideTextLabels feature

// Render node with dynamic width
const renderNode = (node) => {
  const isSelected = selectedNode && selectedNode.id === node.id;
  const { ringColor, bgColor, iconColor } = getNodeColors(node.type, isSelected);
  
  // Determine input and output counts
  const inputCount = node.inputs?.length || 1;
  const outputCount = node.outputs?.length || 1;
  
  // Set minimum width and padding
  const minWidth = hideTextLabels ? 60 : 120; // Narrower width when hiding text
  const horizontalPadding = 16; // Padding on each side
  const iconWidth = 28; // Icon width + gap
  
  // Calculate text width (approximate - will be adjusted by the browser)
  // We're using approximation because actual measurement requires DOM access
  const textLength = node.name.length;
  const avgCharWidth = 8; // Average width of a character in pixels
  const estimatedTextWidth = hideTextLabels ? 0 : textLength * avgCharWidth;
  
  // Calculate the total width with padding and icon
  const contentWidth = iconWidth + estimatedTextWidth + (horizontalPadding * 2);
  const boxWidth = Math.max(minWidth, contentWidth);
  const boxHalfWidth = boxWidth / 2;
  
  return (
    <g
      key={node.id}
      className={`node ${isSelected ? 'node-selected' : ''}`}
      transform={`translate(${node.x}, ${node.y})`}
      onClick={(e) => {
        e.stopPropagation();
        // Don't handle click if we just finished dragging
        if (dragStarted) return;
        
        // Pass whether Ctrl/Cmd is held to skip details panel
        onSelectNode(node.id, isModifierKeyPressed(e));
      }}
      onMouseDown={(e) => {
        // Check if the click is on a port by looking at the event target
        const isPort = e.target.classList?.contains('node-port') || 
                      e.target.hasAttribute?.('data-port-type');
        
        // Only handle node drag if it's not a port and Ctrl/Cmd is held
        if (!isPort) {
          handleNodeMouseDown(e, node.id);
        }
      }}
      data-node-id={node.id}
    >
      {/* Node shape - using dynamic width with transition for smooth resize */}
      <foreignObject
        x={-boxHalfWidth}
        y="-30"
        width={boxWidth}
        height="60"
        style={{ overflow: 'visible' }}
      >
        <div 
          style={{ 
            width: '100%', 
            height: '60px', 
            borderRadius: '6px',
            border: '2px solid',
            borderColor: ringColor,
            backgroundColor: bgColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: modifierKeyHeld && !viewOnlyMode ? 'grab' : 'pointer',
            position: 'relative',
            userSelect: 'none',
            boxShadow: isSelected ? '0 0 8px rgba(0,188,255,0.5)' : (modifierKeyHeld && !viewOnlyMode ? '0 0 4px rgba(59,130,246,0.3)' : 'none'),
            transition: 'box-shadow 0.2s, transform 0.1s, width 0.3s ease-in-out, cursor 0.1s',
            color: textColor,
            transform: modifierKeyHeld && !viewOnlyMode ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: `0 ${horizontalPadding}px`,
            maxWidth: '100%',
            transition: 'width 0.3s ease-in-out'
          }}>
            <div style={{ color: iconColor, flexShrink: 0 }}>
              {getNodeIcon(node)}
            </div>
            {!hideTextLabels && (
              <span style={{ 
                fontWeight: 500, 
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'opacity 0.3s ease-in-out, max-width 0.3s ease-in-out',
                opacity: hideTextLabels ? 0 : 1,
                maxWidth: hideTextLabels ? '0' : '100%'
              }}>
                {node.name}
              </span>
            )}
          </div>
        </div>
      </foreignObject>
      
      {/* Single input port */}
      {inputCount > 0 && (
        <g transform={`translate(0, -30)`}>
          <circle
            cx="0"
            cy="0"
            r="6"
            className="node-port"
            fill={colorMode === 'dark' ? 'white' : 'black'}
            stroke={modifierKeyHeld && !viewOnlyMode ? colors.blue[colorMode === 'dark' ? '400' : '500'] : getNodeColors(node.type).ringColor}
            strokeWidth={modifierKeyHeld && !viewOnlyMode ? "3" : "2"}
            style={{
              cursor: modifierKeyHeld && !viewOnlyMode ? 'crosshair' : 'default',
              filter: modifierKeyHeld && !viewOnlyMode ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none',
              transition: 'all 0.2s ease'
            }}
            data-node-id={node.id}
            data-port-type="input"
            data-port-index={0}
            onMouseDown={(e) => handlePortMouseDown(e, node.id, 'input', 0)}
          />
          {inputCount > 1 && (
            <text
              x="12"
              y="5"
              fill={colors.gray[colorMode === 'dark' ? '400' : '500']}
              fontSize="10"
              fontWeight="bold"
            >
              {inputCount}
            </text>
          )}
        </g>
      )}
      
      {/* Single output port */}
      {outputCount > 0 && (
        <g transform={`translate(0, 30)`}>
          <circle
            cx="0"
            cy="0"
            r="6"
            className="node-port"
            fill={colorMode === 'dark' ? 'white' : 'black'}
            stroke={modifierKeyHeld && !viewOnlyMode ? colors.blue[colorMode === 'dark' ? '400' : '500'] : getNodeColors(node.type).ringColor}
            strokeWidth={modifierKeyHeld && !viewOnlyMode ? "3" : "2"}
            style={{
              cursor: modifierKeyHeld && !viewOnlyMode ? 'crosshair' : 'default',
              filter: modifierKeyHeld && !viewOnlyMode ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none',
              transition: 'all 0.2s ease'
            }}
            data-node-id={node.id}
            data-port-type="output"
            data-port-index={0}
            onMouseDown={(e) => handlePortMouseDown(e, node.id, 'output', 0)}
          />
          {outputCount > 1 && (
            <text
              x="12"
              y="5"
              fill={colors.gray[colorMode === 'dark' ? '400' : '500']}
              fontSize="10"
              fontWeight="bold"
            >
              {outputCount}
            </text>
          )}
        </g>
      )}
    </g>
  );
}

  // Render edge
  const renderEdge = (edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    console.log(`Rendering edge: ${edge.id}, source: ${edge.source}, target: ${edge.target}`);

    
    if (!sourceNode || !targetNode) {
      console.error(`Missing node for edge ${edge.id}: source=${!!sourceNode}, target=${!!targetNode}`);
      return null;
    }
    
    // Single port positions - output port is at the bottom, input port is at the top
    const sourceY = sourceNode.y + 30;
    const targetY = targetNode.y - 30;
    
    // Create a smooth bezier curve
    const path = `M ${sourceNode.x} ${sourceY} C ${sourceNode.x} ${sourceY + 50}, ${targetNode.x} ${targetY - 50}, ${targetNode.x} ${targetY}`;
    
    const isHighlighted = isConnectionHighlighted(edge.id);
    const strokeColor = isHighlighted 
    ? colors.blue[colorMode === 'dark' ? '300' : '500'] // blue accent
    : colors.gray[colorMode === 'dark' ? '400' : '500']; // gray default
    
    const strokeWidth = isHighlighted ? 3 : 2;

    return (
      <path
        key={edge.id}
        className={`edge-path ${isHighlighted ? 'edge-highlighted' : ''}`}
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        markerEnd={isHighlighted ? "url(#arrow-highlighted)" : "url(#arrow)"}
        data-edge-id={edge.id}
        style={{ 
          transition: 'stroke 0.3s, stroke-width 0.3s',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onEdgeClick) {
            onEdgeClick(edge);
          }
        }}
      />
    );
  };

  return (
    <Box 
      flex="1" 
      h="100%" 
      bg={bgColor} 
      position="relative" 
      overflow="hidden"
    >
      <svg
        ref={externalSvgRef || svgRef}
        width="100%"
        height="100%"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onClick={() => onSelectNode(null)}
      >
        {/* <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.gray[colorMode === 'dark' ? '400' : '500']} />
          </marker>
          <marker
            id="arrow-highlighted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.blue[colorMode === 'dark' ? '300' : '500']} />
          </marker>
        </defs> */}
        <defs>
  <marker
    id="arrow"
    viewBox="0 0 10 10"
    refX="8"
    refY="5"
    markerWidth="5"
    markerHeight="5"
    orient="auto"
  >
    {/* Changed from filled triangle to V shape */}
    <path 
      d="M 0 0 L 10 5 L 0 10" 
      fill="none" 
      stroke={colors.gray[colorMode === 'dark' ? '400' : '500']} 
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </marker>
  <marker
    id="arrow-highlighted"
    viewBox="0 0 10 10"
    refX="7"
    refY="5"
    markerWidth="5"
    markerHeight="5"
    orient="auto"
  >
    {/* Changed from filled triangle to V shape */}
    <path 
      d="M 0 0 L 10 5 L 0 10" 
      fill="none" 
      stroke={colors.blue[colorMode === 'dark' ? '300' : '500']} 
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </marker>
</defs>


        <g ref={canvasRef}
          style={{ 
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transformOrigin: '0 0' 
                }}>
          {/* Grid (optional) */}
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={colors.canvas.grid[colorMode]} strokeWidth="1"/>
          </pattern>
          <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#grid)" />
          
          {/* Render edges first so they're under the nodes */}
        {/* <div className="nodesandedges"> */}
          <g className="edges">
            {edges.map(renderEdge)}
          </g>
          <g className="nodes">
            {nodes.map(renderNode)}
          </g>
          {/* </div> */}
        </g>
      </svg>
    </Box>
  );
};

export default FlowCanvas;