import React from 'react'
import { INTERACTIVE_PUBLISH_STEPS } from './journeyConfig'

/**
 * Action Content Component
 * Renders the content for each step
 */
export const renderActionContent = (currentStep, journeyData, nftName, nftDescription, setNftName, setNftDescription, handleAction) => {
  const step = INTERACTIVE_PUBLISH_STEPS[currentStep]

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
                <span className="detail-label">Workflow</span>
                <span className="detail-value">{journeyData.selectedFile.name}</span>
              </div>
            </div>
          ) : (
            <div className="workflow-fetch">
              <p>Click below to prepare your agent's workflow for blockchain publishing</p>
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

/**
 * Render prerequisite warning content
 */
export const renderPrerequisiteWarning = (incompleteSteps) => {
  return (
    <div className="action-content prerequisite-warning">
      <div className="warning-message">
        <h4>Complete Previous Steps First</h4>
        <p>The following steps must be completed before you can proceed:</p>
        <ul>
          {incompleteSteps.map((step, index) => (
            <li key={index}>{step.title}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}