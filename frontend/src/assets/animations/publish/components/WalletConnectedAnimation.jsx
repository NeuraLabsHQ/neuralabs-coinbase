import { motion } from 'framer-motion'
import { getAppThemeColors } from '../../../../utils/svgThemeUtils'

const WalletConnectedAnimation = ({ colorMode = 'light' }) => {
  const themeColors = getAppThemeColors(colorMode)
  return (
    <motion.div className="animation-scene">
      <div className="wallet-connection-container">
        {/* Main wallet */}
        <motion.div 
          className="main-wallet"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
        >
          <svg viewBox="0 0 120 80" width="120" height="80">
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
        <motion.div className="connection-waves">
          {[1, 2, 3].map((wave) => (
            <motion.div
              key={wave}
              className="wave-ring"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ 
                scale: [0, 2.5, 3],
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
        <motion.div className="security-particles">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * Math.PI / 180
            const radius = 80
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
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius,
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
                <div className="particle-dot" />
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
        >
          <svg viewBox="0 0 60 60" width="60" height="60">
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
      >
        <span className="main-text">Wallet Connected</span>
      </motion.div>
    </motion.div>
  )
}

export default WalletConnectedAnimation