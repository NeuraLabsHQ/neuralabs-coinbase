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
      case 'nft-scanning':
        return (
          <motion.div className="animation-scene">
            <div className="nft-scan-container">
              <motion.div 
                className="scan-card"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 2, ease: "linear" }}
              >
                <div className="card-front">NFT</div>
                <div className="card-back">
                  <motion.div 
                    className="scan-line"
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              <motion.div className="scan-particles">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="particle"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0 
                    }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 200,
                      y: (Math.random() - 0.5) * 200,
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
          </motion.div>
        )

      case 'nft-verified':
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="verification-badge"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <svg viewBox="0 0 100 100" width="200" height="200">
                <defs>
                  <linearGradient id="verifiedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#888" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <motion.polygon
                  points="50,10 61,35 88,35 68,55 79,80 50,62 21,80 32,55 12,35 39,35"
                  fill="url(#verifiedGradient)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
                <text x="50" y="55" textAnchor="middle" fontSize="24" fill="white" fontWeight="bold">4+</text>
              </svg>
            </motion.div>
            <motion.div 
              className="access-level-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="access-label">Access Level</span>
              <span className="access-value">4+</span>
            </motion.div>
          </motion.div>
        )

      case 'seal-init':
        return (
          <motion.div className="animation-scene">
            <div className="shamir-container">
              {/* Central secret */}
              <motion.div 
                className="central-secret"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <motion.polygon
                    points="50,20 70,40 70,60 50,80 30,60 30,40"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                  <text x="50" y="55" textAnchor="middle" fontSize="14" fill="white">SECRET</text>
                </svg>
              </motion.div>
              
              {/* Distributed shares */}
              {[0, 72, 144, 216, 288].map((angle, i) => {
                const x = 150 + Math.cos(angle * Math.PI / 180) * 120
                const y = 150 + Math.sin(angle * Math.PI / 180) * 120
                
                return (
                  <motion.div
                    key={i}
                    className="secret-share"
                    style={{ left: `${x}px`, top: `${y}px` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <svg viewBox="0 0 60 60" width="60" height="60">
                      <rect x="10" y="10" width="40" height="40" rx="5" 
                        fill="rgba(255,255,255,0.1)" 
                        stroke="white" 
                        strokeWidth="1.5"
                      />
                      <text x="30" y="35" textAnchor="middle" fontSize="16" fill="white">{i + 1}/5</text>
                    </svg>
                    
                    <motion.svg
                      className="share-connection"
                      viewBox="0 0 300 300"
                      style={{
                        position: 'absolute',
                        left: '-150px',
                        top: '-150px',
                        width: '300px',
                        height: '300px'
                      }}
                    >
                      <motion.line
                        x1="150" y1="150"
                        x2={150 - (150 - x)} y2={150 - (150 - y)}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                      />
                    </motion.svg>
                  </motion.div>
                )
              })}
              
              <motion.div 
                className="threshold-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                3-of-5 Threshold Encryption
              </motion.div>
            </div>
          </motion.div>
        )

      case 'signing':
        return (
          <motion.div className="animation-scene">
            <div className="elliptic-curve-container">
              <svg viewBox="0 0 300 300" width="300" height="300">
                {/* Grid */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="300" height="300" fill="url(#grid)" />
                
                {/* Axes */}
                <line x1="0" y1="150" x2="300" y2="150" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                
                {/* Elliptic curve */}
                <motion.path
                  d="M30,200 Q50,50 100,100 T150,150 Q200,180 250,120"
                  fill="none"
                  stroke="rgba(74, 222, 128, 0.8)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                
                {/* Moving point */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="6"
                  fill="#4ade80"
                  initial={{ cx: 30, cy: 200 }}
                  animate={{ 
                    cx: [30, 100, 150, 250],
                    cy: [200, 100, 150, 120]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <animate
                    attributeName="r"
                    values="6;8;6"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </motion.circle>
                
                {/* Point multiplication visualization */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    times: [0, 0.2, 0.8, 1]
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <motion.circle
                      key={i}
                      cx={(100 + i * 50).toString()}
                      cy={(150 - i * 10).toString()}
                      r="3"
                      fill="rgba(255,255,255,0.5)"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 0] }}
                      transition={{ 
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity
                      }}
                    />
                  ))}
                </motion.g>
                
                {/* Signature generation */}
                <motion.path
                  d="M50,280 Q100,270 150,280 T250,280"
                  fill="none"
                  stroke="url(#signatureGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0] }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <defs>
                  <linearGradient id="signatureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0" />
                    <stop offset="50%" stopColor="#4ade80" stopOpacity="1" />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <motion.div className="curve-labels">
                <span className="curve-equation">y² = x³ + ax + b (mod p)</span>
                <span className="signature-text">ECDSA Signature Generation</span>
              </motion.div>
            </div>
          </motion.div>
        )

      case 'signed':
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="signature-complete"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              ✍️ SIGNED
            </motion.div>
          </motion.div>
        )

      case 'file-selected':
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="file-icon"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              📄
            </motion.div>
          </motion.div>
        )

      case 'encrypting':
        return (
          <motion.div className="animation-scene">
            <div className="encryption-container">
              <motion.div 
                className="data-cube"
                animate={{ 
                  rotateX: [0, 360],
                  rotateY: [0, 360]
                }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
              >
                <div className="cube-face front">
                  <div className="binary-stream">01010110</div>
                </div>
                <div className="cube-face back">
                  <div className="binary-stream">11001010</div>
                </div>
                <div className="cube-face left">
                  <div className="binary-stream">10110011</div>
                </div>
                <div className="cube-face right">
                  <div className="binary-stream">01101101</div>
                </div>
                <div className="cube-face top">
                  <div className="binary-stream">11010110</div>
                </div>
                <div className="cube-face bottom">
                  <div className="binary-stream">10011001</div>
                </div>
              </motion.div>
              
              <motion.div 
                className="lock-overlay"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <rect x="25" y="45" width="50" height="35" rx="5" fill="white" fillOpacity="0.9"/>
                  <path d="M35 45 V35 Q35 25 50 25 Q65 25 65 35 V45" fill="none" stroke="white" strokeWidth="4"/>
                </svg>
              </motion.div>
            </div>
            <motion.div className="encryption-text">Encrypting with AES-256...</motion.div>
          </motion.div>
        )

      case 'encrypted':
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="encrypted-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              🔒 ENCRYPTED
            </motion.div>
          </motion.div>
        )

      case 'uploading':
        return (
          <motion.div className="animation-scene">
            <div className="walrus-upload">
              <motion.div className="central-file">
                <div className="file-icon">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <rect x="20" y="10" width="60" height="80" rx="5" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="2"/>
                    <rect x="30" y="30" width="40" height="3" fill="white" fillOpacity="0.5"/>
                    <rect x="30" y="40" width="40" height="3" fill="white" fillOpacity="0.5"/>
                    <rect x="30" y="50" width="40" height="3" fill="white" fillOpacity="0.5"/>
                  </svg>
                </div>
              </motion.div>
              
              <div className="shard-container">
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 60) * Math.PI / 180
                  const x = Math.cos(angle) * 150
                  const y = Math.sin(angle) * 150
                  
                  return (
                    <motion.div
                      key={i}
                      className="data-shard"
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{ 
                        x: x,
                        y: y,
                        scale: 1,
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        delay: i * 0.2,
                        repeat: Infinity
                      }}
                    >
                      <svg viewBox="0 0 40 40" width="40" height="40">
                        <rect x="5" y="5" width="30" height="30" rx="3" 
                          fill="rgba(59, 130, 246, 0.3)" 
                          stroke="rgba(59, 130, 246, 0.8)" 
                          strokeWidth="1"
                        />
                        <text x="20" y="25" textAnchor="middle" fontSize="12" fill="white">{i + 1}</text>
                      </svg>
                    </motion.div>
                  )
                })}
              </div>
              
              <motion.div className="whale-indicators">
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 60) * Math.PI / 180
                  const x = Math.cos(angle) * 200
                  const y = Math.sin(angle) * 200
                  
                  return (
                    <motion.div
                      key={i}
                      className="whale-node"
                      style={{ left: `${150 + x}px`, top: `${150 + y}px` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1, 1, 0] }}
                      transition={{ 
                        duration: 3,
                        delay: i * 0.2 + 1,
                        repeat: Infinity
                      }}
                    >
                      
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
            <motion.div className="upload-text">Distributing to Walrus Network...</motion.div>
          </motion.div>
        )

      case 'uploaded':
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="upload-complete"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "backOut" }}
            >
              💾 STORED ON WALRUS
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