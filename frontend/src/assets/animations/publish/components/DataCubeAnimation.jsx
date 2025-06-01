import { motion } from 'framer-motion'
import { getAppThemeColors } from '../../../../utils/svgThemeUtils'

const DataCubeAnimation = ({ colorMode = 'light' }) => {
  const themeColors = getAppThemeColors(colorMode)
  const isLightMode = colorMode === 'light'
  
  // CSS-in-JS styles
  const styles = {
    animationScene: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '40px'
    },
    encryptionContainer: {
      position: 'relative',
      width: '300px',
      height: '300px',
      perspective: '1000px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    dataCube: {
      width: '200px',
      height: '200px',
      position: 'relative',
      transformStyle: 'preserve-3d'
    },
    cubeFace: {
      position: 'absolute',
      width: '200px',
      height: '200px',
      background: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${isLightMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      fontSize: '1.2rem',
      color: isLightMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(10px)'
    },
    cubeFaceFront: {
      transform: 'translateZ(100px)'
    },
    cubeFaceBack: {
      transform: 'rotateY(180deg) translateZ(100px)'
    },
    cubeFaceLeft: {
      transform: 'rotateY(-90deg) translateZ(100px)'
    },
    cubeFaceRight: {
      transform: 'rotateY(90deg) translateZ(100px)'
    },
    cubeFaceTop: {
      transform: 'rotateX(90deg) translateZ(100px)'
    },
    cubeFaceBottom: {
      transform: 'rotateX(-90deg) translateZ(100px)'
    },
    binaryStream: {
      animation: 'binaryFlash 2s linear infinite'
    },
    lockOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    encryptionText: {
      textAlign: 'center',
      color: isLightMode ? '#666' : '#888',
      fontSize: '1.1rem',
      letterSpacing: '1px'
    }
  }
  
  // Add keyframes for binary flash animation
  const binaryFlashKeyframes = `
    @keyframes binaryFlash {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  `
  
  return (
    <>
      <style>{binaryFlashKeyframes}</style>
      <motion.div style={styles.animationScene}>
        <div style={styles.encryptionContainer}>
          <motion.div 
            style={styles.dataCube}
            animate={{ 
              rotateX: [0, 360],
              rotateY: [0, 360]
            }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          >
            <div style={{...styles.cubeFace, ...styles.cubeFaceFront}}>
              <div style={styles.binaryStream}>01010110</div>
            </div>
            <div style={{...styles.cubeFace, ...styles.cubeFaceBack}}>
              <div style={styles.binaryStream}>11001010</div>
            </div>
            <div style={{...styles.cubeFace, ...styles.cubeFaceLeft}}>
              <div style={styles.binaryStream}>10110011</div>
            </div>
            <div style={{...styles.cubeFace, ...styles.cubeFaceRight}}>
              <div style={styles.binaryStream}>01101101</div>
            </div>
            <div style={{...styles.cubeFace, ...styles.cubeFaceTop}}>
              <div style={styles.binaryStream}>11010110</div>
            </div>
            <div style={{...styles.cubeFace, ...styles.cubeFaceBottom}}>
              <div style={styles.binaryStream}>10011001</div>
            </div>
          </motion.div>
          
          <motion.div 
            style={styles.lockOverlay}
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
        <motion.div style={styles.encryptionText}>Encrypting with AES-256...</motion.div>
      </motion.div>
    </>
  )
}

export default DataCubeAnimation