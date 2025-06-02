import React, { useState, useEffect, useRef  } from 'react'
import { motion } from 'framer-motion'

const NFTLockingAnimation = ({ colorMode = 'light' }) => {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isLocked, setIsLocked] = useState(false)

  const theme = {
    light: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
      bg: 'transparent',
      cardBg: '#ffffff',
      cardBorder: '#e0e0e0',
      glow: 'rgba(0, 0, 0, 0.1)',
      accent: '#333333',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#888888',
      bg: 'transparent',
      cardBg: '#1a1a1a',
      cardBorder: '#333333',
      glow: 'rgba(255, 255, 255, 0.1)',
      accent: '#dddddd',
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLocked(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Calculate scale factor based on container size
  const baseCardWidth = 300
  const baseCardHeight = 400
  const scaleFactor = Math.min(
    dimensions.width / (baseCardWidth * 1.2), // Add padding
    dimensions.height / (baseCardHeight * 1.1),
    1 // Don't scale up beyond original size
  )

  // Scale all measurements
  const cardWidth = baseCardWidth * scaleFactor
  const cardHeight = baseCardHeight * scaleFactor
  const borderRadius = 16 * scaleFactor
  const padding = 20 * scaleFactor
  const imageSize = 200 * scaleFactor
  const svgSize = 120 * scaleFactor
  const lockDropDistance = 500 * scaleFactor

  // Font sizes
  const headerFontSize = 12 * scaleFactor
  const titleFontSize = 16 * scaleFactor
  const detailFontSize = 12 * scaleFactor
  const statusFontSize = 10 * scaleFactor
  const lockTextFontSize = 16 * scaleFactor
  const lockSubFontSize = 11 * scaleFactor

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
          {/* Main NFT Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 * scaleFactor }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1, type: "spring", damping: 15 }}
            style={{
              position: 'relative',
              zIndex: 2
            }}
          >
            <div style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              backgroundColor: colors.cardBg,
              border: `${2 * scaleFactor}px solid ${colors.cardBorder}`,
              borderRadius: `${borderRadius}px`,
              padding: `${padding}px`,
              boxShadow: `0 ${8 * scaleFactor}px ${32 * scaleFactor}px ${colors.glow}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* NFT Header */}
              <div style={{
                fontSize: `${headerFontSize}px`,
                fontWeight: '600',
                color: colors.secondary,
                textTransform: 'uppercase',
                letterSpacing: `${scaleFactor}px`,
                marginBottom: `${20 * scaleFactor}px`
              }}>
                AI Neura NFT #001
              </div>

              {/* AI Brain Image Container */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                style={{
                  width: `${imageSize}px`,
                  height: `${imageSize}px`,
                  backgroundColor: colors.cardBorder,
                  borderRadius: `${12 * scaleFactor}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: `${20 * scaleFactor}px`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* AI Brain SVG */}
                <svg width={svgSize} height={svgSize} viewBox="0 0 120 120" fill="none">
                  {/* Brain outline */}
                  <path 
                    d="M30 40c0-10 8-18 18-18s18 8 18 18c5-8 15-12 24-8s12 15 8 24c8 5 12 15 8 24s-15 12-24 8c0 10-8 18-18 18s-18-8-18-18c-5 8-15 12-24 8s-12-15-8-24c-8-5-12-15-8-24s15-12 24-8z" 
                    stroke={colors.primary} 
                    strokeWidth={2 * scaleFactor} 
                    fill="none"
                  />
                  
                  {/* Neural network nodes */}
                  <circle cx="45" cy="45" r={3 * scaleFactor} fill={colors.primary} />
                  <circle cx="75" cy="45" r={3 * scaleFactor} fill={colors.primary} />
                  <circle cx="60" cy="60" r={3 * scaleFactor} fill={colors.primary} />
                  <circle cx="40" cy="75" r={3 * scaleFactor} fill={colors.primary} />
                  <circle cx="80" cy="75" r={3 * scaleFactor} fill={colors.primary} />
                  
                  {/* Neural connections */}
                  <line x1="45" y1="45" x2="75" y2="45" stroke={colors.secondary} strokeWidth={scaleFactor} />
                  <line x1="45" y1="45" x2="60" y2="60" stroke={colors.secondary} strokeWidth={scaleFactor} />
                  <line x1="75" y1="45" x2="60" y2="60" stroke={colors.secondary} strokeWidth={scaleFactor} />
                  <line x1="60" y1="60" x2="40" y2="75" stroke={colors.secondary} strokeWidth={scaleFactor} />
                  <line x1="60" y1="60" x2="80" y2="75" stroke={colors.secondary} strokeWidth={scaleFactor} />
                </svg>

                {/* Animated neural pulses */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.5, 0],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.4,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                    style={{
                      position: 'absolute',
                      width: `${6 * scaleFactor}px`,
                      height: `${6 * scaleFactor}px`,
                      borderRadius: '50%',
                      backgroundColor: colors.accent,
                      left: `${30 + (i * 15)}%`,
                      top: `${40 + (i % 2) * 20}%`
                    }}
                  />
                ))}
              </motion.div>

              {/* NFT Details */}
              <div style={{
                textAlign: 'center',
                color: colors.primary
              }}>
                <div style={{ fontSize: `${titleFontSize}px`, fontWeight: '600', marginBottom: `${8 * scaleFactor}px` }}>
                  Neural Network Core
                </div>
                <div style={{ fontSize: `${detailFontSize}px`, color: colors.secondary }}>
                  Artificial Intelligence Asset
                </div>
              </div>

              {/* Security Status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLocked ? 1 : 0.75 }}
                style={{
                  position: 'absolute',
                  bottom: `${20 * scaleFactor}px`,
                  fontSize: `${statusFontSize}px`,
                  color: colors.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: `${0.5 * scaleFactor}px`
                }}
              >
                {isLocked ? 'SECURED' : 'PROCESSING...'}
              </motion.div>
            </div>
          </motion.div>

          {/* Security Lock Card */}
          <motion.div
            initial={{ y: -lockDropDistance, opacity: 0, rotateX: -45 }}
            animate={isLocked ? { 
              y: 0, 
              opacity: 1, 
              rotateX: 0,
              transition: { 
                duration: 2, 
                type: "spring", 
                damping: 15,
                bounce: 0.2
              }
            } : {}}
            style={{
              position: 'absolute',
              zIndex: 5,
              transformStyle: 'preserve-3d'
            }}
          >
            <div style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              backgroundColor: colorMode === 'dark' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              border: `${3 * scaleFactor}px solid ${colors.primary}`,
              borderRadius: `${borderRadius}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 ${12 * scaleFactor}px ${40 * scaleFactor}px ${colors.glow}`,
              position: 'relative'
            }}>
              
              {/* Lock Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={isLocked ? { scale: 1 } : {}}
                transition={{ delay: 1.2, duration: 0.8, type: "spring" }}
                style={{
                  backgroundColor: colors.cardBg,
                  padding: `${20 * scaleFactor}px`,
                  borderRadius: `${12 * scaleFactor}px`,
                  border: `${2 * scaleFactor}px solid ${colors.primary}`,
                  marginBottom: `${20 * scaleFactor}px`
                }}
              >
                <svg width={40 * scaleFactor} height={40 * scaleFactor} viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="10" width="12" height="10" rx="1" stroke={colors.primary} strokeWidth={2 * scaleFactor} fill="none"/>
                  <path d="M8 10V6a4 4 0 0 1 8 0v4" stroke={colors.primary} strokeWidth={2 * scaleFactor} fill="none"/>
                  <circle cx="12" cy="15" r={1.5 * scaleFactor} fill={colors.primary}/>
                </svg>
              </motion.div>

              {/* Security Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 * scaleFactor }}
                animate={isLocked ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.5, duration: 1 }}
                style={{
                  textAlign: 'center',
                  backgroundColor: colors.cardBg,
                  padding: `${16 * scaleFactor}px ${24 * scaleFactor}px`,
                  borderRadius: `${8 * scaleFactor}px`,
                  border: `${2 * scaleFactor}px solid ${colors.primary}`
                }}
              >
                <div style={{
                  fontSize: `${lockTextFontSize}px`,
                  fontWeight: '700',
                  color: colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: `${scaleFactor}px`
                }}>
                  ACCESS PROTECTED
                </div>
                <div style={{
                  fontSize: `${lockSubFontSize}px`,
                  color: colors.secondary,
                  marginTop: `${4 * scaleFactor}px`
                }}>
                  Digital Asset Secured
                </div>
              </motion.div>

              {/* Lock animation pulse */}
              <motion.div
                animate={isLocked ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2.5
                }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: `${2 * scaleFactor}px solid ${colors.accent}`,
                  borderRadius: `${12 * scaleFactor}px`,
                  pointerEvents: 'none'
                }}
              />
            </div>
          </motion.div>

          {/* Security scanning lines */}
          {isLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.8 }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 4,
                    delay: i * 0.8,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "linear"
                  }}
                  style={{
                    position: 'absolute',
                    top: `${30 + i * 15}%`,
                    width: `${2 * scaleFactor}px`,
                    height: `${scaleFactor}px`,
                    background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)`,
                    opacity: 0.6
                  }}
                />
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default NFTLockingAnimation