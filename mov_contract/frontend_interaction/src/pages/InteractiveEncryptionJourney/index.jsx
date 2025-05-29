import React, { useState, useEffect, useRef } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import './styles/index.css'

// Visual Components
import JourneyHeader from './components/visual/JourneyHeader'
import ProgressSection from './components/visual/ProgressSection'
import AnimationSection from './components/visual/AnimationSection'
import ActionSection from './components/visual/ActionSection'
import CompletionSection from './components/visual/CompletionSection'
import BackgroundEffects from './components/visual/BackgroundEffects'

// Functional Components (Blockchain Integration)
import { useJourneyState } from './components/functional/journeyState'
import { useBlockchainInteractions } from './components/functional/blockchainInteractions'
import { useAnimationSystem } from './components/functional/animationSystem'
import { INTERACTIVE_JOURNEY_STEPS } from './components/functional/journeyConfig'

const InteractiveEncryptionJourney = ({ config }) => {
  const account = useCurrentAccount()
  
  // Core state management
  const {
    currentStep,
    setCurrentStep,
    isProcessing,
    setIsProcessing,
    animationPhase,
    setAnimationPhase,
    journeyData,
    updateJourneyData
  } = useJourneyState()
  
  // Blockchain interactions
  const {
    loadUserNFTs,
    selectNFT,
    createSessionKey,
    selectFile,
    mockEncrypt,
    mockUploadToWalrus,
    initializeSeal
  } = useBlockchainInteractions({
    account,
    config,
    setIsProcessing,
    setAnimationPhase,
    updateJourneyData,
    toast
  })
  
  // Animation system
  const {
    renderStepIcon,
    renderAnimation
  } = useAnimationSystem()

  // Initialize journey when account connects
  useEffect(() => {
    if (account) {
      loadUserNFTs()
    }
  }, [account, loadUserNFTs])

  // Auto-advance steps based on completion status
  useEffect(() => {
    const nextStep = INTERACTIVE_JOURNEY_STEPS.findIndex(step => !step.completed(journeyData))
    if (nextStep !== -1 && nextStep !== currentStep) {
      setCurrentStep(nextStep)
    }
  }, [journeyData, currentStep, setCurrentStep])

  return (
    <div className="journey-v2">
      <div className="journey-container">
        <JourneyHeader />

        <div className="journey-main">
          <ProgressSection 
            steps={INTERACTIVE_JOURNEY_STEPS}
            currentStep={currentStep}
            journeyData={journeyData}
            renderStepIcon={renderStepIcon}
          />

          {/* Conditional layout based on completion status */}
          {journeyData.walrusBlobId ? (
            // Show completion details in combined center+right area when upload is complete
            <div className="completion-area">
              <CompletionSection 
                journeyData={journeyData}
                config={config}
              />
            </div>
          ) : (
            // Show normal animation and action sections during journey
            <>
              <AnimationSection 
                animationPhase={animationPhase}
                renderAnimation={renderAnimation}
              />

              <ActionSection 
                currentStep={currentStep}
                steps={INTERACTIVE_JOURNEY_STEPS}
                journeyData={journeyData}
                isProcessing={isProcessing}
                account={account}
                setCurrentStep={setCurrentStep}
                selectNFT={selectNFT}
                createSessionKey={createSessionKey}
                selectFile={selectFile}
                mockEncrypt={mockEncrypt}
                mockUploadToWalrus={mockUploadToWalrus}
                initializeSeal={initializeSeal}
              />
            </>
          )}
        </div>
      </div>

      <BackgroundEffects />
    </div>
  )
}

export default InteractiveEncryptionJourney