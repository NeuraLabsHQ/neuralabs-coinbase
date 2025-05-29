/**
 * Journey Steps Configuration
 * Defines the encryption journey flow steps
 */

export const JOURNEY_STEPS = [
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