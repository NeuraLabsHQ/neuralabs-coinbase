import { 
  hasFlowData, 
  loadJourneyData, 
  loadCurrentStep,
  saveJourneyData,
  saveCurrentStep
} from '../components/functional/sessionStorage'

// Initialize global blockchain references
export const initializeBlockchainReferences = (suiClient, account, signAndExecuteTransaction, config) => {
  if (suiClient && account && signAndExecuteTransaction) {
    // Set global references for blockchain.js
    window.suiClient = suiClient
    window.signAndExecute = signAndExecuteTransaction
    window.config = config
    window.currentAccount = account
  }
}

// Load saved journey data on component mount
export const loadSavedJourneyData = ({
  flowId,
  updateJourneyData,
  setCurrentStepState,
  setCurrentStep,
  account,
  agentId,
  agentData
}) => {
  if (hasFlowData(flowId)) {
    console.log('Loading saved journey data for flow:', flowId)
    const savedJourneyData = loadJourneyData(flowId)
    const savedCurrentStep = loadCurrentStep(flowId)
    
    if (savedJourneyData) {
      // Merge saved data with current account/agent data
      updateJourneyData({
        ...savedJourneyData,
        accountAddress: account?.address,
        agentId: agentId || savedJourneyData.agentId,
        agentData: agentData || savedJourneyData.agentData
      })
    }
    
    if (savedCurrentStep !== null) {
      setCurrentStepState(savedCurrentStep)
      setCurrentStep(savedCurrentStep)
    }
  } else {
    console.log('No saved journey data found for flow:', flowId)
    // Initialize with account and agent data
    updateJourneyData({
      accountAddress: account?.address,
      agentId: agentId,
      agentData: agentData
    })
  }
}

// Auto-save journey data whenever it changes
export const setupAutoSave = (flowId, journeyData, currentStep) => {
  const timeoutId = setTimeout(() => {
    console.log('Auto-saving journey progress...')
    saveJourneyData(flowId, journeyData)
    saveCurrentStep(flowId, currentStep)
  }, 500) // Debounce saves by 500ms
  
  return timeoutId
}

// Handle signature callback
export const handleSignatureCallback = (sessionKey, updateJourneyData, markStepComplete, currentStep, setAnimationPhase) => {
  if (sessionKey) {
    console.log('Signature callback received with session key')
    
    // Update journey data with signed session key
    updateJourneyData({
      sessionKey: sessionKey,
      sessionKeyObject: sessionKey
    })
    
    // Mark step as complete
    markStepComplete(currentStep)
    setAnimationPhase('completed')
    
    // Auto-advance after a short delay
    setTimeout(() => {
      setAnimationPhase('step-completed')
    }, 1500)
  }
}