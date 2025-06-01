import React, { useState, useEffect, useRef } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import './styles/themed-index.css'

// Visual Components
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
import { renderActionContent, renderPrerequisiteWarning } from './components/functional/actionContent'
import { 
  getFlowId, 
  setFlowId, 
  saveJourneyData, 
  loadJourneyData, 
  saveCurrentStep, 
  loadCurrentStep, 
  clearFlowData, 
  hasFlowData, 
  getFlowSummary 
} from './components/functional/sessionStorage'

// Extracted functions
import { 
  handleStepActionWithData, 
  handleStepAction, 
  checkStepPrerequisites,
  moveToNextStep,
  moveToPreviousStep
} from './functions/stepHandlers'
import { 
  handleNFTFormSubmit, 
  handleResetProgress,
  handleNewJourney 
} from './functions/nftFormHandlers'
import { 
  initializeBlockchainReferences,
  loadSavedJourneyData,
  setupAutoSave,
  handleSignatureCallback
} from './functions/initialization'
import { savePublishDataToBackend } from './functions/backendSave'

const InteractivePublish = ({ agentData, agentId, onComplete }) => {
  // Debug logging for agentData and agentId
  console.log('InteractivePublish - agentData received:', agentData);
  console.log('InteractivePublish - agentId received:', agentId);
  
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  // Create config from environment
  const config = {
    walrusApiUrl        : import.meta.env.VITE_WALRUS_API_URL     || 'https://walrus-testnet.walrus.space',
    network             : import.meta.env.VITE_SUI_NETWORK        || 'testnet',
    PACKAGE_ID          : import.meta.env.VITE_PACKAGE_ID         || '0x0',
    ACCESS_REGISTRY_ID  : import.meta.env.VITE_ACCESS_REGISTRY_ID || '0x0',
    WALRUS_PUBLISHER    : import.meta.env.VITE_WALRUS_PUBLISHER   || 'https://publisher.walrus-testnet.walrus.space',
    WALRUS_AGGREGATOR   : import.meta.env.VITE_WALRUS_AGGREGATOR  || 'https://aggregator.walrus-testnet.walrus.space'
  }
  
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
  
  const [flowId, setFlowIdState]                              = useState(() => getFlowId())
  const [currentStep, setCurrentStepState]                    = useState(0)
  const [isProcessing, setProcessingState]                    = useState(false)
  const [animationPhase, setAnimationPhase]                   = useState('idle')
  const [incompletePrerequisites, setIncompletePrerequisites] = useState([])
  
  // NFT form state
  const [versionNumber, setVersionNumber] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  
  // Animation system
  const {renderStepIcon,renderAnimation} = useAnimationSystem()
  
  // Initialize global blockchain references
  useEffect(() => {
    initializeBlockchainReferences(suiClient, account, signAndExecuteTransaction, config)
  }, [suiClient, account, signAndExecuteTransaction, config])

  // Load saved data on component mount
  useEffect(() => {
    if (hasFlowData(flowId)) {
      console.log('Loading saved journey data for flow:', flowId)
      const savedJourneyData = loadJourneyData(flowId)
      const savedCurrentStep = loadCurrentStep(flowId)
      
      if (savedJourneyData) {
        // Merge saved data with current account/agent data
        updateJourneyData({
          ...savedJourneyData,
          // Always update with current account/agent info
          walletConnected: !!account,
          walletAddress: account?.address,
          account,
          agentData,
          agentId: agentData?.id,
          flowId
        })
      }
      
      if (savedCurrentStep !== undefined) {
        setCurrentStepState(savedCurrentStep)
      }
      
      console.log('Loaded flow summary:', getFlowSummary(flowId))
    } else {
      // No saved data, start fresh
      console.log('No saved data found, starting fresh journey')
    }
  }, [flowId])
  
  // Update account and agent data in journey data
  useEffect(() => {
    // Always update agentData, regardless of account status
    const updateData = {
      agentData,
      agentId: agentId || agentData?.id, // Use URL agentId first, fallback to agentData.id
      flowId
    };
    
    // Add account data if wallet is connected
    if (account) {
      updateData.walletConnected = true;
      updateData.walletAddress = account.address;
      updateData.account = account;
    }
    
    console.log('Updating journey data with:', updateData);
    updateJourneyData(updateData);
  }, [account, agentData, agentId, flowId])
  
  // Auto-save journey data whenever it changes
  useEffect(() => {
    const timeoutId = setupAutoSave(flowId, journeyData, currentStep)
    return () => clearTimeout(timeoutId)
  }, [journeyData, currentStep, flowId])
  
  // Handle step navigation (from progress clicks or continue button)
  const handleStepNavigation = (targetStep, incompleteSteps = null) => {
    if (incompleteSteps && incompleteSteps.length > 0) {
      // Show prerequisite warning
      setIncompletePrerequisites(incompleteSteps)
      setAnimationPhase('action-content')
    } else {
      // Navigate to step
      console.log('Navigating from step', currentStep, 'to step', targetStep)
      setCurrentStepState(targetStep)
      setAnimationPhase('idle')
      setIncompletePrerequisites([])
    }
  }
  
  // Only advance to next step when user explicitly continues
  const handleContinueToNext = () => {
    const nextStep = currentStep + 1
    if (nextStep < INTERACTIVE_PUBLISH_STEPS.length) {
      handleStepNavigation(nextStep)
    }
  }
  
  // Removed handleShowActionContent as content is now always visible
  
  // Handle action from content (for mint step with form data)
  const handleActionFromContent = async () => {
    handleNFTFormSubmit({
      versionNumber,
      nftDescription,
      journeyData,
      updateJourneyData,
      agentId: agentId || agentData?.id || journeyData.agentId,
      setAnimationPhase,
      handleStepActionWithData: (data) => handleStepActionWithDataWrapper(data)
    })
  }
  
  // Wrapper functions for imported handlers
  const handleStepActionWithDataWrapper = async (dataOverride = null) => {
    return handleStepActionWithData({
      dataOverride,
      currentStep,
      journeyData,
      updateJourneyData,
      config,
      setProcessingState,
      setAnimationPhase,
      markStepComplete,
      setError,
      onComplete,
      agentId,
      agentData,
      account
    })
  }
  
  const handleStepActionWrapper = async () => {
    return handleStepAction({
      currentStep,
      journeyData,
      updateJourneyData,
      config,
      setProcessingState,
      setAnimationPhase,
      markStepComplete,
      setError,
      onComplete,
      agentId,
      agentData,
      account
    })
  }
  
  const handleResetProgressWrapper = () => {
    handleResetProgress({
      flowId,
      clearFlowData,
      setFlowId,
      setFlowIdState,
      resetJourney,
      setCurrentStepState,
      setAnimationPhase,
      setIncompletePrerequisites
    })
  }
  
  const handleNewJourneyWrapper = () => {
    handleNewJourney({
      flowId,
      clearFlowData,
      setFlowId,
      setFlowIdState,
      resetJourney,
      setCurrentStepState,
      setAnimationPhase,
      setIncompletePrerequisites
    })
  }
  
  // Handle signature callback for Seal session key
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SEAL_SIGNATURE_COMPLETE' && event.data?.sessionKey) {
        handleSignatureCallback(
          event.data.sessionKey,
          updateJourneyData,
          markStepComplete,
          currentStep,
          setAnimationPhase
        )
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [currentStep, markStepComplete, updateJourneyData])

  return (
    <div className="journey-v2">
      <div className="journey-container">
        <div className="journey-main">
          <ProgressSection 
            steps={INTERACTIVE_PUBLISH_STEPS}
            currentStep={currentStep}
            journeyData={journeyData}
            renderStepIcon={renderStepIcon}
            onStepClick={handleStepNavigation}
            onResetProgress={handleResetProgressWrapper}
          />

          {/* Conditional layout based on completion status */}
          {journeyData.walrusBlobId && currentStep >= INTERACTIVE_PUBLISH_STEPS.length - 1 ? (
            // Show completion details when upload is complete
            <div className="completion-area">
              <CompletionSection 
                journeyData={journeyData}
                config={config}
                onNewJourney={handleNewJourneyWrapper}
              />
            </div>
          ) : (
            // Show vertical stack: text + animation + action content + action
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
                renderAnimation={(phase) => renderAnimation(phase, currentStep)}
              />

              {/* Action Content Area */}
              <div className="action-content-area">
                {incompletePrerequisites && incompletePrerequisites.length > 0 ? 
                  renderPrerequisiteWarning(incompletePrerequisites) :
                  renderActionContent(currentStep, journeyData, versionNumber, nftDescription, setVersionNumber, setNftDescription, handleActionFromContent)
                }
              </div>

              {/* Action Section */}
              <ActionSection 
                currentStep={currentStep}
                journeyData={journeyData}
                isProcessing={isProcessing}
                animationPhase={animationPhase}
                onAction={handleStepActionWrapper}
                onContinue={handleContinueToNext}
                setAnimationPhase={setAnimationPhase}
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