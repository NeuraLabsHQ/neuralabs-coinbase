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

// Functional Components
import { useJourneyState } from './components/functional/journeyState'
import { journeyActions } from './components/functional/blockchainInteractions'
import { useAnimationSystem } from './components/functional/animationSystem'
import { INTERACTIVE_PUBLISH_STEPS } from './components/functional/journeyConfig'

const InteractivePublish = ({ config }) => {
  const account = useCurrentAccount()
  
  // Core state management
  const {
    state: journeyData,
    updateState: updateJourneyData,
    setCurrentStep,
    markStepComplete,
    setLoading: setIsProcessing,
    setError,
    resetJourney,
    canProceed,
  } = useJourneyState()
  
  const [currentStep, setCurrentStepState] = useState(0)
  const [isProcessing, setProcessingState] = useState(false)
  const [animationPhase, setAnimationPhase] = useState('idle')
  
  // Animation system
  const { canvasRef, renderStepIcon } = useAnimationSystem()
  
  // Set canvas ref
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = document.querySelector('.animation-canvas')
      if (canvas && canvasRef.current !== canvas) {
        canvasRef.current = canvas
      }
    }
  }, [currentStep])
  
  // Update account in journey data
  useEffect(() => {
    if (account) {
      updateJourneyData({ 
        walletConnected: true, 
        walletAddress: account.address,
        account 
      })
    }
  }, [account])
  
  // Handle step actions
  const handleStepAction = async () => {
    const step = INTERACTIVE_PUBLISH_STEPS[currentStep]
    console.log('handleStepAction called for step:', step)
    
    if (!step.action) {
      console.log('No action defined for step:', step.id)
      return
    }
    
    const action = journeyActions[step.action]
    if (!action) {
      toast.error(`Action ${step.action} not implemented`)
      return
    }
    
    console.log('Executing action:', step.action)
    setProcessingState(true)
    setAnimationPhase('processing')
    
    try {
      const result = await action(journeyData, updateJourneyData, config)
      console.log('Action result:', result)
      
      if (result.success) {
        console.log('Action succeeded, marking step complete:', currentStep)
        markStepComplete(currentStep)
        
        // Update completed steps in journeyData
        const newCompletedSteps = [...journeyData.completedSteps, currentStep]
        updateJourneyData({ completedSteps: newCompletedSteps })
        
        // Auto-advance to next step
        setTimeout(() => {
          console.log('Auto-advancing from step', currentStep, 'to', currentStep + 1)
          if (currentStep < INTERACTIVE_PUBLISH_STEPS.length - 1) {
            setCurrentStepState(currentStep + 1)
            setCurrentStep(currentStep + 1)  // Update the state manager's current step too
            setAnimationPhase('idle')
          }
        }, 1500)  // Increased delay to ensure state updates complete
      } else {
        console.log('Action failed with result:', result)
      }
    } catch (error) {
      console.error('Error in handleStepAction:', error)
      toast.error(error.message || 'An error occurred')
      setError(error.message)
    } finally {
      setProcessingState(false)
    }
  }
  
  const handleNewJourney = () => {
    resetJourney()
    setCurrentStepState(0)
    setAnimationPhase('idle')
  }
  
  // Check if journey is complete
  const isComplete = currentStep === INTERACTIVE_PUBLISH_STEPS.length - 1 && 
                    journeyData.walrusUrl
  
  return (
    <div className="journey-v2">
      <BackgroundEffects />
      
      <div className="journey-container">
        <JourneyHeader />
        
        {!isComplete ? (
          <div className="journey-main">
            {/* Progress Section */}
            <ProgressSection
              steps={INTERACTIVE_PUBLISH_STEPS}
              currentStep={currentStep}
              journeyData={journeyData}
              renderStepIcon={renderStepIcon}
            />
            
            {/* Animation Section */}
            <AnimationSection
              currentStep={currentStep}
              isProcessing={isProcessing}
              animationPhase={animationPhase}
            />
            
            {/* Action Section */}
            <ActionSection
              currentStep={currentStep}
              journeyData={journeyData}
              isProcessing={isProcessing}
              onAction={handleStepAction}
            />
          </div>
        ) : (
          <div className="journey-main">
            <CompletionSection
              journeyData={journeyData}
              onNewJourney={handleNewJourney}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default InteractivePublish