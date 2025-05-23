import React, { useState } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import toast from 'react-hot-toast'

/**
 * NFTManager Component
 * Handles NFT creation and management operations
 */
function NFTManager({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessLevel: 4
  })
  
  const [myNFTs, setMyNFTs] = useState([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  // Create NFT function
  const createNFT = async (e) => {
    e.preventDefault()
    
    if (!account) {
      toast.error('Please connect your wallet')
      return
    }

    setIsCreating(true)
    const toastId = toast.loading('Creating NFT...')

    try {
      const tx = new TransactionBlock()
      
      // Call create_nft function
      tx.moveCall({
        target: `${config.PACKAGE_ID}::nft::create_nft`,
        arguments: [
          tx.object(config.COLLECTION_ID),
          tx.pure(formData.name),
          tx.pure(formData.description),
          tx.pure(parseInt(formData.accessLevel)),
          tx.object('0x6') // Clock object
        ],
      })

      // Execute transaction
      const result = await client.signAndExecuteTransactionBlock({
        signer: account,
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      })

      console.log('NFT created:', result)
      
      // Extract NFT object ID from created objects
      const createdNFT = result.objectChanges?.find(
        change => change.type === 'created' && change.objectType.includes('NFT')
      )

      toast.success('NFT created successfully!', { id: toastId })
      
      // Reset form
      setFormData({ name: '', description: '', accessLevel: 4 })
      
      // Reload NFTs
      loadMyNFTs()
      
    } catch (error) {
      console.error('Error creating NFT:', error)
      toast.error(`Failed to create NFT: ${error.message}`, { id: toastId })
    } finally {
      setIsCreating(false)
    }
  }

  // Load user's NFTs
  const loadMyNFTs = async () => {
    if (!account) return

    setIsLoadingNFTs(true)
    try {
      // Query for NFTs owned by the current account
      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${config.PACKAGE_ID}::nft::NFT`
        },
        options: {
          showType: true,
          showContent: true,
        }
      })

      const nfts = objects.data.map(obj => ({
        id: obj.data.objectId,
        ...obj.data.content.fields
      }))

      setMyNFTs(nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
      toast.error('Failed to load NFTs')
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  // Load NFTs on mount
  React.useEffect(() => {
    if (account) {
      loadMyNFTs()
    }
  }, [account])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">NFT Manager</h2>
        <p className="text-gray-600 mb-4">
          Create and manage AI workflow NFTs with different access levels.
        </p>
      </div>

      {/* Create NFT Form */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Create New NFT</h3>
        <form onSubmit={createNFT} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AI Workflow v1.0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Advanced language model training pipeline..."
              rows="3"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Access Level</label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Level 1 - USE_MODEL</option>
              <option value="2">Level 2 - RESALE</option>
              <option value="3">Level 3 - CREATE_REPLICA</option>
              <option value="4">Level 4 - VIEW_DOWNLOAD (Can decrypt)</option>
              <option value="5">Level 5 - EDIT_DATA</option>
              <option value="6">Level 6 - ABSOLUTE_OWNERSHIP</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Level 4 and above can decrypt files using Seal
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create NFT'}
          </button>
        </form>
      </div>

      {/* My NFTs */}
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">My NFTs</h3>
          <button
            onClick={loadMyNFTs}
            disabled={isLoadingNFTs}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            {isLoadingNFTs ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {myNFTs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No NFTs found. Create your first NFT above!
          </p>
        ) : (
          <div className="space-y-3">
            {myNFTs.map((nft) => (
              <div key={nft.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{nft.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{nft.description}</p>
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <span>Token ID: {nft.token_id}</span>
                      <span>Created: {new Date(Number(nft.creation_date)).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium access-level-${nft.level_of_ownership}`}>
                    Level {nft.level_of_ownership}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• NFTs represent AI workflows with encrypted data</li>
          <li>• Level 4+ access allows decrypting files with Seal</li>
          <li>• You can grant access to other users in the Access Control tab</li>
          <li>• Encrypted files are stored on Walrus</li>
        </ul>
      </div>
    </div>
  )
}

export default NFTManager