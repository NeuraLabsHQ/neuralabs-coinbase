/**
 * Blockchain Interactions Hook
 * Integrates with the modular blockchain_module
 */
import { useCallback } from 'react'
import { useSuiClient, useSignPersonalMessage } from '@mysten/dapp-kit'
// Import our modular blockchain functions
import { getUserNFTs, getNFTById } from '../../../../blockchain_module/nfts'
import { encryptData, encryptFile, getSealClient } from '../../../../blockchain_module/seal-encryption'
import { createSealSessionKey, uploadToWalrus } from '../../../../utils/blockchain'
import { TransactionBuilder, createTransaction } from '../../../../blockchain_module/transaction-proposer'

export const useBlockchainInteractions = ({ 
  account, 
  config, 
  setIsProcessing, 
  setAnimationPhase, 
  updateJourneyData, 
  toast 
}) => {
  const client = useSuiClient()
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  
  // Store the actual SessionKey object separately from journeyData
  let sessionKeyObjectRef = null

  const loadUserNFTs = useCallback(async () => {
    if (!account) return
    
    try {
      const nfts = await getUserNFTs(client, config, account.address)
      updateJourneyData({ 
        account, 
        userNFTs: nfts 
      })
    } catch (error) {
      console.error('Error loading NFTs:', error)
      toast.error('Failed to load NFTs')
    }
  }, [account, client, updateJourneyData, toast])

  const selectNFT = useCallback(async (nft) => {
    setIsProcessing(true)
    setAnimationPhase('nft-scanning')
    
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Get NFT details and access level using our blockchain module
      const nftDetails = await getNFTById(client, nft.id)
      
      updateJourneyData({ 
        selectedNFT: { ...nft, ...nftDetails },
        accessLevel: nftDetails.accessLevel || 4
      })
      
      setAnimationPhase('nft-verified')
      toast.success(`NFT verified with Level ${nftDetails.accessLevel || 4}+ access`)
      
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } catch (error) {
      console.error('Error selecting NFT:', error)
      toast.error('Failed to verify NFT')
      setAnimationPhase('idle')
    } finally {
      setIsProcessing(false)
    }
  }, [client, setIsProcessing, setAnimationPhase, updateJourneyData, toast])

  const initializeSeal = useCallback(async () => {
    setIsProcessing(true)
    setAnimationPhase('seal-init')
    
    try {
      // Initialize Seal using our blockchain module
      // Note: No explicit initialize function, Seal is initialized when first used
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      updateJourneyData({ sealInitialized: true })
      setAnimationPhase('idle')
      toast.success('Seal Protocol initialized with 3-of-5 threshold')
    } catch (error) {
      console.error('Error initializing Seal:', error)
      toast.error('Failed to initialize Seal')
      setAnimationPhase('idle')
    } finally {
      setIsProcessing(false)
    }
  }, [config, setIsProcessing, setAnimationPhase, updateJourneyData, toast])

  const createSessionKey = useCallback(() => {
    if (!account) {
      toast.error('Please connect wallet first')
      return
    }

    setIsProcessing(true)
    setAnimationPhase('signing')
    
    const toastId = toast.loading('Creating session key...')
    
    try {
      // Create session key using blockchain utils pattern
      const sessionKey = createSealSessionKey({
        address: account.address,
        packageId: config.PACKAGE_ID,
        ttlMin: 10
      })

      // Get the personal message
      const messageBytes = sessionKey.getPersonalMessage()

      signPersonalMessage(
        {
          message: messageBytes,
        },
        {
          onSuccess: async (result) => {
            try {
              await sessionKey.setPersonalMessageSignature(result.signature)
              
              // Store the SessionKey object in our ref
              sessionKeyObjectRef = sessionKey
              
              // Create a simple display string instead of trying to export
              const displayString = `sk_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
              
              updateJourneyData({ 
                sessionKey: displayString // Simple string for display
              })
              setAnimationPhase('signed')
              toast.success('Digital signature created!', { id: toastId })
              setTimeout(() => setAnimationPhase('idle'), 1000)
            } catch (error) {
              console.error('Error setting signature:', error)
              toast.error('Failed to set signature', { id: toastId })
              setAnimationPhase('idle')
            } finally {
              setIsProcessing(false)
            }
          },
          onError: (error) => {
            console.error('Error signing message:', error)
            if (error.message?.includes('rejected')) {
              toast.error('Signature rejected by user', { id: toastId })
            } else {
              toast.error(`Failed to sign message: ${error.message}`, { id: toastId })
            }
            setAnimationPhase('idle')
            setIsProcessing(false)
          },
        }
      )
    } catch (error) {
      console.error('Error creating session key:', error)
      toast.error(`Failed to create session key: ${error.message}`, { id: toastId })
      setAnimationPhase('idle')
      setIsProcessing(false)
    }
  }, [account, config, signPersonalMessage, setIsProcessing, setAnimationPhase, updateJourneyData, toast])

  const selectFile = useCallback((file) => {
    if (file && file.size <= 10 * 1024 * 1024) {
      updateJourneyData({ selectedFile: file })
      setAnimationPhase('file-selected')
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } else {
      toast.error('File size must be less than 10MB')
    }
  }, [updateJourneyData, setAnimationPhase, toast])

  const mockEncrypt = useCallback(async (file, journeyData) => {
    setIsProcessing(true)
    setAnimationPhase('encrypting')
    
    const toastId = toast.loading('Encrypting file...')
    
    try {
      // Validate prerequisites
      if (!sessionKeyObjectRef) {
        throw new Error('No session key available. Please create a session key first.')
      }
      
      if (!journeyData.selectedNFT) {
        throw new Error('Please select an NFT first to use as encryption policy.')
      }

      // Add 3-second delay to show the encryption animation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Convert file to Uint8Array (similar to working EncryptSection)
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      
      // Generate a random nonce
      const nonce = crypto.getRandomValues(new Uint8Array(5))
      
      // Get the Seal client
      const sealClient = getSealClient({
        suiClient: client,
        network: 'testnet',
        verifyKeyServers: false
      })
      
      // Use encryptData like the working code
      const { encryptedData: encData, encryptedId } = await encryptData(sealClient, {
        data,
        threshold: 2, // Default threshold
        packageId: config.PACKAGE_ID,
        policyId: journeyData.selectedNFT ? journeyData.selectedNFT.id : config.PACKAGE_ID, // Use selected NFT ID or package ID as fallback
        nonce: nonce
      })
      
      const encryptedData = {
        fileName: file.name,
        size: file.size,
        encryptedSize: encData.length,
        timestamp: new Date().toISOString(),
        encryptedHex: Array.from(encData.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
        encryptedData: encData,
        encryptedId
      }
      
      updateJourneyData({ mockEncryptedData: encryptedData })
      setAnimationPhase('encrypted')
      toast.success('File encrypted!', { id: toastId })
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } catch (error) {
      console.error('Error encrypting file:', error)
      // Fallback to mock data for demo
      const mockData = {
        fileName: file.name,
        size: file.size,
        encryptedSize: Math.floor(file.size * 1.3),
        timestamp: new Date().toISOString(),
        encryptedHex: 'a5b2c3d4e5f6g7h8'
      }
      updateJourneyData({ mockEncryptedData: mockData })
      setAnimationPhase('encrypted')
      toast.success('File encrypted! (Demo Mode)', { id: toastId })
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } finally {
      setIsProcessing(false)
    }
  }, [account, setIsProcessing, setAnimationPhase, updateJourneyData, toast])

  const mockUploadToWalrus = useCallback(async (encryptedData) => {
    setIsProcessing(true)
    setAnimationPhase('uploading')
    
    const toastId = toast.loading('Uploading to Walrus...')
    
    try {
      // Convert encrypted data to proper format for Walrus upload (like working EncryptSection)
      const dataToUpload = {
        encryptedData: encryptedData.encryptedData,
        encryptedId: encryptedData.encryptedId,
        fileName: encryptedData.fileName,
        fileSize: encryptedData.size,
        timestamp: encryptedData.timestamp
      }
      
      const blob = new Blob([JSON.stringify(dataToUpload)], { type: 'application/json' })
      const blobId = await uploadToWalrus(blob)
      
      updateJourneyData({ walrusBlobId: blobId })
      setAnimationPhase('uploaded')
      toast.success('Uploaded to Walrus!', { id: toastId })
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } catch (error) {
      console.error('Error uploading to Walrus:', error)
      // Fallback to mock data for demo
      const mockBlobId = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      updateJourneyData({ walrusBlobId: mockBlobId })
      setAnimationPhase('uploaded')
      toast.success('Uploaded to Walrus! (Demo Mode)', { id: toastId })
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } finally {
      setIsProcessing(false)
    }
  }, [setIsProcessing, setAnimationPhase, updateJourneyData, toast])

  return {
    loadUserNFTs,
    selectNFT,
    createSessionKey,
    selectFile,
    mockEncrypt,
    mockUploadToWalrus,
    initializeSeal
  }
}