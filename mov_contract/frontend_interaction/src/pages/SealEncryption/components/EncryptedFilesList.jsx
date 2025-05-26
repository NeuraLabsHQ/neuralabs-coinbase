
import toast from 'react-hot-toast'

export function EncryptedFilesList({ encryptedFiles }) {
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  if (encryptedFiles.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Encrypted Files</h3>
      <div className="space-y-4">
        {encryptedFiles.map((file, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{file.fileName}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Size: {(file.fileSize / 1024).toFixed(2)} KB | 
                  Threshold: {file.threshold} | 
                  Time: {new Date(file.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  NFT: {String(file.nftId).slice(0, 10)}...
                </p>
                {file.walrusBlobId && (
                  <p className="text-sm text-green-600 mt-1">
                    Walrus Blob ID: {file.walrusBlobId}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Encryption ID:</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden">
                    {String(file.encryptionId).slice(0, 40)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(file.encryptionId, 'Encryption ID')}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">Encrypted Data:</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden">
                    {file.encryptedData.slice(0, 40)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(file.encryptedData, 'Encrypted data')}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              {file.walrusBlobId && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Walrus Blob ID:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {file.walrusBlobId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(file.walrusBlobId, 'Walrus Blob ID')}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}