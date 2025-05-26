import { checkUserAccess, encryptData, uploadToWalrus } from '../../../utils/blockchain'
import { fromHex, toHex } from '@mysten/sui/utils'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function EncryptSection({ account, sealClient, sessionKey, userNFTs, config, onFileEncrypted }) {
  const [encryptForm, setEncryptForm] = useState({
    nftId: '',
    file: null,
    threshold: '2'
  })
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isUploadingToWalrus, setIsUploadingToWalrus] = useState(false)

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

  // Read file as array buffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // Handle file encryption
  const handleEncryptFile = async (e) => {
    e.preventDefault()

    if (!encryptForm.file || !encryptForm.nftId || !sealClient) {
      toast.error('Please fill all fields and ensure Seal client is initialized')
      return
    }

    // Check NFT access before encrypting
    const access = await checkUserAccess(encryptForm.nftId, account.address)
    if (access < 4) {
      toast.error(`Insufficient access level (${access}/4). You need level 4+ to encrypt/decrypt files.`)
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
      // Ensure NFT ID is 32 bytes (pad with zeros if needed)
      const paddedNftId = new Uint8Array(32)
      paddedNftId.set(nftIdBytes.slice(0, 32))

      // Generate a random nonce
      const nonce = crypto.getRandomValues(new Uint8Array(16))
      const fullId = toHex(new Uint8Array([...paddedNftId, ...nonce]))

      // Encrypt using Seal
      const { encryptedData, symmetricKey } = await encryptData({
        data,
        threshold: parseInt(encryptForm.threshold),
        packageId: config.PACKAGE_ID,
        encryptionId: fullId,
        client: sealClient
      })

      // Store encrypted file info
      const encryptedFile = {
        fileName: encryptForm.file.name,
        fileSize: encryptForm.file.size,
        nftId: encryptForm.nftId,
        encryptedData: toHex(encryptedData),
        symmetricKey: toHex(symmetricKey),
        encryptionId: fullId,
        threshold: encryptForm.threshold,
        timestamp: new Date().toISOString()
      }

      onFileEncrypted(encryptedFile)
      toast.success('File encrypted successfully!', { id: toastId })

      // Ask if user wants to upload to Walrus
      const uploadChoice = window.confirm(
        'Would you like to upload the encrypted file to Walrus for permanent storage?'
      )
      if (uploadChoice) {
        await handleUploadToWalrus(encryptedFile)
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

  // Upload to Walrus
  const handleUploadToWalrus = async (encryptedFile) => {
    setIsUploadingToWalrus(true)
    const toastId = toast.loading('Uploading to Walrus...')

    try {
      const dataToUpload = {
        encryptedData: encryptedFile.encryptedData,
        encryptionId: encryptedFile.encryptionId,
        fileName: encryptedFile.fileName,
        fileSize: encryptedFile.fileSize,
        nftId: encryptedFile.nftId,
        threshold: encryptedFile.threshold,
        timestamp: encryptedFile.timestamp
      }

      const blob = new Blob([JSON.stringify(dataToUpload)], { type: 'application/json' })
      const blobId = await uploadToWalrus(blob)

      toast.success(`Uploaded to Walrus! Blob ID: ${blobId}`, { id: toastId })
      
      // Update encrypted file with Walrus blob ID
      encryptedFile.walrusBlobId = blobId
      onFileEncrypted(encryptedFile)
    } catch (error) {
      console.error('Error uploading to Walrus:', error)
      toast.error(`Upload failed: ${error.message}`, { id: toastId })
    } finally {
      setIsUploadingToWalrus(false)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Encrypt File</h3>
      
      {!sessionKey ? (
        <p className="text-gray-500">Create a session key first to encrypt files.</p>
      ) : (
        <form onSubmit={handleEncryptFile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select NFT</label>
            <select
              value={encryptForm.nftId}
              onChange={(e) => setEncryptForm({ ...encryptForm, nftId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an NFT...</option>
              {userNFTs.map((nft) => (
                <option key={nft.id} value={nft.id}>
                  {nft.name} ({String(nft.id).slice(0, 10)}...)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Select File</label>
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
              <option value="1">1 server (faster, less secure)</option>
              <option value="2">2 servers (balanced)</option>
              <option value="3">3 servers (more secure)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isEncrypting || isUploadingToWalrus}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isEncrypting ? 'Encrypting...' : 'Encrypt File'}
          </button>
        </form>
      )}
    </div>
  )
}