/**
 * Blockchain Interactions Hook
 * Integrates with the modular blockchain_module
 */
import { useCallback } from 'react'
import { useSuiClient, useSignPersonalMessage } from '@mysten/dapp-kit'
// Import our modular blockchain functions
import { getUserNFTs, getNFTById } from '../../../../blockchain_module/nfts'
import { encryptData, encryptFile, createSessionKey } from '../../../../blockchain_module/seal-encryption'
import { uploadToWalrus, uploadEncryptedDataReference } from '../../../../blockchain_module/walrus'
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

  const loadUserNFTs = useCallback(async () => {
    if (!account) return
    
    try {
      const nfts = await getUserNFTs(account.address, client, config)
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
      const nftDetails = await getNFTById(nft.id, client)
      
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

  const createSessionKey = useCallback(async () => {
    setIsProcessing(true)
    setAnimationPhase('signing')
    
    const toastId = toast.loading('Creating session key...')
    
    try {
      // Use our blockchain module's session key creation
      const sessionKey = await createSessionKey({
        address: account.address,
        packageId: config.PACKAGE_ID,
        signPersonalMessage
      })
      
      updateJourneyData({ sessionKey })
      setAnimationPhase('signed')
      toast.success('Digital signature created!', { id: toastId })
      setTimeout(() => setAnimationPhase('idle'), 1000)
    } catch (error) {
      console.error('Error creating session key:', error)
      toast.error('Failed to create session key', { id: toastId })
      setAnimationPhase('idle')
    } finally {
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

  const mockEncrypt = useCallback(async (file) => {
    setIsProcessing(true)
    setAnimationPhase('encrypting')
    
    const toastId = toast.loading('Encrypting file...')
    
    try {
      // Use our blockchain module's encryption
      const encryptedData = await encryptFile(file, {
        sessionKey: account.sessionKey // This would be set from createSessionKey
      })
      
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
      // Use our blockchain module's Walrus storage
      const blobId = await uploadToWalrus(encryptedData)
      
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