import React from 'react'

const TechnicalDetails = ({ showDetails }) => {
  if (!showDetails) return null

  return (
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
  )
}

export default TechnicalDetails