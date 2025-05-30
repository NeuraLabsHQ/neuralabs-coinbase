import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useSignPersonalMessage } from '@mysten/dapp-kit'
import toast from 'react-hot-toast'
import { INTERACTIVE_PUBLISH_STEPS } from '../functional/journeyConfig'

/**
 * Action Section Component
 * Handles user interactions for each step
 */
const ActionSection = ({ currentStep, journeyData, isProcessing, animationPhase, onAction, onContinue }) => {
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  
  const step = INTERACTIVE_PUBLISH_STEPS[currentStep]
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      journeyData.selectedFile = file
    }
  }
  
  const handleAction = () => {
    if (step.id === 'mint') {
      journeyData.nftName = nftName
      journeyData.nftDescription = nftDescription
    } else if (step.id === 'signature') {
      // Create session key first
      onAction()
      
      // Then prompt for signature after a short delay
      setTimeout(() => {
        if (journeyData.sessionKeyObject && journeyData.sessionKeyMessage) {
          toast.loading('Please sign the message in your wallet...')
          signPersonalMessage(
            {
              message: journeyData.sessionKeyMessage,
            },
            {
              onSuccess: async (result) => {
                try {
                  await journeyData.sessionKeyObject.setPersonalMessageSignature(result.signature)
                  toast.success('Digital signature created successfully!')
                  // Update the display after successful signing
                  journeyData.sessionKey = `sk_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
                } catch (error) {
                  toast.error('Failed to set signature')
                }
              },
              onError: (error) => {
                if (error.message?.includes('rejected')) {
                  toast.error('Signature rejected by user')
                } else {
                  toast.error(`Failed to sign: ${error.message}`)
                }
              },
            }
          )
        }
      }, 500)
      return
    }
    onAction()
  }
  
  const getActionButtonText = () => {
    switch (step.id) {
      case 'wallet': return journeyData.walletConnected ? 'Wallet Connected' : 'Connect Wallet'
      case 'balances': return 'Check Balances'
      case 'mint': return 'Mint NFT'
      case 'accessCap': return 'Create Access Capability'
      case 'grant': return 'Grant Access'
      case 'verify': return 'Verify Access'
      case 'seal': return 'Initialize Seal'
      case 'signature': return 'Create Session Key'
      case 'file': return 'Continue with Selected File'
      case 'encrypt': return 'Encrypt File'
      case 'walrus': return 'Store on Walrus'
      default: return 'Continue'
    }
  }

  const isStepCompleted = () => {
    return step.completed(journeyData)
  }

  const renderContent = () => {
    switch (step.id) {
      case 'wallet':
        return (
          <div className="action-content">
            {journeyData.walletConnected ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Connected Wallet</span>
                  <span className="detail-value">{journeyData.walletAddress?.slice(0, 10)}...{journeyData.walletAddress?.slice(-8)}</span>
                </div>
              </div>
            ) : (
              <p>Connect your SUI wallet to begin the publishing journey</p>
            )}
          </div>
        )
        
      case 'balances':
        return (
          <div className="action-content">
            {journeyData.suiBalance !== null && journeyData.walBalance !== null ? (
              <div className="balance-info">
                <div className="status-message status-success">
                  <div className="detail-item">
                    <span className="detail-label">SUI Balance</span>
                    <span className="detail-value">{(Number(journeyData.suiBalance) / 1e9).toFixed(4)} SUI</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">WAL Balance</span>
                    <span className="detail-value">{(Number(journeyData.walBalance) / 1e9).toFixed(4)} WAL</span>
                  </div>
                </div>
              </div>
            ) : (
              <p>Check your token balances before proceeding</p>
            )}
          </div>
        )
        
      case 'mint':
        return (
          <div className="action-content">
            {journeyData.nftId ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">NFT Created</span>
                  <span className="detail-value">{journeyData.nftId.slice(0, 12)}...</span>
                </div>
              </div>
            ) : (
              <form className="action-form" onSubmit={(e) => { e.preventDefault(); handleAction(); }}>
                <div className="form-group">
                  <label>NFT Name</label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    placeholder="Enter NFT name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>NFT Description</label>
                  <textarea
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    placeholder="Enter NFT description"
                    rows={3}
                    required
                  />
                </div>
              </form>
            )}
          </div>
        )
        
      case 'accessCap':
        return (
          <div className="action-content">
            {journeyData.accessCapId ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Access Capability</span>
                  <span className="detail-value">Created successfully</span>
                </div>
              </div>
            ) : (
              <p>Create access capability for your NFT</p>
            )}
          </div>
        )

      case 'grant':
        return (
          <div className="action-content">
            {journeyData.completedSteps?.includes(4) ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Access Granted</span>
                  <span className="detail-value">Level 6 permissions</span>
                </div>
              </div>
            ) : (
              <p>Grant yourself access to the NFT</p>
            )}
          </div>
        )

      case 'verify':
        return (
          <div className="action-content">
            {journeyData.accessLevel !== null ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Access Level</span>
                  <span className="detail-value">
                    {typeof journeyData.accessLevel === 'object' 
                      ? journeyData.accessLevel.level || JSON.stringify(journeyData.accessLevel)
                      : journeyData.accessLevel}
                  </span>
                </div>
              </div>
            ) : (
              <p>Verify your access permissions</p>
            )}
          </div>
        )

      case 'seal':
        return (
          <div className="action-content">
            {journeyData.sealClient ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Seal Protocol</span>
                  <span className="detail-value">3-of-5 threshold ready</span>
                </div>
              </div>
            ) : (
              <p>Initialize Seal protocol for secure encryption</p>
            )}
          </div>
        )
        
      case 'file':
        return (
          <div className="action-content">
            {journeyData.selectedFile ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Selected File</span>
                  <span className="detail-value">{journeyData.selectedFile.name}</span>
                </div>
              </div>
            ) : (
              <div className="file-upload">
                <input
                  type="file"
                  id="file-input"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-input" className="file-upload-label">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedFile ? (
                      <>
                        <p>Selected: {selectedFile.name}</p>
                        <p className="file-info">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <p>Click to select file</p>
                        <p className="file-info">Any file type supported</p>
                      </>
                    )}
                  </motion.div>
                </label>
              </div>
            )}
          </div>
        )
        
      case 'signature':
        return (
          <div className="action-content">
            {journeyData.sessionKey ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Session Key</span>
                  <span className="detail-value">{journeyData.sessionKey.slice(0, 16)}...{journeyData.sessionKey.slice(-8)}</span>
                </div>
              </div>
            ) : (
              <p>Create digital signature for encryption</p>
            )}
          </div>
        )

      case 'encrypt':
        return (
          <div className="action-content">
            {journeyData.encryptedData ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Encryption</span>
                  <span className="detail-value">File encrypted successfully</span>
                </div>
              </div>
            ) : (
              <p>Encrypt your file using AES-256</p>
            )}
          </div>
        )

      case 'walrus':
        return (
          <div className="action-content">
            {journeyData.walrusBlobId ? (
              <div className="status-message status-success">
                <div className="detail-item">
                  <span className="detail-label">Storage</span>
                  <span className="detail-value">Published to Walrus</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Blob ID</span>
                  <span className="detail-value">{journeyData.walrusBlobId.slice(0, 12)}...</span>
                </div>
              </div>
            ) : (
              <p>Store encrypted file on Walrus network</p>
            )}
          </div>
        )
        
      default:
        return (
          <div className="action-content">
            <p>{step.subtitle}</p>
          </div>
        )
    }
  }
  
  const isDisabled = () => {
    if (isProcessing) return true
    if (step.id === 'mint' && (!nftName || !nftDescription)) return true
    if (step.id === 'file' && !selectedFile && !journeyData.selectedFile) return true
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
      {renderContent()}
      
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