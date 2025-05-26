import React, { useState, useEffect, useRef } from 'react'
import { useCurrentAccount, useSuiClient, useSignPersonalMessage, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { SessionKey } from '@mysten/seal'
import { WalrusClient } from '@mysten/walrus'
import { Transaction } from '@mysten/sui/transactions'
import { fromHex, toHex } from '@mysten/sui/utils'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import './InteractiveEncryptionJourneyV2.css'

const InteractiveEncryptionJourneyV2 = ({ config }) => {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  // Core state
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [animationPhase, setAnimationPhase] = useState('idle')
  
  // Data state
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [userNFTs, setUserNFTs] = useState([])
  const [sessionKey, setSessionKey] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [mockEncryptedData, setMockEncryptedData] = useState(null)
  const [walrusBlobId, setWalrusBlobId] = useState(null)
  
  // Animation refs
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const steps = [
    {
      id: 'wallet',
      title: 'Wallet Connected',
      subtitle: 'Secure connection established',
      icon: 'wallet',
      completed: () => !!account
    },
    {
      id: 'nft',
      title: 'NFT Verification',
      subtitle: 'Proving ownership & access',
      icon: 'nft',
      completed: () => !!selectedNFT
    },
    {
      id: 'signature',
      title: 'Digital Signature',
      subtitle: 'Creating session key',
      icon: 'signature',
      completed: () => !!sessionKey
    },
    {
      id: 'file',
      title: 'File Selection',
      subtitle: 'Choose data to protect',
      icon: 'file',
      completed: () => !!selectedFile
    },
    {
      id: 'encrypt',
      title: 'Encryption',
      subtitle: 'AES-256 protection',
      icon: 'encrypt',
      completed: () => !!mockEncryptedData
    },
    {
      id: 'walrus',
      title: 'Decentralized Storage',
      subtitle: 'Distributing across network',
      icon: 'walrus',
      completed: () => !!walrusBlobId
    }
  ]

  // Initialize
  useEffect(() => {
    if (account) {
      loadUserNFTs()
    }
  }, [account])

  useEffect(() => {
    const nextStep = steps.findIndex(step => !step.completed())
    if (nextStep !== -1 && nextStep !== currentStep) {
      setCurrentStep(nextStep)
    }
  }, [selectedNFT, sessionKey, selectedFile, mockEncryptedData, walrusBlobId])

  const loadUserNFTs = async () => {
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
          description: obj.data.content.fields.description
        }))
      
      setUserNFTs(nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
    }
  }

  const selectNFT = async (nft) => {
    setIsProcessing(true)
    setAnimationPhase('nft-scanning')
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSelectedNFT(nft)
    setAnimationPhase('nft-verified')
    toast.success('NFT verified with Level 4+ access')
    
    setTimeout(() => setAnimationPhase('idle'), 1000)
    setIsProcessing(false)
  }

  const createSessionKey = async () => {
    setIsProcessing(true)
    setAnimationPhase('signing')
    
    const toastId = toast.loading('Creating session key...')
    
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
            setAnimationPhase('signed')
            toast.success('Session key created!', { id: toastId })
            setTimeout(() => setAnimationPhase('idle'), 1000)
          },
          onError: () => {
            setAnimationPhase('idle')
            toast.error('Failed to sign message', { id: toastId })
          }
        }
      )
    } catch (error) {
      setAnimationPhase('idle')
      toast.error('Failed to create session key', { id: toastId })
    }
    
    setIsProcessing(false)
  }

  const selectFile = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 10 * 1024 * 1024) {
      setSelectedFile(file)
      setAnimationPhase('file-selected')
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } else {
      toast.error('File size must be less than 10MB')
    }
  }

  const mockEncrypt = async () => {
    setIsProcessing(true)
    setAnimationPhase('encrypting')
    
    const toastId = toast.loading('Encrypting file...')
    
    // Simulate encryption
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setMockEncryptedData({
      fileName: selectedFile.name,
      size: selectedFile.size,
      encryptedSize: Math.floor(selectedFile.size * 1.3),
      timestamp: new Date().toISOString()
    })
    
    setAnimationPhase('encrypted')
    toast.success('File encrypted!', { id: toastId })
    setTimeout(() => setAnimationPhase('idle'), 1000)
    setIsProcessing(false)
  }

  const mockUploadToWalrus = async () => {
    setIsProcessing(true)
    setAnimationPhase('uploading')
    
    const toastId = toast.loading('Uploading to Walrus...')
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const mockBlobId = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    setWalrusBlobId(mockBlobId)
    
    setAnimationPhase('uploaded')
    toast.success('Uploaded to Walrus!', { id: toastId })
    setTimeout(() => setAnimationPhase('idle'), 1000)
    setIsProcessing(false)
  }

  const renderStepIcon = (iconType, isActive, isCompleted) => {
    const baseClass = `step-icon-svg ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`
    
    switch(iconType) {
      case 'wallet':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
            initial={{ opacity: 0.3 }}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
              scale: isActive ? 1.1 : 1
            }}
            transition={{ duration: 0.5 }}
          >
            <motion.rect 
              x="20" y="30" width="60" height="40" rx="5"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <motion.circle 
              cx="65" cy="50" r="5"
              fill="currentColor"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            />
          </motion.svg>
        )
      
      case 'nft':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
            animate={{ 
              opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3,
              rotate: isActive ? [0, 5, -5, 0] : 0
            }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            <motion.path
              d="M30 20 L70 20 L80 50 L50 80 L20 50 Z"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5 }}
            />
            <motion.text 
              x="50" y="55" 
              textAnchor="middle" 
              fontSize="20" 
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : isCompleted ? 0.8 : 0.5 }}
            >
              NFT
            </motion.text>
          </motion.svg>
        )
      
      case 'signature':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.path
              d="M20 50 Q35 30 50 50 T80 50"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: isActive ? [0, 1, 1, 0] : isCompleted ? 1 : 0,
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
              transition={{ 
                duration: 3, 
                repeat: isActive ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
          </motion.svg>
        )
      
      case 'file':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.path
              d="M30 15 L30 85 L70 85 L70 35 L50 15 Z"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M50 15 L50 35 L70 35"
              fill="none" stroke="currentColor" strokeWidth="2"
            />
            {isActive && (
              <motion.line
                x1="40" y1="50" x2="60" y2="50"
                stroke="currentColor" strokeWidth="2"
                initial={{ x1: 50, x2: 50 }}
                animate={{ x1: 40, x2: 60 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              />
            )}
          </motion.svg>
        )
      
      case 'encrypt':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.rect
              x="25" y="45" width="50" height="35" rx="5"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            <motion.path
              d="M35 45 V35 Q35 25 50 25 Q65 25 65 35 V45"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {isActive && (
              <motion.circle
                cx="50" cy="62"
                r="5"
                fill="currentColor"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.svg>
        )
      
      case 'walrus':
        return (
          <motion.svg 
            viewBox="0 0 100 100" 
            className={baseClass}
          >
            <motion.circle
              cx="50" cy="50" r="30"
              fill="none" stroke="currentColor" strokeWidth="2"
              animate={{ 
                opacity: isActive ? 1 : isCompleted ? 0.9 : 0.3
              }}
            />
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <motion.circle
                key={i}
                cx={50 + 25 * Math.cos(angle * Math.PI / 180)}
                cy={50 + 25 * Math.sin(angle * Math.PI / 180)}
                r="5"
                fill="currentColor"
                animate={{ 
                  scale: isActive ? [0.5, 1, 0.5] : 1,
                  opacity: isActive ? [0.5, 1, 0.5] : isCompleted ? 0.9 : 0.3
                }}
                transition={{ 
                  duration: 2, 
                  repeat: isActive ? Infinity : 0,
                  delay: i * 0.2 
                }}
              />
            ))}
          </motion.svg>
        )
      
      default:
        return null
    }
  }

  const renderAnimation = () => {
    switch(animationPhase) {
      case 'nft-scanning':
        return (
          <motion.div className="animation-scene">
            <div className="nft-scan-container">
              <motion.div 
                className="scan-card"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 2, ease: "linear" }}
              >
                <div className="card-front">NFT</div>
                <div className="card-back">
                  <motion.div 
                    className="scan-line"
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              <motion.div className="scan-particles">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="particle"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0 
                    }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 200,
                      y: (Math.random() - 0.5) * 200,
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )
      
      case 'nft-verified':
        return (
          <motion.div className="animation-scene">
            <motion.div 
              className="verification-badge"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <svg viewBox="0 0 100 100" width="200" height="200">
                <motion.polygon
                  points="50,10 61,35 88,35 68,55 79,80 50,62 21,80 32,55 12,35 39,35"
                  fill="url(#verifiedGradient)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
                <text x="50" y="55" textAnchor="middle" fontSize="24" fill="white" fontWeight="bold">4+</text>
              </svg>
              <defs>
                <linearGradient id="verifiedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#888" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </motion.div>
          </motion.div>
        )
      
      case 'signing':
        return (
          <motion.div className="animation-scene">
            <svg viewBox="0 0 400 200" className="signature-animation">
              <motion.path
                d="M50,100 Q100,50 150,100 T250,100 Q300,80 350,90"
                fill="none"
                stroke="url(#signatureGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              />
              <defs>
                <linearGradient id="signatureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                  <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <motion.div className="signing-text">Creating Digital Signature...</motion.div>
          </motion.div>
        )
      
      case 'encrypting':
        return (
          <motion.div className="animation-scene">
            <div className="encryption-container">
              <motion.div 
                className="data-cube"
                animate={{ 
                  rotateX: [0, 360],
                  rotateY: [0, 360]
                }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
              >
                <div className="cube-face front">
                  <div className="binary-stream">01010110</div>
                </div>
                <div className="cube-face back">
                  <div className="binary-stream">11001010</div>
                </div>
                <div className="cube-face left">
                  <div className="binary-stream">10110011</div>
                </div>
                <div className="cube-face right">
                  <div className="binary-stream">01101101</div>
                </div>
                <div className="cube-face top">
                  <div className="binary-stream">11010110</div>
                </div>
                <div className="cube-face bottom">
                  <div className="binary-stream">10011001</div>
                </div>
              </motion.div>
              
              <motion.div 
                className="lock-overlay"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <rect x="25" y="45" width="50" height="35" rx="5" fill="white" fillOpacity="0.9"/>
                  <path d="M35 45 V35 Q35 25 50 25 Q65 25 65 35 V45" fill="none" stroke="white" strokeWidth="4"/>
                </svg>
              </motion.div>
            </div>
            <motion.div className="encryption-text">Encrypting with AES-256...</motion.div>
          </motion.div>
        )
      
      case 'uploading':
        return (
          <motion.div className="animation-scene">
            <div className="walrus-upload">
              <motion.div className="central-file">
                <div className="file-icon">
                  <svg viewBox="0 0 100 100" width="80" height="80">
                    <rect x="20" y="10" width="60" height="80" rx="5" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="2"/>
                    <rect x="30" y="30" width="40" height="3" fill="white" fillOpacity="0.5"/>
                    <rect x="30" y="40" width="40" height="3" fill="white" fillOpacity="0.5"/>
                    <rect x="30" y="50" width="40" height="3" fill="white" fillOpacity="0.5"/>
                  </svg>
                </div>
              </motion.div>
              
              <div className="shard-container">
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 60) * Math.PI / 180
                  const x = Math.cos(angle) * 150
                  const y = Math.sin(angle) * 150
                  
                  return (
                    <motion.div
                      key={i}
                      className="data-shard"
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{ 
                        x: x,
                        y: y,
                        scale: 1,
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        delay: i * 0.2,
                        repeat: Infinity
                      }}
                    >
                      <div className="shard-content">{i + 1}</div>
                    </motion.div>
                  )
                })}
              </div>
              
              <div className="server-nodes">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`server-node server-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + i * 0.3 }}
                  >
                    W{i + 1}
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div className="upload-text">Distributing to Walrus Network...</motion.div>
          </motion.div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="journey-v2">
      <div className="journey-container">
        <motion.div 
          className="journey-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Encryption Journey</h1>
          <p>Experience the power of decentralized encryption</p>
        </motion.div>

        <div className="journey-main">
          {/* Progress Steps */}
          <div className="progress-section">
            <div className="progress-track">
              <motion.div 
                className="progress-fill"
                initial={{ height: '0%' }}
                animate={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
              
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className={`progress-step ${step.completed() ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="step-icon">
                    {renderStepIcon(step.icon, index === currentStep, step.completed())}
                  </div>
                  <div className="step-info">
                    <h3>{step.title}</h3>
                    <p>{step.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Animation Display */}
          <div className="animation-section">
            <AnimatePresence mode="wait">
              {renderAnimation()}
            </AnimatePresence>
            
            {/* Default state when no animation */}
            {(!animationPhase || animationPhase === 'idle') && (
              <motion.div 
                className="idle-animation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="network-animation">
                  <motion.div 
                    className="network-core"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <svg viewBox="0 0 200 200" width="200" height="200">
                      <circle cx="100" cy="100" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                      <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    </svg>
                  </motion.div>
                  
                  {/* Network Nodes */}
                  {[...Array(6)].map((_, i) => {
                    const angle = (i * 60) * Math.PI / 180
                    const x = 100 + Math.cos(angle) * 70
                    const y = 100 + Math.sin(angle) * 70
                    
                    return (
                      <motion.div
                        key={i}
                        className="network-node"
                        style={{ left: `${x}px`, top: `${y}px` }}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 3,
                          delay: i * 0.5,
                          repeat: Infinity
                        }}
                      />
                    )
                  })}
                  
                  {/* Connection Lines */}
                  <svg className="network-connections" viewBox="0 0 200 200" width="200" height="200">
                    {[...Array(6)].map((_, i) => {
                      const angle1 = (i * 60) * Math.PI / 180
                      const angle2 = ((i + 1) * 60) * Math.PI / 180
                      const x1 = 100 + Math.cos(angle1) * 70
                      const y1 = 100 + Math.sin(angle1) * 70
                      const x2 = 100 + Math.cos(angle2) * 70
                      const y2 = 100 + Math.sin(angle2) * 70
                      
                      return (
                        <motion.line
                          key={i}
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="1"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ 
                            duration: 2,
                            delay: i * 0.3,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                      )
                    })}
                  </svg>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Panel */}
          <div className="action-section">
            <AnimatePresence mode="wait">
              {currentStep === 0 && account && (
                <motion.div className="action-card" key="wallet">
                  <h2>Wallet Connected</h2>
                  <p className="wallet-address">{account.address.slice(0, 8)}...{account.address.slice(-6)}</p>
                  <button 
                    className="action-button"
                    onClick={() => setCurrentStep(1)}
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div className="action-card" key="nft">
                  <h2>Select Your NFT</h2>
                  <div className="nft-selection">
                    {userNFTs.map((nft) => (
                      <motion.div
                        key={nft.id}
                        className="nft-option"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectNFT(nft)}
                      >
                        <div className="nft-visual">NFT</div>
                        <span>{nft.name}</span>
                      </motion.div>
                    ))}
                  </div>
                  {userNFTs.length === 0 && (
                    <p className="no-nfts">No NFTs found. Please mint one first.</p>
                  )}
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div className="action-card" key="signature">
                  <h2>Sign Message</h2>
                  <p>Create a session key for secure operations</p>
                  <button 
                    className="action-button"
                    onClick={createSessionKey}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Signing...' : 'Sign Message'}
                  </button>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div className="action-card" key="file">
                  <h2>Select File</h2>
                  <input 
                    type="file"
                    onChange={selectFile}
                    className="file-input"
                  />
                  {selectedFile && (
                    <p className="file-name">{selectedFile.name}</p>
                  )}
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div className="action-card" key="encrypt">
                  <h2>Encrypt File</h2>
                  <p>Protect your data with military-grade encryption</p>
                  <button 
                    className="action-button"
                    onClick={mockEncrypt}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Encrypting...' : 'Encrypt'}
                  </button>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div className="action-card" key="walrus">
                  <h2>Upload to Walrus</h2>
                  <p>Store on decentralized network</p>
                  <button 
                    className="action-button"
                    onClick={mockUploadToWalrus}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Uploading...' : 'Upload'}
                  </button>
                </motion.div>
              )}

              {walrusBlobId && (
                <motion.div className="action-card success" key="complete">
                  <h2>Journey Complete!</h2>
                  <p>Your file is encrypted and stored</p>
                  <div className="blob-info">
                    <span>Blob ID:</span>
                    <code>{walrusBlobId.slice(0, 20)}...</code>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="background-effects">
        <div className="grid-pattern"></div>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>
    </div>
  )
}

export default InteractiveEncryptionJourneyV2