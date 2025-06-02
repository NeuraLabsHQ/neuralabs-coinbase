import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const WorkflowGenerationAnimation = ({ colorMode = 'light' }) => {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [shownNodes, setShownNodes] = useState(new Set(['root']))
  const [currentLevel, setCurrentLevel] = useState(0)
  const [animatingConnections, setAnimatingConnections] = useState(new Set())
  const [shownConnections, setShownConnections] = useState(new Set())

  const theme = {
    light: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
      bg: 'transparent',
      nodeBg: '#ffffff',
      nodeBorder: '#000000',
      lineColor: '#000000',
      glow: 'rgba(0, 0, 0, 0.1)',
      accent: '#333333',
      textColor: '#000000',
      successColor: '#666666',
      dataFlow: '#333333'
    },
    dark: {
      primary: '#ffffff',
      secondary: '#999999',
      tertiary: '#666666',
      bg: 'transparent',
      nodeBg: '#000000',
      nodeBorder: '#ffffff',
      lineColor: '#ffffff',
      glow: 'rgba(255, 255, 255, 0.1)',
      accent: '#cccccc',
      textColor: '#ffffff',
      successColor: '#999999',
      dataFlow: '#cccccc'
    }
  }

  const colors = colorMode === "dark" ? theme.dark : theme.light

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateDimensions)
      resizeObserver.disconnect()
    }
  }, [])

  // Calculate scale factor
  const baseWidth = 500
  const baseHeight = 600
  const scaleFactor = Math.min(
    dimensions.width / baseWidth,
    dimensions.height / baseHeight,
    1
  )

  // Container dimensions for coordinate conversion
  const containerWidth = baseWidth * scaleFactor
  const containerHeight = baseHeight * scaleFactor

  // Scaled measurements
  const nodeSize = 60 * scaleFactor
  const iconSize = 24 * scaleFactor
  const borderRadius = 12 * scaleFactor
  const borderWidth = Math.max(1, 2 * scaleFactor)
  const lineWidth = Math.max(1, 2 * scaleFactor)

  // Define workflow structure
  const workflowNodes = [
    // Level 0 - Root
    { id: 'root', x: 50, y: 10, icon: '◉', level: 0 },
    
    // Level 1 - Branch out
    { id: 'process1', x: 20, y: 30, icon: '◆', level: 1, parent: 'root' },
    { id: 'process2', x: 50, y: 30, icon: '◆', level: 1, parent: 'root' },
    { id: 'process3', x: 80, y: 30, icon: '◆', level: 1, parent: 'root' },
    
    // Level 2 - Maximum expansion
    { id: 'task1', x: 10, y: 50, icon: '■', level: 2, parent: 'process1' },
    { id: 'task2', x: 30, y: 50, icon: '■', level: 2, parent: 'process1' },
    { id: 'task3', x: 50, y: 50, icon: '■', level: 2, parent: 'process2' },
    { id: 'task4', x: 70, y: 50, icon: '■', level: 2, parent: 'process3' },
    { id: 'task5', x: 90, y: 50, icon: '■', level: 2, parent: 'process3' },
    
    // Level 3 - Start converging
    { id: 'merge1', x: 30, y: 70, icon: '▼', level: 3, parents: ['task1', 'task2', 'task3'] },
    { id: 'merge2', x: 70, y: 70, icon: '▼', level: 3, parents: ['task3', 'task4', 'task5'] },
    
    // Level 4 - Final output
    { id: 'output', x: 50, y: 90, icon: '●', level: 4, parents: ['merge1', 'merge2'] }
  ]

  // Create connections
  const connections = []
  workflowNodes.forEach(node => {
    if (node.parent) {
      const parentNode = workflowNodes.find(n => n.id === node.parent)
      if (parentNode) {
        connections.push({ 
          id: `${parentNode.id}-${node.id}`,
          from: parentNode, 
          to: node, 
          level: node.level 
        })
      }
    }
    if (node.parents) {
      node.parents.forEach(parentId => {
        const parentNode = workflowNodes.find(n => n.id === parentId)
        if (parentNode) {
          connections.push({ 
            id: `${parentNode.id}-${node.id}`,
            from: parentNode, 
            to: node, 
            level: node.level 
          })
        }
      })
    }
  })

  // Animation progression
  useEffect(() => {
    let animationTimer, nodeTimer

    if (currentLevel > 4) {
      // Animation complete - could restart here if needed
      return
    }

    // Animate connections for current level
    const levelConnections = connections
      .filter(conn => conn.level === currentLevel + 1)
      .map(conn => conn.id)
    
    if (levelConnections.length > 0) {
      setAnimatingConnections(new Set(levelConnections))
      
      // Move to shown after animation
      animationTimer = setTimeout(() => {
        setShownConnections(prev => {
          const newSet = new Set(prev)
          levelConnections.forEach(id => newSet.add(id))
          return newSet
        })
        setAnimatingConnections(new Set())
      }, 1800)
    }

    // After lines complete, show nodes
    nodeTimer = setTimeout(() => {
      const nextLevelNodes = workflowNodes
        .filter(node => node.level === currentLevel + 1)
        .map(node => node.id)
      
      if (nextLevelNodes.length > 0) {
        setShownNodes(prev => {
          const newSet = new Set(prev)
          nextLevelNodes.forEach(id => newSet.add(id))
          return newSet
        })
      }
      setCurrentLevel(prev => prev + 1)
    }, 2000)

    return () => {
      clearTimeout(animationTimer)
      clearTimeout(nodeTimer)
    }
  }, [currentLevel])

  const Node = ({ node }) => {
    const isShown = shownNodes.has(node.id)

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isShown ? 1 : 0, 
          opacity: isShown ? 1 : 0
        }}
        transition={{ duration: 0.3, type: "spring", damping: 20 }}
        style={{
          position: 'absolute',
          left: `${node.x}%`,
          top: `${node.y}%`,
          transform: 'translate(-50%, -50%)',
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          backgroundColor: colors.nodeBg,
          border: `${borderWidth}px solid ${colors.nodeBorder}`,
          borderRadius: `${borderRadius}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 ${4 * scaleFactor}px ${16 * scaleFactor}px ${colors.glow}`,
          zIndex: 10
        }}
      >
        <div style={{ 
          fontSize: `${iconSize}px`,
          color: colors.textColor
        }}>
          {node.icon}
        </div>
      </motion.div>
    )
  }

  const Connection = ({ connection }) => {
    const { from, to, id } = connection
    const isAnimating = animatingConnections.has(id)
    const isShown = shownConnections.has(id)
    const fromNodeShown = shownNodes.has(from.id)
    const shouldAnimate = (isAnimating || isShown) && fromNodeShown
    
    // Convert percentage to pixels for SVG coordinates
    const x1 = (from.x / 100) * containerWidth + (nodeSize / 2)
    const y1 = (from.y / 100) * containerHeight + nodeSize
    const x2 = (to.x / 100) * containerWidth + (nodeSize / 2)
    const y2 = (to.y / 100) * containerHeight
    
    // Create curved path
    const midY = (y1 + y2) / 2
    const controlY = y1 + (y2 - y1) * 0.3
    const path = `M ${x1} ${y1} Q ${x1} ${controlY}, ${(x1 + x2) / 2} ${midY} T ${x2} ${y2}`

    return (
      <svg
        style={{
          position: 'absolute',
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          pointerEvents: 'none',
          zIndex: 5,
          opacity: shouldAnimate ? 1 : 0
        }}
      >
        {/* Connection line */}
        <motion.path
          d={path}
          fill="none"
          stroke={colors.lineColor}
          strokeWidth={lineWidth}
          initial={{ pathLength: 0 }}
          animate={{ 
            pathLength: shouldAnimate ? 1 : 0
          }}
          transition={{ 
            duration: isAnimating ? 1.8 : 0, 
            ease: "easeInOut",
            delay: isAnimating ? 0.1 : 0
          }}
        />
        
        {/* Leading dot that moves along the path */}
        {isAnimating && (
          <motion.circle
            r={4 * scaleFactor}
            fill={colors.accent}
            initial={{ offsetDistance: '0%', opacity: 0 }}
            animate={{ 
              offsetDistance: '100%',
              opacity: [0, 1, 1, 0]
            }}
            transition={{ 
              duration: 1.8, 
              ease: "easeInOut",
              delay: 0.1,
              times: [0, 0.1, 0.9, 1]
            }}
            style={{
              offsetPath: `path('${path}')`,
              offsetRotate: '0deg'
            }}
          />
        )}
      </svg>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          position: 'relative'
        }}>
          {/* Render ALL connections at once */}
          {connections.map((conn) => (
            <Connection
              key={conn.id}
              connection={conn}
            />
          ))}

          {/* Render ALL nodes at once */}
          {workflowNodes.map((node) => (
            <Node
              key={node.id}
              node={node}
            />
          ))}

          {/* Select workflow message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              position: 'absolute',
              bottom: `${-50 * scaleFactor}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: `${12 * scaleFactor}px`,
              color: colors.secondary,
              textTransform: 'uppercase',
              letterSpacing: `${0.5 * scaleFactor}px`
            }}
          >
            Select Workflow
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default WorkflowGenerationAnimation