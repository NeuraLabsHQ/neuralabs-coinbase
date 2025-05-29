import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
/**
 * Action Section Component
 * Displays action cards based on current step
 */
const ActionSection = ({ 
  currentStep, 
  steps, 
  journeyData, 
  isProcessing, 
  account,
  setCurrentStep,
  selectNFT,
  createSessionKey,
  selectFile,
  mockEncrypt,
  mockUploadToWalrus,
  initializeSeal
}) => {
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      selectFile(file)
    }
  }

  return (
    <div className="action-section">
      <AnimatePresence mode="wait">
        {currentStep === 0 && account && (
          <motion.div className="action-card" key="wallet">
            <h2>Wallet Connected</h2>
            <p className="wallet-address">{account.address.slice(0, 8)}...{account.address.slice(-6)}</p>
            <button 
              className="action-button"
              onClick={() => setCurrentStep(1)}
            >
              Continue
            </button>
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div className="action-card" key="nft">
            <h2>Select Your NFT</h2>
            <div className="nft-selection">
              {journeyData.userNFTs.map((nft) => (
                <motion.div
                  key={nft.id}
                  className="nft-option"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectNFT(nft)}
                >
                  <div className="nft-visual">NFT</div>
                  <span>{nft.name}</span>
                </motion.div>
              ))}
            </div>
            {journeyData.userNFTs.length === 0 && (
              <p className="no-nfts">No NFTs found. Please mint one first.</p>
            )}
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div className="action-card" key="seal">
            <h2>Seal Protocol</h2>
            <p>Initialize threshold encryption network</p>
            {!journeyData.sealInitialized ? (
              <button 
                className="action-button"
                onClick={initializeSeal}
                disabled={isProcessing}
              >
                {isProcessing ? 'Initializing...' : 'Initialize Seal'}
              </button>
            ) : (
              <div className="seal-status">
                <span className="status-complete">✓ Connected to 3-of-5 key servers</span>
              </div>
            )}
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div className="action-card" key="signature">
            <h2>Digital Signature</h2>
            <p>Sign with elliptic curve cryptography</p>
            <button 
              className="action-button"
              onClick={createSessionKey}
              disabled={isProcessing}
            >
              {isProcessing ? 'Signing...' : 'Create Signature'}
            </button>
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div className="action-card" key="file">
            <h2>Select File</h2>
            <input 
              type="file"
              onChange={handleFileSelect}
              className="file-input"
            />
            {journeyData.selectedFile && (
              <p className="file-name">{journeyData.selectedFile.name}</p>
            )}
          </motion.div>
        )}

        {currentStep === 5 && (
          <motion.div className="action-card" key="encrypt">
            <h2>Encrypt File</h2>
            <p>Protect your data with military-grade encryption</p>
            <button 
              className="action-button"
              onClick={() => mockEncrypt(journeyData.selectedFile, journeyData)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Encrypting...' : 'Encrypt'}
            </button>
          </motion.div>
        )}

        {currentStep === 6 && (
          <motion.div className="action-card" key="walrus">
            <h2>Upload to Walrus</h2>
            <p>Store on decentralized network</p>
            <button 
              className="action-button"
              onClick={() => mockUploadToWalrus(journeyData.mockEncryptedData)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Uploading...' : 'Upload'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ActionSection