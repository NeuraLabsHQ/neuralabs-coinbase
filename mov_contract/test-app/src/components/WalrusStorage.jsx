import React, { useState } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import toast from 'react-hot-toast'

/**
 * WalrusStorage Component
 * Manages encrypted file storage on Walrus
 */
function WalrusStorage({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [uploadForm, setUploadForm] = useState({
    nftObjectId: '',
    file: null,
    encryptedKeyId: '',
    threshold: '1',
    keyServerCount: '2'
  })
  
  const [storedFiles, setStoredFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isStoring, setIsStoring] = useState(false)

  // Mock Walrus upload (in production, use actual Walrus SDK)
  const uploadToWalrus = async (encryptedData) => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock blob ID
    const blobId = `walrus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      blobId,
      url: `https://walrus.testnet.io/${blobId}`,
      size: encryptedData.length
    }
  }

  // Handle file upload and storage reference
  const handleFileUpload = async (e) => {
    e.preventDefault()
    
    if (!account || !uploadForm.file || !uploadForm.nftObjectId) {
      toast.error('Please fill all required fields')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Processing file...')

    try {
      // Read file
      const fileContent = await readFile(uploadForm.file)
      
      // Mock encryption (in production, use Seal)
      const encryptedData = new TextEncoder().encode(
        'ENCRYPTED_' + fileContent
      )
      
      // Upload to Walrus
      toast.loading('Uploading to Walrus...', { id: toastId })
      const walrusResult = await uploadToWalrus(encryptedData)
      
      // Calculate file hash
      const fileHash = await calculateHash(fileContent)
      
      // Store reference in NFT
      toast.loading('Storing reference in NFT...', { id: toastId })
      await storeEncryptedReference({
        nftObjectId: uploadForm.nftObjectId,
        walrusBlobId: walrusResult.blobId,
        encryptedKeyId: uploadForm.encryptedKeyId || generateMockKeyId(),
        fileHash,
        fileSize: uploadForm.file.size,
        contentType: uploadForm.file.type || 'application/octet-stream'
      })
      
      // Add to stored files list
      const storedFile = {
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        walrusBlobId: walrusResult.blobId,
        walrusUrl: walrusResult.url,
        nftObjectId: uploadForm.nftObjectId,
        timestamp: new Date().toISOString(),
        fileHash
      }
      
      setStoredFiles([...storedFiles, storedFile])
      toast.success('File uploaded and stored successfully!', { id: toastId })
      
      // Reset form
      setUploadForm({
        nftObjectId: '',
        file: null,
        encryptedKeyId: '',
        threshold: '1',
        keyServerCount: '2'
      })
      
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(`Upload failed: ${error.message}`, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  // Store encrypted reference in NFT
  const storeEncryptedReference = async (data) => {
    setIsStoring(true)
    
    try {
      const tx = new TransactionBlock()
      
      // Convert encrypted key ID to vector<u8>
      const keyIdBytes = data.encryptedKeyId.split(' ').map(n => parseInt(n))
      
      tx.moveCall({
        target: `${config.PACKAGE_ID}::nft::add_encrypted_data`,
        arguments: [
          tx.object(data.nftObjectId),
          tx.object(config.COLLECTION_ID),
          tx.pure(data.walrusBlobId),
          tx.pure.vector('u8', keyIdBytes),
          tx.pure(JSON.stringify({
            threshold: parseInt(uploadForm.threshold),
            keyServers: parseInt(uploadForm.keyServerCount)
          })),
          tx.pure(data.fileHash),
          tx.pure(data.fileSize),
          tx.pure(data.contentType),
          tx.pure(parseInt(uploadForm.threshold)),
          tx.pure(parseInt(uploadForm.keyServerCount)),
          tx.object('0x6') // Clock
        ],
      })

      const result = await client.signAndExecuteTransactionBlock({
        signer: account,
        transactionBlock: tx,
        options: {
          showEffects: true,
        },
      })

      console.log('Reference stored:', result)
      
    } catch (error) {
      throw error
    } finally {
      setIsStoring(false)
    }
  }

  // Helper functions
  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const calculateHash = async (data) => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const generateMockKeyId = () => {
    // Generate 8 random bytes
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes).join(' ')
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Walrus Storage</h2>
        <p className="text-gray-600 mb-4">
          Upload encrypted files to Walrus decentralized storage and link them to NFTs.
        </p>
      </div>

      {/* Upload Form */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Upload Encrypted File</h3>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">NFT Object ID</label>
            <input
              type="text"
              value={uploadForm.nftObjectId}
              onChange={(e) => setUploadForm({ ...uploadForm, nftObjectId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x... (NFT object to attach file to)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The NFT object ID (not token ID) to attach this file to
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">File to Upload</label>
            <input
              type="file"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {uploadForm.file && (
              <div className="mt-2 text-sm text-gray-600">
                <div>Selected: {uploadForm.file.name}</div>
                <div>Size: {formatFileSize(uploadForm.file.size)}</div>
                <div>Type: {uploadForm.file.type || 'Unknown'}</div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Encrypted Key ID (optional)
            </label>
            <input
              type="text"
              value={uploadForm.encryptedKeyId}
              onChange={(e) => setUploadForm({ ...uploadForm, encryptedKeyId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Space-separated bytes (e.g., 1 2 3 4 5 6 7 8)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to generate a random key ID
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Threshold</label>
              <select
                value={uploadForm.threshold}
                onChange={(e) => setUploadForm({ ...uploadForm, threshold: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Key Servers</label>
              <select
                value={uploadForm.keyServerCount}
                onChange={(e) => setUploadForm({ ...uploadForm, keyServerCount: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isUploading || isStoring}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload to Walrus'}
          </button>
        </form>
      </div>

      {/* Stored Files */}
      {storedFiles.length > 0 && (
        <div className="border rounded-lg p-6">
          <h3 className="font-medium mb-4">Stored Files</h3>
          <div className="space-y-3">
            {storedFiles.map((file, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{file.fileName}</h4>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <div>Size: {formatFileSize(file.fileSize)}</div>
                      <div>
                        Walrus Blob ID: 
                        <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                          {file.walrusBlobId}
                        </code>
                      </div>
                      <div>
                        NFT Object: 
                        <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                          {file.nftObjectId.substring(0, 16)}...
                        </code>
                      </div>
                      <div className="text-xs">
                        Hash: {file.fileHash.substring(0, 32)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        Uploaded: {new Date(file.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <a
                      href={file.walrusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      View on Walrus
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Storage Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">📊 Storage Limits</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Max file size: 10 MB (testnet)</li>
            <li>• Supported formats: All file types</li>
            <li>• Encryption: Required before upload</li>
            <li>• Persistence: Testnet data may be cleared</li>
          </ul>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">🔐 Security Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Files encrypted before upload</li>
            <li>• Access controlled by NFT ownership</li>
            <li>• Decentralized storage on Walrus</li>
            <li>• Integrity verified by hash</li>
          </ul>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-medium text-blue-900 mb-2">📋 Complete Workflow</h4>
        <ol className="text-sm text-blue-800 space-y-2">
          <li>1. Create NFT with desired access level (NFT Manager tab)</li>
          <li>2. Grant access to users who need it (Access Control tab)</li>
          <li>3. Encrypt files using Seal (Seal Encryption tab)</li>
          <li>4. Upload encrypted files to Walrus (this tab)</li>
          <li>5. Users with level 4+ access can decrypt and download</li>
        </ol>
      </div>
    </div>
  )
}

export default WalrusStorage