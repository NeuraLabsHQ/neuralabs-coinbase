import React, { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { initializeSealClient } from '@blockchain/seal-encryption'
import { getUserNFTs } from '@blockchain/nfts'
import { SessionKeySection } from './components/SessionKeySection'
import { EncryptSection } from './components/EncryptSection'
import { DecryptSection } from './components/DecryptSection'
import { EncryptedFilesList } from './components/EncryptedFilesList'
import toast from 'react-hot-toast'

/**
 * SealEncryption Page Component
 * Handles file encryption and decryption using Seal
 */
function SealEncryption({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [sessionKey, setSessionKey] = useState(null)
  const [sealClient, setSealClient] = useState(null)
  const [userNFTs, setUserNFTs] = useState([])
  const [encryptedFiles, setEncryptedFiles] = useState([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)

  // Initialize Seal client
  useEffect(() => {
    let mounted = true

    if (client && !sealClient) {
      console.log('Initializing Seal client...')

      try {
        const seal = initializeSealClient(client)

        if (mounted) {
          setSealClient(seal)
          console.log('Seal client initialized successfully')
          toast.success('Seal encryption ready')
        }
      } catch (error) {
        console.error('Error initializing Seal client:', error)
        toast.error(`Failed to initialize Seal client: ${error.message}`)
      }
    }

    return () => {
      mounted = false
    }
  }, [client, sealClient])

  // Load user NFTs
  const loadUserNFTs = async () => {
    if (!account) return

    setLoadingNFTs(true)
    try {
      const nfts = await getUserNFTs(account.address)
      setUserNFTs(nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
      toast.error('Failed to load NFTs')
    } finally {
      setLoadingNFTs(false)
    }
  }

  // Load NFTs when account changes
  useEffect(() => {
    if (account) {
      loadUserNFTs()
    }
  }, [account])

  // Handle file encrypted
  const handleFileEncrypted = (encryptedFile) => {
    setEncryptedFiles(prev => {
      // Update existing file or add new one
      const existing = prev.find(f => f.encryptionId === encryptedFile.encryptionId)
      if (existing) {
        return prev.map(f => f.encryptionId === encryptedFile.encryptionId ? encryptedFile : f)
      }
      return [...prev, encryptedFile]
    })
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to use Seal encryption.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Seal Encryption</h2>
        <p className="text-gray-600">
          Encrypt and decrypt files using Sui Seal. Files are encrypted with threshold cryptography 
          and can only be decrypted by users with sufficient access rights (Level 4+).
        </p>
      </div>

      {/* Session Key Management */}
      <SessionKeySection
        account={account}
        sessionKey={sessionKey}
        setSessionKey={setSessionKey}
        config={config}
      />

      {/* User NFTs */}
      {loadingNFTs ? (
        <div className="border rounded-lg p-6">
          <p className="text-gray-500 text-center">Loading NFTs...</p>
        </div>
      ) : userNFTs.length === 0 ? (
        <div className="border rounded-lg p-6">
          <p className="text-gray-500 text-center">
            No NFTs found. Create NFTs in the NFT Manager to encrypt files.
          </p>
        </div>
      ) : (
        <>
          {/* Encrypt Section */}
          <EncryptSection
            account={account}
            sealClient={sealClient}
            sessionKey={sessionKey}
            userNFTs={userNFTs}
            config={config}
            onFileEncrypted={handleFileEncrypted}
          />

          {/* Decrypt Section */}
          <DecryptSection
            account={account}
            sealClient={sealClient}
            sessionKey={sessionKey}
            userNFTs={userNFTs}
            config={config}
          />

          {/* Encrypted Files List */}
          <EncryptedFilesList encryptedFiles={encryptedFiles} />
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How Seal Encryption Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Files are encrypted using threshold cryptography</li>
          <li>• Encryption keys are split across multiple key servers</li>
          <li>• Only users with Level 4+ access can decrypt files</li>
          <li>• Encrypted files can be stored on Walrus for permanent storage</li>
          <li>• Session keys are valid for 30 minutes</li>
        </ul>
      </div>
    </div>
  )
}

export default SealEncryption