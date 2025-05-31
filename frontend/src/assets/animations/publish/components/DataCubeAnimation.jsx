import { motion } from 'framer-motion'
import { getAppThemeColors } from '../../../../utils/svgThemeUtils'

const DataCubeAnimation = ({ colorMode = 'light' }) => {
  const themeColors = getAppThemeColors(colorMode)
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
            <rect x="25" y="45" width="50" height="35" rx="5" fill={themeColors.text} fillOpacity="0.9"/>
            <path d="M35 45 V35 Q35 25 50 25 Q65 25 65 35 V45" fill="none" stroke={themeColors.text} strokeWidth="4"/>
          </svg>
        </motion.div>
      </div>
      <motion.div className="encryption-text">Encrypting with AES-256...</motion.div>
    </motion.div>
  )
}

export default DataCubeAnimation