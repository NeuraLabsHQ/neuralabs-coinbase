import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Animation System for Interactive Publish Journey
 * Provides icons and animations matching the Interactive Journey style
 */

export const useAnimationSystem = () => {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animationIdRef = useRef(null)

  const initParticles = () => {
    particlesRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.3 + 0.1
    }))
  }

  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Update and draw particles
    particlesRef.current.forEach(particle => {
      particle.x += particle.vx
      particle.y += particle.vy

      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width
      if (particle.x > canvas.width) particle.x = 0
      if (particle.y < 0) particle.y = canvas.height
      if (particle.y > canvas.height) particle.y = 0

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
      ctx.fill()
    })

    animationIdRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }

    handleResize()
    initParticles()
    animate()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  const renderStepIcon = (icon, isActive, isCompleted) => {
    const baseClass = isActive ? 'step-icon-active' : isCompleted ? 'step-icon-completed' : 'step-icon-inactive'
    
    // Safety check for undefined icon
    if (!icon) {
      return (
        <motion.svg viewBox="0 0 100 100" className={baseClass}>
          <motion.circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
        </motion.svg>
      )
    }
    
    switch (icon) {
      case 'wallet':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.rect
              x="20" y="30" width="60" height="40" rx="5"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M20 45 L80 45"
              stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {isActive && (
              <motion.circle
                cx="50" cy="57"
                r="5"
                fill="currentColor"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.svg>
        )
      
      case 'balance':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.circle
              cx="35" cy="50" r="25"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.circle
              cx="65" cy="50" r="25"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {isActive && (
              <motion.path
                d="M35 50 Q50 35 65 50"
                fill="none" stroke="currentColor" strokeWidth="2"
                initial={{ d: "M35 50 Q50 35 65 50" }}
                animate={{ 
                  d: ["M35 50 Q50 35 65 50", "M35 50 Q50 65 65 50", "M35 50 Q50 35 65 50"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.svg>
        )
      
      case 'nft':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.polygon
              points="50,20 70,35 70,65 50,80 30,65 30,35"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
                rotate: isActive ? 360 : 0
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" }
              }}
            />
            <motion.circle
              cx="50" cy="50" r="15"
              fill="none" stroke="currentColor" strokeWidth="2"
            />
          </motion.svg>
        )
      
      case 'key':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.circle
              cx="35" cy="50" r="15"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M45 50 L70 50 L70 45 L75 45 L75 55 L70 55 L70 50"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {isActive && (
              <motion.circle
                cx="35" cy="50"
                r="5"
                fill="currentColor"
                animate={{ scale: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.svg>
        )
      
      case 'shield':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.path
              d="M50 20 L70 30 L70 55 Q70 70 50 80 Q30 70 30 55 L30 30 Z"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {isActive && (
              <motion.path
                d="M40 50 L45 55 L60 40"
                fill="none" stroke="currentColor" strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
          </motion.svg>
        )
      
      case 'check':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.circle
              cx="50" cy="50" r="30"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M35 50 L45 60 L65 40"
              fill="none" stroke="currentColor" strokeWidth="3"
              initial={{ pathLength: isCompleted ? 1 : 0 }}
              animate={{ 
                pathLength: isActive || isCompleted ? 1 : 0,
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0
              }}
              transition={{ duration: 0.5 }}
            />
          </motion.svg>
        )
      
      case 'seal':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.circle
              cx="50" cy="50" r="30"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.g>
              {[0, 72, 144, 216, 288].map((angle, i) => (
                <motion.circle
                  key={i}
                  cx={50 + 20 * Math.cos((angle * Math.PI) / 180)}
                  cy={50 + 20 * Math.sin((angle * Math.PI) / 180)}
                  r="5"
                  fill="currentColor"
                  animate={{ 
                    opacity: isActive ? [0.3, 1, 0.3] : isCompleted ? 0.7 : 0.2,
                    scale: isActive ? [0.8, 1.2, 0.8] : 1
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.g>
          </motion.svg>
        )
      
      case 'file':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.path
              d="M30 15 L30 85 L70 85 L70 35 L50 15 Z"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M50 15 L50 35 L70 35"
              fill="none" stroke="currentColor" strokeWidth="2"
            />
            {isActive && (
              <motion.line
                x1="40" y1="50" x2="60" y2="50"
                stroke="currentColor" strokeWidth="2"
                initial={{ x1: 50, x2: 50 }}
                animate={{ x1: 40, x2: 60 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              />
            )}
          </motion.svg>
        )
      
      case 'encrypt':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.rect
              x="25" y="45" width="50" height="35" rx="5"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M35 45 V35 Q35 25 50 25 Q65 25 65 35 V45"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {isActive && (
              <motion.circle
                cx="50" cy="62"
                r="5"
                fill="currentColor"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.svg>
        )
      
      case 'walrus':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.ellipse
              cx="50" cy="50" rx="35" ry="25"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M30 60 Q30 70 35 75 M70 60 Q70 70 65 75"
              fill="none" stroke="currentColor" strokeWidth="2"
            />
            {isActive && (
              <>
                <motion.circle cx="35" cy="45" r="3" fill="currentColor" 
                  animate={{ scale: [1, 0, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.circle cx="65" cy="45" r="3" fill="currentColor"
                  animate={{ scale: [1, 0, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
          </motion.svg>
        )
      
      default:
        return null
    }
  }

  return {
    canvasRef,
    renderStepIcon
  }
}