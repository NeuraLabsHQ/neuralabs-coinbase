

export function TechnicalDetailsSection({ nftDetails }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">⚙️ Technical Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Object Type</label>
          <p className="font-mono text-sm break-all">{nftDetails.type}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Storage Rebate</label>
          <p>{nftDetails.storageRebate || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Digest</label>
          <p className="font-mono text-sm break-all">{nftDetails.digest}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Previous Transaction</label>
          <p className="font-mono text-sm break-all">{nftDetails.previousTransaction}</p>
        </div>
      </div>
    </div>
  )
}