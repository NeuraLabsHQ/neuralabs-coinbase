/**
 * Interactive Journey Configuration
 * Defines the interactive encryption journey steps
 */

export const INTERACTIVE_JOURNEY_STEPS = [
  {
    id: 'wallet',
    title: 'Wallet Connected',
    subtitle: 'Secure connection established',
    icon: 'wallet',
    completed: (data) => !!data.account,
    detail: (data) => data.account ? `${data.account.address.slice(0, 10)}...${data.account.address.slice(-8)}` : ''
  },
  {
    id: 'nft',
    title: 'NFT Verification',
    subtitle: 'Proving ownership & access',
    icon: 'nft',
    completed: (data) => !!data.selectedNFT,
    detail: (data) => data.selectedNFT ? `ID: ${data.selectedNFT.id.slice(0, 12)}... • Level ${data.selectedNFT.accessLevel || '4+'}` : ''
  },
  {
    id: 'seal',
    title: 'Seal Protocol',
    subtitle: "Shamir's secret sharing",
    icon: 'seal',
    completed: (data) => !!data.sealInitialized,
    detail: (data) => data.sealInitialized ? '3-of-5 threshold encryption ready' : ''
  },
  {
    id: 'signature',
    title: 'Digital Signature',
    subtitle: 'Elliptic curve cryptography',
    icon: 'signature',
    completed: (data) => !!data.sessionKey,
    detail: (data) => data.sessionKey ? `${data.sessionKey.slice(0, 16)}...${data.sessionKey.slice(-8)}` : ''
  },
  {
    id: 'file',
    title: 'File Selection',
    subtitle: 'Choose data to protect',
    icon: 'file',
    completed: (data) => !!data.selectedFile,
    detail: (data) => data.selectedFile ? data.selectedFile.name.length > 20 ? data.selectedFile.name.slice(0, 17) + '...' : data.selectedFile.name : ''
  },
  {
    id: 'encrypt',
    title: 'Encryption',
    subtitle: 'AES-256 protection',
    icon: 'encrypt',
    completed: (data) => !!data.mockEncryptedData,
    detail: (data) => data.mockEncryptedData ? `0x${data.mockEncryptedData.encryptedHex?.slice(0, 16) || 'a5b2c3d4e5f6...'}` : ''
  },
  {
    id: 'walrus',
    title: 'Decentralized Storage',
    subtitle: 'Distributing across network',
    icon: 'walrus',
    completed: (data) => !!data.walrusBlobId,
    detail: (data) => data.walrusBlobId ? `Blob: ${data.walrusBlobId.slice(0, 16)}...` : ''
  }
]