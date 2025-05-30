import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useSignPersonalMessage } from '@mysten/dapp-kit'
import toast from 'react-hot-toast'
import { INTERACTIVE_PUBLISH_STEPS } from '../functional/journeyConfig'

/**
 * Action Section Component
 * Handles user interactions for each step
 */
const ActionSection = ({ currentStep, journeyData, isProcessing, onAction }) => {
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
      // Special handling for Digital Signature - sign after session key creation
      onAction()
      
      setTimeout(() => {
        if (journeyData.sessionKeyObject && journeyData.sessionKeyMessage) {
          signPersonalMessage(
            {
              message: journeyData.sessionKeyMessage,
            },
            {
              onSuccess: async (result) => {
                await journeyData.sessionKeyObject.setPersonalMessageSignature(result.signature)
                toast.success('Digital signature created successfully!')
              },
              onError: (error) => {
                toast.error(`Failed to sign: ${error.message}`)
              },
            }
          )
        }
      }, 100)
      return
    }
    onAction()
  }
  
  const renderContent = () => {
    switch (step.id) {
      case 'wallet':
        return (
          <div className="action-content">
            <p>Connect your SUI wallet to begin the publishing journey</p>
          </div>
        )
        
      case 'balances':
        return (
          <div className="action-content">
            {journeyData.suiBalance !== null && journeyData.walBalance !== null && (
              <div className="balance-info">
                <div className="status-info">
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
            )}
          </div>
        )
        
      case 'mint':
        return (
          <div className="action-content">
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
          </div>
        )
        
      case 'file':
        return (
          <div className="action-content">
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
          </div>
        )
        
      case 'signature':
        return (
          <div className="action-content">
            <p>Create digital signature for encryption</p>
            {journeyData.sessionKey && (
              <div className="status-info">
                <div className="detail-item">
                  <span className="detail-label">Session Key</span>
                  <span className="detail-value">{journeyData.sessionKey}</span>
                </div>
              </div>
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
    if (step.id === 'file' && !selectedFile) return true
    return false
  }
  
  return (
    <div className="action-section">
      {renderContent()}
      
      {step.action && (
        <motion.button
          type="button"
          className="action-button"
          onClick={(e) => {
            e.preventDefault();
            console.log('Button clicked for step:', step.id);
            console.log('Is disabled:', isDisabled());
            console.log('Is processing:', isProcessing);
            handleAction();
          }}
          disabled={isDisabled()}
          whileHover={{ scale: isDisabled() ? 1 : 1.02 }}
          whileTap={{ scale: isDisabled() ? 1 : 0.98 }}
        >
          {isProcessing ? 'Processing...' : 'Continue'}
        </motion.button>
      )}
    </div>
  )
}

export default ActionSection