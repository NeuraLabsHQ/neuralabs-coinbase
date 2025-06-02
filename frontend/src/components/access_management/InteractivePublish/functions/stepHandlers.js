import toast from 'react-hot-toast'
import { INTERACTIVE_PUBLISH_STEPS } from '../components/functional/journeyConfig'
import { journeyActions } from '../components/functional/blockchainInteractions'
import { getFlowId, loadJourneyData } from '../components/functional/sessionStorage'
import { savePublishDataToBackend } from './backendSave'

// Handle step actions with optional data override
export const handleStepActionWithData = async ({
  dataOverride = null,
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
}) => {
  const step = INTERACTIVE_PUBLISH_STEPS[currentStep]
  const actionData = dataOverride || journeyData
  
  
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
    const result = await action(actionData, updateJourneyData, config)
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
        if (currentStep === INTERACTIVE_PUBLISH_STEPS.length - 1 && result.success && result.walrus_data) {
          // Save to backend before completing
          // Need to get the latest session storage data to ensure walrus data is captured
          const flowId = getFlowId()
          const latestJourneyData = loadJourneyData(flowId)
          
          // Merge current actionData with loaded data to ensure we have everything
          const finalData = {
            ...journeyData,
            ...actionData,
            ...latestJourneyData,
            ...result.walrus_data // Include walrus data if available
          }
          
          try {
            toast.loading('Saving blockchain data...', { id: 'backend-save' })
            await savePublishDataToBackend(
              journeyData,
              agentId,
              agentData,
              config,
              account,
              finalData
            )
            toast.dismiss('backend-save')
            
            // Call onComplete after successful backend save
            setTimeout(() => {
              if (onComplete) {
                onComplete()
              }
            }, 1000)
          } catch (error) {
            toast.dismiss('backend-save')
            // Still proceed with completion even if backend save fails
            console.error('Backend save failed, but proceeding:', error)
            setTimeout(() => {
              if (onComplete) {
                onComplete()
              }
            }, 1000)
          }
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
    console.error('=== STEP ACTION ERROR ===');
    console.error('Step:', step.id);
    console.error('Action:', step.action);
    console.error('Error:', error);
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Journey data at error:', actionData);
    
    toast.error(error.message || 'An error occurred');
    setError(error.message);
    setAnimationPhase('idle');
  } finally {
    setProcessingState(false)
  }
}

// Handle step actions
export const handleStepAction = async (params) => {
  return handleStepActionWithData({ ...params, dataOverride: null })
}

// Check if user has all prerequisites for current step
export const checkStepPrerequisites = (currentStep, journeyData) => {
  const step = INTERACTIVE_PUBLISH_STEPS[currentStep]
  
  if (!step.prerequisites || step.prerequisites.length === 0) {
    return { hasAll: true, missing: [] }
  }
  
  const missing = []
  for (const prereq of step.prerequisites) {
    if (!journeyData[prereq]) {
      missing.push(prereq)
    }
  }
  
  return {
    hasAll: missing.length === 0,
    missing
  }
}

// Move to next step with prerequisite checking
export const moveToNextStep = ({
  currentStep,
  journeyData,
  setCurrentStepState,
  setAnimationPhase,
  setIncompletePrerequisites,
  saveCurrentStep,
  flowId
}) => {
  const nextStep = currentStep + 1
  
  if (nextStep >= INTERACTIVE_PUBLISH_STEPS.length) {
    console.log('No more steps available')
    return
  }
  
  // Check prerequisites for next step
  const { hasAll, missing } = checkStepPrerequisites(nextStep, journeyData)
  
  if (!hasAll) {
    console.log('Missing prerequisites for next step:', missing)
    setIncompletePrerequisites(missing)
    // Still move to the step to show the warning
  } else {
    setIncompletePrerequisites([])
  }
  
  setCurrentStepState(nextStep)
  setAnimationPhase('idle')
  saveCurrentStep(flowId, nextStep)
}

// Move to previous step
export const moveToPreviousStep = ({
  currentStep,
  setCurrentStepState,
  setAnimationPhase,
  setIncompletePrerequisites,
  saveCurrentStep,
  flowId
}) => {
  if (currentStep > 0) {
    const prevStep = currentStep - 1
    setCurrentStepState(prevStep)
    setAnimationPhase('idle')
    setIncompletePrerequisites([])
    saveCurrentStep(flowId, prevStep)
  }
}