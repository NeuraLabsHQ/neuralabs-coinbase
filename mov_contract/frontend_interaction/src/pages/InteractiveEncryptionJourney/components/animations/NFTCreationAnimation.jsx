import { motion } from 'framer-motion'

const NFTCreationAnimation = () => {
  return (
    <motion.div className="animation-scene">
      <div className="nft-creation-container">
        {/* Digital forge */}
        <motion.div 
          className="digital-forge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, ease: "backOut" }}
        >
          <svg viewBox="0 0 120 120" width="120" height="120">
            {/* Forge base */}
            <motion.rect 
              x="20" y="80" width="80" height="30" rx="5"
              fill="rgba(139, 69, 19, 0.8)" 
              stroke="#8b4513" 
              strokeWidth="2"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3 }}
            />
            
            {/* Flame particles */}
            {[...Array(6)].map((_, i) => (
              <motion.circle
                key={i}
                cx={40 + i * 8}
                cy={75}
                r="3"
                fill={i % 2 === 0 ? "#ff6b35" : "#f7931e"}
                initial={{ y: 0, opacity: 0 }}
                animate={{ 
                  y: [-10, -30, -10],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 0.5 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </svg>
        </motion.div>

        {/* Materializing NFT */}
        <motion.div 
          className="materializing-nft"
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1.5, ease: "backOut" }}
        >
          <motion.svg viewBox="0 0 100 100" width="100" height="100">
            {/* NFT frame */}
            <motion.path
              d="M20 15 L80 15 L85 25 L85 75 L80 85 L20 85 L15 75 L15 25 Z"
              fill="linear-gradient(135deg, #667eea, #764ba2)"
              stroke="white"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            />
            
            {/* Unique pattern inside */}
            <motion.circle 
              cx="50" cy="50" r="20"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
            />
            
            <motion.path
              d="M35 35 L65 65 M65 35 L35 65"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.3, duration: 0.5 }}
            />
            
            {/* ID number */}
            <motion.text
              x="50" y="95"
              textAnchor="middle"
              fontSize="8"
              fill="white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8 }}
            >
              #001247
            </motion.text>
          </motion.svg>
        </motion.div>

        {/* Minting particles */}
        <motion.div className="minting-particles">
          {[...Array(15)].map((_, i) => {
            const angle = (i * 24) * Math.PI / 180
            const radius = 80
            return (
              <motion.div
                key={i}
                className="mint-particle"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 0
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius,
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: 1.5 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              >
                <div className="particle-sparkle">✨</div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Blockchain confirmation */}
        <motion.div 
          className="blockchain-confirmation"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 3, duration: 0.8 }}
        >
          <motion.div className="block-chain">
            {[1, 2, 3].map((block) => (
              <motion.div
                key={block}
                className="block"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: 3 + block * 0.2,
                  type: "spring",
                  stiffness: 200
                }}
              >
                <div className="block-content">
                  <div className="block-hash">0x{block}a4f</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Success glow */}
        <motion.div 
          className="success-glow"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 1],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            delay: 4,
            duration: 1.5,
            ease: "easeOut"
          }}
        />
      </div>
      
      <motion.div 
        className="creation-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.2 }}
      >
        <span className="main-text">NFT Creation</span>
        <span className="sub-text">Minting unique identifier</span>
      </motion.div>
    </motion.div>
  )
}

export default NFTCreationAnimation