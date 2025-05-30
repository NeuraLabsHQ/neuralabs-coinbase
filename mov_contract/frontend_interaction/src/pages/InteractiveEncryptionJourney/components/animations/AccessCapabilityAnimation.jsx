import React from 'react'
import { motion } from 'framer-motion'

const AccessCapabilityAnimation = () => {
  return (
    <motion.div className="animation-scene">
      <div className="access-capability-container">
        {/* Central key forge */}
        <motion.div 
          className="key-forge"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: "backOut" }}
        >
          <svg viewBox="0 0 120 60" width="120" height="60">
            {/* Key shaft */}
            <motion.rect 
              x="10" y="25" width="70" height="10" rx="5"
              fill="linear-gradient(90deg, #c0392b, #e74c3c)"
              stroke="#a93226" 
              strokeWidth="2"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
            
            {/* Key head */}
            <motion.circle 
              cx="25" cy="30" r="15"
              fill="linear-gradient(135deg, #c0392b, #e74c3c)"
              stroke="#a93226" 
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
            
            {/* Key teeth */}
            <motion.path
              d="M80 25 L85 25 L85 20 L90 20 L90 35 L85 35 L85 30 L80 30"
              fill="#c0392b"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            />
            
            {/* Key hole in center */}
            <circle cx="25" cy="30" r="5" fill="#a93226"/>
          </svg>
        </motion.div>

        {/* Permission matrix */}
        <motion.div className="permission-matrix">
          {[...Array(9)].map((_, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            return (
              <motion.div
                key={i}
                className="permission-node"
                style={{
                  position: 'absolute',
                  left: `${30 + col * 40}%`,
                  top: `${40 + row * 25}%`,
                }}
                initial={{ 
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  scale: 1,
                  opacity: 1
                }}
                transition={{ 
                  delay: 1.5 + i * 0.1,
                  duration: 0.5,
                  ease: "backOut"
                }}
              >
                <motion.div 
                  className="node-core"
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(52, 152, 219, 0.3)',
                      '0 0 20px rgba(52, 152, 219, 0.6)',
                      '0 0 10px rgba(52, 152, 219, 0.3)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {i === 4 ? '🔑' : '🔒'}
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Connection lines */}
        <motion.div className="connection-lines">
          <svg viewBox="0 0 400 300" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Horizontal lines */}
            {[0, 1, 2].map((row) => (
              <motion.line
                key={`h-${row}`}
                x1="120" y1={120 + row * 75}
                x2="280" y2={120 + row * 75}
                stroke="rgba(52, 152, 219, 0.4)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 2.5 + row * 0.2, duration: 0.8 }}
              />
            ))}
            
            {/* Vertical lines */}
            {[0, 1, 2].map((col) => (
              <motion.line
                key={`v-${col}`}
                x1={120 + col * 80} y1="120"
                x2={120 + col * 80} y2="270"
                stroke="rgba(52, 152, 219, 0.4)"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 3 + col * 0.2, duration: 0.8 }}
              />
            ))}
          </svg>
        </motion.div>

        {/* Access levels */}
        <motion.div 
          className="access-levels"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.8 }}
        >
          {['READ', 'WRITE', 'ADMIN'].map((level, index) => (
            <motion.div
              key={level}
              className="access-level"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 3.7 + index * 0.2,
                type: "spring",
                stiffness: 200
              }}
            >
              <div className={`level-indicator level-${index + 1}`}>
                {index + 1}
              </div>
              <span>{level}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* System initialization */}
        <motion.div 
          className="system-init"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 4.5, duration: 0.6 }}
        >
          <motion.div 
            className="init-circle"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 60 60" width="60" height="60">
              <circle 
                cx="30" cy="30" r="25" 
                fill="none" 
                stroke="rgba(46, 204, 113, 0.3)" 
                strokeWidth="2"
              />
              <motion.circle 
                cx="30" cy="30" r="25" 
                fill="none" 
                stroke="#2ecc71" 
                strokeWidth="3"
                strokeDasharray="157"
                strokeDashoffset="157"
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <text x="30" y="35" textAnchor="middle" fontSize="12" fill="#2ecc71">
                CAP
              </text>
            </svg>
          </motion.div>
        </motion.div>

        {/* Security particles */}
        <motion.div className="security-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="security-particle"
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
                y: [-20, -40, -60]
              }}
              transition={{ 
                duration: 3,
                delay: 2 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeOut"
              }}
            >
              🔐
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      <motion.div 
        className="capability-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 5 }}
      >
        <span className="main-text">Access Capability</span>
        <span className="sub-text">Creating permission system</span>
      </motion.div>
    </motion.div>
  )
}

export default AccessCapabilityAnimation