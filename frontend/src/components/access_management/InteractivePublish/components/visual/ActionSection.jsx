import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSignPersonalMessage } from '@mysten/dapp-kit'
import toast from 'react-hot-toast'
import { INTERACTIVE_PUBLISH_STEPS } from '../functional/journeyConfig'

/**
 * Action Section Component
 * Handles user interactions for each step (buttons only, content moved to AnimationSection)
 */
const ActionSection = ({ currentStep, journeyData, isProcessing, animationPhase, onAction, onContinue, setAnimationPhase }) => {
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const [isSignatureTriggered, setIsSignatureTriggered] = useState(false)
  
  const step = INTERACTIVE_PUBLISH_STEPS[currentStep]
  
  // Effect to handle signature when session key is ready
  useEffect(() => {
    if (step.id === 'signature' && 
        journeyData.sessionKeyNeedsSignature && 
        journeyData.sessionKeyObject && 
        journeyData.sessionKeyMessage &&
        !isSignatureTriggered &&
        animationPhase === 'awaiting-signature') {
      
      console.log('Session key ready, triggering signature...');
      setIsSignatureTriggered(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Please sign the message in your wallet to enable Shamir\'s Secret Sharing...');
      
      // Trigger the wallet signature popup
      signPersonalMessage(
        {
          message: journeyData.sessionKeyMessage,
        },
        {
          onSuccess: async (result) => {
            try {
              toast.dismiss(loadingToast);
              console.log('Signature received:', result.signature);
              
              // Set the signature on the session key object
              await journeyData.sessionKeyObject.setPersonalMessageSignature(result.signature);
              
              // Update journey data to indicate signature is complete
              journeyData.sessionKeySigned = true;
              journeyData.signatureCompleted = true;
              journeyData.sessionKeyNeedsSignature = false;
              
              toast.success('Digital signature created! Shamir\'s Secret Sharing activated.');
              
              // Trigger completion
              setAnimationPhase('completed');
              
              // Mark step as complete after a short delay
              setTimeout(() => {
                setAnimationPhase('step-completed');
              }, 1500);
            } catch (error) {
              console.error('Error setting signature:', error);
              toast.error('Failed to set signature on session key');
              setIsSignatureTriggered(false); // Allow retry
            }
          },
          onError: (error) => {
            toast.dismiss(loadingToast);
            console.error('Signature error:', error);
            
            if (error.message?.includes('rejected') || error.message?.includes('cancel')) {
              toast.error('Signature cancelled. Please click the button to try again.');
            } else {
              toast.error(`Signature failed: ${error.message || 'Unknown error'}`);
            }
            setIsSignatureTriggered(false); // Allow retry
          },
        }
      );
    }
  }, [step.id, journeyData, animationPhase, isSignatureTriggered, signPersonalMessage, setAnimationPhase]);
  
  const handleAction = async () => {
    if (step.id === 'signature') {
      // For signature step, we need different behavior
      // Just trigger the action and let the parent handle it
      console.log('Digital signature step - triggering action');
      onAction();
      return;
    } else {
      // For all other steps, just call the action
      onAction()
    }
  }
  
  // Removed handleShowActionContent as content is now always visible in AnimationSection
  
  const getActionButtonText = () => {
    switch (step.id) {
      case 'wallet': return journeyData.walletConnected ? 'Wallet Connected' : 'Connect Wallet'
      case 'balances': return 'Check Balances'
      case 'mint': return 'Mint NFT'
      case 'accessCap': return 'Create Access Capability'
      case 'grant': return 'Grant Access'
      case 'verify': return 'Verify Access'
      case 'seal': return 'Initialize Seal'
      case 'signature': 
        if (animationPhase === 'awaiting-signature') return 'Waiting for Signature...'
        if (isSignatureTriggered) return 'Check Your Wallet'
        return 'Create Session Key'
      case 'file': return 'Continue with Selected File'
      case 'encrypt': return 'Encrypt File'
      case 'walrus': return 'Store on Walrus'
      default: return 'Continue'
    }
  }

  const isStepCompleted = () => {
    return step.completed(journeyData)
  }
  
  const isDisabled = () => {
    if (isProcessing) return true
    if (step.id === 'file' && !journeyData.selectedFile) return true
    return false
  }
  
  const shouldShowContinueButton = () => {
    return animationPhase === 'step-completed' || isStepCompleted()
  }
  
  const shouldShowActionButton = () => {
    return step.action && !isStepCompleted() && animationPhase !== 'step-completed'
  }
  
  return (
    <div className="action-section">
      <div className="button-container">
        {shouldShowActionButton() && (
          <motion.button
            type="button"
            className="action-button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Action button clicked for step:', step.id);
              console.log('Is disabled:', isDisabled());
              console.log('Is processing:', isProcessing);
              handleAction();
            }}
            disabled={isDisabled()}
            whileHover={{ scale: isDisabled() ? 1 : 1.02 }}
            whileTap={{ scale: isDisabled() ? 1 : 0.98 }}
          >
            {isProcessing ? 'Processing...' : getActionButtonText()}
          </motion.button>
        )}
        
        {shouldShowContinueButton() && currentStep < INTERACTIVE_PUBLISH_STEPS.length - 1 && (
          <motion.button
            type="button"
            className="continue-button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Continue button clicked, advancing to next step');
              onContinue();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue to Next Step
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default ActionSection