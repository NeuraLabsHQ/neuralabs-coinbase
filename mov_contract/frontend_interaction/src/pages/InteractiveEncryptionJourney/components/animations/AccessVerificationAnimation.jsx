import { motion } from 'framer-motion'

const AccessVerificationAnimation = () => {
  return (
    <motion.div className="animation-scene">
      <div className="access-verification-container">
        {/* Scanner beam */}
        <motion.div 
          className="verification-scanner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="scanner-beam"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1, 1, 0] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div 
            className="scanner-line"
            animate={{ 
              y: [-50, 50, -50]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Identity card/token */}
        <motion.div 
          className="identity-card"
          initial={{ x: -100, rotate: -10 }}
          animate={{ x: 0, rotate: 0 }}
          transition={{ duration: 1, ease: "backOut" }}
        >
          <motion.div 
            className="card-content"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(52, 152, 219, 0.3)',
                '0 0 40px rgba(52, 152, 219, 0.6)',
                '0 0 20px rgba(52, 152, 219, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="card-header">
              <span className="card-title">ACCESS TOKEN</span>
              <span className="card-id">#A47F9</span>
            </div>
            
            <div className="card-body">
              <motion.div 
                className="permission-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {[
                  { name: 'READ', status: 'granted', delay: 1.8 },
                  { name: 'WRITE', status: 'granted', delay: 2.0 },
                  { name: 'DELETE', status: 'denied', delay: 2.2 },
                  { name: 'ADMIN', status: 'denied', delay: 2.4 }
                ].map((perm) => (
                  <motion.div
                    key={perm.name}
                    className={`permission-item ${perm.status}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: perm.delay,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <span className="perm-name">{perm.name}</span>
                    <motion.div 
                      className={`perm-status ${perm.status}`}
                      animate={perm.status === 'granted' ? {
                        backgroundColor: ['#27ae60', '#2ecc71', '#27ae60']
                      } : {
                        backgroundColor: ['#c0392b', '#e74c3c', '#c0392b']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {perm.status === 'granted' ? '✓' : '✗'}
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Verification process */}
        <motion.div 
          className="verification-process"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          {[
            { step: 'Scanning Token...', delay: 2.5, duration: 1 },
            { step: 'Checking Permissions...', delay: 3.5, duration: 1.5 },
            { step: 'Validating Access...', delay: 4.5, duration: 1 },
            { step: 'Access Confirmed', delay: 5.5, duration: 0 }
          ].map((step, index) => (
            <motion.div
              key={index}
              className="verification-step"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: step.delay }}
            >
              <motion.div 
                className="step-indicator"
                animate={{ 
                  rotate: step.duration > 0 ? 360 : 0,
                  scale: step.duration === 0 ? [1, 1.2, 1] : 1
                }}
                transition={{ 
                  duration: step.duration > 0 ? 1 : 0.5,
                  repeat: step.duration > 0 ? Infinity : 0,
                  ease: "linear"
                }}
              >
                {step.duration === 0 ? '✓' : '⟳'}
              </motion.div>
              <span className="step-text">{step.step}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Biometric scanner effect */}
        <motion.div 
          className="biometric-scanner"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 3, duration: 0.8 }}
        >
          <motion.div 
            className="scan-circle"
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
            <svg viewBox="0 0 80 80" width="80" height="80">
              {/* Outer ring */}
              <circle 
                cx="40" cy="40" r="35" 
                fill="none" 
                stroke="rgba(52, 152, 219, 0.3)" 
                strokeWidth="2"
              />
              
              {/* Scanning arcs */}
              {[0, 90, 180, 270].map((rotation, i) => (
                <motion.path
                  key={i}
                  d="M 40 5 A 35 35 0 0 1 65 20"
                  fill="none"
                  stroke="#3498db"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${rotation} 40 40)`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 0] }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
              
              {/* Center dot */}
              <motion.circle 
                cx="40" cy="40" r="8" 
                fill="#3498db"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity
                }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Verification result */}
        <motion.div 
          className="verification-result"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 6, duration: 0.8, ease: "backOut" }}
        >
          <motion.div 
            className="result-badge verified"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(46, 204, 113, 0.3)',
                '0 0 40px rgba(46, 204, 113, 0.6)',
                '0 0 20px rgba(46, 204, 113, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div 
              className="badge-icon"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, ease: "linear" }}
            >
              🛡️
            </motion.div>
            <span className="badge-text">VERIFIED</span>
          </motion.div>
        </motion.div>

        {/* Success particles */}
        <motion.div className="success-particles">
          {[...Array(16)].map((_, i) => {
            const angle = (i * 22.5) * Math.PI / 180
            const radius = 100
            return (
              <motion.div
                key={i}
                className="success-particle"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius
                }}
                transition={{ 
                  duration: 2,
                  delay: 6.5 + i * 0.05,
                  ease: "easeOut"
                }}
              >
                ✨
              </motion.div>
            )
          })}
        </motion.div>
      </div>
      
      <motion.div 
        className="verification-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 7 }}
      >
        <span className="main-text">Access Verification</span>
        <span className="sub-text">Confirming permissions</span>
      </motion.div>
    </motion.div>
  )
}

export default AccessVerificationAnimation