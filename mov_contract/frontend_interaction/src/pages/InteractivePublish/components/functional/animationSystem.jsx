/**
 * Animation System Hook for Interactive Publish
 * Manages step icons and animation phases using external components
 */
import React from 'react'
import { motion } from 'framer-motion'

// Import animation components from Interactive Encryption Journey
import WalletConnectedAnimation from '../../../InteractiveEncryptionJourney/components/animations/WalletConnectedAnimation'
import NFTCreationAnimation from '../../../InteractiveEncryptionJourney/components/animations/NFTCreationAnimation'
import NFTScanAnimation from '../../../InteractiveEncryptionJourney/components/animations/NFTScanAnimation'
import AccessCapabilityAnimation from '../../../InteractiveEncryptionJourney/components/animations/AccessCapabilityAnimation'
import GrantAccessAnimation from '../../../InteractiveEncryptionJourney/components/animations/GrantAccessAnimation'
import AccessVerificationAnimation from '../../../InteractiveEncryptionJourney/components/animations/AccessVerificationAnimation'
import DataCubeAnimation from '../../../InteractiveEncryptionJourney/components/animations/DataCubeAnimation'

// Import custom animations for this journey
// import BalanceCheckAnimation from '../animations/BalanceCheckAnimation'
import BalanceCheckAnimation from '../../../InteractiveEncryptionJourney/components/animations/BalanceCheckAnimation.svg'
// import FileSelectionAnimation from '../animations/FileSelectionAnimation'

// Import SVG icons
import WalletIcon from '../../../InteractiveEncryptionJourney/components/animations/WalletIcon.svg'
import BalanceIcon from '../../../InteractiveEncryptionJourney/components/animations/BalanceIcon.svg'
import NFTIcon from '../../../InteractiveEncryptionJourney/components/animations/NFTIcon.svg'
import KeyIcon from '../../../InteractiveEncryptionJourney/components/animations/KeyIcon.svg'
import ShieldIcon from '../../../InteractiveEncryptionJourney/components/animations/ShieldIcon.svg'
import CheckIcon from '../../../InteractiveEncryptionJourney/components/animations/CheckIcon.svg'
import SealIcon from '../../../InteractiveEncryptionJourney/components/animations/SealIcon.svg'
import SignatureIcon from '../../../InteractiveEncryptionJourney/components/animations/SignatureIcon.svg'
import FileIcon from '../../../InteractiveEncryptionJourney/components/animations/FileIcon.svg'
import EncryptIcon from '../../../InteractiveEncryptionJourney/components/animations/EncryptIcon.svg'
import WalrusIcon from '../../../InteractiveEncryptionJourney/components/animations/WalrusIcon.svg'

// Import specific animations
import EllipticCurveAnimation from '../../../InteractiveEncryptionJourney/components/animations/EllipticCurveAnimation.svg'
import WalrusUploadAnimation from '../../../InteractiveEncryptionJourney/components/animations/WalrusUploadAnimation.svg'
import NetworkIdleAnimation from '../../../InteractiveEncryptionJourney/components/animations/NetworkIdleAnimation.svg'

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
    
    const iconMap = {
      'wallet': WalletIcon,
      'balance': BalanceIcon,
      'nft': NFTIcon,
      'key': KeyIcon,
      'shield': ShieldIcon,
      'check': CheckIcon,
      'seal': SealIcon,
      'signature': SignatureIcon,
      'file': FileIcon,
      'encrypt': EncryptIcon,
      'walrus': WalrusIcon
    }
    
    const IconSrc = iconMap[iconType]
    
    if (!IconSrc) return null
    
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
        <img src={IconSrc} alt={`${iconType} Icon`} width="100" height="100" />
      </motion.div>
    )
  }

  const renderAnimation = (animationPhase) => {
    switch(animationPhase) {
      case 'wallet-connecting':
        return <WalletConnectedAnimation />

      case 'balance-checking':
        // return <BalanceCheckAnimation />
        return (
          <motion.div className="animation-scene">
            <div className="seal-init-container">
              <img src={BalanceCheckAnimation} alt="Balance Check" width="200" height="200" />
              <motion.div 
                className="seal-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="main-text">Verifying Token Balances</span>
                <span className="sub-text">SUI & WAL Holdings Check</span>
              </motion.div>
            </div>
          </motion.div>
        )

        

      case 'nft-creating':
        return <NFTScanAnimation />

      case 'access-cap-creating':
        return <AccessCapabilityAnimation />

      case 'grant-access':
        return <GrantAccessAnimation />

      case 'access-verifying':
        return <AccessVerificationAnimation />

      case 'seal-initializing':
        return (
          <motion.div className="animation-scene">
            <div className="seal-init-container">
              <img src={SealIcon} alt="Seal Protocol" width="200" height="200" />
              <motion.div 
                className="seal-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="main-text">Initializing Seal Protocol</span>
                <span className="sub-text">3-of-5 Threshold Encryption</span>
              </motion.div>
            </div>
          </motion.div>
        )

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

      case 'file-selecting':
          return (
          <motion.div className="animation-scene">
            <div className="seal-init-container">
              <img src={FileIcon} alt="Select Filek" width="200" height="200" />
              <motion.div 
                className="seal-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="main-text">Select File</span>
              </motion.div>
            </div>
          </motion.div>
        )


      case 'encrypting':
        return <DataCubeAnimation />

      case 'uploading':
        return (
          <motion.div className="animation-scene">
            <div className="walrus-upload">
              <img src={WalrusUploadAnimation} alt="Walrus Upload Animation" width="400" height="400" />
            </div>
            <motion.div className="upload-text">Publishing to Walrus Network...</motion.div>
          </motion.div>
        )

      case 'processing':
        return (
          <motion.div className="animation-scene">
            <div className="processing-container">
              <motion.div 
                className="processing-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <motion.circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4"
                  />
                  <motion.circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke="white" strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 0.7, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </svg>
              </motion.div>
              <motion.div className="processing-text">Processing...</motion.div>
            </div>
          </motion.div>
        )

      case 'completed':
        return <AnimationBadge className="success-badge">✅ COMPLETED</AnimationBadge>

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