import { motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import { getAppThemeColors } from '../../../../utils/svgThemeUtils'

const NFTScanAnimation = ({ colorMode = 'light' }) => {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const themeColors = getAppThemeColors(colorMode)
  
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
  const baseWidth = 200
  const baseHeight = 250
  const scaleFactor = Math.min(
    dimensions.width / (baseWidth * 1.5), // Add some padding
    dimensions.height / (baseHeight * 1.2),
    1 // Don't scale up beyond original size
  )

  // Scale values based on container size
  const cardWidth = baseWidth * scaleFactor
  const cardHeight = baseHeight * scaleFactor
  const borderRadius = 20 * scaleFactor
  const fontSize = 3 * scaleFactor
  const scanLineHeight = 3 * scaleFactor
  const particleSize = 4 * scaleFactor
  const particleSpread = 200 * scaleFactor
  const boxShadowSpread = 32 * scaleFactor
  
  // Dynamic styles based on scale
  const styles = {
    animationScene: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    },
    nftScanContainer: {
      position: 'relative',
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
      perspective: `${1000 * scaleFactor}px`
    },
    scanCard: {
      width: '100%',
      height: '100%',
      position: 'relative',
      transformStyle: 'preserve-3d'
    },
    cardFront: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      background: colorMode === 'dark' 
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
        : 'linear-gradient(135deg, rgba(81, 144, 255, 0.2), rgba(81, 144, 255, 0.1))',
      border: colorMode === 'dark' 
        ? '2px solid rgba(255, 255, 255, 0.3)'
        : '2px solid rgba(81, 144, 255, 0.4)',
      borderRadius: `${borderRadius}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${fontSize}rem`,
      fontWeight: 'bold',
      color: colorMode === 'dark' ? '#fff' : '#3182CE',
      boxShadow: colorMode === 'dark' 
        ? `0 ${8 * scaleFactor}px ${boxShadowSpread}px rgba(255, 255, 255, 0.1)`
        : `0 ${8 * scaleFactor}px ${boxShadowSpread}px rgba(81, 144, 255, 0.2)`
    },
    cardBack: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      background: colorMode === 'dark' 
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
        : 'linear-gradient(135deg, rgba(81, 144, 255, 0.2), rgba(81, 144, 255, 0.1))',
      border: colorMode === 'dark' 
        ? '2px solid rgba(255, 255, 255, 0.3)'
        : '2px solid rgba(81, 144, 255, 0.4)',
      borderRadius: `${borderRadius}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${fontSize}rem`,
      fontWeight: 'bold',
      color: colorMode === 'dark' ? '#fff' : '#3182CE',
      transform: 'rotateY(180deg)',
      overflow: 'hidden',
      boxShadow: colorMode === 'dark' 
        ? `0 ${8 * scaleFactor}px ${boxShadowSpread}px rgba(255, 255, 255, 0.1)`
        : `0 ${8 * scaleFactor}px ${boxShadowSpread}px rgba(81, 144, 255, 0.2)`
    },
    scanLine: {
      position: 'absolute',
      width: '100%',
      height: `${scanLineHeight}px`,
      background: colorMode === 'dark'
        ? 'linear-gradient(90deg, transparent, #fff, transparent)'
        : 'linear-gradient(90deg, transparent, #3182CE, transparent)',
      boxShadow: colorMode === 'dark'
        ? `0 0 ${20 * scaleFactor}px rgba(255, 255, 255, 0.8)`
        : `0 0 ${20 * scaleFactor}px rgba(49, 130, 206, 0.8)`
    },
    scanParticles: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    },
    particle: {
      position: 'absolute',
      width: `${particleSize}px`,
      height: `${particleSize}px`,
      background: colorMode === 'dark' ? '#fff' : '#3182CE',
      borderRadius: '50%',
      top: '50%',
      left: '50%',
      boxShadow: colorMode === 'dark'
        ? `0 0 ${8 * scaleFactor}px rgba(255, 255, 255, 0.6)`
        : `0 0 ${8 * scaleFactor}px rgba(49, 130, 206, 0.6)`
    }
  }

  return (
    <div ref={containerRef} style={styles.animationScene}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div style={styles.nftScanContainer}>
          <motion.div 
            style={styles.scanCard}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 360 }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
          >
            <div style={styles.cardFront}>NFT</div>
            <div style={styles.cardBack}>
              <motion.div 
                style={styles.scanLine}
                initial={{ top: 0 }}
                animate={{ top: '100%' }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          </motion.div>
          <motion.div style={styles.scanParticles}>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                style={styles.particle}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0 
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * particleSpread,
                  y: (Math.random() - 0.5) * particleSpread,
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity
                }}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}
export default NFTScanAnimation