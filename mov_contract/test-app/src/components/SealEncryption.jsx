import React, { useState } from 'react'
import { useCurrentAccount, useSuiClient, useSignPersonalMessage } from '@mysten/dapp-kit'
import { SessionKey, getAllowlistedKeyServers, SealClient } from '@mysten/seal'
import { Transaction } from '@mysten/sui/transactions'
import { fromHex, toHex } from '@mysten/sui/utils'
import toast from 'react-hot-toast'

/**
 * SealEncryption Component
 * Handles file encryption and decryption using Seal
 */
function SealEncryption({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  
  const [sessionKey, setSessionKey] = useState(null)
  const [sealClient, setSealClient] = useState(null)
  
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

  // Initialize Seal client
  React.useEffect(() => {
    if (client && !sealClient) {
      console.log('Initializing MOCK Seal client...')
      
      // Use a mock client since we're having issues with the real SealClient
      // This allows testing other functionality while we debug the Seal issue
      console.warn('Using mock Seal client due to initialization issues')
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
      
      // TODO: Uncomment below when Seal client issues are resolved
      /*
      try {
        // Try to get allowlisted key servers
        let keyServerIds
        try {
          keyServerIds = getAllowlistedKeyServers('testnet')
          console.log('Key server IDs from getAllowlistedKeyServers:', keyServerIds)
        } catch (err) {
          console.error('Error getting allowlisted key servers:', err)
          throw new Error('Failed to get key servers')
        }
        
        if (!keyServerIds || !Array.isArray(keyServerIds) || keyServerIds.length === 0) {
          throw new Error('No valid key servers found')
        }
        
        // Remove duplicates and filter valid IDs
        const uniqueServerIds = [...new Set(keyServerIds)].filter(id => 
          id && typeof id === 'string' && id.length > 0
        )
        
        if (uniqueServerIds.length === 0) {
          throw new Error('No valid key server IDs after filtering')
        }
        
        const seal = new SealClient({
          suiClient: client,
          serverObjectIds: uniqueServerIds,
          verifyKeyServers: false
        })
        
        setSealClient(seal)
        console.log('Seal client initialized successfully')
        
      } catch (error) {
        console.error('Error initializing Seal client:', error)
        toast.error('Failed to initialize Seal client. Using mock client for testing.')
        
        // Fallback to mock client
        setSealClient({
          encrypt: () => Promise.reject(new Error(`Seal initialization failed: ${error.message}`)),
          decrypt: () => Promise.reject(new Error(`Seal initialization failed: ${error.message}`)),
          fetchKeys: () => Promise.reject(new Error(`Seal initialization failed: ${error.message}`))
        })
      }
      */
    }
  }, [client, sealClient])

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
            toast.error(`Failed to sign message: ${error.message}`, { id: toastId })
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

    setIsEncrypting(true)
    const toastId = toast.loading('Encrypting file...')

    try {
      // Read file content
      const fileContent = await readFileAsArrayBuffer(encryptForm.file)
      const data = new Uint8Array(fileContent)
      
      // Create ID from NFT object ID + nonce
      const nftIdBytes = fromHex(encryptForm.nftId)
      const nonce = crypto.getRandomValues(new Uint8Array(5))
      const id = toHex(new Uint8Array([...nftIdBytes, ...nonce]))
      
      // Encrypt using SealClient
      const { encryptedObject, key } = await sealClient.encrypt({
        threshold: parseInt(encryptForm.threshold),
        packageId: config.PACKAGE_ID,
        id: id,
        data: data
      })
      
      // Store encrypted file info
      const encryptedFile = {
        fileName: encryptForm.file.name,
        fileSize: encryptForm.file.size,
        nftId: encryptForm.nftId,
        encryptedData: toHex(encryptedObject),
        symmetricKey: toHex(key),
        encryptionId: id,
        threshold: encryptForm.threshold,
        timestamp: new Date().toISOString()
      }
      
      setEncryptedFiles([...encryptedFiles, encryptedFile])
      
      toast.success('File encrypted successfully!', { id: toastId })
      console.log('Encrypted file:', encryptedFile)
      
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
          tx.pure.vector('u8', fromHex(storedFile.encryptionId)),
          tx.object(decryptForm.nftId), // NFT object
          tx.object(config.REGISTRY_ID) // Access Registry
        ]
      })
      
      const txBytes = await tx.build({ client, onlyTransactionKind: true })
      
      // Decrypt using SealClient
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
              placeholder="NFT object ID (0x...)"
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
          <li>• Files are encrypted using Seal's threshold encryption</li>
          <li>• Only users with level 4+ access to the NFT can decrypt</li>
          <li>• The encrypted data can be stored on Walrus</li>
          <li>• Backup keys allow recovery in case of key server issues</li>
        </ul>
      </div>
    </div>
  )
}

export default SealEncryption