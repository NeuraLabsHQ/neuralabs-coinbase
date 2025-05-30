import React from 'react'
import { motion } from 'framer-motion'

/**
 * Completion Section Component
 * Shows success state with journey details
 */
const CompletionSection = ({ journeyData, onNewJourney }) => {
  return (
    <div className="completion-area">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="completion-icon">✨</div>
        
        <div className="completion-content">
          <h2>Published Successfully!</h2>
          <p>Your content has been encrypted and stored on the decentralized network</p>
        </div>
        
        <div className="completion-details">
          <div className="detail-item">
            <span className="detail-label">NFT ID</span>
            <span className="detail-value">{journeyData.nftId?.slice(0, 20)}...</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">NFT Name</span>
            <span className="detail-value">{journeyData.nftName}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Access Level</span>
            <span className="detail-value">Level {journeyData.accessLevel?.level || journeyData.accessLevel || 6} (Full Access)</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">File</span>
            <span className="detail-value">{journeyData.selectedFile?.name}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Encryption</span>
            <span className="detail-value">AES-256 with Seal Protocol</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Storage</span>
            <span className="detail-value">Walrus Decentralized Network</span>
          </div>
          
          {journeyData.walrusBlobId && (
            <div className="detail-item">
              <span className="detail-label">Walrus Blob ID</span>
              <span className="detail-value">{journeyData.walrusBlobId}</span>
              <button 
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(journeyData.walrusBlobId)}
                style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '12px' }}
              >
                📋
              </button>
            </div>
          )}
          
          {journeyData.walrusUrl && (
            <div className="detail-item">
              <span className="detail-label">Access URL</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="detail-value" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                  {journeyData.walrusUrl.length > 40 ? `${journeyData.walrusUrl.slice(0, 40)}...` : journeyData.walrusUrl}
                </span>
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(journeyData.walrusUrl)}
                  style={{ padding: '2px 6px', fontSize: '12px' }}
                >
                  📋
                </button>
                <a 
                  href={journeyData.walrusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '2px 6px', fontSize: '12px', textDecoration: 'none' }}
                >
                  🔗
                </a>
              </div>
            </div>
          )}
          
          {journeyData.transactionDigest && (
            <div className="detail-item">
              <span className="detail-label">Transaction</span>
              <span className="detail-value">{journeyData.transactionDigest.slice(0, 20)}...</span>
            </div>
          )}
        </div>
        
        <motion.button
          className="new-journey-button"
          onClick={onNewJourney}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start New Publishing Journey
        </motion.button>
      </motion.div>
    </div>
  )
}

export default CompletionSection