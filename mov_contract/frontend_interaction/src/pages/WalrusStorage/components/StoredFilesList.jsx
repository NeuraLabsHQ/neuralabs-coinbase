
import toast from 'react-hot-toast'

export function StoredFilesList({ storedFiles }) {
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const openInWalrus = (blobId) => {
    const url = `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`
    window.open(url, '_blank')
  }

  if (storedFiles.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Stored Files</h3>
      <div className="space-y-4">
        {storedFiles.map((file, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{file.fileName}</h4>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <p>Size: {(file.fileSize / 1024).toFixed(2)} KB | Type: {file.fileType}</p>
                  <p>NFT: {String(file.nftObjectId).slice(0, 16)}...</p>
                  <p>Uploaded: {new Date(file.timestamp).toLocaleString()}</p>
                  {file.encryptedKeyId && file.encryptedKeyId !== 'none' && (
                    <p className="text-amber-600">
                      🔐 Encrypted (Key: {String(file.encryptedKeyId).slice(0, 16)}...)
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500">Blob ID:</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden">
                    {file.blobId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(file.blobId, 'Blob ID')}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => openInWalrus(file.blobId)}
                    className="text-xs text-green-500 hover:text-green-600"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-gray-500">
              <p>Threshold: {file.threshold}</p>
              <p>Key Servers: {file.keyServerCount}</p>
              <p>Epochs: {file.epochs || 1}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}