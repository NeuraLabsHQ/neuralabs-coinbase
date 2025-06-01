import React from 'react'
import { motion } from 'framer-motion'

/**
 * Completion Section Component
 * Shows all journey details after successful upload
 */
const CompletionSection = ({ journeyData, config, onNewJourney }) => {
  if (!journeyData.walrusBlobId) {
    return null
  }

  const walrusUrl = journeyData.walrusUrl || `${config?.WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space'}/v1/${journeyData.walrusBlobId}`

  const copyToClipboard = async (text, button) => {
    try {
      await navigator.clipboard.writeText(text)
      // Visual feedback
      const originalText = button.textContent
      button.textContent = '✓'
      button.style.color = 'var(--journey-success-color)'
      setTimeout(() => {
        button.textContent = originalText
        button.style.color = ''
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <motion.div 
      className="completion-area"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="completion-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="completion-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
        >
          ✨
        </motion.div>
        
        <h2>Publishing Journey Complete!</h2>
        <p>Your content has been successfully encrypted and stored on the decentralized network</p>

        <div className="journey-details">
          <div className="detail-grid">
            {/* Wallet Section */}
            <motion.div 
              className="detail-group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="detail-header">
                <span className="detail-icon">🔗</span>
                <h3>Wallet Details</h3>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address</span>
                <div className="detail-value-with-action">
                  <span className="detail-value mono">
                    {`${(journeyData.account?.address || journeyData.walletAddress).slice(0, 8)}...${(journeyData.account?.address || journeyData.walletAddress).slice(-6)}`}
                  </span>
                  <button 
                    className="copy-btn"
                    onClick={(e) => copyToClipboard(journeyData.account?.address || journeyData.walletAddress, e.target)}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">Network</span>
                <span className="detail-value">SUI Testnet</span>
              </div>
            </motion.div>

            {/* NFT Section */}
            {journeyData.nftId && (
              <motion.div 
                className="detail-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="detail-header">
                  <span className="detail-icon">🎨</span>
                  <h3>NFT Access Control</h3>
                </div>
                <div className="detail-item">
                  <span className="detail-label">NFT Name</span>
                  <span className="detail-value">{journeyData.nftName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">NFT ID</span>
                  <div className="detail-value-with-action">
                    <span className="detail-value mono">
                      {`${journeyData.nftId.slice(0, 8)}...${journeyData.nftId.slice(-6)}`}
                    </span>
                    <button 
                      className="copy-btn"
                      onClick={(e) => copyToClipboard(journeyData.nftId, e.target)}
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Access Level</span>
                  <span className="detail-value badge success">Level {journeyData.accessLevel?.level || journeyData.accessLevel || 6}</span>
                </div>
              </motion.div>
            )}

            {/* Encryption Section */}
            <motion.div 
              className="detail-group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="detail-header">
                <span className="detail-icon">🔒</span>
                <h3>Seal Encryption</h3>
              </div>
              <div className="detail-item">
                <span className="detail-label">Protocol</span>
                <span className="detail-value">Threshold Cryptography</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Security</span>
                <span className="detail-value">3-of-5 Key Servers</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value badge success">Active Session</span>
              </div>
            </motion.div>

            {/* File Section */}
            {journeyData.selectedFile && (
              <motion.div 
                className="detail-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="detail-header">
                  <span className="detail-icon">📄</span>
                  <h3>File Details</h3>
                </div>
                <div className="detail-item">
                  <span className="detail-label">File Name</span>
                  <span className="detail-value">{journeyData.selectedFile.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Size</span>
                  <span className="detail-value">{(journeyData.selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Timestamp</span>
                  <span className="detail-value">{new Date().toLocaleTimeString()}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Walrus Storage - Highlighted Section */}
          <motion.div 
            className="walrus-highlight-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="walrus-header">
              <span className="walrus-icon">🐋</span>
              <h3>Walrus Decentralized Storage</h3>
            </div>
            
            <div className="walrus-details">
              <div className="blob-id-section">
                <span className="label">Blob ID</span>
                <div className="blob-id-container">
                  <code className="blob-id">{journeyData.walrusBlobId}</code>
                  <button 
                    className="copy-btn-inline"
                    onClick={(e) => copyToClipboard(journeyData.walrusBlobId, e.target)}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              
              <div className="storage-info">
                <div className="info-item">
                  <span className="info-label">Network</span>
                  <span className="info-value">Walrus Testnet</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-value">5 Epochs</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value badge success">Stored</span>
                </div>
              </div>

              <div className="url-section">
                <span className="label">Access URL</span>
                <div className="url-box">
                  <code className="url-text">{walrusUrl}</code>
                  <div className="url-actions">
                    <button 
                      className="url-action-btn"
                      onClick={(e) => copyToClipboard(walrusUrl, e.target)}
                    >
                      📋 Copy
                    </button>
                    <a 
                      href={walrusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="url-action-btn primary"
                    >
                      🔗 Open
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div 
          className="completion-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button 
            className="action-button primary"
            onClick={() => window.open(walrusUrl, '_blank')}
          >
            <span className="button-icon">🐋</span>
            View on Walrus
          </button>
          
          <button 
            className="action-button secondary"
            onClick={(e) => {
              const details = {
                walletAddress: journeyData.account?.address || journeyData.walletAddress,
                nftId: journeyData.nftId,
                nftName: journeyData.nftName,
                fileName: journeyData.selectedFile?.name,
                walrusBlobId: journeyData.walrusBlobId,
                walrusUrl: walrusUrl,
                timestamp: new Date().toISOString()
              }
              copyToClipboard(JSON.stringify(details, null, 2), e.currentTarget)
            }}
          >
            <span className="button-icon">📋</span>
            Copy All Details
          </button>
          
          {onNewJourney && (
            <button 
              className="action-button tertiary"
              onClick={onNewJourney}
            >
              <span className="button-icon">🚀</span>
              Start New Journey
            </button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default CompletionSection