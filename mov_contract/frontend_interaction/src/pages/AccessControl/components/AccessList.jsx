import { revokeUserAccess, ACCESS_LEVELS } from '../../../utils/blockchain'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function AccessList({ accessList, accessCaps, account, onAccessRevoked, title, showRevoke = true }) {
  const [isRevoking, setIsRevoking] = useState(false)

  const handleRevokeAccess = async (tokenId, user) => {
    if (!account) {
      toast.error('Please connect your wallet')
      return
    }

    setIsRevoking(true)
    const toastId = toast.loading('Revoking access...')

    try {
      // Find the AccessCap for this NFT
      const accessCap = accessCaps.find(cap => cap.nft_id === tokenId)
      if (!accessCap) {
        toast.error('No AccessCap found for this NFT', { id: toastId })
        setIsRevoking(false)
        return
      }

      await revokeUserAccess({
        nftId: tokenId,
        userAddress: user,
        accessCapId: accessCap.id,
        signerAddress: account.address
      })

      toast.success('Access revoked successfully!', { id: toastId })
      onAccessRevoked(tokenId, user)
      setIsRevoking(false)
    } catch (error) {
      console.error('Error revoking access:', error)
      toast.error(`Failed to revoke access: ${error.message}`, { id: toastId })
      setIsRevoking(false)
    }
  }

  if (accessList.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{title}</h3>
        </div>
        <p className="text-gray-500 text-center py-8">
          {showRevoke ? 'No access rights granted yet.' : 'No one has granted you access to their NFTs yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{title}</h3>
      </div>
      
      <div className="space-y-3">
        {accessList.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">
                    {item.nftName || `NFT ${String(item.tokenId).slice(0, 10)}...`}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium access-level-${item.level}`}>
                    Level {item.level} - {ACCESS_LEVELS[item.level].name}
                  </span>
                  {ACCESS_LEVELS[item.level].canDecrypt && (
                    <span className="text-xs text-green-600">
                      🔓 Can decrypt
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {showRevoke ? 'User' : 'Granted by'}: <code className="bg-gray-100 px-1 rounded">
                    {String(showRevoke ? item.user : item.grantedBy).slice(0, 10)}...{String(showRevoke ? item.user : item.grantedBy).slice(-6)}
                  </code>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  NFT ID: <code className="bg-gray-100 px-1 rounded text-xs">{String(item.tokenId).slice(0, 16)}...</code>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Granted: {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
              {showRevoke ? (
                <button
                  onClick={() => handleRevokeAccess(item.tokenId, item.user)}
                  disabled={isRevoking}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Revoke
                </button>
              ) : (
                <div className="ml-4">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Active Access
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}