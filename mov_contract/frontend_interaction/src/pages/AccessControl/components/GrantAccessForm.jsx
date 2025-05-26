import React, { useState } from 'react'
import { grantAccessToUser } from '@blockchain/access-management'
import { ACCESS_LEVELS } from '@blockchain/utils/constants'
import toast from 'react-hot-toast'

export function GrantAccessForm({ nfts, accessCaps, account, onAccessGranted }) {
  const [selectedNFT, setSelectedNFT] = useState('')
  const [selectedAccessCap, setSelectedAccessCap] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [accessLevel, setAccessLevel] = useState('4')
  const [isGranting, setIsGranting] = useState(false)

  const handleGrantAccess = async (e) => {
    e.preventDefault()
    
    if (!account) {
      toast.error('Please connect your wallet')
      return
    }

    if (!selectedNFT || !userAddress || !selectedAccessCap) {
      toast.error('Please fill all fields')
      return
    }

    setIsGranting(true)
    const toastId = toast.loading('Granting access...')

    try {
      const result = await grantAccessToUser({
        nftId: selectedNFT,
        userAddress,
        accessLevel: parseInt(accessLevel),
        accessCapId: selectedAccessCap,
        signerAddress: account.address
      })

      toast.success('Access granted successfully!', { id: toastId })
      
      // Add to access list
      const accessEntry = {
        tokenId: selectedNFT,
        nftName: nfts.find(nft => nft.id === selectedNFT)?.name || 'Unknown NFT',
        user: userAddress,
        level: accessLevel,
        timestamp: new Date().toISOString()
      }
      
      onAccessGranted(accessEntry)
      
      // Reset form
      setUserAddress('')
      setIsGranting(false)
    } catch (error) {
      console.error('Error granting access:', error)
      toast.error(`Failed to grant access: ${error.message}`, { id: toastId })
      setIsGranting(false)
    }
  }

  const handleNFTChange = (e) => {
    setSelectedNFT(e.target.value)
    // Auto-select matching AccessCap if available
    const matchingCap = accessCaps.find(cap => cap.nft_id === e.target.value)
    if (matchingCap) {
      setSelectedAccessCap(matchingCap.id)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Grant Access</h3>
      <form onSubmit={handleGrantAccess} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select NFT</label>
          <select
            value={selectedNFT}
            onChange={handleNFTChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select an NFT...</option>
            {nfts.map((nft) => (
              <option key={nft.id} value={nft.id}>
                {nft.name} ({String(nft.id).slice(0, 10)}...)
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Access Capability</label>
          <select
            value={selectedAccessCap}
            onChange={(e) => setSelectedAccessCap(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select access cap...</option>
            {accessCaps
              .filter(cap => cap.nft_id === selectedNFT)
              .map((cap) => (
                <option key={cap.id} value={cap.id}>
                  AccessCap ({String(cap.id).slice(0, 10)}...)
                </option>
              ))}
          </select>
          {selectedNFT && !accessCaps.find(cap => cap.nft_id === selectedNFT) && (
            <p className="text-xs text-amber-600 mt-1">
              No AccessCap found for this NFT. Create one above.
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">User Address</label>
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Access Level</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ACCESS_LEVELS).map(([level, info]) => (
              <label
                key={level}
                className={`flex items-center p-3 border rounded-md cursor-pointer ${
                  accessLevel === level ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="accessLevel"
                  value={level}
                  checked={accessLevel === level}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="mr-2"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium access-level-${level} px-2 py-1 rounded`}>
                      Level {level}
                    </span>
                    <span className="ml-2 text-sm">{info.name}</span>
                  </div>
                  {info.canDecrypt && (
                    <span className="text-xs text-green-600 mt-1 block">
                      ✓ Can decrypt files
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isGranting}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGranting ? 'Granting...' : 'Grant Access'}
        </button>
      </form>
    </div>
  )
}