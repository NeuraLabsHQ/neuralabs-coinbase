import React, { useState, useEffect, useRef } from 'react'
import { useCurrentAccount, useSuiClient, useSignPersonalMessage, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { SessionKey, SealClient } from '@mysten/seal'
import { WalrusClient } from '@mysten/walrus'
import { Transaction } from '@mysten/sui/transactions'
import { fromHex, toHex } from '@mysten/sui/utils'
import toast from 'react-hot-toast'
import './InteractiveEncryptionJourney.css'

const InteractiveEncryptionJourney = ({ config }) => {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  // Core state
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [stepAnimation, setStepAnimation] = useState(null)
  
  // Data state
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [userNFTs, setUserNFTs] = useState([])
  const [sessionKey, setSessionKey] = useState(null)
  const [sealClient, setSealClient] = useState(null)
  const [walrusClient, setWalrusClient] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [encryptedData, setEncryptedData] = useState(null)
  const [walrusBlobId, setWalrusBlobId] = useState(null)
  
  // Animation refs
  const animationContainerRef = useRef(null)

  const steps = [
    {
      id: 'wallet-connected',
      title: 'Wallet Connected',
      description: 'Your SUI wallet is connected and ready',
      icon: 'wallet',
      action: null,
      completed: () => !!account
    },
    {
      id: 'nft-selection',
      title: 'Select & Verify NFT',
      description: 'Choose an NFT with Level 4+ access',
      icon: 'nft',
      action: 'selectNFT',
      completed: () => !!selectedNFT
    },
    {
      id: 'message-signing',
      title: 'Sign Message',
      description: 'Create a session key by signing a message',
      icon: 'signature',
      action: 'signMessage',
      completed: () => !!sessionKey
    },
    {
      id: 'seal-init',
      title: 'Initialize Seal',
      description: 'Connect to Seal key servers',
      icon: 'seal',
      action: 'initializeSeal',
      completed: () => !!sealClient
    },
    {
      id: 'file-selection',
      title: 'Select File',
      description: 'Choose a file to encrypt',
      icon: 'file',
      action: 'selectFile',
      completed: () => !!selectedFile
    },
    {
      id: 'encryption',
      title: 'Encrypt Data',
      description: 'Encrypt your file with AES-256',
      icon: 'encrypt',
      action: 'encryptFile',
      completed: () => !!encryptedData
    },
    {
      id: 'walrus-upload',
      title: 'Upload to Walrus',
      description: 'Store encrypted data on decentralized network',
      icon: 'walrus',
      action: 'uploadToWalrus',
      completed: () => !!walrusBlobId
    }
  ]

  // Initialize clients
  useEffect(() => {
    if (account) {
      loadUserNFTs()
      initializeWalrus()
    }
  }, [account])

  // Update current step based on completion
  useEffect(() => {
    const nextIncompleteStep = steps.findIndex(step => !step.completed())
    if (nextIncompleteStep !== -1 && nextIncompleteStep !== currentStep) {
      setCurrentStep(nextIncompleteStep)
    }
  }, [selectedNFT, sessionKey, sealClient, selectedFile, encryptedData, walrusBlobId])

  const loadUserNFTs = async () => {
    if (!account || !client) return
    
    try {
      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${config.PACKAGE_ID}::nft::NeuraLabsNFT`
        },
        options: {
          showContent: true,
          showType: true
        }
      })
      
      const nfts = objects.data
        .filter(obj => obj.data?.content?.dataType === 'moveObject')
        .map(obj => ({
          id: obj.data.objectId,
          name: obj.data.content.fields.name,
          description: obj.data.content.fields.description,
          creator: obj.data.content.fields.creator
        }))
      
      setUserNFTs(nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
    }
  }

  const initializeWalrus = async () => {
    try {
      const walrus = new WalrusClient({
        network: 'testnet',
        suiClient: client
      })
      setWalrusClient(walrus)
    } catch (error) {
      console.error('Error initializing Walrus:', error)
    }
  }

  const checkNFTAccess = async (nftId) => {
    try {
      const registry = await client.getObject({
        id: config.REGISTRY_ID,
        options: { showContent: true }
      })
      
      const permissionsTableId = registry.data.content.fields.permissions.fields.id.id
      const nftPermissions = await client.getDynamicFieldObject({
        parentId: permissionsTableId,
        name: {
          type: '0x2::object::ID',
          value: nftId
        }
      })
      
      if (!nftPermissions.data) return { hasAccess: false, level: 0 }
      
      const userPermissionsTableId = nftPermissions.data.content.fields.value.fields.id.id
      const userAccess = await client.getDynamicFieldObject({
        parentId: userPermissionsTableId,
        name: {
          type: 'address',
          value: account.address
        }
      })
      
      const level = userAccess.data ? parseInt(userAccess.data.content.fields.value) : 0
      return { hasAccess: level >= 4, level }
    } catch (error) {
      console.error('Error checking access:', error)
      return { hasAccess: false, level: 0 }
    }
  }

  const handleAction = async (action) => {
    setIsProcessing(true)
    
    switch (action) {
      case 'selectNFT':
        // Handled by NFT selection UI
        break
        
      case 'signMessage':
        await handleSignMessage()
        break
        
      case 'initializeSeal':
        await handleInitializeSeal()
        break
        
      case 'selectFile':
        // Handled by file input
        break
        
      case 'encryptFile':
        await handleEncryptFile()
        break
        
      case 'uploadToWalrus':
        await handleUploadToWalrus()
        break
    }
    
    setIsProcessing(false)
  }

  const handleSignMessage = async () => {
    const toastId = toast.loading('Creating session key...')
    setStepAnimation('signing')
    
    try {
      const key = new SessionKey({
        address: account.address,
        packageId: config.PACKAGE_ID,
        ttlMin: 30
      })
      
      const messageBytes = key.getPersonalMessage()
      
      signPersonalMessage(
        { message: messageBytes },
        {
          onSuccess: async (result) => {
            await key.setPersonalMessageSignature(result.signature)
            setSessionKey(key)
            setStepAnimation('signed')
            toast.success('Session key created!', { id: toastId })
            
            // Mark step as completed
            setCompletedSteps([...completedSteps, 'message-signing'])
          },
          onError: (error) => {
            setStepAnimation(null)
            toast.error('Failed to sign message', { id: toastId })
          }
        }
      )
    } catch (error) {
      setStepAnimation(null)
      toast.error('Failed to create session key', { id: toastId })
    }
  }

  const handleInitializeSeal = async () => {
    const toastId = toast.loading('Connecting to Seal servers...')
    setStepAnimation('connecting-servers')
    
    try {
      const keyServerIds = [
        '0x713de2776691e4704aeb9bba9f271a8427be8a4c24092337fdaa9e4b19ca2d48'
      ]
      
      const seal = new SealClient({
        suiClient: client,
        serverObjectIds: keyServerIds,
        verifyKeyServers: false
      })
      
      setSealClient(seal)
      setStepAnimation('servers-connected')
      toast.success('Connected to Seal servers!', { id: toastId })
      setCompletedSteps([...completedSteps, 'seal-init'])
      
    } catch (error) {
      setStepAnimation(null)
      toast.error('Failed to connect to Seal', { id: toastId })
    }
  }

  const handleEncryptFile = async () => {
    if (!selectedFile || !sealClient || !selectedNFT) return
    
    const toastId = toast.loading('Encrypting file...')
    setStepAnimation('encrypting')
    
    try {
      const fileContent = await readFileAsArrayBuffer(selectedFile)
      const data = new Uint8Array(fileContent)
      
      const nftIdBytes = fromHex(selectedNFT.id)
      const paddedNftId = new Uint8Array(32)
      paddedNftId.set(nftIdBytes.slice(0, 32))
      
      const nonce = crypto.getRandomValues(new Uint8Array(16))
      const fullId = new Uint8Array([...paddedNftId, ...nonce])
      
      const { encryptedObject, key } = await sealClient.encrypt({
        threshold: 2,
        packageId: config.PACKAGE_ID,
        id: fullId,
        data: data
      })
      
      setEncryptedData({
        data: encryptedObject,
        key: key,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        encryptionId: toHex(fullId)
      })
      
      setStepAnimation('encrypted')
      toast.success('File encrypted successfully!', { id: toastId })
      setCompletedSteps([...completedSteps, 'encryption'])
      
    } catch (error) {
      setStepAnimation(null)
      toast.error('Encryption failed', { id: toastId })
    }
  }

  const handleUploadToWalrus = async () => {
    if (!encryptedData || !walrusClient) return
    
    const toastId = toast.loading('Uploading to Walrus...')
    setStepAnimation('uploading')
    
    try {
      const dataToStore = JSON.stringify({
        metadata: {
          fileName: encryptedData.fileName,
          fileSize: encryptedData.fileSize,
          nftId: selectedNFT.id,
          encryptionId: encryptedData.encryptionId,
          uploadedBy: account.address
        },
        encryptedData: toHex(encryptedData.data)
      })
      
      const response = await walrusClient.store({
        data: new TextEncoder().encode(dataToStore),
        epochs: 5
      })
      
      const blobId = response.newlyCreated?.blobObject.blobId || response.alreadyCertified?.blobId
      setWalrusBlobId(blobId)
      
      setStepAnimation('uploaded')
      toast.success('Uploaded to Walrus!', { id: toastId })
      setCompletedSteps([...completedSteps, 'walrus-upload'])
      
    } catch (error) {
      setStepAnimation(null)
      toast.error('Upload failed', { id: toastId })
    }
  }

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const selectNFT = async (nft) => {
    setIsProcessing(true)
    setStepAnimation('verifying-nft')
    
    const access = await checkNFTAccess(nft.id)
    
    if (access.hasAccess) {
      setSelectedNFT({ ...nft, accessLevel: access.level })
      setStepAnimation('nft-verified')
      toast.success(`NFT verified! Access level: ${access.level}`)
      setCompletedSteps([...completedSteps, 'nft-selection'])
    } else {
      setStepAnimation(null)
      toast.error(`Insufficient access (Level ${access.level}/4)`)
    }
    
    setIsProcessing(false)
  }

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
      case 'file':
        return (
          <svg viewBox="0 0 24 24" className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2"/>
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
      default:
        return null
    }
  }

  return (
    <div className="interactive-journey">
      <div className="journey-container">
        <div className="journey-header">
          <h1>Interactive Encryption Journey</h1>
          <p>Complete each step to encrypt and store your data securely</p>
        </div>

        <div className="journey-content">
          {/* Progress Timeline */}
          <div className="progress-timeline">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`timeline-step ${step.completed() ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
              >
                <div className="step-indicator">
                  <div className="step-circle">
                    {step.completed() ? (
                      <svg viewBox="0 0 24 24" className="checkmark-icon">
                        <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      renderStepIcon(step.icon, index === currentStep)
                    )}
                  </div>
                  {index < steps.length - 1 && <div className="step-line"></div>}
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Panel */}
          <div className="action-panel">
            {currentStep === 0 && account && (
              <div className="action-card">
                <div className="success-animation">
                  <svg viewBox="0 0 100 100" className="wallet-success">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#4ade80" strokeWidth="3"/>
                    <path d="M30 50 L45 65 L70 35" fill="none" stroke="#4ade80" strokeWidth="3" 
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Wallet Connected</h3>
                <p>Address: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="action-button"
                >
                  Continue to NFT Selection
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="action-card">
                <h3>Select an NFT</h3>
                <p>Choose an NFT with Level 4+ access</p>
                <div className="nft-grid">
                  {userNFTs.map((nft) => (
                    <div 
                      key={nft.id}
                      className={`nft-card ${selectedNFT?.id === nft.id ? 'selected' : ''}`}
                      onClick={() => selectNFT(nft)}
                    >
                      <div className="nft-icon">NFT</div>
                      <h4>{nft.name}</h4>
                      <p>{nft.id.slice(0, 8)}...</p>
                    </div>
                  ))}
                </div>
                {userNFTs.length === 0 && (
                  <p className="no-nfts">No NFTs found. Please mint an NFT first.</p>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="action-card">
                <h3>Create Session Key</h3>
                <p>Sign a message to create a temporary session key</p>
                <button 
                  onClick={() => handleAction('signMessage')}
                  disabled={isProcessing}
                  className="action-button"
                >
                  {isProcessing ? 'Signing...' : 'Sign Message'}
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="action-card">
                <h3>Connect to Seal Servers</h3>
                <p>Initialize connection to threshold encryption servers</p>
                <button 
                  onClick={() => handleAction('initializeSeal')}
                  disabled={isProcessing}
                  className="action-button"
                >
                  {isProcessing ? 'Connecting...' : 'Connect to Seal'}
                </button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="action-card">
                <h3>Select File to Encrypt</h3>
                <p>Choose a file (max 10MB)</p>
                <input 
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file && file.size <= 10 * 1024 * 1024) {
                      setSelectedFile(file)
                      setStepAnimation('file-selected')
                      setCompletedSteps([...completedSteps, 'file-selection'])
                    } else {
                      toast.error('File size must be less than 10MB')
                    }
                  }}
                  className="file-input"
                />
                {selectedFile && (
                  <p className="file-info">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div className="action-card">
                <h3>Encrypt Your File</h3>
                <p>Encrypt using AES-256 with threshold keys</p>
                <button 
                  onClick={() => handleAction('encryptFile')}
                  disabled={isProcessing}
                  className="action-button"
                >
                  {isProcessing ? 'Encrypting...' : 'Encrypt File'}
                </button>
              </div>
            )}

            {currentStep === 6 && (
              <div className="action-card">
                <h3>Upload to Walrus</h3>
                <p>Store encrypted data on decentralized network</p>
                <button 
                  onClick={() => handleAction('uploadToWalrus')}
                  disabled={isProcessing}
                  className="action-button"
                >
                  {isProcessing ? 'Uploading...' : 'Upload to Walrus'}
                </button>
              </div>
            )}

            {currentStep === 7 && walrusBlobId && (
              <div className="action-card success">
                <div className="success-animation">
                  <svg viewBox="0 0 100 100" className="complete-success">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#4ade80" strokeWidth="3"/>
                    <path d="M25 50 L40 65 L75 30" fill="none" stroke="#4ade80" strokeWidth="4" 
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Encryption Complete!</h3>
                <p>Your file has been encrypted and stored on Walrus</p>
                <div className="result-info">
                  <p><strong>Blob ID:</strong> {walrusBlobId.slice(0, 16)}...</p>
                  <p><strong>File:</strong> {encryptedData.fileName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Animation Display */}
          <div className="animation-display" ref={animationContainerRef}>
            {renderStepAnimation()}
          </div>
        </div>
      </div>
    </div>
  )

  function renderStepAnimation() {
    if (!stepAnimation) return null

    switch (stepAnimation) {
      case 'verifying-nft':
        return (
          <div className="animation-container">
            <div className="nft-verify-animation">
              <div className="nft-card-3d">
                <div className="card-face front">NFT</div>
                <div className="card-face back">
                  <div className="scanning-line"></div>
                </div>
              </div>
              <p className="animation-label">Verifying Access...</p>
            </div>
          </div>
        )

      case 'nft-verified':
        return (
          <div className="animation-container">
            <div className="nft-verified-animation">
              <div className="verified-card">
                <svg viewBox="0 0 100 100" className="shield-icon">
                  <path d="M50 10 L80 25 L80 55 Q80 80 50 90 Q20 80 20 55 L20 25 Z" 
                        fill="#4ade80" fillOpacity="0.2" stroke="#4ade80" strokeWidth="2"/>
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" 
                        fontSize="20" fill="#4ade80" fontWeight="bold">4+</text>
                </svg>
                <p>Access Level {selectedNFT?.accessLevel}</p>
              </div>
            </div>
          </div>
        )

      case 'signing':
        return (
          <div className="animation-container">
            <div className="signature-animation">
              <svg viewBox="0 0 300 150" className="signature-svg">
                <path className="signature-path animated" 
                      d="M30,75 Q60,40 90,75 T150,75 Q180,50 210,75 T270,75" 
                      fill="none" stroke="white" strokeWidth="3"/>
              </svg>
              <p className="animation-label">Creating Digital Signature...</p>
            </div>
          </div>
        )

      case 'signed':
        return (
          <div className="animation-container">
            <div className="signed-animation">
              <div className="signature-seal">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="#4ade80" fillOpacity="0.2" 
                          stroke="#4ade80" strokeWidth="2"/>
                  <path d="M30 50 L45 65 L70 35" fill="none" stroke="#4ade80" 
                        strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
              <p>Session Key Created</p>
            </div>
          </div>
        )

      case 'connecting-servers':
        return (
          <div className="animation-container">
            <div className="servers-animation">
              <div className="central-client">
                <div className="client-icon"></div>
              </div>
              <div className="server-nodes">
                <div className="server-node node-1">
                  <div className="connection-line line-1"></div>
                  <span>KS1</span>
                </div>
                <div className="server-node node-2">
                  <div className="connection-line line-2"></div>
                  <span>KS2</span>
                </div>
                <div className="server-node node-3">
                  <div className="connection-line line-3"></div>
                  <span>KS3</span>
                </div>
              </div>
              <p className="animation-label">Connecting to Key Servers...</p>
            </div>
          </div>
        )

      case 'servers-connected':
        return (
          <div className="animation-container">
            <div className="connected-animation">
              <div className="server-constellation">
                <div className="constellation-center">✓</div>
                <div className="orbit-ring"></div>
                <div className="orbit-node node-1"></div>
                <div className="orbit-node node-2"></div>
                <div className="orbit-node node-3"></div>
              </div>
              <p>Connected to 3 Key Servers</p>
            </div>
          </div>
        )

      case 'file-selected':
        return (
          <div className="animation-container">
            <div className="file-animation">
              <div className="file-icon">
                <div className="file-corner"></div>
                <div className="file-lines">
                  <div className="line"></div>
                  <div className="line"></div>
                  <div className="line"></div>
                </div>
              </div>
              <p>{selectedFile?.name}</p>
            </div>
          </div>
        )

      case 'encrypting':
        return (
          <div className="animation-container">
            <div className="encryption-3d-animation">
              <div className="encryption-box">
                <div className="box-face front">
                  <div className="data-stream">010110</div>
                </div>
                <div className="box-face back"></div>
                <div className="box-face left"></div>
                <div className="box-face right"></div>
                <div className="box-face top"></div>
                <div className="box-face bottom"></div>
                <div className="lock-animation">
                  <svg viewBox="0 0 50 50" className="lock-icon">
                    <rect x="10" y="25" width="30" height="20" rx="2" fill="white" fillOpacity="0.8"/>
                    <path d="M15 25 V20 Q15 10 25 10 Q35 10 35 20 V25" fill="none" 
                          stroke="white" strokeWidth="3"/>
                  </svg>
                </div>
              </div>
              <p className="animation-label">Encrypting with AES-256...</p>
            </div>
          </div>
        )

      case 'encrypted':
        return (
          <div className="animation-container">
            <div className="encrypted-success">
              <div className="locked-box">
                <div className="box-glow"></div>
                <svg viewBox="0 0 50 50" className="lock-closed">
                  <rect x="10" y="25" width="30" height="20" rx="2" fill="#4ade80"/>
                  <path d="M15 25 V20 Q15 10 25 10 Q35 10 35 20 V25" fill="none" 
                        stroke="#4ade80" strokeWidth="3"/>
                </svg>
              </div>
              <p>File Encrypted Successfully</p>
            </div>
          </div>
        )

      case 'uploading':
        return (
          <div className="animation-container">
            <div className="walrus-upload-animation">
              <div className="encrypted-package">
                <div className="package-box"></div>
              </div>
              <div className="splitting-animation">
                <div className="shard shard-1"></div>
                <div className="shard shard-2"></div>
                <div className="shard shard-3"></div>
                <div className="shard shard-4"></div>
                <div className="shard shard-5"></div>
                <div className="shard shard-6"></div>
              </div>
              <div className="walrus-servers">
                <div className="walrus-server server-1">W1</div>
                <div className="walrus-server server-2">W2</div>
                <div className="walrus-server server-3">W3</div>
              </div>
              <p className="animation-label">Distributing to Walrus Network...</p>
            </div>
          </div>
        )

      case 'uploaded':
        return (
          <div className="animation-container">
            <div className="upload-success">
              <div className="distributed-network">
                <div className="network-center">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="#4ade80" fillOpacity="0.2" 
                            stroke="#4ade80" strokeWidth="2"/>
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" 
                          fontSize="30" fill="#4ade80">W</text>
                  </svg>
                </div>
                <div className="network-nodes">
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="node"></div>
                </div>
              </div>
              <p>Stored on Walrus Network</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }
}

export default InteractiveEncryptionJourney