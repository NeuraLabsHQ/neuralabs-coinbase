import React from 'react'

export function WalrusInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-medium text-blue-900 mb-2">About Walrus Storage</h3>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• Decentralized storage network built on Sui</li>
        <li>• Files are erasure-coded and distributed across nodes</li>
        <li>• Permanent storage with cryptographic guarantees</li>
        <li>• Access controlled by NFT ownership (Level 4+ required)</li>
        <li>• Supports encrypted and unencrypted files</li>
        <li>• Maximum file size: 10MB (for this demo)</li>
      </ul>
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Encrypted files should be encrypted using Seal before uploading. 
          Store the encryption key ID for later decryption.
        </p>
      </div>
    </div>
  )
}