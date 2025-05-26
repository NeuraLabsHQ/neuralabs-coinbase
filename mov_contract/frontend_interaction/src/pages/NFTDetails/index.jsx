import { checkUserAccess, getUserNFTs } from '../../utils/blockchain'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AccessControlSection } from './components/AccessControlSection'
import { BasicInfoSection } from './components/BasicInfoSection'
import { EncryptedDataSection } from './components/EncryptedDataSection'
import { NFTSelector } from './components/NFTSelector'
import { TechnicalDetailsSection } from './components/TechnicalDetailsSection'

/**
 * NFT Details Page Component
 * Shows comprehensive information about an NFT including access control and encrypted data
 */
function NFTDetails({ config }) {
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
      const nfts = await getUserNFTs(account.address)
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
      // Get NFT object details using blockchain module
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
      await loadAccessDetails(nftId, nftInfo)

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

  // Load access control details
  const loadAccessDetails = async (nftId, nftInfo) => {
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
        const level = await checkUserAccess(nftId, address)
        return {
          address,
          level,
          isOwner: address === nftInfo?.creator,
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

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view NFT details.</p>
      </div>
    )
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
      <NFTSelector
        myNFTs={myNFTs}
        selectedNFTId={selectedNFTId}
        setSelectedNFTId={setSelectedNFTId}
        onLoadDetails={loadNFTDetails}
        isLoading={isLoading}
      />

      {/* NFT Details Display */}
      {nftDetails && (
        <div className="space-y-6">
          {/* Basic NFT Information */}
          <BasicInfoSection nftDetails={nftDetails} />

          {/* Access Control Information */}
          <AccessControlSection accessDetails={accessDetails} />

          {/* Encrypted Data */}
          <EncryptedDataSection encryptedData={encryptedData} />

          {/* Technical Details */}
          <TechnicalDetailsSection nftDetails={nftDetails} />
        </div>
      )}
    </div>
  )
}

export default NFTDetails