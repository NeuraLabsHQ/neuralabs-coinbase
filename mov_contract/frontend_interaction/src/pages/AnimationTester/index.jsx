import React, { useState } from 'react'
import { motion } from 'framer-motion'
import './AnimationTester.css'

// Import all SVG animations
import WalletIcon from '../InteractiveEncryptionJourney/components/animations/WalletIcon.svg'
import NFTIcon from '../InteractiveEncryptionJourney/components/animations/NFTIcon.svg'
import SignatureIcon from '../InteractiveEncryptionJourney/components/animations/SignatureIcon.svg'
import FileIcon from '../InteractiveEncryptionJourney/components/animations/FileIcon.svg'
import EncryptIcon from '../InteractiveEncryptionJourney/components/animations/EncryptIcon.svg'
import SealIcon from '../InteractiveEncryptionJourney/components/animations/SealIcon.svg'
import WalrusIcon from '../InteractiveEncryptionJourney/components/animations/WalrusIcon.svg'
import VerificationBadge from '../InteractiveEncryptionJourney/components/animations/VerificationBadge.svg'
import EllipticCurveAnimation from '../InteractiveEncryptionJourney/components/animations/EllipticCurveAnimation.svg'
import WalrusUploadAnimation from '../InteractiveEncryptionJourney/components/animations/WalrusUploadAnimation.svg'
import NetworkIdleAnimation from '../InteractiveEncryptionJourney/components/animations/NetworkIdleAnimation.svg'

// Import all JSX animations
import NFTScanAnimation from '../InteractiveEncryptionJourney/components/animations/NFTScanAnimation'
import DataCubeAnimation from '../InteractiveEncryptionJourney/components/animations/DataCubeAnimation'
import WalletConnectedAnimation from '../InteractiveEncryptionJourney/components/animations/WalletConnectedAnimation'
import BalanceCheckAnimation from '../InteractiveEncryptionJourney/components/animations/BalanceCheckAnimation'
import NFTCreationAnimation from '../InteractiveEncryptionJourney/components/animations/NFTCreationAnimation'
import AccessCapabilityAnimation from '../InteractiveEncryptionJourney/components/animations/AccessCapabilityAnimation'
import GrantAccessAnimation from '../InteractiveEncryptionJourney/components/animations/GrantAccessAnimation'
import AccessVerificationAnimation from '../InteractiveEncryptionJourney/components/animations/AccessVerificationAnimation'

const AnimationTester = () => {
  const [selectedAnimation, setSelectedAnimation] = useState('')

  // SVG animations list
  const svgAnimations = [
    { name: 'WalletIcon.svg', component: WalletIcon, type: 'svg' },
    { name: 'NFTIcon.svg', component: NFTIcon, type: 'svg' },
    { name: 'SignatureIcon.svg', component: SignatureIcon, type: 'svg' },
    { name: 'FileIcon.svg', component: FileIcon, type: 'svg' },
    { name: 'EncryptIcon.svg', component: EncryptIcon, type: 'svg' },
    { name: 'SealIcon.svg', component: SealIcon, type: 'svg' },
    { name: 'WalrusIcon.svg', component: WalrusIcon, type: 'svg' },
    { name: 'VerificationBadge.svg', component: VerificationBadge, type: 'svg' },
    { name: 'EllipticCurveAnimation.svg', component: EllipticCurveAnimation, type: 'svg' },
    { name: 'WalrusUploadAnimation.svg', component: WalrusUploadAnimation, type: 'svg' },
    { name: 'NetworkIdleAnimation.svg', component: NetworkIdleAnimation, type: 'svg' },
  ]

  // JSX animations list
  const jsxAnimations = [
    { name: 'NFTScanAnimation.jsx', component: NFTScanAnimation, type: 'jsx' },
    { name: 'DataCubeAnimation.jsx', component: DataCubeAnimation, type: 'jsx' },
    { name: 'WalletConnectedAnimation.jsx', component: WalletConnectedAnimation, type: 'jsx' },
    { name: 'BalanceCheckAnimation.jsx', component: BalanceCheckAnimation, type: 'jsx' },
    { name: 'NFTCreationAnimation.jsx', component: NFTCreationAnimation, type: 'jsx' },
    { name: 'AccessCapabilityAnimation.jsx', component: AccessCapabilityAnimation, type: 'jsx' },
    { name: 'GrantAccessAnimation.jsx', component: GrantAccessAnimation, type: 'jsx' },
    { name: 'AccessVerificationAnimation.jsx', component: AccessVerificationAnimation, type: 'jsx' },
  ]

  // Combine all animations
  const allAnimations = [...svgAnimations, ...jsxAnimations]

  const renderAnimation = () => {
    const selected = allAnimations.find(anim => anim.name === selectedAnimation)
    if (!selected) return null

    if (selected.type === 'svg') {
      return (
        <div className="svg-animation-container">
          <img 
            src={selected.component} 
            alt={selected.name}
            style={{ 
              maxWidth: '400px', 
              maxHeight: '400px',
              width: '100%',
              height: 'auto'
            }}
          />
        </div>
      )
    } else {
      const AnimationComponent = selected.component
      return <AnimationComponent />
    }
  }

  return (
    <div className="animation-tester-page">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Animation Tester
          </h1>
          <p className="text-gray-300 text-lg">
            Select an animation from the dropdown to preview it
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-md mx-auto mb-8"
        >
          <label className="block text-white text-sm font-medium mb-2">
            Choose Animation:
          </label>
          <select
            value={selectedAnimation}
            onChange={(e) => setSelectedAnimation(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select an animation --</option>
            
            <optgroup label="SVG Animations">
              {svgAnimations.map((animation) => (
                <option key={animation.name} value={animation.name}>
                  {animation.name}
                </option>
              ))}
            </optgroup>
            
            <optgroup label="JSX Animations">
              {jsxAnimations.map((animation) => (
                <option key={animation.name} value={animation.name}>
                  {animation.name}
                </option>
              ))}
            </optgroup>
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="animation-preview-container"
        >
          {selectedAnimation ? (
            <div className="bg-gray-900 rounded-lg p-8 min-h-[500px] flex items-center justify-center border border-gray-700">
              <div className="animation-wrapper">
                {renderAnimation()}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-8 min-h-[500px] flex items-center justify-center border border-gray-700 border-dashed">
              <div className="text-center text-gray-400">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-6xl mb-4"
                >
                  🎬
                </motion.div>
                <p className="text-xl">Select an animation to preview</p>
              </div>
            </div>
          )}
        </motion.div>

        {selectedAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 text-center"
          >
            <div className="bg-gray-800 rounded-lg p-4 inline-block">
              <h3 className="text-white font-medium mb-2">Currently Viewing:</h3>
              <p className="text-blue-400 font-mono">{selectedAnimation}</p>
              <p className="text-gray-400 text-sm mt-1">
                Type: {allAnimations.find(anim => anim.name === selectedAnimation)?.type?.toUpperCase()}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Animation Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{svgAnimations.length}</div>
                <div className="text-gray-400 text-sm">SVG Animations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{jsxAnimations.length}</div>
                <div className="text-gray-400 text-sm">JSX Animations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{allAnimations.length}</div>
                <div className="text-gray-400 text-sm">Total Animations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {selectedAnimation ? '1' : '0'}
                </div>
                <div className="text-gray-400 text-sm">Currently Selected</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  )
}

export default AnimationTester