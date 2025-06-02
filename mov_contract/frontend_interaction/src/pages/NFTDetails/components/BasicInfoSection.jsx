

export function BasicInfoSection({ nftDetails }) {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(parseInt(timestamp)).toLocaleString()
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">📋 Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Name</label>
          <p className="text-lg font-semibold">{nftDetails.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Object ID</label>
          <p className="font-mono text-sm break-all">{nftDetails.id}</p>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600">Description</label>
          <p className="text-gray-800">{nftDetails.description}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Creator</label>
          <p className="font-mono text-sm break-all">{nftDetails.creator}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Created At</label>
          <p>{formatTimestamp(nftDetails.created_at)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Current Owner</label>
          <p className="font-mono text-sm break-all">
            {typeof nftDetails.owner === 'object' ? nftDetails.owner.AddressOwner : nftDetails.owner}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Version</label>
          <p>{nftDetails.version}</p>
        </div>
      </div>
    </div>
  )
}