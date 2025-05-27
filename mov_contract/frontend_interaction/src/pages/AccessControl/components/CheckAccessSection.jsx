import { checkUserAccess } from '../../../utils/blockchain'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function CheckAccessSection({ account, onAccessFound }) {
  const [checkNFTId, setCheckNFTId] = useState('')
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)

  const handleCheckAccess = async () => {
    if (!checkNFTId || !account) {
      toast.error('Please enter an NFT ID')
      return
    }

    setIsCheckingAccess(true)
    const toastId = toast.loading('Checking access...')

    try {
      const accessResult = await checkUserAccess(checkNFTId, account.address)
      const accessLevel = accessResult.level
      
      if (accessLevel > 0) {
        const newAccessEntry = {
          tokenId: checkNFTId,
          nftName: `NFT ${String(checkNFTId).slice(0, 10)}...`,
          level: accessLevel.toString(),
          timestamp: new Date().toISOString(),
          grantedBy: 'Unknown',
          checkedManually: true
        }
        
        onAccessFound(newAccessEntry)
        toast.success(`You have level ${accessLevel} access to this NFT!`, { id: toastId })
      } else {
        toast.error('You do not have access to this NFT', { id: toastId })
      }
      
      setCheckNFTId('')
    } catch (error) {
      console.error('Error checking access:', error)
      toast.error(`Failed to check access: ${error.message}`, { id: toastId })
    } finally {
      setIsCheckingAccess(false)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Check My Access to NFT</h3>
      <p className="text-gray-600 text-sm mb-4">
        Enter an NFT Object ID to check if you have access to it
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={checkNFTId}
          onChange={(e) => setCheckNFTId(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0x... (NFT Object ID)"
        />
        <button
          onClick={handleCheckAccess}
          disabled={isCheckingAccess || !checkNFTId}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          {isCheckingAccess ? 'Checking...' : 'Check Access'}
        </button>
      </div>
    </div>
  )
}