import React, { useState } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import toast from 'react-hot-toast'

/**
 * AccessControl Component
 * Manages access rights for NFTs
 */
function AccessControl({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [selectedNFT, setSelectedNFT] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [accessLevel, setAccessLevel] = useState('4')
  const [isGranting, setIsGranting] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  
  const [accessList, setAccessList] = useState([])

  // Grant access to a user
  const grantAccess = async (e) => {
    e.preventDefault()
    
    if (!account) {
      toast.error('Please connect your wallet')
      return
    }

    if (!selectedNFT || !userAddress) {
      toast.error('Please fill all fields')
      return
    }

    setIsGranting(true)
    const toastId = toast.loading('Granting access...')

    try {
      const tx = new TransactionBlock()
      
      tx.moveCall({
        target: `${config.PACKAGE_ID}::nft::grant_access`,
        arguments: [
          tx.object(config.COLLECTION_ID),
          tx.pure(parseInt(selectedNFT)),
          tx.pure(userAddress),
          tx.pure(parseInt(accessLevel)),
          tx.object('0x6') // Clock
        ],
      })

      const result = await client.signAndExecuteTransactionBlock({
        signer: account,
        transactionBlock: tx,
        options: {
          showEffects: true,
        },
      })

      console.log('Access granted:', result)
      toast.success('Access granted successfully!', { id: toastId })
      
      // Add to local list
      setAccessList([...accessList, {
        tokenId: selectedNFT,
        user: userAddress,
        level: accessLevel,
        timestamp: new Date().toISOString()
      }])
      
      // Reset form
      setUserAddress('')
      
    } catch (error) {
      console.error('Error granting access:', error)
      toast.error(`Failed to grant access: ${error.message}`, { id: toastId })
    } finally {
      setIsGranting(false)
    }
  }

  // Revoke access from a user
  const revokeAccess = async (tokenId, user) => {
    setIsRevoking(true)
    const toastId = toast.loading('Revoking access...')

    try {
      const tx = new TransactionBlock()
      
      tx.moveCall({
        target: `${config.PACKAGE_ID}::nft::revoke_access`,
        arguments: [
          tx.object(config.COLLECTION_ID),
          tx.pure(parseInt(tokenId)),
          tx.pure(user),
          tx.object('0x6') // Clock
        ],
      })

      const result = await client.signAndExecuteTransactionBlock({
        signer: account,
        transactionBlock: tx,
        options: {
          showEffects: true,
        },
      })

      console.log('Access revoked:', result)
      toast.success('Access revoked successfully!', { id: toastId })
      
      // Remove from local list
      setAccessList(accessList.filter(
        item => !(item.tokenId === tokenId && item.user === user)
      ))
      
    } catch (error) {
      console.error('Error revoking access:', error)
      toast.error(`Failed to revoke access: ${error.message}`, { id: toastId })
    } finally {
      setIsRevoking(false)
    }
  }

  // Access level descriptions
  const accessLevelInfo = {
    1: { name: 'USE_MODEL', color: 'gray', canDecrypt: false },
    2: { name: 'RESALE', color: 'blue', canDecrypt: false },
    3: { name: 'CREATE_REPLICA', color: 'green', canDecrypt: false },
    4: { name: 'VIEW_DOWNLOAD', color: 'yellow', canDecrypt: true },
    5: { name: 'EDIT_DATA', color: 'orange', canDecrypt: true },
    6: { name: 'ABSOLUTE_OWNERSHIP', color: 'red', canDecrypt: true }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Access Control</h2>
        <p className="text-gray-600 mb-4">
          Grant or revoke access to your NFTs. Users with level 4+ can decrypt associated files.
        </p>
      </div>

      {/* Grant Access Form */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Grant Access</h3>
        <form onSubmit={grantAccess} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">NFT Token ID</label>
            <input
              type="number"
              value={selectedNFT}
              onChange={(e) => setSelectedNFT(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter token ID (e.g., 1)"
              required
            />
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
              {Object.entries(accessLevelInfo).map(([level, info]) => (
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

      {/* Access List */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Current Access Rights</h3>
        
        {accessList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No access rights granted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {accessList.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">Token #{item.tokenId}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium access-level-${item.level}`}>
                        Level {item.level} - {accessLevelInfo[item.level].name}
                      </span>
                      {accessLevelInfo[item.level].canDecrypt && (
                        <span className="text-xs text-green-600">
                          🔓 Can decrypt
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      User: <code className="bg-gray-100 px-1 rounded">{item.user}</code>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Granted: {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeAccess(item.tokenId, item.user)}
                    disabled={isRevoking}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access Control Matrix */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Access Control Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Level</th>
                <th className="text-left py-2">Name</th>
                <th className="text-center py-2">Use</th>
                <th className="text-center py-2">Resell</th>
                <th className="text-center py-2">Replicate</th>
                <th className="text-center py-2">Decrypt</th>
                <th className="text-center py-2">Edit</th>
                <th className="text-center py-2">Grant</th>
              </tr>
            </thead>
            <tbody>
              {[
                [1, '✓', '✗', '✗', '✗', '✗', '✗'],
                [2, '✓', '✓', '✗', '✗', '✗', '✗'],
                [3, '✓', '✓', '✓', '✗', '✗', '✗'],
                [4, '✓', '✓', '✓', '✓', '✗', '✗'],
                [5, '✓', '✓', '✓', '✓', '✓', '✗'],
                [6, '✓', '✓', '✓', '✓', '✓', '✓'],
              ].map(([level, ...permissions]) => (
                <tr key={level} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium access-level-${level}`}>
                      {level}
                    </span>
                  </td>
                  <td className="py-2">{accessLevelInfo[level].name}</td>
                  {permissions.map((perm, i) => (
                    <td key={i} className="text-center py-2">
                      <span className={perm === '✓' ? 'text-green-600' : 'text-gray-400'}>
                        {perm}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AccessControl