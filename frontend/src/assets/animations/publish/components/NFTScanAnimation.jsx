import { motion } from 'framer-motion'
import { getAppThemeColors } from '../../../../utils/svgThemeUtils'

const NFTScanAnimation = ({ colorMode = 'light' }) => {
  const themeColors = getAppThemeColors(colorMode)
  return (
    <motion.div className="animation-scene">
      <div className="nft-scan-container">
        <motion.div 
          className="scan-card"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
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
}

export default NFTScanAnimation