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

const InteractivePublish = ({ agentData, agentId, onComplete }) => {
  // Debug logging for agentData and agentId
  console.log('InteractivePublish - agentData received:', agentData);
  console.log('InteractivePublish - agentId received:', agentId);
  
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  // Create config from environment
  const config = {
    walrusApiUrl: import.meta.env.VITE_WALRUS_API_URL || 'https://walrus-testnet.walrus.space',
    network: import.meta.env.VITE_SUI_NETWORK || 'testnet',
    PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID || '0x0',
    ACCESS_REGISTRY_ID: import.meta.env.VITE_ACCESS_REGISTRY_ID || '0x0',
    WALRUS_PUBLISHER: import.meta.env.VITE_WALRUS_PUBLISHER || 'https://publisher.walrus-testnet.walrus.space',
    WALRUS_AGGREGATOR: import.meta.env.VITE_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space'
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
  
  const [flowId, setFlowIdState] = useState(() => getFlowId())
  const [currentStep, setCurrentStepState] = useState(0)
  const [isProcessing, setProcessingState] = useState(false)
  const [animationPhase, setAnimationPhase] = useState('idle')
  const [incompletePrerequisites, setIncompletePrerequisites] = useState([])
  
  // NFT form state
  const [versionNumber, setVersionNumber] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  
  // Animation system
  const {
    renderStepIcon,
    renderAnimation
  } = useAnimationSystem()
  
  // Initialize global blockchain references
  useEffect(() => {
    if (suiClient && account && signAndExecuteTransaction) {
      // Set global references for blockchain.js
      window.suiClient = suiClient
      window.signAndExecute = signAndExecuteTransaction
      window.config = config
      window.currentAccount = account
    }
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
  
  // Save journey data whenever it changes
  useEffect(() => {
    if (journeyData && Object.keys(journeyData).length > 0) {
      saveJourneyData(flowId, journeyData)
    }
  }, [journeyData, flowId])
  
  // Save current step whenever it changes
  useEffect(() => {
    saveCurrentStep(flowId, currentStep)
  }, [currentStep, flowId])
  
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
  const handleActionFromContent = () => {
    if (versionNumber && nftDescription) {
      // Construct full NFT name with neuralabs prefix
      const currentAgentId = agentId || agentData?.id || journeyData.agentId || 'unknown'
      const fullNftName = `neuralabs:${currentAgentId}:${versionNumber}`
      
      // Update journey data with form data
      updateJourneyData({
        nftName: fullNftName,
        versionNumber: versionNumber,
        nftDescription: nftDescription
      })
    }
    
    // Go back to animation and trigger action
    setAnimationPhase('idle')
    setTimeout(() => {
      handleStepAction()
    }, 100)
  }
  
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
    
    // Set step-specific animation phase
    const animationPhases = {
      'connectWallet': 'wallet-connecting',
      'checkBalances': 'balance-checking', 
      'mintNFT': 'nft-creating',
      'createAccessCap': 'access-cap-creating',
      'grantSelfAccess': 'grant-access',
      'verifyAccess': 'access-verifying',
      'initializeSeal': 'seal-initializing',
      'createSessionKey': 'signing',
      'selectFile': 'file-selecting',
      'encryptFile': 'encrypting',
      'storeFile': 'uploading'
    }
    setAnimationPhase(animationPhases[step.action] || 'processing')
    
    // Add 3-second delay for animations
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    try {
      const result = await action(journeyData, updateJourneyData, config)
      console.log('Action result:', result)
      
      if (result.success) {
        console.log('Action succeeded for step:', currentStep)
        
        // Special handling for signature step
        if (step.action === 'createSessionKey' && result.needsSignature) {
          console.log('Session key created, now requesting signature...')
          
          // Trigger the signature request
          setTimeout(() => {
            const signButton = document.getElementById('trigger-signature-btn')
            if (signButton) {
              signButton.click()
            }
          }, 500)
          
          // Don't mark as complete yet - wait for signature
          setAnimationPhase('awaiting-signature')
        } else {
          // Normal completion flow
          markStepComplete(currentStep)
          
          // Update completed steps in journeyData
          const newCompletedSteps = [...(journeyData.completedSteps || []), currentStep]
          updateJourneyData({ completedSteps: newCompletedSteps })
          
          setAnimationPhase('completed')
          
          // Check if this is the final step
          if (currentStep === INTERACTIVE_PUBLISH_STEPS.length - 1 && result.success) {
            // Call onComplete after successful final step
            setTimeout(() => {
              if (onComplete) {
                onComplete()
              }
            }, 2000)
          }
          
          // Don't auto-advance - wait for user to click continue
          setTimeout(() => {
            setAnimationPhase('step-completed')
          }, 1500)
        }
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
  
  // Reset progress and start new journey
  const handleResetProgress = () => {
    console.log('Resetting journey progress')
    
    // Clear session storage for current flow
    clearFlowData(flowId)
    
    // Generate new flow ID
    const newFlowId = setFlowId()
    setFlowIdState(newFlowId)
    
    // Reset all state
    resetJourney()
    setCurrentStepState(0)
    setAnimationPhase('idle')
    setIncompletePrerequisites([])
    
    console.log('Started new journey with flow ID:', newFlowId)
  }
  
  const handleNewJourney = () => {
    handleResetProgress()
  }

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
            onResetProgress={handleResetProgress}
          />

          {/* Conditional layout based on completion status */}
          {journeyData.walrusBlobId && currentStep >= INTERACTIVE_PUBLISH_STEPS.length - 1 ? (
            // Show completion details when upload is complete
            <div className="completion-area">
              <CompletionSection 
                journeyData={journeyData}
                config={config}
                onNewJourney={handleNewJourney}
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
                onAction={handleStepAction}
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