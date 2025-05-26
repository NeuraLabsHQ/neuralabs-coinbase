import React, { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'

/**
 * NFT Details Page Component
 * Shows comprehensive information about an NFT including access control and encrypted data
 */
function NFTDetailsPage({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [selectedNFTId, setSelectedNFTId] = useState('')
  const [myNFTs, setMyNFTs] = useState([])
  const [nftDetails, setNftDetails] = useState(null)
  const [accessDetails, setAccessDetails] = useState([])
  const [encryptedData, setEncryptedData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load user's NFTs for dropdown
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

  // Load comprehensive NFT details
  const loadNFTDetails = async (nftId) => {
    if (!nftId || !account) return

    setIsLoading(true)
    const toastId = toast.loading('Loading NFT details...')

    try {
      // Get NFT object details
      const nftObject = await client.getObject({
        id: nftId,
        options: {
          showType: true,
          showContent: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showDisplay: true,
        }
      })

      if (!nftObject.data) {
        throw new Error('NFT not found')
      }

      const fields = nftObject.data.content?.fields || {}
      const nftInfo = {
        id: nftObject.data.objectId,
        name: fields.name || 'Unknown',
        description: fields.description || 'No description',
        creator: fields.creator || 'Unknown',
        created_at: fields.created_at || 0,
        owner: nftObject.data.owner,
        version: nftObject.data.version,
        digest: nftObject.data.digest,
        type: nftObject.data.type,
        storageRebate: nftObject.data.storageRebate,
        previousTransaction: nftObject.data.previousTransaction,
      }

      setNftDetails(nftInfo)

      // Load access control information
      await loadAccessDetails(nftId)

      // Load encrypted data stored on this NFT
      await loadEncryptedDataDetails(nftId)

      toast.success('NFT details loaded successfully!', { id: toastId })
    } catch (error) {
      console.error('Error loading NFT details:', error)
      toast.error(`Failed to load NFT details: ${error.message}`, { id: toastId })
      setNftDetails(null)
      setAccessDetails([])
      setEncryptedData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Check access level for a specific user and NFT
  const checkAccessLevel = async (nftId, userAddress) => {
    try {
      const result = await client.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction()
          tx.moveCall({
            target: `${config.PACKAGE_ID}::access::get_access_level`,
            arguments: [
              tx.object(config.REGISTRY_ID),
              tx.pure.id(nftId),
              tx.pure.address(userAddress),
            ],
          })
          return tx
        })(),
        sender: account.address,
      })
      
      if (result.results?.[0]?.returnValues?.[0]) {
        const accessLevel = parseInt(result.results[0].returnValues[0][0])
        return accessLevel
      }
      
      return 0
    } catch (error) {
      console.error('Error checking access level:', error)
      return 0
    }
  }

  // Load access control details
  const loadAccessDetails = async (nftId) => {
    try {
      // Get addresses that might have access (from localStorage)
      const knownAddresses = new Set()
      
      // Add current user
      knownAddresses.add(account.address)
      
      // Add addresses from granted access
      const grantedAccess = JSON.parse(localStorage.getItem(`granted_access_${account.address}`) || '[]')
      grantedAccess.forEach(access => {
        if (access.tokenId === nftId) {
          knownAddresses.add(access.user)
        }
      })

      // Add addresses from received access
      const receivedAccess = JSON.parse(localStorage.getItem(`received_access_${account.address}`) || '[]')
      receivedAccess.forEach(access => {
        if (access.tokenId === nftId && access.grantedBy) {
          knownAddresses.add(access.grantedBy)
        }
      })

      // Check access levels for known addresses
      const accessPromises = Array.from(knownAddresses).map(async (address) => {
        const level = await checkAccessLevel(nftId, address)
        return {
          address,
          level,
          isOwner: address === nftDetails?.creator,
          isCurrentUser: address === account.address
        }
      })

      const accessResults = await Promise.all(accessPromises)
      const filteredAccess = accessResults.filter(result => result.level > 0 || result.isOwner)
      
      setAccessDetails(filteredAccess)
    } catch (error) {
      console.error('Error loading access details:', error)
      setAccessDetails([])
    }
  }

  // Load encrypted data details
  const loadEncryptedDataDetails = async (nftId) => {
    try {
      // Get dynamic fields to find encrypted data
      const dynamicFields = await client.getDynamicFields({
        parentId: nftId,
      })

      const encryptedDataPromises = dynamicFields.data.map(async (field) => {
        try {
          const fieldObject = await client.getDynamicFieldObject({
            parentId: nftId,
            name: field.name,
          })

          if (fieldObject.data?.content?.fields) {
            const fields = fieldObject.data.content.fields
            return {
              walrus_blob_id: field.name.value,
              seal_key_id: fields.seal_key_id || [],
              file_hash: fields.file_hash || '',
              file_size: fields.file_size || 0,
              content_type: fields.content_type || '',
              encrypted_at: fields.encrypted_at || 0,
              walrus_url: `https://aggregator.walrus-testnet.walrus.space/v1/${field.name.value}`
            }
          }
          return null
        } catch (error) {
          console.error('Error loading encrypted data field:', error)
          return null
        }
      })

      const encryptedDataResults = await Promise.all(encryptedDataPromises)
      const validData = encryptedDataResults.filter(data => data !== null)
      
      setEncryptedData(validData)
    } catch (error) {
      console.error('Error loading encrypted data:', error)
      setEncryptedData([])
    }
  }

  // Load NFTs on mount
  useEffect(() => {
    if (account) {
      loadMyNFTs()
    }
  }, [account])

  // Access level info
  const accessLevelInfo = {
    0: { name: 'NO_ACCESS', color: 'gray' },
    1: { name: 'USE_MODEL', color: 'gray' },
    2: { name: 'RESALE', color: 'blue' },
    3: { name: 'CREATE_REPLICA', color: 'green' },
    4: { name: 'VIEW_DOWNLOAD', color: 'yellow' },
    5: { name: 'EDIT_DATA', color: 'orange' },
    6: { name: 'ABSOLUTE_OWNERSHIP', color: 'red' }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(parseInt(timestamp)).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">NFT Details Explorer</h2>
        <p className="text-gray-600 mb-4">
          View comprehensive information about any NFT including access control and encrypted data.
        </p>
      </div>

      {/* NFT Selection */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Select NFT</h3>
        
        {/* Dropdown Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Choose from your NFTs</label>
          <select
            value={selectedNFTId}
            onChange={(e) => {
              setSelectedNFTId(e.target.value)
              if (e.target.value) {
                loadNFTDetails(e.target.value)
              }
            }}
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
              onClick={() => loadNFTDetails(selectedNFTId)}
              disabled={!selectedNFTId || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load Details'}
            </button>
          </div>
        </div>
      </div>

      {/* NFT Details Display */}
      {nftDetails && (
        <div className="space-y-6">
          {/* Basic NFT Information */}
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

          {/* Access Control Information */}
          <div className="border rounded-lg p-6">
            <h3 className="font-medium mb-4">🔐 Access Control</h3>
            {accessDetails.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No access information available
              </p>
            ) : (
              <div className="space-y-3">
                {accessDetails.map((access, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-sm">
                            {String(access.address).slice(0, 10)}...{String(access.address).slice(-6)}
                          </span>
                          {access.isOwner && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              Owner/Creator
                            </span>
                          )}
                          {access.isCurrentUser && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium access-level-${access.level}`}>
                          Level {access.level} - {accessLevelInfo[access.level]?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Encrypted Data */}
          <div className="border rounded-lg p-6">
            <h3 className="font-medium mb-4">🔒 Encrypted Data Storage</h3>
            {encryptedData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No encrypted data found for this NFT
              </p>
            ) : (
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
            )}
          </div>

          {/* Technical Details */}
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
        </div>
      )}
    </div>
  )
}

export default NFTDetailsPage