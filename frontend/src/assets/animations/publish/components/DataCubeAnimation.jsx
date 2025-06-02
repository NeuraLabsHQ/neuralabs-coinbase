import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const DataCubeAnimation = ({ colorMode = 'light' }) => {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  const theme = {
    light: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
      bg: 'transparent',
      cubeBg: 'rgba(0, 0, 0, 0.05)',
      cubeBorder: 'rgba(0, 0, 0, 0.2)',
      cubeText: 'rgba(0, 0, 0, 0.6)',
      lockFill: '#000000',
      encryptText: '#666666'
    },
    dark: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#888888',
      bg: 'transparent',
      cubeBg: 'rgba(255, 255, 255, 0.05)',
      cubeBorder: 'rgba(255, 255, 255, 0.2)',
      cubeText: 'rgba(255, 255, 255, 0.6)',
      lockFill: '#ffffff',
      encryptText: '#888888'
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
    
    // Use ResizeObserver for more accurate parent size detection
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateDimensions)
      resizeObserver.disconnect()
    }
  }, [])

  // Calculate scale factor based on container size
  const baseContainerSize = 400 // Base size for the entire animation
  const scaleFactor = Math.min(
    dimensions.width / baseContainerSize,
    dimensions.height / baseContainerSize,
    1 // Don't scale up beyond original size
  )

  // Scale all measurements
  const containerSize = 300 * scaleFactor
  const cubeSize = 200 * scaleFactor
  const lockSize = 100 * scaleFactor
  const cubeFontSize = 1.2 * scaleFactor
  const encryptFontSize = 1.1 * scaleFactor
  const gap = 40 * scaleFactor
  const borderWidth = Math.max(1, scaleFactor)
  
  // CSS-in-JS styles with scaling
  const styles = {
    animationScene: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: `${gap}px`
    },
    encryptionContainer: {
      position: 'relative',
      width: `${containerSize}px`,
      height: `${containerSize}px`,
      perspective: `${1000 * scaleFactor}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    dataCube: {
      width: `${cubeSize}px`,
      height: `${cubeSize}px`,
      position: 'relative',
      transformStyle: 'preserve-3d'
    },
    cubeFace: {
      position: 'absolute',
      width: `${cubeSize}px`,
      height: `${cubeSize}px`,
      background: colors.cubeBg,
      border: `${borderWidth}px solid ${colors.cubeBorder}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      fontSize: `${cubeFontSize}rem`,
      color: colors.cubeText,
      backdropFilter: 'blur(10px)'
    },
    cubeFaceFront: {
      transform: `translateZ(${cubeSize/2}px)`
    },
    cubeFaceBack: {
      transform: `rotateY(180deg) translateZ(${cubeSize/2}px)`
    },
    cubeFaceLeft: {
      transform: `rotateY(-90deg) translateZ(${cubeSize/2}px)`
    },
    cubeFaceRight: {
      transform: `rotateY(90deg) translateZ(${cubeSize/2}px)`
    },
    cubeFaceTop: {
      transform: `rotateX(90deg) translateZ(${cubeSize/2}px)`
    },
    cubeFaceBottom: {
      transform: `rotateX(-90deg) translateZ(${cubeSize/2}px)`
    },
    binaryStream: {
      animation: 'binaryFlash 2s linear infinite'
    },
    lockOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    encryptionText: {
      textAlign: 'center',
      color: colors.encryptText,
      fontSize: `${encryptFontSize}rem`,
      letterSpacing: `${scaleFactor}px`
    }
  }
  
  // Add keyframes for binary flash animation
  const binaryFlashKeyframes = `
    @keyframes binaryFlash {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  `
  
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
        <>
          <style>{binaryFlashKeyframes}</style>
          <motion.div style={styles.animationScene}>
            <div style={styles.encryptionContainer}>
              <motion.div 
                style={styles.dataCube}
                animate={{ 
                  rotateX: [0, 360],
                  rotateY: [0, 360]
                }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
              >
                <div style={{...styles.cubeFace, ...styles.cubeFaceFront}}>
                  <div style={styles.binaryStream}>01010110</div>
                </div>
                <div style={{...styles.cubeFace, ...styles.cubeFaceBack}}>
                  <div style={styles.binaryStream}>11001010</div>
                </div>
                <div style={{...styles.cubeFace, ...styles.cubeFaceLeft}}>
                  <div style={styles.binaryStream}>10110011</div>
                </div>
                <div style={{...styles.cubeFace, ...styles.cubeFaceRight}}>
                  <div style={styles.binaryStream}>01101101</div>
                </div>
                <div style={{...styles.cubeFace, ...styles.cubeFaceTop}}>
                  <div style={styles.binaryStream}>11010110</div>
                </div>
                <div style={{...styles.cubeFace, ...styles.cubeFaceBottom}}>
                  <div style={styles.binaryStream}>10011001</div>
                </div>
              </motion.div>
              
              <motion.div 
                style={styles.lockOverlay}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                <svg viewBox="0 0 100 100" width={lockSize} height={lockSize}>
                  <rect x="25" y="45" width="50" height="35" rx="5" fill={colors.lockFill} fillOpacity="0.9"/>
                  <path d="M35 45 V35 Q35 25 50 25 Q65 25 65 35 V45" fill="none" stroke={colors.lockFill} strokeWidth={4 * scaleFactor}/>
                </svg>
              </motion.div>
            </div>
            <motion.div 
              style={styles.encryptionText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              Encrypting with AES-256...
            </motion.div>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default DataCubeAnimation