/**
 * Animation System Hook for Interactive Publish
 * Manages step icons and animation phases using external components
 */
import React from 'react'
import { motion } from 'framer-motion'
import { useColorMode } from '@chakra-ui/react'
import { getSVGThemeStyles } from '../../../../../utils/svgThemeUtils'

// Import animation components from the copied location
import WalletConnectedAnimation from '../../../../../assets/animations/publish/components/WalletConnectedAnimation'
import NFTCreationAnimation from '../../../../../assets/animations/publish/components/NFTCreationAnimation'
import NFTScanAnimation from '../../../../../assets/animations/publish/components/NFTScanAnimation'
import AccessCapabilityAnimation from '../../../../../assets/animations/publish/components/AccessCapabilityAnimation'
import GrantAccessAnimation from '../../../../../assets/animations/publish/components/GrantAccessAnimation'
import AccessVerificationAnimation from '../../../../../assets/animations/publish/components/AccessVerificationAnimation'
import DataCubeAnimation from '../../../../../assets/animations/publish/components/DataCubeAnimation'

import WorkflowGenerationAnimation from '../../../../../assets/animations/publish/components/WorkflowGenerationAnimation'


// Import SVG animations from assets
import BalanceCheckAnimation from '../../../../../assets/animations/publish/BalanceCheckAnimation.svg'

// Import SVG icons
import WalletIcon from '../../../../../assets/animations/publish/WalletIcon.svg'
import BalanceIcon from '../../../../../assets/animations/publish/BalanceIcon.svg'
import NFTIcon from '../../../../../assets/animations/publish/NFTIcon.svg'
import KeyIcon from '../../../../../assets/animations/publish/KeyIcon.svg'
import ShieldIcon from '../../../../../assets/animations/publish/ShieldIcon.svg'
import CheckIcon from '../../../../../assets/animations/publish/CheckIcon.svg'
import SealIcon from '../../../../../assets/animations/publish/SealIcon.svg'
import SignatureIcon from '../../../../../assets/animations/publish/SignatureIcon.svg'
import FileIcon from '../../../../../assets/animations/publish/FileIcon.svg'
import EncryptIcon from '../../../../../assets/animations/publish/EncryptIcon.svg'
import WalrusIcon from '../../../../../assets/animations/publish/WalrusIcon.svg'

// Import specific animations
import EllipticCurveAnimation from '../../../../../assets/animations/publish/EllipticCurveAnimation.svg'
import EllipticCurveAnimation2 from '../../../../../assets/animations/publish/EllepticCurveAnimation2.svg'

import WalrusUploadAnimation from '../../../../../assets/animations/publish/WalrusUploadAnimation.svg'
import NetworkIdleAnimation from '../../../../../assets/animations/publish/NetworkIdleAnimation.svg'
import SecretShare from '../../../../../assets/animations/publish/SecretShare.svg'

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
  const { colorMode } = useColorMode()
  const svgStyles = getSVGThemeStyles(colorMode)
  
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
    
    if (!IconSrc) {
      console.warn('No icon found for iconType:', iconType)
      return null
    }
    
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
        <img 
          src={IconSrc} 
          alt={`${iconType} Icon`} 
          style={svgStyles}
        />
      </motion.div>
    )
  }

  const renderAnimation = (animationPhase, currentStep = null) => {
    // Map step indices to their default animations
    const getDefaultStepAnimation = (stepIndex) => {
      const stepAnimations = {
        0: 'wallet-connecting',    // wallet step
        1: 'balance-checking',     // balances step  
        2: 'nft-creating',         // mint step
        3: 'access-cap-creating',  // accessCap step
        4: 'grant-access',         // grant step
        5: 'access-verifying',     // verify step
        6: 'seal-initializing',    // seal step
        7: 'signing',              // signature step
        8: 'file-selecting',       // file step
        9: 'encrypting',           // encrypt step
        10: 'uploading'            // walrus step
      }
      return stepAnimations[stepIndex] || 'wallet-connecting'
    }

    switch(animationPhase) {
      case 'wallet-connecting':
        return <WalletConnectedAnimation colorMode={colorMode} />

      case 'balance-checking':
        return (
          <motion.div className="animation-scene">
            <div className="seal-init-container">
              <img src={BalanceCheckAnimation} alt="Balance Check" style={svgStyles} />
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
        return <NFTScanAnimation colorMode={colorMode} />

      case 'access-cap-creating':
        return <AccessCapabilityAnimation colorMode={colorMode} />

      case 'grant-access':
        return <GrantAccessAnimation colorMode={colorMode} />

      case 'access-verifying':
        return <AccessVerificationAnimation colorMode={colorMode} />

      case 'seal-initializing':
        return (
          <motion.div className="animation-scene">
            <div className="seal-init-container">
              <img src={SealIcon} alt="Seal Protocol" style={svgStyles} />
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
            <div className="shamir-secret-container">
              <img src={EllipticCurveAnimation2} alt="Shamir's Secret Sharing" style={svgStyles} />
              <motion.div 
                className="secret-labels"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="secret-equation">Shamir's Secret Sharing</span>
                <span className="signature-text">Creating 3-of-5 Threshold Signature</span>
              </motion.div>
            </div>
          </motion.div>
        )

      case 'file-selecting':
        // return (
        //   <motion.div className="animation-scene">
        //     <div className="seal-init-container">
        //       <img src={FileIcon} alt="Select File" style={svgStyles} />
        //       <motion.div 
        //         className="seal-text"
        //         initial={{ opacity: 0 }}
        //         animate={{ opacity: 1 }}
        //         transition={{ delay: 0.5 }}
        //       >
        //         <span className="main-text">Select File</span>
        //       </motion.div>
        //     </div>
        //   </motion.div>
        // )

        return <WorkflowGenerationAnimation colorMode={colorMode} />

      case 'encrypting':
        return <DataCubeAnimation colorMode={colorMode} />

      case 'uploading':
        return (
          <motion.div className="animation-scene">
            <div className="walrus-upload">
              <img src={WalrusUploadAnimation} alt="Walrus Upload Animation" style={svgStyles} />
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
                <svg viewBox="0 0 100 100" style={{ width: '80px', height: '80px' }}>
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

      case 'step-completed':
        // Show NetworkIdle when step is completed and waiting for user to continue
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="idle-animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="network-animation">
                <img src={NetworkIdleAnimation} alt="Network Idle Animation" style={svgStyles} />
              </div>
            </motion.div>
          </motion.div>
        )

      case 'default':
      case 'idle':
      default:
        // Show step-specific animation when idle instead of NetworkIdle
        if (currentStep !== null) {
          const stepAnimation = getDefaultStepAnimation(currentStep)
          return renderAnimation(stepAnimation, null) // Recursive call but with null currentStep to avoid infinite loop
        }
        
        // Fallback to first step animation if no currentStep provided
        return <WalletConnectedAnimation colorMode={colorMode} />
    }
  }

  return {
    renderStepIcon,
    renderAnimation
  }
}