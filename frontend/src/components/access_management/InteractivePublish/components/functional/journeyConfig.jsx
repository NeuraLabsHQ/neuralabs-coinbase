export const INTERACTIVE_PUBLISH_STEPS = [
  {
    id: 'wallet',
    title: 'Wallet Connected',
    subtitle: 'Secure connection established',
    icon: 'wallet',
    completed: (data) => !!data.walletConnected,
    detail: (data) => data.walletAddress ? `${data.walletAddress.slice(0, 10)}...${data.walletAddress.slice(-8)}` : '',
    action: 'connectWallet',
  },
  {
    id: 'balances',
    title: 'Balance Check',
    subtitle: 'Verifying token holdings',
    icon: 'balance',
    completed: (data) => data.suiBalance !== null && data.walBalance !== null,
    detail: (data) => {
      if (data.suiBalance !== null && data.walBalance !== null) {
        const suiAmount = (Number(data.suiBalance) / 1e9).toFixed(2);
        const walAmount = (Number(data.walBalance) / 1e9).toFixed(2);
        return `SUI: ${suiAmount} • WAL: ${walAmount}`;
      }
      return '';
    },
    action: 'checkBalances',
  },
  {
    id: 'mint',
    title: 'NFT Creation',
    subtitle: 'Minting unique identifier',
    icon: 'nft',
    completed: (data) => !!data.nftId,
    detail: (data) => data.nftId ? `ID: ${data.nftId.slice(0, 12)}...` : '',
    action: 'mintNFT',
    requiredFields: ['nftName', 'nftDescription'],
  },
  {
    id: 'accessCap',
    title: 'Access Capability',
    subtitle: 'Creating permission system',
    icon: 'key',
    completed: (data) => !!data.accessCapId,
    detail: (data) => data.accessCapId ? 'Access control initialized' : '',
    action: 'createAccessCap',
  },
  {
    id: 'grant',
    title: 'Grant Access',
    subtitle: 'Setting ownership permissions',
    icon: 'shield',
    completed: (data) => data.completedSteps && data.completedSteps.includes(4),
    detail: (data) => 'Level 6 access granted',
    action: 'grantSelfAccess',
  },
  {
    id: 'verify',
    title: 'Access Verification',
    subtitle: 'Confirming permissions',
    icon: 'check',
    completed: (data) => data.accessLevel !== null,
    detail: (data) => {
      if (data.accessLevel) {
        if (typeof data.accessLevel === 'object') {
          return `Access Level: ${data.accessLevel.level || 'Unknown'}`;
        }
        return `Access Level: ${data.accessLevel}`;
      }
      return '';
    },
    action: 'verifyAccess',
  },
  {
    id: 'seal',
    title: 'Seal Protocol',
    subtitle: "Shamir's secret sharing",
    icon: 'seal',
    completed: (data) => !!data.sealClient,
    detail: (data) => data.sealClient ? '3-of-5 threshold encryption ready' : '',
    action: 'initializeSeal',
  },
  {
    id: 'signature',
    title: 'Digital Signature',
    subtitle: 'Shamir\'s secret sharing',
    icon: 'signature',
    completed: (data) => !!data.sessionKey && (data.sessionKeySigned || data.signatureCompleted),
    detail: (data) => data.sessionKey && data.sessionKeySigned ? 'Threshold signature created' : data.sessionKey ? 'Awaiting signature...' : '',
    action: 'createSessionKey',
  },
  {
    id: 'file',
    title: 'Select Workflow',
    subtitle: 'Preparing agent workflow for blockchain',
    icon: 'file',
    completed: (data) => !!data.selectedFile,
    detail: (data) => data.selectedFile ? 'Workflow ready for publishing' : '',
    action: 'selectFile',
  },
  {
    id: 'encrypt',
    title: 'Encryption',
    subtitle: 'AES-256 protection',
    icon: 'encrypt',
    completed: (data) => !!data.encryptedData,
    detail: (data) => data.encryptedData ? 'Content encrypted' : '',
    action: 'encryptFile',
  },
  {
    id: 'walrus',
    title: 'Decentralized Storage',
    subtitle: 'Publishing to network',
    icon: 'walrus',
    completed: (data) => !!data.walrusBlobId,
    detail: (data) => data.walrusBlobId ? `Published successfully` : '',
    action: 'storeFile',
  }
];

export const initialState = {
  currentStep: 0,
  completedSteps: [],
  walletConnected: false,
  walletAddress: null,
  suiBalance: null,
  walBalance: null,
  nftId: null,
  nftName: '',
  nftDescription: '',
  accessCapId: null,
  accessLevel: null,
  sealClient: null,
  sessionKey: null,
  selectedFile: null,
  encryptedData: null,
  walrusUrl: null,
  error: null,
  loading: false,
  transactionDigest: null,
};