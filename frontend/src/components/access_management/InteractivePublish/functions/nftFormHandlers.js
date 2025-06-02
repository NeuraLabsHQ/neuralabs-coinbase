import toast from 'react-hot-toast'

// Handle NFT form submission from the action section
export const handleNFTFormSubmit = ({
  versionNumber,
  nftDescription,
  journeyData,
  updateJourneyData,
  agentId,
  setAnimationPhase,
  handleStepActionWithData
}) => {
  // Validate inputs
  if (!versionNumber || !versionNumber.trim()) {
    toast.error('Please enter a version number')
    return
  }
  
  if (!nftDescription || !nftDescription.trim()) {
    toast.error('Please enter a description')
    return
  }
  
  // Create the NFT name in the required format
  const currentAgentId = agentId || journeyData.agentId
  const fullNftName = `neuralabs:${currentAgentId}:${versionNumber}`
  
  
  // Create temporary state with form data for the blockchain action
  const tempJourneyData = {
    ...journeyData,
    nftName: fullNftName,
    versionNumber: versionNumber,
    nftDescription: nftDescription
  }
  
  // Update journey data and immediately trigger action with temp data
  updateJourneyData({
    nftName: fullNftName,
    versionNumber: versionNumber,
    nftDescription: nftDescription
  })
  
  // Call the action directly with the temp data
  setAnimationPhase('idle')
  setTimeout(() => {
    handleStepActionWithData(tempJourneyData)
  }, 100)
}

// Reset progress and start new journey
export const handleResetProgress = ({
  flowId,
  clearFlowData,
  setFlowId,
  setFlowIdState,
  resetJourney,
  setCurrentStepState,
  setAnimationPhase,
  setIncompletePrerequisites
}) => {
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

export const handleNewJourney = (params) => {
  handleResetProgress(params)
}