import { useEffect, useRef, useState } from 'react'

import { motion } from 'framer-motion'
import { getAppThemeColors } from '../../../../utils/svgThemeUtils'

const WalletConnectedAnimation = ({ colorMode = 'light' }) => {
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
  const baseSize = 300 // Base size for the animation
  const scaleFactor = Math.min(
    dimensions.width / baseSize,
    dimensions.height / baseSize,
    1 // Don't scale up beyond original size
  )

  // Scale values based on container size
  const walletWidth = 120 * scaleFactor
  const walletHeight = 80 * scaleFactor
  const particleRadius = 80 * scaleFactor
  const checkmarkSize = 60 * scaleFactor
  const maxWaveScale = 2.5 * scaleFactor

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <motion.div 
          className="animation-scene"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <div 
            className="wallet-connection-container"
            style={{
              position: 'relative',
              width: `${baseSize * scaleFactor}px`,
              height: `${baseSize * scaleFactor * 0.8}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Main wallet */}
            <motion.div 
              className="main-wallet"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "backOut" }}
              style={{
                position: 'absolute',
                zIndex: 2
              }}
            >
              <svg viewBox="0 0 120 80" width={walletWidth} height={walletHeight}>
                <motion.rect 
                  x="10" y="20" width="100" height="60" rx="8"
                  fill="none" stroke={themeColors.text} strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
                <motion.circle 
                  cx="85" cy="50" r="8"
                  fill={themeColors.text}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                />
              </svg>
            </motion.div>

            {/* Connection waves */}
            <motion.div 
              className="connection-waves"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {[1, 2, 3].map((wave) => (
                <motion.div
                  key={wave}
                  className="wave-ring"
                  style={{
                    position: 'absolute',
                    width: `${40 * scaleFactor}px`,
                    height: `${40 * scaleFactor}px`,
                    border: `2px solid ${themeColors.text}`,
                    borderRadius: '50%',
                    opacity: 0.3
                  }}
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ 
                    scale: [0, maxWaveScale, maxWaveScale + 0.5],
                    opacity: [0.8, 0.3, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: wave * 0.3,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Security particles */}
            <motion.div 
              className="security-particles"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%'
              }}
            >
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * Math.PI / 180
                return (
                  <motion.div
                    key={i}
                    className="security-particle"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{ 
                      x: Math.cos(angle) * particleRadius,
                      y: Math.sin(angle) * particleRadius,
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1, 1, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      delay: 1.5 + i * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div 
                      className="particle-dot"
                      style={{
                        width: `${6 * scaleFactor}px`,
                        height: `${6 * scaleFactor}px`,
                        backgroundColor: themeColors.success,
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Success checkmark */}
            <motion.div 
              className="connection-success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 2, duration: 0.6, ease: "backOut" }}
              style={{
                position: 'absolute',
                zIndex: 3
              }}
            >
              <svg viewBox="0 0 60 60" width={checkmarkSize} height={checkmarkSize}>
                <circle cx="30" cy="30" r="25" fill={`${themeColors.success}33`} stroke={themeColors.success} strokeWidth="3"/>
                <motion.path
                  d="M18 30 L26 38 L42 22"
                  fill="none"
                  stroke={themeColors.success}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 2.3, duration: 0.5 }}
                />
              </svg>
            </motion.div>
          </div>
          
          <motion.div 
            className="connection-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            style={{
              marginTop: `${20 * scaleFactor}px`,
              fontSize: `${16 * scaleFactor}px`,
              fontWeight: 'bold',
              color: themeColors.text
            }}
          >
            <span className="main-text">Wallet Connected</span>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default WalletConnectedAnimation