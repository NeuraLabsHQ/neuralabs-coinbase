import { checkUserAccess, decryptData, downloadFromWalrus, createTransaction } from '../../../utils/blockchain'
import { fromHex, toHex } from '@mysten/sui/utils'
import { Transaction } from '@mysten/sui/transactions'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function DecryptSection({ account, sealClient, sessionKey, userNFTs, config, client }) {
  const [decryptForm, setDecryptForm] = useState({
    nftId: '',
    encryptedData: '',
    walrusBlobId: ''
  })
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedContent, setDecryptedContent] = useState(null)

  // Handle decryption
  const handleDecryptFile = async (e) => {
    e.preventDefault()

    if (!sessionKey || !sealClient) {
      toast.error('Session key and Seal client are required')
      return
    }

    if (!decryptForm.nftId || (!decryptForm.encryptedData && !decryptForm.walrusBlobId)) {
      toast.error('Please provide NFT ID and either encrypted data or Walrus blob ID')
      return
    }

    // Check NFT access before decrypting
    const accessResult = await checkUserAccess(decryptForm.nftId, account.address)
    if (accessResult.level < 4) {
      toast.error(`Insufficient access level (${accessResult.level}/4). You need level 4+ to encrypt/decrypt files.`)
      return
    }

    setIsDecrypting(true)
    const toastId = toast.loading('Decrypting file...')

    try {
      let encryptedData, encryptionId, fileName

      // If Walrus blob ID provided, fetch from Walrus
      if (decryptForm.walrusBlobId) {
        const walrusData = await downloadFromWalrus(decryptForm.walrusBlobId)
        const parsed = JSON.parse(walrusData)
        encryptedData = fromHex(parsed.encryptedData)
        encryptionId = parsed.encryptionId
        fileName = parsed.fileName
      } else {
        // Use provided encrypted data
        encryptedData = fromHex(decryptForm.encryptedData)
        // For manual input, we need to reconstruct the encryption ID
        const nftIdBytes = fromHex(decryptForm.nftId)
        const paddedNftId = new Uint8Array(32)
        paddedNftId.set(nftIdBytes.slice(0, 32))
        const nonce = crypto.getRandomValues(new Uint8Array(16))
        encryptionId = toHex(new Uint8Array([...paddedNftId, ...nonce]))
        fileName = 'decrypted-file'
      }

      // Create transaction for fetching keys
      const tx = new Transaction()
      tx.setSender(account.address)

      // Add the seal_approve call
      tx.moveCall({
        target: `${config.PACKAGE_ID}::access::seal_approve`,
        arguments: [
          tx.pure.vector('u8', fromHex(encryptionId)),
          tx.object(decryptForm.nftId),
          tx.object(config.ACCESS_REGISTRY_ID),
        ],
      })

      // Get transaction bytes for decryption
      if (!client) {
        throw new Error('SUI client not available')
      }
      const txBytes = await tx.build({ client: client, onlyTransactionKind: true })

      // Decrypt the data using the seal client directly
      const decrypted = await decryptData(sealClient, {
        encryptedData,
        sessionKey,
        txBytes
      })

      // Convert decrypted data to blob for download
      const blob = new Blob([decrypted], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)

      setDecryptedContent({
        url,
        fileName: fileName || 'decrypted-file',
        size: decrypted.length
      })

      toast.success('File decrypted successfully!', { id: toastId })
    } catch (error) {
      console.error('Error decrypting file:', error)
      toast.error(`Decryption failed: ${error.message}`, { id: toastId })
    } finally {
      setIsDecrypting(false)
    }
  }

  // Download decrypted file
  const downloadDecryptedFile = () => {
    if (!decryptedContent) return

    const a = document.createElement('a')
    a.href = decryptedContent.url
    a.download = decryptedContent.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // Clean up
    URL.revokeObjectURL(decryptedContent.url)
    setDecryptedContent(null)
    toast.success('File downloaded!')
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Decrypt File</h3>
      
      {!sessionKey ? (
        <p className="text-gray-500">Create a session key first to decrypt files.</p>
      ) : (
        <form onSubmit={handleDecryptFile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select NFT</label>
            <select
              value={decryptForm.nftId}
              onChange={(e) => setDecryptForm({ ...decryptForm, nftId: e.target.value })}
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
            <label className="block text-sm font-medium mb-1">
              Encrypted Data (hex) or Walrus Blob ID
            </label>
            <textarea
              value={decryptForm.encryptedData}
              onChange={(e) => setDecryptForm({ ...decryptForm, encryptedData: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste encrypted data hex string..."
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Or Walrus Blob ID</label>
            <input
              type="text"
              value={decryptForm.walrusBlobId}
              onChange={(e) => setDecryptForm({ ...decryptForm, walrusBlobId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 9BsZ9..."
            />
          </div>

          <button
            type="submit"
            disabled={isDecrypting}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isDecrypting ? 'Decrypting...' : 'Decrypt File'}
          </button>
        </form>
      )}

      {decryptedContent && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">File decrypted successfully!</p>
          <p className="text-sm text-gray-600 mt-1">
            {decryptedContent.fileName} ({(decryptedContent.size / 1024).toFixed(2)} KB)
          </p>
          <button
            onClick={downloadDecryptedFile}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Download File
          </button>
        </div>
      )}
    </div>
  )
}