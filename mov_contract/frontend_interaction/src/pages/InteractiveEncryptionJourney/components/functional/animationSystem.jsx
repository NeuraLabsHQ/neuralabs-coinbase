/**
 * Animation System Hook
 * Manages step icons and animation phases
 */
import React from 'react'
import { motion } from 'framer-motion'

// Import animation components
import WalletConnectedAnimation from '../animations/WalletConnectedAnimation'
import NFTScanAnimation from '../animations/NFTScanAnimation'
import NFTCreationAnimation from '../animations/NFTCreationAnimation'
import AccessVerificationAnimation from '../animations/AccessVerificationAnimation'
import DataCubeAnimation from '../animations/DataCubeAnimation'
import GrantAccessAnimation from '../animations/GrantAccessAnimation'

// Import SVG icons
import WalletIcon from '../animations/WalletIcon.svg'
import NFTIcon from '../animations/NFTIcon.svg'
import SignatureIcon from '../animations/SignatureIcon.svg'
import FileIcon from '../animations/FileIcon.svg'
import EncryptIcon from '../animations/EncryptIcon.svg'
import SealIcon from '../animations/SealIcon.svg'
import WalrusIcon from '../animations/WalrusIcon.svg'
import NetworkIdleAnimation from '../animations/NetworkIdleAnimation.svg'
import VerificationBadge from '../animations/VerificationBadge.svg'
import CentralSecret from '../animations/CentralSecret.svg'
import SecretShare from '../animations/SecretShare.svg'
import WalrusUploadAnimation from '../animations/WalrusUploadAnimation.svg'
import EllipticCurveAnimation from '../animations/EllipticCurveAnimation.svg'

// Helper component for simple badge animations
const AnimationBadge = ({ children, className = "" }) => (
  <motion.div className="animation-scene">
    <motion.div 
      className={`animation-badge ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "backOut" }}
    >
      {children}
    </motion.div>
  </motion.div>
)

export const useAnimationSystem = () => { 
  const renderStepIcon = (iconType, isActive, isCompleted) => {
    const baseClass = `step-icon-svg ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`
    
    switch(iconType) {
      case 'wallet':
        return (
          <motion.div
            className={baseClass}
            initial={{ opacity: 0.3 }}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
              scale: isActive ? 1.1 : 1
            }}
            transition={{ duration: 0.8 }}
          >
            <img src={WalletIcon} alt="Wallet Icon" width="100" height="100" />
          </motion.div>
        )
      
      case 'nft':
        return (
          <motion.div
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
              rotate: isActive ? [0, 5, -5, 0] : 0
            }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            <img src={NFTIcon} alt="NFT Icon" width="100" height="100" />
          </motion.div>
        )
      
      case 'signature':
        return (
          <motion.div
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
            }}
            transition={{ duration: 0.8 }}
          >
            <img src={SignatureIcon} alt="Signature Icon" width="100" height="100" />
          </motion.div>
        )
      
      case 'file':
        return (
          <motion.div
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
            }}
            transition={{ duration: 0.8 }}
          >
            <img src={FileIcon} alt="File Icon" width="100" height="100" />
          </motion.div>
        )
      
      case 'encrypt':
        return (
          <motion.div
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
            }}
            transition={{ duration: 0.8 }}
          >
            <img src={EncryptIcon} alt="Encrypt Icon" width="100" height="100" />
          </motion.div>
        )
      
      case 'seal':
        return (
          <motion.div
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
            }}
            transition={{ duration: 0.8 }}
          >
            <img src={SealIcon} alt="Seal Icon" width="100" height="100" />
          </motion.div>
        )
      
      case 'walrus':
        return (
          <motion.div
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
            }}
            transition={{ duration: 0.8 }}
          >
            <img src={WalrusIcon} alt="Walrus Icon" width="100" height="100" />
          </motion.div>
        )
      
      default:
        return null
    }
  }

  const renderAnimation = (animationPhase) => {
    switch(animationPhase) {
      case 'nft-scanning':
        return <NFTScanAnimation />

      case 'nft-verified':
        return <AccessVerificationAnimation />

      case 'seal-init':
        return <GrantAccessAnimation />

      case 'signing':
        return (
          <motion.div className="animation-scene">
            <div className="elliptic-curve-container">
              <img src={EllipticCurveAnimation} alt="Elliptic Curve Animation" width="300" height="300" />
              <motion.div className="curve-labels">
                <span className="curve-equation">y² = x³ + ax + b (mod p)</span>
                <span className="signature-text">ECDSA Signature Generation</span>
              </motion.div>
            </div>
          </motion.div>
        )

      case 'signed':
        return <AnimationBadge className="signature-complete">✍️ SIGNED</AnimationBadge>

      case 'file-selected':
        return <AnimationBadge className="file-icon">📄</AnimationBadge>

      case 'encrypting':
        return <DataCubeAnimation />

      case 'encrypted':
        return <AnimationBadge className="encrypted-badge">🔒 ENCRYPTED</AnimationBadge>

      case 'uploading':
        return (
          <motion.div className="animation-scene">
            <div className="walrus-upload">
              <img src={WalrusUploadAnimation} alt="Walrus Upload Animation" width="400" height="400" />
            </div>
            <motion.div className="upload-text">Distributing to Walrus Network...</motion.div>
          </motion.div>
        )

      case 'uploaded':
        return <AnimationBadge className="upload-complete">💾 STORED ON WALRUS</AnimationBadge>

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
                <img src={NetworkIdleAnimation} alt="Network Idle Animation" width="400" height="400" />
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