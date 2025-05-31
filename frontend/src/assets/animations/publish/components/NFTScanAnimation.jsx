import { motion } from 'framer-motion'
import { getAppThemeColors } from '../../../../utils/svgThemeUtils'

const NFTScanAnimation = ({ colorMode = 'light' }) => {
  const themeColors = getAppThemeColors(colorMode)
  
  // Inline styles for the NFT scanning animation
  const styles = {
    animationScene: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: '200px',
      position: 'relative'
    },
    nftScanContainer: {
      position: 'relative',
      width: '200px',
      height: '250px',
      perspective: '1000px'
    },
    scanCard: {
      width: '100%',
      height: '100%',
      position: 'relative',
      transformStyle: 'preserve-3d'
    },
    cardFront: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      background: colorMode === 'dark' 
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
        : 'linear-gradient(135deg, rgba(81, 144, 255, 0.2), rgba(81, 144, 255, 0.1))',
      border: colorMode === 'dark' 
        ? '2px solid rgba(255, 255, 255, 0.3)'
        : '2px solid rgba(81, 144, 255, 0.4)',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem',
      fontWeight: 'bold',
      color: colorMode === 'dark' ? '#fff' : '#3182CE',
      boxShadow: colorMode === 'dark' 
        ? '0 8px 32px rgba(255, 255, 255, 0.1)'
        : '0 8px 32px rgba(81, 144, 255, 0.2)'
    },
    cardBack: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      background: colorMode === 'dark' 
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
        : 'linear-gradient(135deg, rgba(81, 144, 255, 0.2), rgba(81, 144, 255, 0.1))',
      border: colorMode === 'dark' 
        ? '2px solid rgba(255, 255, 255, 0.3)'
        : '2px solid rgba(81, 144, 255, 0.4)',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem',
      fontWeight: 'bold',
      color: colorMode === 'dark' ? '#fff' : '#3182CE',
      transform: 'rotateY(180deg)',
      overflow: 'hidden',
      boxShadow: colorMode === 'dark' 
        ? '0 8px 32px rgba(255, 255, 255, 0.1)'
        : '0 8px 32px rgba(81, 144, 255, 0.2)'
    },
    scanLine: {
      position: 'absolute',
      width: '100%',
      height: '3px',
      background: colorMode === 'dark'
        ? 'linear-gradient(90deg, transparent, #fff, transparent)'
        : 'linear-gradient(90deg, transparent, #3182CE, transparent)',
      boxShadow: colorMode === 'dark'
        ? '0 0 20px rgba(255, 255, 255, 0.8)'
        : '0 0 20px rgba(49, 130, 206, 0.8)'
    },
    scanParticles: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    },
    particle: {
      position: 'absolute',
      width: '4px',
      height: '4px',
      background: colorMode === 'dark' ? '#fff' : '#3182CE',
      borderRadius: '50%',
      top: '50%',
      left: '50%',
      boxShadow: colorMode === 'dark'
        ? '0 0 8px rgba(255, 255, 255, 0.6)'
        : '0 0 8px rgba(49, 130, 206, 0.6)'
    }
  }

  return (
    <motion.div style={styles.animationScene}>
      <div style={styles.nftScanContainer}>
        <motion.div 
          style={styles.scanCard}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        >
          <div style={styles.cardFront}>NFT</div>
          <div style={styles.cardBack}>
            <motion.div 
              style={styles.scanLine}
              initial={{ top: 0 }}
              animate={{ top: '100%' }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>
        <motion.div style={styles.scanParticles}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              style={styles.particle}
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
}

export default NFTScanAnimation