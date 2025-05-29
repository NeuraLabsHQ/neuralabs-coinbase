/**
 * Step Animations Hook
 * Handles icon rendering and step-specific animations
 */
import React from 'react'

export const useStepAnimations = () => {
  const renderStepIcon = (iconType, isActive) => {
    const className = `icon-svg ${isActive ? 'active' : ''}`
    
    switch(iconType) {
      case 'wallet':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 9H7v6h14V9z" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="17" cy="12" r="1" fill="currentColor"/>
          </svg>
        )
      case 'nft':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 7h10v10H7z" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9l6 6m0-6l-6 6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'signature':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <path d="M3 17v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12l4 4 8-8" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      case 'seal':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 7v5l3 3" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        )
      case 'keys':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <circle cx="8" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M13 12h8l-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8" cy="12" r="1" fill="currentColor"/>
          </svg>
        )
      case 'encrypt':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
        )
      case 'walrus':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 3v6m0 6v6m-9-9h6m6 0h6" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        )
      case 'complete':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )
      default:
        return null
    }
  }

  const renderStepAnimation = (stepId) => {
    switch(stepId) {
      case 'wallet-connect':
        return (
          <div className="wallet-connect-anim">
            <div className="wallet-pulse"></div>
            <div className="connection-beam"></div>
          </div>
        )
      case 'nft-ownership':
        return (
          <div className="nft-verify-anim">
            <div className="blockchain-grid">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="grid-block"></div>
              ))}
            </div>
          </div>
        )
      case 'message-signing':
        return (
          <div className="signature-anim">
            <svg className="signature-svg" viewBox="0 0 200 100">
              <path className="signature-path" d="M20,50 Q50,20 80,50 T140,50 Q170,30 180,40" 
                fill="none" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
        )
      case 'seal-verification':
        return (
          <div className="seal-verify-anim">
            <div className="server-node server-1">
              <span className="server-label">KS1</span>
            </div>
            <div className="server-node server-2">
              <span className="server-label">KS2</span>
            </div>
            <div className="server-node server-3">
              <span className="server-label">KS3</span>
            </div>
            <div className="verification-rays"></div>
            <div className="central-node"></div>
          </div>
        )
      case 'key-generation':
        return (
          <div className="key-gen-anim">
            <div className="key-fragment fragment-1"></div>
            <div className="key-fragment fragment-2"></div>
            <div className="key-fragment fragment-3"></div>
            <div className="key-assembly"></div>
          </div>
        )
      case 'data-encryption':
        return (
          <div className="encryption-anim">
            <div className="data-block plain">
              <span className="data-label">Plain</span>
            </div>
            <div className="encryption-process">
              <div className="encryption-wave"></div>
              <span className="algo-label">AES-256</span>
            </div>
            <div className="data-block encrypted">
              <span className="data-label">Encrypted</span>
            </div>
          </div>
        )
      case 'walrus-storage':
        return (
          <div className="walrus-anim">
            <div className="data-shards">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`shard shard-${i}`}></div>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return {
    renderStepIcon,
    renderStepAnimation
  }
}