import React, { useState } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { SealClient, SessionKey } from '@mysten/seal'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import toast from 'react-hot-toast'

/**
 * SealEncryption Component
 * Handles file encryption and decryption using Seal
 */
function SealEncryption({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [sealClient, setSealClient] = useState(null)
  const [sessionKey, setSessionKey] = useState(null)
  
  const [encryptForm, setEncryptForm] = useState({
    tokenId: '',
    file: null,
    threshold: '1'
  })
  
  const [decryptForm, setDecryptForm] = useState({
    tokenId: '',
    encryptedData: '',
    walrusBlobId: ''
  })
  
  const [encryptedFiles, setEncryptedFiles] = useState([])
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Initialize Seal client
  React.useEffect(() => {
    if (client) {
      const seal = new SealClient({
        suiClient: client,
        serverObjectIds: config.SEAL_KEY_SERVERS.map(s => s.objectId),
        verifyKeyServers: false // Set to true in production
      })
      setSealClient(seal)
    }
  }, [client, config])

  // Create session key
  const createSessionKey = async () => {
    if (!account) {
      toast.error('Please connect wallet first')
      return
    }

    const toastId = toast.loading('Creating session key...')
    
    try {
      const key = new SessionKey({
        address: account.address,
        packageId: config.PACKAGE_ID,
        ttlMin: 60 // 60 minute TTL
      })
      
      const message = key.getPersonalMessage()
      const { signature } = await account.signPersonalMessage(message)
      key.setPersonalMessageSignature(signature)
      
      setSessionKey(key)
      toast.success('Session key created!', { id: toastId })
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
    
    if (!sealClient || !encryptForm.file || !encryptForm.tokenId) {
      toast.error('Please fill all fields')
      return
    }

    setIsEncrypting(true)
    const toastId = toast.loading('Encrypting file...')

    try {
      // Read file content
      const fileContent = await readFileAsArrayBuffer(encryptForm.file)
      const data = new Uint8Array(fileContent)
      
      // Create namespace from token ID
      const tokenIdBytes = new ArrayBuffer(8)
      const view = new DataView(tokenIdBytes)
      view.setBigUint64(0, BigInt(encryptForm.tokenId))
      
      // Add nonce
      const nonce = crypto.getRandomValues(new Uint8Array(16))
      const id = new Uint8Array(24)
      id.set(new Uint8Array(tokenIdBytes), 0)
      id.set(nonce, 8)
      
      // Encrypt data
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
        tokenId: encryptForm.tokenId,
        encryptedData: Buffer.from(encryptedObject).toString('base64'),
        backupKey: Buffer.from(key).toString('hex'),
        threshold: encryptForm.threshold,
        timestamp: new Date().toISOString()
      }
      
      setEncryptedFiles([...encryptedFiles, encryptedFile])
      
      toast.success('File encrypted successfully!', { id: toastId })
      console.log('Encrypted file:', encryptedFile)
      
      // Reset form
      setEncryptForm({ tokenId: '', file: null, threshold: '1' })
      
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
    
    if (!sealClient || !sessionKey || !decryptForm.encryptedData || !decryptForm.tokenId) {
      toast.error('Please fill all fields and create session key')
      return
    }

    setIsDecrypting(true)
    const toastId = toast.loading('Decrypting file...')

    try {
      // Create namespace from token ID
      const tokenIdBytes = new ArrayBuffer(8)
      const view = new DataView(tokenIdBytes)
      view.setBigUint64(0, BigInt(decryptForm.tokenId))
      
      // We need the same ID that was used for encryption
      // In a real app, this would be stored with the encrypted data
      const id = new Uint8Array(24)
      id.set(new Uint8Array(tokenIdBytes), 0)
      // Note: In production, store and retrieve the exact nonce used
      
      // Create seal_approve transaction
      const tx = new TransactionBlock()
      tx.moveCall({
        target: `${config.PACKAGE_ID}::nft::seal_approve`,
        arguments: [
          tx.pure.vector('u8', Array.from(id)),
          tx.object(config.COLLECTION_ID)
        ]
      })
      
      const txBytes = await tx.build({ client, onlyTransactionKind: true })
      
      // Decrypt data
      const encryptedBytes = Buffer.from(decryptForm.encryptedData, 'base64')
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
      a.download = 'decrypted_file'
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
          Encrypt and decrypt files using Seal threshold encryption. Only users with level 4+ access can decrypt.
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
            <label className="block text-sm font-medium mb-1">NFT Token ID</label>
            <input
              type="number"
              value={encryptForm.tokenId}
              onChange={(e) => setEncryptForm({ ...encryptForm, tokenId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Token ID that controls access"
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
              <option value="1">1-of-2 (Fastest)</option>
              <option value="2">2-of-2 (Most secure)</option>
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
                      <div>Token ID: {file.tokenId}</div>
                      <div>Threshold: {file.threshold}-of-2</div>
                      <div className="font-mono text-xs break-all">
                        Backup Key: {file.backupKey.substring(0, 32)}...
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDecryptForm({
                        tokenId: file.tokenId,
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
            <label className="block text-sm font-medium mb-1">NFT Token ID</label>
            <input
              type="number"
              value={decryptForm.tokenId}
              onChange={(e) => setDecryptForm({ ...decryptForm, tokenId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Token ID for access check"
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