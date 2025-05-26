import React, { useState } from 'react'
import { uploadToWalrus } from '@blockchain/walrus'
import { storeWalrusMetadata } from '@blockchain/walrus'
import { checkUserAccess } from '@blockchain/access-management'
import toast from 'react-hot-toast'

export function UploadSection({ account, myNFTs, onFileUploaded }) {
  const [uploadForm, setUploadForm] = useState({
    nftObjectId: '',
    file: null,
    encryptedKeyId: '',
    threshold: '3',
    keyServerCount: '5',
    epochs: '1'
  })
  const [isUploading, setIsUploading] = useState(false)

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setUploadForm({ ...uploadForm, file })
    }
  }

  // Handle NFT selection
  const handleNFTSelect = (e) => {
    const value = e.target.value
    setUploadForm({ ...uploadForm, nftObjectId: value })
  }

  // Upload file to Walrus
  const handleUploadFile = async (e) => {
    e.preventDefault()
    
    if (!uploadForm.file || !uploadForm.nftObjectId) {
      toast.error('Please select a file and NFT')
      return
    }

    // Check NFT access
    const accessLevel = await checkUserAccess(uploadForm.nftObjectId, account.address)
    if (accessLevel < 4) {
      toast.error(`Insufficient access level (${accessLevel}/4). You need level 4+ to upload files.`)
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Uploading to Walrus...')

    try {
      // Create metadata
      const metadata = {
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        fileType: uploadForm.file.type,
        nftObjectId: uploadForm.nftObjectId,
        uploadedBy: account.address,
        encryptedKeyId: uploadForm.encryptedKeyId || 'none',
        threshold: parseInt(uploadForm.threshold),
        keyServerCount: parseInt(uploadForm.keyServerCount),
        timestamp: new Date().toISOString()
      }

      // Upload file to Walrus
      const blobId = await uploadToWalrus(uploadForm.file)

      // Store metadata on-chain if needed
      const storedFile = {
        ...metadata,
        blobId,
        walrusUri: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`
      }

      // Notify parent component
      onFileUploaded(storedFile)

      toast.success(`File uploaded successfully! Blob ID: ${blobId}`, { id: toastId })
      
      // Reset form
      setUploadForm({
        nftObjectId: '',
        file: null,
        encryptedKeyId: '',
        threshold: '3',
        keyServerCount: '5',
        epochs: '1'
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(`Upload failed: ${error.message}`, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Upload File to Walrus</h3>
      
      <form onSubmit={handleUploadFile} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select NFT</label>
          <select
            value={uploadForm.nftObjectId}
            onChange={handleNFTSelect}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select an NFT...</option>
            {myNFTs.map((nft) => (
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
          {uploadForm.file && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Encrypted Key ID (Optional)
          </label>
          <input
            type="text"
            value={uploadForm.encryptedKeyId}
            onChange={(e) => setUploadForm({ ...uploadForm, encryptedKeyId: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ID of the encrypted key for this file"
          />
          <p className="text-xs text-gray-500 mt-1">
            If this file is encrypted, provide the key ID from Seal encryption
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Threshold</label>
            <input
              type="number"
              value={uploadForm.threshold}
              onChange={(e) => setUploadForm({ ...uploadForm, threshold: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Key Servers</label>
            <input
              type="number"
              value={uploadForm.keyServerCount}
              onChange={(e) => setUploadForm({ ...uploadForm, keyServerCount: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Epochs</label>
            <input
              type="number"
              value={uploadForm.epochs}
              onChange={(e) => setUploadForm({ ...uploadForm, epochs: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload to Walrus'}
        </button>
      </form>
    </div>
  )
}