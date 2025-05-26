import React, { useState, useEffect, useRef } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import './EncryptionJourney.css'

const EncryptionJourney = ({ config }) => {
  const account = useCurrentAccount()
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const containerRef = useRef(null)

  const steps = [
    {
      id: 'wallet-connect',
      title: 'Connect Wallet',
      description: 'Your journey begins by connecting your SUI wallet',
      icon: 'wallet',
      details: 'zkLogin enables passwordless authentication using OAuth providers'
    },
    {
      id: 'nft-ownership',
      title: 'NFT Verification',
      description: 'Blockchain verifies your NFT ownership and access level',
      icon: 'nft',
      details: 'Smart contract checks on-chain permissions table for Level 4+ access'
    },
    {
      id: 'message-signing',
      title: 'Message Signing',
      description: 'Sign a personal message to create a session key',
      icon: 'signature',
      details: 'Ed25519 signature creates temporary session key valid for 30 minutes'
    },
    {
      id: 'seal-verification',
      title: 'Seal Verification',
      description: 'Seal servers verify your access permissions',
      icon: 'seal',
      details: '3 key servers validate access through seal_approve Move function'
    },
    {
      id: 'key-generation',
      title: 'Key Generation',
      description: 'Threshold key shares are generated across multiple servers',
      icon: 'keys',
      details: '2-of-3 threshold scheme ensures availability and security'
    },
    {
      id: 'data-encryption',
      title: 'Data Encryption',
      description: 'Your file is encrypted using AES-256 encryption',
      icon: 'encrypt',
      details: 'Symmetric encryption with 256-bit key for maximum security'
    },
    {
      id: 'walrus-storage',
      title: 'Decentralized Storage',
      description: 'Encrypted data is split and stored across Walrus network',
      icon: 'walrus',
      details: 'Erasure coding creates redundant shards across multiple nodes'
    },
    {
      id: 'complete',
      title: 'Secure & Decentralized',
      description: 'Your data is now encrypted and distributed',
      icon: 'complete'
    }
  ]

  const startJourney = () => {
    setIsAnimating(true)
    setCurrentStep(0)
    animateToNextStep()
  }

  const animateToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 3000)
    } else {
      setIsAnimating(false)
    }
  }

  useEffect(() => {
    if (isAnimating && currentStep < steps.length - 1) {
      animateToNextStep()
    }
  }, [currentStep, isAnimating])

  return (
    <div className="encryption-journey" ref={containerRef}>
      <div className="journey-header">
        <h1>The Encryption Journey</h1>
        <p>Experience the magic of decentralized encryption</p>
      </div>

      <div className="journey-container">
        {/* 3D Rotating Cube Animation */}
        <div className="cube-container">
          <div className="cube">
            <div className="cube-face front">
              <svg viewBox="0 0 100 100" className="face-icon">
                <rect x="20" y="20" width="60" height="60" fill="none" stroke="white" strokeWidth="2"/>
                <circle cx="50" cy="50" r="15" fill="white"/>
              </svg>
            </div>
            <div className="cube-face back">
              <svg viewBox="0 0 100 100" className="face-icon">
                <path d="M50 20 L70 40 L70 60 L50 80 L30 60 L30 40 Z" fill="none" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="cube-face left">
              <svg viewBox="0 0 100 100" className="face-icon">
                <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="2"/>
                <path d="M35 50 L50 35 L65 50" fill="none" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="cube-face right">
              <svg viewBox="0 0 100 100" className="face-icon">
                <rect x="30" y="30" width="40" height="40" fill="none" stroke="white" strokeWidth="2"/>
                <line x1="30" y1="50" x2="70" y2="50" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="cube-face top">
              <svg viewBox="0 0 100 100" className="face-icon">
                <polygon points="50,20 70,50 50,80 30,50" fill="none" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="cube-face bottom">
              <svg viewBox="0 0 100 100" className="face-icon">
                <path d="M30 30 Q50 20 70 30 T70 70 Q50 80 30 70 T30 30" fill="none" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="steps-timeline">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`step ${index <= currentStep ? 'active' : ''} ${index === currentStep ? 'current' : ''}`}
            >
              <div className="step-connector">
                <div className="connector-line"></div>
                <div className="pulse-ring"></div>
              </div>
              
              <div className="step-content">
                <div className="step-icon">
                  {renderStepIcon(step.icon, index === currentStep)}
                </div>
                <div className="step-info">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {index === currentStep && step.details && (
                    <p className="step-details">{step.details}</p>
                  )}
                </div>
              </div>

              {index === currentStep && isAnimating && (
                <div className="step-animation">
                  {renderStepAnimation(step.id)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating Particles */}
        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          {!isAnimating ? (
            <button onClick={startJourney} className="journey-button">
              Start Journey
            </button>
          ) : (
            <button onClick={() => setIsAnimating(false)} className="journey-button secondary">
              Pause Journey
            </button>
          )}
          <button 
            onClick={() => setShowDetails(!showDetails)} 
            className="journey-button secondary ml-4"
          >
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </button>
        </div>

        {/* Technical Details Panel */}
        {showDetails && (
          <div className="details-panel">
            <h3>Technical Implementation</h3>
            <div className="details-grid">
              <div className="detail-card">
                <h4>Wallet Connection</h4>
                <p>Using zkLogin for passwordless authentication with JWT tokens</p>
              </div>
              <div className="detail-card">
                <h4>NFT Verification</h4>
                <p>On-chain access control with 6 permission levels (Level 4+ required for encryption)</p>
              </div>
              <div className="detail-card">
                <h4>Seal Encryption</h4>
                <p>Threshold encryption with k-of-n key shares distributed across servers</p>
              </div>
              <div className="detail-card">
                <h4>Walrus Storage</h4>
                <p>Erasure coding splits data into chunks with 2/3 redundancy factor</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Background Grid */}
      <div className="grid-background">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  )

  function renderStepIcon(iconType, isActive) {
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

  function renderStepAnimation(stepId) {
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
}

export default EncryptionJourney