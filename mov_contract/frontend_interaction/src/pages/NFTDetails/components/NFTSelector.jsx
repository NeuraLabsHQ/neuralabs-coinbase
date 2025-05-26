import React from 'react'

export function NFTSelector({ myNFTs, selectedNFTId, setSelectedNFTId, onLoadDetails, isLoading }) {
  const handleSelectChange = (e) => {
    setSelectedNFTId(e.target.value)
    if (e.target.value) {
      onLoadDetails(e.target.value)
    }
  }

  const handleManualLoad = () => {
    if (selectedNFTId) {
      onLoadDetails(selectedNFTId)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Select NFT</h3>
      
      {/* Dropdown Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Choose from your NFTs</label>
        <select
          value={selectedNFTId}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select an NFT...</option>
          {myNFTs.map((nft) => (
            <option key={nft.id} value={nft.id}>
              {nft.name} ({String(nft.id).slice(0, 10)}...)
            </option>
          ))}
        </select>
      </div>

      {/* Manual Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Or enter NFT Object ID manually</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={selectedNFTId}
            onChange={(e) => setSelectedNFTId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x... (NFT Object ID)"
          />
          <button
            onClick={handleManualLoad}
            disabled={!selectedNFTId || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load Details'}
          </button>
        </div>
      </div>
    </div>
  )
}