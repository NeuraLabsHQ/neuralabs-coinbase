import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const NFTLockingAnimation = ({ colorMode = 'light' }) => {
  const [isLocked, setIsLocked] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)

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
    // Start scanning after initial delay
    const scanTimer = setTimeout(() => {
      setIsScanning(true)
    }, 2000)

    // Complete scan and unlock
    const unlockTimer = setTimeout(() => {
      setScanComplete(true)
      setIsScanning(false)
    }, 5000)

    const removeTimer = setTimeout(() => {
      setIsLocked(false)
    }, 6000)

    return () => {
      clearTimeout(scanTimer)
      clearTimeout(unlockTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Main NFT Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1, type: "spring", damping: 15 }}
        style={{
          position: 'relative',
          zIndex: 2
        }}
      >
        <div style={{
          width: '300px',
          height: '400px',
          backgroundColor: colors.cardBg,
          border: `2px solid ${colors.cardBorder}`,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: `0 8px 32px ${colors.glow}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* NFT Header */}
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: colors.secondary,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '20px'
          }}>
            AI Neural NFT #001
          </div>

          {/* AI Brain Image Container */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
            style={{
              width: '200px',
              height: '200px',
              backgroundColor: colors.cardBorder,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* AI Brain SVG */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              {/* Brain outline */}
              <path 
                d="M30 40c0-10 8-18 18-18s18 8 18 18c5-8 15-12 24-8s12 15 8 24c8 5 12 15 8 24s-15 12-24 8c0 10-8 18-18 18s-18-8-18-18c-5 8-15 12-24 8s-12-15-8-24c-8-5-12-15-8-24s15-12 24-8z" 
                stroke={colors.primary} 
                strokeWidth="2" 
                fill="none"
              />
              
              {/* Neural network nodes */}
              <circle cx="45" cy="45" r="3" fill={colors.primary} />
              <circle cx="75" cy="45" r="3" fill={colors.primary} />
              <circle cx="60" cy="60" r="3" fill={colors.primary} />
              <circle cx="40" cy="75" r="3" fill={colors.primary} />
              <circle cx="80" cy="75" r="3" fill={colors.primary} />
              
              {/* Neural connections */}
              <line x1="45" y1="45" x2="75" y2="45" stroke={colors.secondary} strokeWidth="1" />
              <line x1="45" y1="45" x2="60" y2="60" stroke={colors.secondary} strokeWidth="1" />
              <line x1="75" y1="45" x2="60" y2="60" stroke={colors.secondary} strokeWidth="1" />
              <line x1="60" y1="60" x2="40" y2="75" stroke={colors.secondary} strokeWidth="1" />
              <line x1="60" y1="60" x2="80" y2="75" stroke={colors.secondary} strokeWidth="1" />
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
                  width: '6px',
                  height: '6px',
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
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Neural Network Core
            </div>
            <div style={{ fontSize: '12px', color: colors.secondary }}>
              Artificial Intelligence Asset
            </div>
          </div>

          {/* Security Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLocked ? 1 : 0.3 }}
            style={{
              position: 'absolute',
              bottom: '20px',
              fontSize: '10px',
              color: colors.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {isLocked ? 'SECURED' : 'PROCESSING...'}
          </motion.div>
        </div>
      </motion.div>

      {/* Security Lock Card */}
      <motion.div
        initial={{ y: 0, opacity: 1, rotateX: 0 }}
        animate={isLocked ? { 
          y: 0, 
          opacity: 1, 
          rotateX: 0
        } : {
          y: -500,
          opacity: 0,
          rotateX: -45,
          transition: { 
            duration: 1.5, 
            type: "spring", 
            damping: 15
          }
        }}
        style={{
          position: 'absolute',
          zIndex: 5,
          transformStyle: 'preserve-3d'
        }}
      >
        <div style={{
          width: '300px',
          height: '400px',
          backgroundColor: colorMode === 'dark' ? 'rgba(26, 26, 26, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          border: `3px solid ${colors.primary}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 12px 40px ${colors.glow}`,
          position: 'relative'
        }}>
          
          {/* Lock Icon */}
          <motion.div
            initial={{ scale: 1 }}
            animate={scanComplete ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.8, type: "spring" }}
            style={{
              backgroundColor: colors.cardBg,
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${colors.primary}`,
              marginBottom: '20px',
              position: 'relative'
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="10" width="12" height="10" rx="1" stroke={colors.primary} strokeWidth="2" fill="none"/>
              <path d="M8 10V6a4 4 0 0 1 8 0v4" stroke={colors.primary} strokeWidth="2" fill="none"/>
              <circle cx="12" cy="15" r="1.5" fill={colors.primary}/>
            </svg>

            {/* Scanning effect on lock */}
            {isScanning && (
              <motion.div
                animate={{
                  y: [-20, 40, -20]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  position: 'absolute',
                  left: '0',
                  width: '100%',
                  height: '2px',
                  background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)`,
                  opacity: 0.8
                }}
              />
            )}
          </motion.div>

          {/* Security Text */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={scanComplete ? { 
              color: '#4CAF50',
              transition: { duration: 0.5 }
            } : {}}
            style={{
              textAlign: 'center',
              backgroundColor: colors.cardBg,
              padding: '16px 24px',
              borderRadius: '8px',
              border: `2px solid ${colors.primary}`
            }}
          >
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {isScanning ? 'SCANNING...' : scanComplete ? 'ACCESS VERIFIED' : 'ACCESS PROTECTED'}
            </div>
            <div style={{
              fontSize: '11px',
              color: colors.secondary,
              marginTop: '4px'
            }}>
              {isScanning ? 'Verifying Identity' : scanComplete ? 'Unlock Successful' : 'Digital Asset Secured'}
            </div>
          </motion.div>

          {/* Lock animation pulse */}
          <motion.div
            animate={isLocked && !scanComplete ? {
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
              border: `2px solid ${colors.accent}`,
              borderRadius: '12px',
              pointerEvents: 'none'
            }}
          />
        </div>
      </motion.div>

      {/* Scanning effect across entire NFT */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            width: '300px',
            height: '400px',
            pointerEvents: 'none',
            zIndex: 6
          }}
        >
          {/* Main scanning beam */}
          <motion.div
            animate={{
              y: [-20, 420, -20]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '4px',
              background: `linear-gradient(to right, transparent, ${colors.accent}, ${colors.accent}, transparent)`,
              opacity: 0.8,
              boxShadow: `0 0 10px ${colors.accent}`
            }}
          />

          {/* Secondary scanning lines */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-10, 410, -10]
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '1px',
                background: `linear-gradient(to right, transparent, ${colors.tertiary}, transparent)`,
                opacity: 0.4
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Security scanning lines */}
      {isLocked && !scanComplete && (
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
                width: '2px',
                height: '1px',
                background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)`,
                opacity: 0.6
              }}
            />
          ))}
        </motion.div>
      )}

    </div>
  )
}

export default NFTLockingAnimation