/**
 * Animation System Hook
 * Manages step icons and animation phases
 */
import React from 'react'
import { motion } from 'framer-motion'

export const useAnimationSystem = () => { 
  const renderStepIcon = (iconType, isActive, isCompleted) => {
    const baseClass = `step-icon-svg ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`
    
    switch(iconType) {
      case 'wallet':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
            initial={{ opacity: 0.3 }}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
              scale: isActive ? 1.1 : 1
            }}
            transition={{ duration: 0.8 }}
          >
            <motion.rect 
              x="20" y="30" width="60" height="40" rx="5"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
            <motion.circle 
              cx="65" cy="50" r="5"
              fill="currentColor"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            />
          </motion.svg>
        )

      case 'balance':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
              rotate: isActive ? [0, 5, -5, 0] : 0
            }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            <motion.circle
              cx="35" cy="50" r="20"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5 }}
            />
            <motion.circle
              cx="65" cy="50" r="20"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />
            <motion.text 
              x="35" y="55" 
              textAnchor="middle" 
              fontSize="12" 
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : isCompleted ? 0.8 : 0.5 }}
            >
              SUI
            </motion.text>
            <motion.text 
              x="65" y="55" 
              textAnchor="middle" 
              fontSize="12" 
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : isCompleted ? 0.8 : 0.5 }}
            >
              WAL
            </motion.text>
          </motion.svg>
        )
      
      case 'nft':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
              rotate: isActive ? [0, 5, -5, 0] : 0
            }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            <motion.path
              d="M30 20 L70 20 L80 50 L50 80 L20 50 Z"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5 }}
            />
            <motion.text 
              x="50" y="55" 
              textAnchor="middle" 
              fontSize="20" 
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : isCompleted ? 0.8 : 0.5 }}
            >
              NFT
            </motion.text>
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
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: isActive || isCompleted ? 1 : 0,
                opacity: isActive ? 0.6 : isCompleted ? 0.5 : 0.2
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut"
              }}
            />
            <motion.path
              d="M45 50 L70 50 L70 45 L75 45 L75 55 L70 55 L70 50"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: isActive || isCompleted ? 1 : 0,
                opacity: isActive ? 0.6 : isCompleted ? 0.5 : 0.2
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut",
                delay: 0.5
              }}
            />
            {isActive && (
              <motion.circle
                cx="35"
                cy="50"
                r="8"
                fill="currentColor"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  scale: [0.8, 1.2, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.svg>
        )
      
      case 'signature':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            {/* Elliptic curve */}
            <motion.path
              d="M10 70 Q20 20, 50 50 T90 30"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: isActive || isCompleted ? 1 : 0,
                opacity: isActive ? 0.6 : isCompleted ? 0.5 : 0.2
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut"
              }}
            />
            {/* Point on curve */}
            {isActive && (
              <motion.circle
                cx="50"
                cy="50"
                r="4"
                fill="currentColor"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  cx: [20, 50, 80, 20],
                  cy: [60, 50, 40, 60]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            {/* Signature path */}
            <motion.path
              d="M20 80 Q35 70 50 80 T80 80"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: isActive ? [0, 1, 1, 0] : isCompleted ? 1 : 0,
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
              transition={{ 
                duration: 3, 
                repeat: isActive ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
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
      
      case 'seal':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            {/* Central core */}
            <motion.circle
              cx="50" cy="50" r="15"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {/* Secret shares */}
            {[0, 72, 144, 216, 288].map((angle, i) => {
              const x = 50 + 30 * Math.cos(angle * Math.PI / 180)
              const y = 50 + 30 * Math.sin(angle * Math.PI / 180)
              return (
                <motion.g key={i}>
                  <motion.line
                    x1="50" y1="50" x2={x} y2={y}
                    stroke="currentColor" strokeWidth="1"
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{ 
                      pathLength: isActive ? [0, 1, 1, 0] : isCompleted ? 1 : 0,
                      opacity: isActive ? [0.2, 0.5, 0.5, 0.2] : isCompleted ? 0.5 : 0.2
                    }}
                    transition={{ 
                      duration: 3, 
                      delay: i * 0.2,
                      repeat: isActive ? Infinity : 0
                    }}
                  />
                  <motion.circle
                    cx={x.toString()} cy={y.toString()} r="8"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ 
                      scale: isActive ? [1, 1, 1.2, 1] : 1,
                      opacity: isActive ? [0.3, 1, 1, 0.5] : isCompleted ? 0.8 : 0.3
                    }}
                    transition={{ 
                      duration: 3, 
                      delay: i * 0.2,
                      repeat: isActive ? Infinity : 0
                    }}
                  />
                </motion.g>
              )
            })}
          </motion.svg>
        )
      
      case 'walrus':
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
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <motion.circle
                key={i}
                cx={(50 + 25 * Math.cos(angle * Math.PI / 180)).toString()}
                cy={(50 + 25 * Math.sin(angle * Math.PI / 180)).toString()}
                r="5"
                fill="currentColor"
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ 
                  scale: isActive ? [0.5, 1, 0.5] : 1,
                  opacity: isActive ? [0.5, 1, 0.5] : isCompleted ? 0.9 : 0.3
                }}
                transition={{ 
                  duration: 3, 
                  repeat: isActive ? Infinity : 0,
                  delay: i * 0.2 
                }}
              />
            ))}
          </motion.svg>
        )
      
      default:
        return null
    }
  }

  const renderAnimation = (animationPhase) => {
    switch(animationPhase) {
      case 'processing':
        return (
          <motion.div className="animation-scene">
            <div className="processing-container">
              <motion.div 
                className="processing-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <motion.circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4"
                  />
                  <motion.circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke="white" strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 0.7, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </svg>
              </motion.div>
              <motion.div className="processing-text">Processing...</motion.div>
            </div>
          </motion.div>
        )

      case 'completed':
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="success-badge"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              ✅ COMPLETED
            </motion.div>
          </motion.div>
        )

      case 'idle':
      default:
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="idle-animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="network-animation">
                <motion.div 
                  className="network-core"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <svg viewBox="0 0 200 200" width="200" height="200">
                    <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                    <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  </svg>
                </motion.div>
                
                {/* Network Nodes */}
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 60) * Math.PI / 180
                  const x = 100 + Math.cos(angle) * 70
                  const y = 100 + Math.sin(angle) * 70
                  
                  return (
                    <motion.div
                      key={i}
                      className="network-node"
                      style={{ left: `${x}px`, top: `${y}px` }}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 3,
                        delay: i * 0.5,
                        repeat: Infinity
                      }}
                    />
                  )
                })}
                
                {/* Connection Lines */}
                <svg className="network-connections" viewBox="0 0 200 200" width="200" height="200">
                  {[...Array(6)].map((_, i) => {
                    const angle1 = (i * 60) * Math.PI / 180
                    const angle2 = ((i + 1) * 60) * Math.PI / 180
                    const x1 = 100 + Math.cos(angle1) * 70
                    const y1 = 100 + Math.sin(angle1) * 70
                    const x2 = 100 + Math.cos(angle2) * 70
                    const y2 = 100 + Math.sin(angle2) * 70
                    
                    return (
                      <motion.line
                        key={i}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ 
                          duration: 2,
                          delay: i * 0.3,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                    )
                  })}
                </svg>
              </div>
            </motion.div>
          </motion.div>
        )
    }
  }

  return {
    renderStepIcon,
    renderAnimation
  }
}