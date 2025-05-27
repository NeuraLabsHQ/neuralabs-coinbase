

export function EncryptedDataSection({ encryptedData }) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(parseInt(timestamp)).toLocaleString()
  }

  if (encryptedData.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">🔒 Encrypted Data Storage</h3>
        <p className="text-gray-500 text-center py-8">
          No encrypted data found for this NFT
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">🔒 Encrypted Data Storage</h3>
      <div className="space-y-4">
        {encryptedData.map((data, index) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Walrus Blob ID</label>
                <p className="font-mono text-sm break-all">{data.walrus_blob_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">File Size</label>
                <p>{formatFileSize(data.file_size)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Content Type</label>
                <p>{data.content_type || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Encrypted At</label>
                <p>{formatTimestamp(data.encrypted_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">File Hash</label>
                <p className="font-mono text-xs break-all">{data.file_hash}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Seal Key ID</label>
                <p className="font-mono text-xs">
                  [{Array.isArray(data.seal_key_id) ? data.seal_key_id.join(', ') : 'N/A'}]
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Walrus URL</label>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-xs break-all flex-1">{data.walrus_url}</p>
                  <a
                    href={data.walrus_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}