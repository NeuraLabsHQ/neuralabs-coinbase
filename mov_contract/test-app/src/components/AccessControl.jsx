import React, { useState } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'

/**
 * AccessControl Component
 * Manages access rights for NFTs
 */
function AccessControl({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  const [selectedNFT, setSelectedNFT] = useState('')
  const [selectedAccessCap, setSelectedAccessCap] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [accessLevel, setAccessLevel] = useState('4')
  const [isGranting, setIsGranting] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  
  const [myNFTs, setMyNFTs] = useState([])
  const [myAccessCaps, setMyAccessCaps] = useState([])
  const [accessList, setAccessList] = useState([])

  // Load user's NFTs
  const loadMyNFTs = async () => {
    if (!account) return

    try {
      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${config.PACKAGE_ID}::nft::NeuraLabsNFT`
        },
        options: {
          showType: true,
          showContent: true,
        }
      })

      const nfts = objects.data.map(obj => {
        const fields = obj.data?.content?.fields || {};
        // Handle nested id structure
        const id = fields.id?.id || fields.id || '';
        return {
          id: obj.data?.objectId || '',
          name: fields.name || '',
          description: fields.description || '',
          creator: fields.creator || '',
          created_at: fields.created_at || fields.creation_date || Date.now()
        };
      })

      setMyNFTs(nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
      toast.error('Failed to load NFTs')
    }
  }

  // Load user's AccessCaps
  const loadMyAccessCaps = async () => {
    if (!account) return

    try {
      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${config.PACKAGE_ID}::access::AccessCap`
        },
        options: {
          showType: true,
          showContent: true,
        }
      })

      const caps = objects.data.map(obj => ({
        id: obj.data?.objectId || '',
        nft_id: obj.data?.content?.fields?.nft_id || ''
      }))

      setMyAccessCaps(caps)
    } catch (error) {
      console.error('Error loading AccessCaps:', error)
      toast.error('Failed to load AccessCaps')
    }
  }

  // Load data on mount
  React.useEffect(() => {
    if (account) {
      loadMyNFTs()
      loadMyAccessCaps()
    }
  }, [account])

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
      const tx = new Transaction()
      
      // Need to have an AccessCap for the NFT to grant access
      if (!selectedAccessCap) {
        toast.error('Please select an Access Cap for the NFT', { id: toastId })
        setIsGranting(false)
        return
      }

      tx.moveCall({
        target: `${config.PACKAGE_ID}::access::grant_access`,
        arguments: [
          tx.object(config.REGISTRY_ID), // Access Registry
          tx.object(selectedAccessCap), // Access Cap for the NFT
          tx.pure.id(selectedNFT), // NFT ID (as ID type, not string)
          tx.pure.address(userAddress), // User address
          tx.pure.u8(parseInt(accessLevel)) // Access level
        ],
      })

      signAndExecuteTransaction(
        {
          transaction: tx,
          options: {
            showEffects: true,
          },
        },
        {
          onSuccess: (result) => {
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
            setIsGranting(false)
          },
          onError: (error) => {
            console.error('Error granting access:', error)
            toast.error(`Failed to grant access: ${error.message}`, { id: toastId })
            setIsGranting(false)
          }
        }
      )
    } catch (error) {
      console.error('Error in grant access:', error)
      toast.error(`Failed to grant access: ${error.message}`, { id: toastId })
      setIsGranting(false)
    }
  }

  // Create AccessCap for an NFT
  const createAccessCap = async (nftId) => {
    const toastId = toast.loading('Creating Access Capability...')
    
    try {
      const tx = new Transaction()
      
      tx.moveCall({
        target: `${config.PACKAGE_ID}::access::create_access_cap_entry`,
        arguments: [
          tx.object(nftId) // NFT object
        ],
      })

      signAndExecuteTransaction(
        {
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        },
        {
          onSuccess: async (result) => {
            console.log('AccessCap created:', result)
            toast.success('Access Capability created successfully!', { id: toastId })
            
            // Reload AccessCaps
            await loadMyAccessCaps()
          },
          onError: (error) => {
            console.error('Error creating AccessCap:', error)
            toast.error(`Failed to create AccessCap: ${error.message}`, { id: toastId })
          }
        }
      )
    } catch (error) {
      console.error('Error in create AccessCap:', error)
      toast.error(`Failed to create AccessCap: ${error.message}`, { id: toastId })
    }
  }

  // Revoke access from a user
  const revokeAccess = async (tokenId, user) => {
    setIsRevoking(true)
    const toastId = toast.loading('Revoking access...')

    try {
      const tx = new Transaction()
      
      // Need AccessCap to revoke access
      const accessCap = myAccessCaps.find(cap => cap.nft_id === tokenId);
      if (!accessCap) {
        toast.error('No AccessCap found for this NFT', { id: toastId });
        setIsRevoking(false);
        return;
      }

      tx.moveCall({
        target: `${config.PACKAGE_ID}::access::revoke_access`,
        arguments: [
          tx.object(config.REGISTRY_ID), // Access Registry
          tx.object(accessCap.id), // Access Cap
          tx.pure.id(tokenId), // NFT ID (as ID type, not string)
          tx.pure.address(user) // User address
        ],
      })

      signAndExecuteTransaction(
        {
          transaction: tx,
          options: {
            showEffects: true,
          },
        },
        {
          onSuccess: (result) => {
            console.log('Access revoked:', result)
            toast.success('Access revoked successfully!', { id: toastId })
            
            // Remove from local list
            setAccessList(accessList.filter(
              item => !(item.tokenId === tokenId && item.user === user)
            ))
            setIsRevoking(false)
          },
          onError: (error) => {
            console.error('Error revoking access:', error)
            toast.error(`Failed to revoke access: ${error.message}`, { id: toastId })
            setIsRevoking(false)
          }
        }
      )
    } catch (error) {
      console.error('Error in revoke access:', error)
      toast.error(`Failed to revoke access: ${error.message}`, { id: toastId })
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

      {/* My NFTs and AccessCaps */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">My NFTs & Access Capabilities</h3>
        {myNFTs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No NFTs found. Create NFTs in the NFT Manager tab.
          </p>
        ) : (
          <div className="space-y-3">
            {myNFTs.map((nft) => {
              const hasAccessCap = myAccessCaps.some(cap => cap.nft_id === nft.id)
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
                          onClick={() => createAccessCap(nft.id)}
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
        )}
        <p className="text-xs text-gray-500 mt-4">
          AccessCaps are required to grant or revoke access to your NFTs.
        </p>
      </div>

      {/* Grant Access Form */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Grant Access</h3>
        <form onSubmit={grantAccess} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select NFT</label>
            <select
              value={selectedNFT}
              onChange={(e) => {
                setSelectedNFT(e.target.value);
                // Auto-select matching AccessCap if available
                const matchingCap = myAccessCaps.find(cap => cap.nft_id === e.target.value);
                if (matchingCap) {
                  setSelectedAccessCap(matchingCap.id);
                }
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an NFT...</option>
              {myNFTs.map((nft) => (
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
              {myAccessCaps
                .filter(cap => cap.nft_id === selectedNFT)
                .map((cap) => (
                  <option key={cap.id} value={cap.id}>
                    AccessCap ({String(cap.id).slice(0, 10)}...)
                  </option>
                ))}
            </select>
            {selectedNFT && !myAccessCaps.find(cap => cap.nft_id === selectedNFT) && (
              <p className="text-xs text-amber-600 mt-1">
                No AccessCap found for this NFT. Create one in the NFT Manager.
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