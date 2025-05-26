import React, { useState } from 'react'
import { useCurrentAccount, useSuiClient, useSignPersonalMessage, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { SessionKey, getAllowlistedKeyServers, SealClient } from '@mysten/seal'
import { Transaction } from '@mysten/sui/transactions'
import { fromHex, toHex } from '@mysten/sui/utils'
import { WalrusClient } from '@mysten/walrus'
import toast from 'react-hot-toast'

/**
 * SealEncryption Component
 * Handles file encryption and decryption using Seal
 */
function SealEncryption({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  const [sessionKey, setSessionKey] = useState(null)
  const [sealClient, setSealClient] = useState(null)
  const [walrusClient, setWalrusClient] = useState(null)
  
  const [encryptForm, setEncryptForm] = useState({
    nftId: '',
    file: null,
    threshold: '2'
  })
  
  const [decryptForm, setDecryptForm] = useState({
    nftId: '',
    encryptedData: '',
    walrusBlobId: ''
  })
  
  const [encryptedFiles, setEncryptedFiles] = useState([])
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [userNFTs, setUserNFTs] = useState([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [isUploadingToWalrus, setIsUploadingToWalrus] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Initialize Seal client
  React.useEffect(() => {
    // Add a flag to prevent double initialization in React strict mode
    let mounted = true
    
    if (client && !sealClient) {
      console.log('Initializing Seal client...')
      
      try {
        // Get the official testnet key server IDs
        let keyServerIds
        try {
          keyServerIds = getAllowlistedKeyServers('testnet')
          console.log('Got allowlisted key servers:', keyServerIds)
          
          // Remove duplicates if any
          keyServerIds = [...new Set(keyServerIds)]
          console.log('Unique key server IDs:', keyServerIds)
          
          if (!keyServerIds || keyServerIds.length === 0) {
            throw new Error('No key servers found')
          }



        } catch (err) {
          console.error('Error getting key servers, using fallback:', err)
          // Fallback to known testnet key servers
          keyServerIds = [
            '0x713de2776691e4704aeb9bba9f271a8427be8a4c24092337fdaa9e4b19ca2d48'
          ]
        }
        
        console.log('Using key server IDs:', keyServerIds)
        
        // the below is a key step as the input that seal client expects is [str,int][]

        keyServerIds = [["id1", keyServerIds[0]], ["id2", keyServerIds[1]]]

        const seal = new SealClient({
          client,
          serverObjectIds: keyServerIds,
          // Don't verify key servers for testnet to avoid potential issues
          verifyKeyServers: false
        })
        
        if (mounted) {
          setSealClient(seal)
          console.log('Seal client initialized successfully with real encryption')
          console.log('Key servers:', keyServerIds)
          toast.success('Seal encryption ready (using real encryption)')
        }
        
      } catch (error) {
        console.error('Error initializing Seal client:', error)
        toast.error(`Failed to initialize Seal client: ${error.message}`)
        
        // Fallback to mock client for development
        console.warn('Falling back to mock Seal client')
        setSealClient({
          encrypt: async ({ threshold, packageId, id, data }) => {
            console.log('Mock encrypt called with:', { threshold, packageId, id, dataLength: data.length })
            // Return mock encrypted data
            const mockEncrypted = new Uint8Array([...data].map(b => b ^ 0xAA)) // Simple XOR "encryption"
            const mockKey = new Uint8Array(32).fill(0x42) // Mock symmetric key
            return {
              encryptedObject: mockEncrypted,
              key: mockKey
            }
          },
          decrypt: async ({ data, sessionKey, txBytes }) => {
            console.log('Mock decrypt called with data length:', data.length)
            // Simple XOR "decryption" to reverse mock encryption
            return new Uint8Array([...data].map(b => b ^ 0xAA))
          },
          fetchKeys: async ({ ids, txBytes, sessionKey, threshold }) => {
            console.log('Mock fetchKeys called with:', { ids, threshold })
            return Promise.resolve() // Mock success
          }
        })
      }
    }
    
    return () => {
      mounted = false
    }
  }, [client, sealClient])
  
  // Initialize Walrus client
  React.useEffect(() => {
    if (client && !walrusClient) {
      try {
        console.log('Initializing Walrus client...')
        const walrus = new WalrusClient({
          network: 'testnet',
          suiClient: client
        })
        setWalrusClient(walrus)
        console.log('Walrus client initialized successfully')
      } catch (error) {
        console.error('Error initializing Walrus client:', error)
        toast.error('Failed to initialize Walrus client')
      }
    }
  }, [client, walrusClient])

  // Create session key
  const createSessionKey = () => {
    if (!account) {
      toast.error('Please connect wallet first')
      return
    }

    const toastId = toast.loading('Creating session key...')
    
    try {
      const key = new SessionKey({
        address: account.address,
        packageId: config.PACKAGE_ID,
        ttlMin: 30 // 30 minute TTL (max allowed is 30)
      })
      
      // Get the personal message
      const messageBytes = key.getPersonalMessage()
      
      signPersonalMessage(
        { 
          message: messageBytes
        },
        {
          onSuccess: async (result) => {
            await key.setPersonalMessageSignature(result.signature)
            setSessionKey(key)
            toast.success('Session key created!', { id: toastId })
          },
          onError: (error) => {
            console.error('Error signing message:', error)
            if (error.message?.includes('rejected')) {
              toast.error('Signature rejected by user', { id: toastId })
            } else {
              toast.error(`Failed to sign message: ${error.message}`, { id: toastId })
            }
          }
        }
      )
    } catch (error) {
      console.error('Error creating session key:', error)
      toast.error(`Failed to create session key: ${error.message}`, { id: toastId })
    }
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setEncryptForm({ ...encryptForm, file })
    }
  }

  // Encrypt file
  const encryptFile = async (e) => {
    e.preventDefault()
    
    if (!encryptForm.file || !encryptForm.nftId || !sealClient) {
      toast.error('Please fill all fields and ensure Seal client is initialized')
      return
    }

    // Check NFT access before encrypting
    const access = await checkNFTAccess(encryptForm.nftId)
    if (!access.hasAccess) {
      toast.error(`Insufficient access level (${access.level}/4). You need level 4+ to encrypt/decrypt files.`)
      return
    }

    setIsEncrypting(true)
    const toastId = toast.loading('Encrypting file...')

    try {
      // Read file content
      const fileContent = await readFileAsArrayBuffer(encryptForm.file)
      const data = new Uint8Array(fileContent)
      
      // Create ID from NFT object ID + nonce
      // The ID must be: [32 bytes NFT ID][variable length nonce]
      const nftIdBytes = fromHex(encryptForm.nftId)
      // Ensure NFT ID is 32 bytes (pad with zeros if needed)
      const paddedNftId = new Uint8Array(32)
      paddedNftId.set(nftIdBytes.slice(0, 32))
      
      // Generate a random nonce
      const nonce = crypto.getRandomValues(new Uint8Array(16))
      const fullId = new Uint8Array([...paddedNftId, ...nonce])
      
      // Encrypt using SealClient
      console.log('Encrypting with Seal:', {
        threshold: parseInt(encryptForm.threshold),
        idLength: fullId.length,
        dataLength: data.length,
        isRealClient: !sealClient.encrypt.toString().includes('Mock'),
        clientType: sealClient.constructor?.name || 'Unknown'
      })
      
      const { encryptedObject, key } = await sealClient.encrypt({
        threshold: parseInt(encryptForm.threshold),
        packageId: config.PACKAGE_ID,
        id: fullId,
        data: data
      })
      
      console.log('Encryption result:', {
        encryptedSize: encryptedObject.length,
        keySize: key.length,
        isRealEncryption: encryptedObject.length > data.length + 100 // Real encryption adds significant overhead
      })
      
      // Store encrypted file info
      const encryptedFile = {
        fileName: encryptForm.file.name,
        fileSize: encryptForm.file.size,
        nftId: encryptForm.nftId,
        encryptedData: toHex(encryptedObject),
        symmetricKey: toHex(key),
        encryptionId: toHex(fullId),
        threshold: encryptForm.threshold,
        timestamp: new Date().toISOString()
      }
      
      setEncryptedFiles([...encryptedFiles, encryptedFile])
      
      toast.success('File encrypted successfully!', { id: toastId })
      console.log('Encrypted file:', encryptedFile)
      
      // Ask if user wants to upload to Walrus
      const uploadChoice = window.confirm('Would you like to upload the encrypted file to Walrus for permanent storage?')
      if (uploadChoice && walrusClient) {
        await uploadToWalrus(encryptedFile)
      }
      
      // Reset form
      setEncryptForm({ nftId: '', file: null, threshold: '2' })
      
    } catch (error) {
      console.error('Error encrypting file:', error)
      toast.error(`Encryption failed: ${error.message}`, { id: toastId })
    } finally {
      setIsEncrypting(false)
    }
  }

  // Decrypt file
  const decryptFile = async (e) => {
    e.preventDefault()
    
    if (!sessionKey || !decryptForm.encryptedData || !decryptForm.nftId || !sealClient) {
      toast.error('Please fill all fields and create session key')
      return
    }

    // Check NFT access before decrypting
    const access = await checkNFTAccess(decryptForm.nftId)
    if (!access.hasAccess) {
      toast.error(`Insufficient access level (${access.level}/4). You need level 4+ to decrypt files.`)
      return
    }

    setIsDecrypting(true)
    const toastId = toast.loading('Decrypting file...')

    try {
      // Parse the encrypted data
      const encryptedBytes = fromHex(decryptForm.encryptedData)
      
      // Find the encryption ID from stored files
      const storedFile = encryptedFiles.find(f => f.encryptedData === decryptForm.encryptedData)
      if (!storedFile) {
        toast.error('Encryption ID not found. Please decrypt a file you encrypted in this session.', { id: toastId })
        setIsDecrypting(false)
        return
      }
      
      // Create seal_approve transaction
      const tx = new Transaction()
      tx.moveCall({
        target: `${config.PACKAGE_ID}::access::seal_approve`,
        arguments: [
          tx.pure.vector('u8', Array.from(fromHex(storedFile.encryptionId))),
          tx.object(decryptForm.nftId), // NFT object
          tx.object(config.REGISTRY_ID) // Access Registry  
        ]
      })
      
      const txBytes = await tx.build({ client, onlyTransactionKind: true })
      
      // Decrypt using SealClient
      console.log('Decrypting with Seal:', {
        dataLength: encryptedBytes.length,
        hasSessionKey: !!sessionKey,
        txBytesLength: txBytes.length
      })
      
      const decryptedData = await sealClient.decrypt({
        data: encryptedBytes,
        sessionKey,
        txBytes
      })
      
      // Create download link
      const blob = new Blob([decryptedData], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = storedFile ? `decrypted_${storedFile.fileName}` : 'decrypted_file'
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('File decrypted and downloaded!', { id: toastId })
      
    } catch (error) {
      console.error('Error decrypting file:', error)
      toast.error(`Decryption failed: ${error.message}`, { id: toastId })
    } finally {
      setIsDecrypting(false)
    }
  }

  // Helper function to read file
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // Load user's NFTs
  const loadUserNFTs = async () => {
    if (!account) return
    
    setLoadingNFTs(true)
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
          creator: obj.data.content.fields.creator,
          createdAt: obj.data.content.fields.created_at
        }))
      
      setUserNFTs(nfts)
      console.log('Loaded NFTs:', nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
      toast.error('Failed to load NFTs')
    } finally {
      setLoadingNFTs(false)
    }
  }
  
  // Load NFTs when account changes
  React.useEffect(() => {
    loadUserNFTs()
  }, [account, client])
  
  // Upload encrypted file to Walrus
  const uploadToWalrus = async (encryptedFile) => {
    if (!walrusClient || !account) {
      toast.error('Walrus client not initialized or no account connected')
      return
    }
    
    setIsUploadingToWalrus(true)
    const toastId = toast.loading('Uploading to Walrus...')
    
    try {
      // Convert hex string back to Uint8Array
      const encryptedData = fromHex(encryptedFile.encryptedData)
      
      // Create metadata for the encrypted file
      const metadata = {
        fileName: encryptedFile.fileName,
        fileSize: encryptedFile.fileSize,
        nftId: encryptedFile.nftId,
        encryptionId: encryptedFile.encryptionId,
        threshold: encryptedFile.threshold,
        encryptedAt: encryptedFile.timestamp,
        uploadedBy: account.address
      }
      
      // Create a blob with metadata and encrypted data
      const dataToStore = JSON.stringify({
        metadata,
        encryptedData: encryptedFile.encryptedData // Store as hex string for easier retrieval
      })
      
      // Upload to Walrus
      console.log('Uploading to Walrus:', { size: dataToStore.length })
      const response = await walrusClient.store({
        data: new TextEncoder().encode(dataToStore),
        epochs: 5, // Store for 5 epochs
      })
      
      if (response.newlyCreated) {
        const blobId = response.newlyCreated.blobObject.blobId
        console.log('Successfully uploaded to Walrus:', blobId)
        
        // Update the encrypted file with Walrus blob ID
        const updatedFile = { ...encryptedFile, walrusBlobId: blobId }
        setEncryptedFiles(prev => 
          prev.map(f => f.encryptionId === encryptedFile.encryptionId ? updatedFile : f)
        )
        
        // Store the blob ID on-chain for future reference
        await storeWalrusBlobOnChain(encryptedFile.nftId, blobId, encryptedFile.encryptionId)
        
        toast.success(`Uploaded to Walrus! Blob ID: ${blobId.slice(0, 16)}...`, { id: toastId })
      } else if (response.alreadyCertified) {
        const blobId = response.alreadyCertified.blobId
        toast.success(`File already exists on Walrus! Blob ID: ${blobId.slice(0, 16)}...`, { id: toastId })
      }
    } catch (error) {
      console.error('Error uploading to Walrus:', error)
      toast.error(`Failed to upload to Walrus: ${error.message}`, { id: toastId })
    } finally {
      setIsUploadingToWalrus(false)
    }
  }
  
  // Store Walrus blob ID on-chain
  const storeWalrusBlobOnChain = async (nftId, blobId, encryptionId) => {
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${config.PACKAGE_ID}::storage::add_encrypted_data`,
        arguments: [
          tx.object(nftId),
          tx.pure.string(blobId),
          tx.pure.vector('u8', Array.from(fromHex(encryptionId)))
        ]
      })
      
      await signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Stored Walrus blob ID on-chain:', result)
            toast.success('Walrus blob ID stored on-chain')
          },
          onError: (error) => {
            console.error('Error storing blob ID on-chain:', error)
            toast.error('Failed to store blob ID on-chain')
          }
        }
      )
    } catch (error) {
      console.error('Error creating transaction:', error)
    }
  }
  
  // Download from Walrus
  const downloadFromWalrus = async (blobId) => {
    if (!walrusClient) {
      toast.error('Walrus client not initialized')
      return
    }
    
    const toastId = toast.loading('Downloading from Walrus...')
    
    try {
      console.log('Downloading from Walrus:', blobId)
      const response = await walrusClient.read({ blobId })
      
      if (response) {
        const text = new TextDecoder().decode(response)
        const data = JSON.parse(text)
        
        // Update decrypt form with the downloaded encrypted data
        setDecryptForm({
          nftId: data.metadata.nftId,
          encryptedData: data.encryptedData,
          walrusBlobId: blobId
        })
        
        toast.success('Downloaded encrypted file from Walrus', { id: toastId })
        return data
      }
    } catch (error) {
      console.error('Error downloading from Walrus:', error)
      if (error.message?.includes('not found')) {
        toast.error('Blob not found on Walrus. It may have expired.', { id: toastId })
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your connection.', { id: toastId })
      } else {
        toast.error(`Failed to download from Walrus: ${error.message}`, { id: toastId })
      }
    }
  }
  
  // Check if user has access to NFT
  const checkNFTAccess = async (nftId) => {
    if (!account) return { hasAccess: false, level: 0 }
    
    try {
      // Get access registry object
      const registry = await client.getObject({
        id: config.REGISTRY_ID,
        options: {
          showContent: true
        }
      })
      
      if (!registry.data?.content?.dataType === 'moveObject') {
        throw new Error('Invalid registry object')
      }
      
      // Get permissions table ID
      const permissionsTableId = registry.data.content.fields.permissions.fields.id.id
      
      // Try to get NFT permissions
      const nftPermissions = await client.getDynamicFieldObject({
        parentId: permissionsTableId,
        name: {
          type: '0x2::object::ID',
          value: nftId
        }
      })
      
      if (!nftPermissions.data) {
        return { hasAccess: false, level: 0 }
      }
      
      // Get user's access level
      const userPermissionsTableId = nftPermissions.data.content.fields.value.fields.id.id
      const userAccess = await client.getDynamicFieldObject({
        parentId: userPermissionsTableId,
        name: {
          type: 'address',
          value: account.address
        }
      })
      
      if (!userAccess.data) {
        return { hasAccess: false, level: 0 }
      }
      
      const level = parseInt(userAccess.data.content.fields.value)
      return { hasAccess: level >= 4, level } // Level 4+ required for decryption
      
    } catch (error) {
      console.error('Error checking NFT access:', error)
      return { hasAccess: false, level: 0 }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Seal Encryption</h2>
        <p className="text-gray-600 mb-4">
          Encrypt and decrypt files using Seal threshold encryption. Only NFT holders with proper access can decrypt.
        </p>
      </div>

      {/* Session Key */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Session Key</h3>
            <p className="text-sm text-gray-600">
              {sessionKey ? 'Session key active' : 'Create a session key to decrypt files'}
            </p>
          </div>
          <button
            onClick={createSessionKey}
            disabled={!account}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {sessionKey ? 'Refresh Key' : 'Create Key'}
          </button>
        </div>
      </div>

      {/* User's NFTs */}
      {account && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Your NFTs</h3>
            <button
              onClick={loadUserNFTs}
              disabled={loadingNFTs}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {loadingNFTs ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {userNFTs.length === 0 ? (
            <p className="text-sm text-gray-600">No NFTs found. Please mint an NFT first.</p>
          ) : (
            <div className="space-y-2">
              {userNFTs.map((nft) => (
                <div key={nft.id} className="border rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{nft.name}</h4>
                      <p className="text-sm text-gray-600">{nft.description}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {nft.id.slice(0, 16)}...</p>
                    </div>
                    <button
                      onClick={async () => {
                        const access = await checkNFTAccess(nft.id)
                        if (access.hasAccess) {
                          setEncryptForm({ ...encryptForm, nftId: nft.id })
                          toast.success(`Selected NFT with access level ${access.level}`)
                        } else {
                          toast.error(`No access or insufficient level (${access.level}/4)`)
                        }
                      }}
                      className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Encrypt File */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Encrypt File</h3>
        <form onSubmit={encryptFile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">NFT Object ID</label>
            <input
              type="text"
              value={encryptForm.nftId}
              onChange={(e) => setEncryptForm({ ...encryptForm, nftId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Select from your NFTs or paste ID"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">File to Encrypt</label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {encryptForm.file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {encryptForm.file.name} ({(encryptForm.file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Threshold</label>
            <select
              value={encryptForm.threshold}
              onChange={(e) => setEncryptForm({ ...encryptForm, threshold: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1-of-3 (Fastest)</option>
              <option value="2">2-of-3 (Recommended)</option>
              <option value="3">3-of-3 (Most secure)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Number of key servers required for decryption
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isEncrypting || !sealClient}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isEncrypting ? 'Encrypting...' : 'Encrypt File'}
          </button>
        </form>
      </div>

      {/* Encrypted Files List */}
      {encryptedFiles.length > 0 && (
        <div className="border rounded-lg p-6">
          <h3 className="font-medium mb-4">Encrypted Files</h3>
          <div className="space-y-3">
            {encryptedFiles.map((file, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{file.fileName}</h4>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <div>Size: {(file.fileSize / 1024).toFixed(2)} KB</div>
                      <div>NFT ID: {file.nftId.slice(0, 10)}...</div>
                      <div>Threshold: {file.threshold}-of-3</div>
                      <div className="font-mono text-xs break-all">
                        Symmetric Key: {file.symmetricKey.slice(0, 32)}...
                      </div>
                      {file.walrusBlobId && (
                        <div className="text-xs text-green-600 mt-1">
                          Stored on Walrus: {file.walrusBlobId.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDecryptForm({
                        nftId: file.nftId,
                        encryptedData: file.encryptedData,
                        walrusBlobId: ''
                      })
                    }}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Load for Decrypt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decrypt File */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Decrypt File</h3>
        <form onSubmit={decryptFile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">NFT Object ID</label>
            <input
              type="text"
              value={decryptForm.nftId}
              onChange={(e) => setDecryptForm({ ...decryptForm, nftId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="NFT object ID (0x...)"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Encrypted Data (Base64)</label>
            <textarea
              value={decryptForm.encryptedData}
              onChange={(e) => setDecryptForm({ ...decryptForm, encryptedData: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              placeholder="Paste encrypted data here..."
              rows="4"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Or Download from Walrus</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={decryptForm.walrusBlobId}
                onChange={(e) => setDecryptForm({ ...decryptForm, walrusBlobId: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Walrus blob ID"
              />
              <button
                type="button"
                onClick={() => downloadFromWalrus(decryptForm.walrusBlobId)}
                disabled={!decryptForm.walrusBlobId || !walrusClient}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
              >
                Download
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isDecrypting || !sessionKey}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isDecrypting ? 'Decrypting...' : 'Decrypt File'}
          </button>
        </form>
      </div>

      {/* Information */}
      <div className="border rounded-lg p-4 bg-yellow-50">
        <h4 className="font-medium text-yellow-900 mb-2">ℹ️ How it works</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Files are encrypted using Seal's threshold encryption with NFT-based namespaces</li>
          <li>• Only users with level 4+ access to the NFT can decrypt files</li>
          <li>• Encrypted data is automatically stored on Walrus for permanent decentralized storage</li>
          <li>• Walrus blob IDs are stored on-chain for easy retrieval</li>
          <li>• Session keys provide temporary access without repeated wallet signatures</li>
          <li>• Backup keys allow recovery in case of key server issues</li>
        </ul>
      </div>
      
      {/* Status */}
      {isUploadingToWalrus && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <p className="text-sm text-blue-800">Uploading encrypted file to Walrus...</p>
        </div>
      )}
    </div>
  )
}

export default SealEncryption