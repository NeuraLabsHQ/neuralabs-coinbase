
import { createAccessCap } from '../../../utils/blockchain'
import toast from 'react-hot-toast'

export function MyNFTsSection({ nfts, accessCaps, onAccessCapCreated, account }) {

  const handleCreateAccessCap = async (nftId) => {
  if (!account) {
    toast.error('Please connect your wallet')
    return
  }

  const toastId = toast.loading('Creating Access Capability...')
  
  try {
    // Pass the account address directly
    const result = await createAccessCap(nftId, account.address)
    toast.success('Access Capability created successfully!', { id: toastId })
    
    // Trigger refresh after delay
    setTimeout(() => {
      onAccessCapCreated()
    }, 1000)
  } catch (error) {
    console.error('Error creating AccessCap:', error)
    toast.error(`Failed to create AccessCap: ${error.message}`, { id: toastId })
  }
}

  if (nfts.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">My NFTs & Access Capabilities</h3>
        <p className="text-gray-500 text-center py-8">
          No NFTs found. Create NFTs in the NFT Manager tab.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">My NFTs & Access Capabilities</h3>
      <div className="space-y-3">
        {nfts.map((nft) => {
          const hasAccessCap = accessCaps.some(cap => cap.nft_id === nft.id)
          return (
            <div key={nft.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-medium">{nft.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{nft.description}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {nft.id}</p>
                </div>
                <div className="ml-4">
                  {hasAccessCap ? (
                    <span className="text-green-600 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Has AccessCap
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCreateAccessCap(nft.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Create AccessCap
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-500 mt-4">
        AccessCaps are required to grant or revoke access to your NFTs.
      </p>
    </div>
  )
}