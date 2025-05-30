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
  const {
    renderStepIcon,
    renderAnimation
  } = useAnimationSystem()
  
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
  
  // Auto-advance steps based on completion status
  useEffect(() => {
    const nextStep = INTERACTIVE_PUBLISH_STEPS.findIndex(step => !step.completed(journeyData))
    console.log('Interactive Publish auto-advance check:');
    console.log('- Current step:', currentStep);
    console.log('- Next uncompleted step:', nextStep);
    console.log('- Journey data keys:', Object.keys(journeyData));
    console.log('- Walrus blob ID:', journeyData.walrusBlobId);
    
    if (nextStep !== -1 && nextStep !== currentStep) {
      console.log('Auto-advancing from step', currentStep, 'to step', nextStep);
      setCurrentStepState(nextStep)
    } else if (nextStep === -1) {
      console.log('All steps completed! Should show completion section.');
    }
  }, [journeyData, currentStep])
  
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
        const newCompletedSteps = [...(journeyData.completedSteps || []), currentStep]
        updateJourneyData({ completedSteps: newCompletedSteps })
        
        setAnimationPhase('completed')
        
        // Auto-advance happens via useEffect above
        setTimeout(() => {
          setAnimationPhase('idle')
        }, 1500)
      } else {
        console.log('Action failed with result:', result)
        setAnimationPhase('idle')
      }
    } catch (error) {
      console.error('Error in handleStepAction:', error)
      toast.error(error.message || 'An error occurred')
      setError(error.message)
      setAnimationPhase('idle')
    } finally {
      setProcessingState(false)
    }
  }
  
  const handleNewJourney = () => {
    resetJourney()
    setCurrentStepState(0)
    setAnimationPhase('idle')
  }

  return (
    <div className="journey-v2">
      <div className="journey-container">
        <JourneyHeader />

        <div className="journey-main">
          <ProgressSection 
            steps={INTERACTIVE_PUBLISH_STEPS}
            currentStep={currentStep}
            journeyData={journeyData}
            renderStepIcon={renderStepIcon}
          />

          {/* Conditional layout based on completion status */}
          {journeyData.walrusBlobId ? (
            // Show completion details when upload is complete
            <div className="completion-area">
              <CompletionSection 
                journeyData={journeyData}
                config={config}
                onNewJourney={handleNewJourney}
              />
            </div>
          ) : (
            // Show vertical stack: text + animation + action
            <div className="journey-right-stack">
              {/* Text Content Section */}
              <div className="text-section">
                <motion.h2
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="step-title"
                >
                  {INTERACTIVE_PUBLISH_STEPS[currentStep].title}
                </motion.h2>
                
                <motion.p
                  key={`${currentStep}-subtitle`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="step-subtitle"
                >
                  {INTERACTIVE_PUBLISH_STEPS[currentStep].subtitle}
                </motion.p>
              </div>

              {/* Animation Section */}
              <AnimationSection 
                animationPhase={animationPhase}
                renderAnimation={renderAnimation}
              />

              {/* Action Section */}
              <ActionSection 
                currentStep={currentStep}
                journeyData={journeyData}
                isProcessing={isProcessing}
                onAction={handleStepAction}
              />
            </div>
          )}
        </div>
      </div>

      <BackgroundEffects />
    </div>
  )
}

export default InteractivePublish