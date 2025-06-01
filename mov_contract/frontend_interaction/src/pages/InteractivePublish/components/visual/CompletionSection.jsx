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

  return (
    <motion.div 
      className="completion-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "backOut" }}
    >
      <div className="completion-card">
        <motion.div 
          className="completion-header"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
        >
          <div className="success-icon">🎉</div>
          <h2>Publishing Journey Complete!</h2>
          <p>Your content has been successfully encrypted and stored on the decentralized network</p>
        </motion.div>

        <div className="completion-details">
          {/* Wallet Information */}
          <motion.div 
            className="detail-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="detail-header">
              <span className="detail-icon">🔗</span>
              <h3>Wallet Connection</h3>
            </div>
            <div className="detail-content">
              <div className="detail-item">
                <span className="label">Address:</span>
                <span className="value mono">{journeyData.account?.address || journeyData.walletAddress}</span>
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(journeyData.account?.address || journeyData.walletAddress)}
                >
                  📋
                </button>
              </div>
              <div className="detail-item">
                <span className="label">Network:</span>
                <span className="value">SUI Testnet</span>
              </div>
            </div>
          </motion.div>

          {/* NFT Information */}
          {journeyData.nftId && (
            <motion.div 
              className="detail-group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="detail-header">
                <span className="detail-icon">🎨</span>
                <h3>NFT Publishing Control</h3>
              </div>
              <div className="detail-content">
                <div className="detail-item">
                  <span className="label">NFT Name:</span>
                  <span className="value">{journeyData.nftName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">NFT ID:</span>
                  <span className="value mono">{journeyData.nftId}</span>
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(journeyData.nftId)}
                  >
                    📋
                  </button>
                </div>
                <div className="detail-item">
                  <span className="label">Access Level:</span>
                  <span className="value badge">Level {journeyData.accessLevel?.level || journeyData.accessLevel || 6} (Full Access)</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Seal Protocol Information */}
          <motion.div 
            className="detail-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="detail-header">
              <span className="detail-icon">🔒</span>
              <h3>Seal Protocol Encryption</h3>
            </div>
            <div className="detail-content">
              <div className="detail-item">
                <span className="label">Protocol:</span>
                <span className="value">SUI Seal (Threshold Cryptography)</span>
              </div>
              <div className="detail-item">
                <span className="label">Threshold:</span>
                <span className="value">3-of-5 Key Servers</span>
              </div>
              <div className="detail-item">
                <span className="label">Session Key:</span>
                <span className="value mono">{journeyData.sessionKey ? `${journeyData.sessionKey.slice(0, 20)}...` : 'Active'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Network:</span>
                <span className="value">Seal Testnet</span>
              </div>
            </div>
          </motion.div>

          {/* File Information */}
          {journeyData.selectedFile && (
            <motion.div 
              className="detail-group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="detail-header">
                <span className="detail-icon">📄</span>
                <h3>Published File</h3>
              </div>
              <div className="detail-content">
                <div className="detail-item">
                  <span className="label">File Name:</span>
                  <span className="value">{journeyData.selectedFile.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Original Size:</span>
                  <span className="value">{(journeyData.selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
                <div className="detail-item">
                  <span className="label">Encrypted Size:</span>
                  <span className="value">{journeyData.encryptedData ? (journeyData.encryptedData.length / 1024).toFixed(2) : 'N/A'} KB</span>
                </div>
                <div className="detail-item">
                  <span className="label">Published Time:</span>
                  <span className="value">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Walrus Storage Information */}
          <motion.div 
            className="detail-group highlight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className="detail-header">
              <span className="detail-icon">🐋</span>
              <h3>Walrus Decentralized Storage</h3>
            </div>
            <div className="detail-content">
              <div className="detail-item">
                <span className="label">Blob ID:</span>
                <span className="value mono">{journeyData.walrusBlobId}</span>
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(journeyData.walrusBlobId)}
                >
                  📋
                </button>
              </div>
              <div className="detail-item">
                <span className="label">Storage Network:</span>
                <span className="value">Walrus Testnet</span>
              </div>
              <div className="detail-item">
                <span className="label">Epochs:</span>
                <span className="value">5 Epochs (Permanent Storage)</span>
              </div>
              <div className="detail-item">
                <span className="label">Access URL:</span>
                <div className="url-container">
                  <span className="value mono url">{walrusUrl}</span>
                  <div className="url-actions">
                    <button 
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(walrusUrl)}
                    >
                      📋
                    </button>
                    <a 
                      href={walrusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-btn"
                    >
                      🔗 Open
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="completion-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <button 
              className="action-btn primary"
              onClick={() => window.open(walrusUrl, '_blank')}
            >
              🔗 View on Walrus
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => {
                const details = {
                  walletAddress: journeyData.account?.address || journeyData.walletAddress,
                  nftId: journeyData.nftId,
                  nftName: journeyData.nftName,
                  fileName: journeyData.selectedFile?.name,
                  walrusBlobId: journeyData.walrusBlobId,
                  walrusUrl: walrusUrl,
                  timestamp: new Date().toISOString()
                }
                navigator.clipboard.writeText(JSON.stringify(details, null, 2))
              }}
            >
              📋 Copy All Details
            </button>
            {onNewJourney && (
              <button 
                className="action-btn tertiary"
                onClick={onNewJourney}
              >
                🚀 Start New Journey
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default CompletionSection