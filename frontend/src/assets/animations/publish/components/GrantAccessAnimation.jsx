import { motion } from 'framer-motion'

const GrantAccessAnimation = () => {
  return (
    <motion.div className="animation-scene">
      <div className="grant-access-container">
        {/* Owner entity */}
        <motion.div 
          className="owner-entity"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="owner-avatar"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(251, 191, 36, 0.3)',
                '0 0 40px rgba(251, 191, 36, 0.6)',
                '0 0 20px rgba(251, 191, 36, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            👑
          </motion.div>
          <span className="entity-label">Owner</span>
        </motion.div>

        {/* Permission key transfer */}
        <motion.div className="permission-transfer">
          {/* Key */}
          <motion.div 
            className="transferring-key"
            initial={{ x: -50, rotate: 0 }}
            animate={{ 
              x: 150,
              rotate: [0, 360, 720],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2.5,
              delay: 1,
              ease: "easeInOut"
            }}
          >
            <svg viewBox="0 0 40 20" width="40" height="20">
              <rect x="5" y="8" width="25" height="4" rx="2" fill="#e74c3c"/>
              <circle cx="10" cy="10" r="6" fill="#c0392b" stroke="#a93226" strokeWidth="1"/>
              <circle cx="10" cy="10" r="2" fill="#a93226"/>
              <path d="M30 8 L32 8 L32 6 L35 6 L35 14 L32 14 L32 12 L30 12" fill="#c0392b"/>
            </svg>
          </motion.div>

          {/* Transfer beam */}
          <motion.div 
            className="transfer-beam"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 1, 0] }}
            transition={{ 
              duration: 2,
              delay: 1.2,
              ease: "easeInOut"
            }}
          />

          {/* Permission particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="permission-particle"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ 
                x: 150 + (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 30,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5,
                delay: 1.5 + i * 0.1,
                ease: "easeOut"
              }}
            >
              ⭐
            </motion.div>
          ))}
        </motion.div>

        {/* Grantee entity */}
        <motion.div 
          className="grantee-entity"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.div 
            className="grantee-avatar"
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 10px rgba(52, 152, 219, 0.3)',
                '0 0 30px rgba(52, 152, 219, 0.7)',
                '0 0 10px rgba(52, 152, 219, 0.3)'
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 3
            }}
          >
            👤
          </motion.div>
          <span className="entity-label">Grantee</span>
        </motion.div>

        {/* Permission levels visualization */}
        <motion.div 
          className="permission-levels"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          {[
            { level: 'READ', color: '#27ae60', delay: 2.5 },
            { level: 'write', color: '#f39c12', delay: 2.7 },
            { level: 'admin', color: '#e74c3c', delay: 2.9 }
          ].map((perm, index) => (
            <motion.div
              key={perm.level}
              className="permission-level"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: perm.delay,
                type: "spring",
                stiffness: 200
              }}
            >
              <motion.div 
                className="level-badge"
                style={{ backgroundColor: perm.color }}
                animate={{ 
                  boxShadow: [
                    `0 0 10px ${perm.color}30`,
                    `0 0 20px ${perm.color}60`,
                    `0 0 10px ${perm.color}30`
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: perm.delay + 0.5
                }}
              >
                {perm.level.toUpperCase()}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Ownership chain */}
        <motion.div 
          className="ownership-chain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          <svg viewBox="0 0 300 100" width="100%" height="100">
            {/* Chain links */}
            {[0, 1, 2, 3].map((link) => (
              <motion.g key={link}>
                <motion.ellipse
                  cx={50 + link * 60}
                  cy="50"
                  rx="20"
                  ry="12"
                  fill="none"
                  stroke="#95a5a6"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ 
                    delay: 3.5 + link * 0.2,
                    duration: 0.5
                  }}
                />
                <motion.ellipse
                  cx={50 + link * 60}
                  cy="50"
                  rx="12"
                  ry="20"
                  fill="none"
                  stroke="#95a5a6"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ 
                    delay: 3.7 + link * 0.2,
                    duration: 0.5
                  }}
                />
              </motion.g>
            ))}
          </svg>
        </motion.div>

        {/* Success confirmation */}
        <motion.div 
          className="grant-success"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 4.5, duration: 0.6, ease: "backOut" }}
        >
          <motion.div 
            className="success-ring"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: 360
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg viewBox="0 0 60 60" width="60" height="60">
              <circle 
                cx="30" cy="30" r="25" 
                fill="rgba(46, 204, 113, 0.2)" 
                stroke="#2ecc71" 
                strokeWidth="3"
              />
              <motion.path
                d="M18 30 L26 38 L42 22"
                fill="none"
                stroke="#2ecc71"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 4.7, duration: 0.5 }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Access granted particles */}
        <motion.div className="granted-particles">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * Math.PI / 180
            return (
              <motion.div
                key={i}
                className="granted-particle"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: Math.cos(angle) * 100,
                  y: Math.sin(angle) * 100
                }}
                transition={{ 
                  duration: 2,
                  delay: 5 + i * 0.1,
                  ease: "easeOut"
                }}
              >
                🎉
              </motion.div>
            )
          })}
        </motion.div>
      </div>
      
      <motion.div 
        className="grant-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 5.5 }}
      >
        <span className="main-text">Grant Access</span>
        <span className="sub-text">Setting ownership permissions</span>
      </motion.div>
    </motion.div>
  )
}

export default GrantAccessAnimation