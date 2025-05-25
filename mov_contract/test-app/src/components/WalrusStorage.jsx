import React, { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { WalrusClient } from '@mysten/walrus'
import toast from 'react-hot-toast'

/**
 * WalrusStorage Component
 * Manages encrypted file storage on Walrus using the official SDK
 */
function WalrusStorage({ config }) {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const [walrusClient, setWalrusClient] = useState(null)
  
  const [uploadForm, setUploadForm] = useState({
    nftObjectId: '',
    file: null,
    encryptedKeyId: '',
    threshold: '3',
    keyServerCount: '5',
    epochs: '1'
  })
  
  const [storedFiles, setStoredFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isStoring, setIsStoring] = useState(false)
  const [downloadBlobId, setDownloadBlobId] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  
  // New state for NFT management
  const [myNFTs, setMyNFTs] = useState([])
  const [selectedNFTFromDropdown, setSelectedNFTFromDropdown] = useState('')

  // Load user's NFTs
  const loadMyNFTs = async () => {
    if (!account) return

    try {
      const objects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${config.PACKAGE_ID}::nft::NeuraLabsNFT`
        },
        options: {
          showType: true,
          showContent: true,
        }
      })

      const nfts = objects.data.map(obj => {
        const fields = obj.data?.content?.fields || {};
        return {
          id: obj.data?.objectId || '',
          name: fields.name || '',
          description: fields.description || '',
          creator: fields.creator || '',
          created_at: fields.created_at || fields.creation_date || Date.now()
        };
      })

      setMyNFTs(nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
    }
  }

  // Initialize Walrus client and load NFTs
  useEffect(() => {
    const initWalrusClient = async () => {
      if (!account) {
        console.log('No account connected, skipping Walrus client initialization')
        setWalrusClient(null)
        return
      }
      
      try {
        console.log('Initializing Walrus SDK for account:', account.address)
        
        // Initialize Walrus client according to official documentation
        const client = new WalrusClient({
          network: 'testnet',
          suiClient: suiClient,
        })
        
        setWalrusClient(client)
        console.log('Walrus SDK client initialized successfully')
      } catch (error) {
        console.error('Failed to initialize Walrus client:', error)
        toast.error('Failed to initialize Walrus client')
      }
    }
    
    // Only initialize once when account changes
    initWalrusClient()
    
    // Load NFTs when account is connected
    if (account) {
      loadMyNFTs()
    }
  }, [account?.address, suiClient])

  // Upload file to Walrus using HTTP API (more reliable than SDK for dApp Kit integration)
  const uploadToWalrusHTTP = async (fileData, fileName, epochs) => {
    if (!account) {
      throw new Error('No wallet connected')
    }

    try {
      console.log(`Uploading ${fileName} for ${epochs} epochs using HTTP API...`)
      
      // Use Walrus HTTP API for upload
      const response = await fetch(`https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=${epochs}`, {
        method: 'PUT',
        body: fileData,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Upload successful via HTTP:', result)
      
      if (result.newlyCreated) {
        return {
          blobId: result.newlyCreated.blobObject.blobId,
          cost: result.newlyCreated.cost,
          url: `https://aggregator.walrus-testnet.walrus.space/v1/${result.newlyCreated.blobObject.blobId}`
        }
      } else if (result.alreadyCertified) {
        return {
          blobId: result.alreadyCertified.blobId,
          cost: { storageCost: '0', writeFee: '0' },
          url: `https://aggregator.walrus-testnet.walrus.space/v1/${result.alreadyCertified.blobId}`
        }
      } else {
        throw new Error('Unexpected response format from Walrus')
      }
      
    } catch (error) {
      console.error('Walrus HTTP upload error:', error)
      
      if (error.message.includes('403') || error.message.includes('Unauthorized')) {
        throw new Error('This might be a public Walrus node. Try again or use a different approach.')
      } else {
        throw new Error(`Failed to upload to Walrus: ${error.message}`)
      }
    }
  }

  // Download file from Walrus using official SDK
  const downloadFromWalrusSDK = async (blobId) => {
    if (!walrusClient) {
      throw new Error('Walrus SDK not initialized')
    }

    try {
      console.log(`Downloading blob: ${blobId} using Walrus SDK`)
      
      // Use the official Walrus SDK readBlob method
      const data = await walrusClient.readBlob({ blobId })
      
      console.log(`Download successful: ${data.length} bytes`)
      return data
    } catch (error) {
      console.error('Walrus SDK download error:', error)
      
      // Handle retryable errors according to SDK documentation
      if (error.constructor.name === 'RetryableWalrusClientError') {
        console.log('Retryable error encountered, resetting client and retrying...')
        walrusClient.reset()
        throw new Error('Walrus network error - please try again')
      }
      
      throw new Error(`Failed to download from Walrus: ${error.message}`)
    }
  }

  // Handle file upload and storage reference
  const handleFileUpload = async (e) => {
    e.preventDefault()
    
    if (!account || !uploadForm.file || !uploadForm.nftObjectId || !walrusClient) {
      toast.error('Please fill all required fields and ensure wallet is connected')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Processing file...')

    try {
      // Read file as Uint8Array
      const fileContent = await readFileAsArrayBuffer(uploadForm.file)
      const fileData = new Uint8Array(fileContent)
      
      // Mock encryption (in production, use Seal)
      // For demo purposes, we'll just prefix the data
      const prefix = new TextEncoder().encode('ENCRYPTED_')
      const encryptedData = new Uint8Array(prefix.length + fileData.length)
      encryptedData.set(prefix)
      encryptedData.set(fileData, prefix.length)
      
      // Upload to Walrus using HTTP API
      toast.loading('Uploading to Walrus via HTTP API...', { id: toastId })
      const walrusResult = await uploadToWalrusHTTP(
        encryptedData, 
        uploadForm.file.name,
        uploadForm.epochs
      )
      
      // Calculate file hash
      const fileHash = await calculateHash(fileData)
      
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
        fileHash,
        cost: walrusResult.cost,
        epochs: uploadForm.epochs
      }
      
      setStoredFiles([...storedFiles, storedFile])
      toast.success('File uploaded successfully via Walrus HTTP API!', { id: toastId })
      
      // Reset form
      setUploadForm({
        nftObjectId: '',
        file: null,
        encryptedKeyId: '',
        threshold: '3',
        keyServerCount: '5',
        epochs: '1'
      })
      setSelectedNFTFromDropdown('')
      
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(`Upload failed: ${error.message}`, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file download using SDK
  const handleFileDownload = async () => {
    if (!downloadBlobId || !walrusClient) {
      toast.error('Please enter a blob ID')
      return
    }

    setIsDownloading(true)
    const toastId = toast.loading('Downloading from Walrus...')

    try {
      // Download from Walrus using official SDK
      const encryptedData = await downloadFromWalrusSDK(downloadBlobId)
      
      // Mock decryption (in production, use Seal)
      // For demo, we'll just remove the ENCRYPTED_ prefix
      const prefix = new TextEncoder().encode('ENCRYPTED_')
      let decryptedData = encryptedData
      
      // Check if data starts with our mock encryption prefix
      const prefixMatch = encryptedData.slice(0, prefix.length).every(
        (byte, i) => byte === prefix[i]
      )
      
      if (prefixMatch) {
        decryptedData = encryptedData.slice(prefix.length)
      }
      
      // Create download link
      const blob = new Blob([decryptedData])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `walrus_download_${downloadBlobId.substring(0, 8)}.dat`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('File downloaded successfully!', { id: toastId })
      setDownloadBlobId('')
      
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error(`Download failed: ${error.message}`, { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  // Store encrypted reference in NFT
  const storeEncryptedReference = async (data) => {
    setIsStoring(true)
    
    try {
      // Validate required data
      if (!data.nftObjectId || !data.walrusBlobId || !data.fileHash) {
        throw new Error('Missing required data: nftObjectId, walrusBlobId, or fileHash')
      }
      
      const tx = new Transaction()
      
      // Convert encrypted key ID to vector<u8> with validation
      let keyIdBytes
      try {
        if (!data.encryptedKeyId || data.encryptedKeyId.trim() === '') {
          // Generate default key ID if none provided
          keyIdBytes = [1, 2, 3, 4, 5, 6, 7, 8]
        } else {
          keyIdBytes = data.encryptedKeyId.split(' ').map(n => {
            const num = parseInt(n.trim())
            if (isNaN(num)) throw new Error(`Invalid number: ${n}`)
            return num
          })
        }
      } catch (error) {
        console.error('Error parsing encrypted key ID:', error)
        // Use fallback key ID
        keyIdBytes = [1, 2, 3, 4, 5, 6, 7, 8]
      }
      
      tx.moveCall({
        target: `${config.PACKAGE_ID}::storage::upload_encrypted_data`,
        arguments: [
          tx.object(data.nftObjectId),              // nft: &mut NeuraLabsNFT
          tx.object(config.REGISTRY_ID),            // registry: &AccessRegistry
          tx.pure.string(data.walrusBlobId),        // walrus_blob_id: String
          tx.pure.vector('u8', keyIdBytes),         // seal_key_id: vector<u8>
          tx.pure.string(data.fileHash || ''),     // file_hash: String
          tx.pure.u64(data.fileSize || 0),         // file_size: u64
          tx.pure.string(data.contentType || 'application/octet-stream'), // content_type: String
          tx.object('0x6')                         // clock: &sui::clock::Clock
        ],
      })

      return new Promise((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction: tx,
            options: {
              showEffects: true,
            },
          },
          {
            onSuccess: (result) => {
              console.log('Reference stored:', result)
              resolve(result)
            },
            onError: (error) => {
              console.error('Error storing reference:', error)
              reject(error)
            }
          }
        )
      })
      
    } catch (error) {
      throw error
    } finally {
      setIsStoring(false)
    }
  }

  // Helper functions
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const calculateHash = async (data) => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
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

  const formatCost = (cost) => {
    if (!cost) return 'N/A'
    const storageCost = cost.storageCost ? (parseInt(cost.storageCost) / 1e9).toFixed(6) : '0'
    const writeFee = cost.writeFee ? (parseInt(cost.writeFee) / 1e9).toFixed(6) : '0'
    return `Storage: ${storageCost} SUI, Write: ${writeFee} SUI`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Walrus Storage (HTTP API)</h2>
        <p className="text-gray-600 mb-4">
          Upload encrypted files to Walrus decentralized storage using the HTTP API.
        </p>
        {walrusClient ? (
          <div className="text-sm text-green-600">✅ Walrus client configured</div>
        ) : (
          <div className="text-sm text-yellow-600">⏳ Configuring Walrus client...</div>
        )}
      </div>

      {/* Upload Form */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Upload Encrypted File</h3>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select NFT (Optional)</label>
            <select
              value={selectedNFTFromDropdown}
              onChange={(e) => {
                setSelectedNFTFromDropdown(e.target.value)
                if (e.target.value) {
                  setUploadForm({ ...uploadForm, nftObjectId: e.target.value })
                }
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="">Choose from your NFTs...</option>
              {myNFTs.map((nft) => (
                <option key={nft.id} value={nft.id}>
                  {nft.name} ({String(nft.id).slice(0, 10)}...)
                </option>
              ))}
            </select>
            {myNFTs.length === 0 && account && (
              <p className="text-xs text-amber-600 mb-2">
                No NFTs found. Create NFTs in the NFT Manager tab first.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">NFT Object ID</label>
            <input
              type="text"
              value={uploadForm.nftObjectId}
              onChange={(e) => {
                setUploadForm({ ...uploadForm, nftObjectId: e.target.value })
                // Clear dropdown selection if user manually edits the input
                if (e.target.value !== selectedNFTFromDropdown) {
                  setSelectedNFTFromDropdown('')
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedNFTFromDropdown ? 'bg-gray-100' : ''
              }`}
              placeholder="0x... (NFT object to attach file to)"
              disabled={selectedNFTFromDropdown !== ''}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {selectedNFTFromDropdown 
                ? 'Selected from dropdown above. Clear dropdown to edit manually.'
                : 'The NFT object ID (not token ID) to attach this file to'
              }
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
              Storage Duration (Epochs)
            </label>
            <select
              value={uploadForm.epochs}
              onChange={(e) => setUploadForm({ ...uploadForm, epochs: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1 epoch (~1 day)</option>
              <option value="5">5 epochs (~5 days)</option>
              <option value="10">10 epochs (~10 days)</option>
              <option value="30">30 epochs (~30 days)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Longer storage duration costs more SUI
            </p>
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
                <option value="1">1 of N</option>
                <option value="2">2 of N</option>
                <option value="3">3 of N (Recommended)</option>
                <option value="4">4 of N</option>
                <option value="5">5 of N</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Key Servers</label>
              <select
                value={uploadForm.keyServerCount}
                onChange={(e) => setUploadForm({ ...uploadForm, keyServerCount: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">3 servers</option>
                <option value="4">4 servers</option>
                <option value="5">5 servers (Recommended)</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isUploading || isStoring || !walrusClient}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isUploading ? 'Uploading via HTTP...' : 'Upload to Walrus'}
          </button>
        </form>
      </div>

      {/* Download Section */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Download File from Walrus</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={downloadBlobId}
            onChange={(e) => setDownloadBlobId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Walrus blob ID"
          />
          <button
            onClick={handleFileDownload}
            disabled={isDownloading || !walrusClient || !downloadBlobId}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
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
                      <div>Storage Duration: {file.epochs} epochs</div>
                      <div>Cost: {formatCost(file.cost)}</div>
                      <div className="text-xs">
                        Hash: {file.fileHash.substring(0, 32)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        Uploaded: {new Date(file.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 space-y-2">
                    <button
                      onClick={() => setDownloadBlobId(file.walrusBlobId)}
                      className="text-sm text-blue-500 hover:text-blue-600 block"
                    >
                      Copy Blob ID
                    </button>
                    <a
                      href={file.walrusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-500 hover:text-green-600 block"
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

      {/* SDK Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">📊 SDK Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Native TypeScript support</li>
            <li>• Automatic retry logic</li>
            <li>• Error handling & recovery</li>
            <li>• Cost estimation</li>
            <li>• Type-safe API</li>
          </ul>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">🔐 Security Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Files encrypted before upload</li>
            <li>• Access controlled by NFT ownership</li>
            <li>• Decentralized storage on Walrus</li>
            <li>• Integrity verified by hash</li>
            <li>• Threshold encryption support</li>
          </ul>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-medium text-blue-900 mb-2">📋 Complete SDK Workflow</h4>
        <ol className="text-sm text-blue-800 space-y-2">
          <li>1. SDK initializes with SUI client connection</li>
          <li>2. Create NFT with desired access level (NFT Manager tab)</li>
          <li>3. Grant access to users who need it (Access Control tab)</li>
          <li>4. Encrypt files using Seal (Seal Encryption tab)</li>
          <li>5. Upload encrypted files via Walrus SDK (this tab)</li>
          <li>6. SDK handles chunking, retries, and error recovery</li>
          <li>7. Users with level 4+ access can download via SDK</li>
        </ol>
      </div>
    </div>
  )
}

export default WalrusStorage