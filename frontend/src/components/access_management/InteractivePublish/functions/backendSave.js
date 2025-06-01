import toast from 'react-hot-toast'
import { agentAPI } from '../../../../utils/agent-api'
import { getFlowId, loadJourneyData } from '../components/functional/sessionStorage'

export const savePublishDataToBackend = async (
  journeyData,
  agentId,
  agentData,
  config,
  account,
  latestData = null
) => {
  try {
    // Use latestData if provided, otherwise fall back to journeyData
    const dataToSave = latestData || journeyData
    
    // Debug log the entire data
    console.log('=== savePublishDataToBackend DEBUG ===')
    console.log('Using data source:', latestData ? 'latestData' : 'journeyData')
    console.log('Full data:', dataToSave)
    console.log('walrusBlobId:', dataToSave.walrusBlobId)
    console.log('walrusUrl:', dataToSave.walrusUrl)
    console.log('selectedFile:', dataToSave.selectedFile)
    console.log('===================================')
    
    // Extract version from NFT name
    const version = dataToSave.nftName ? dataToSave.nftName.split('::').pop() : dataToSave.versionNumber
    
    // Prepare blockchain data for backend
    const blockchainData = {
      version: version,
      published_hash: dataToSave.transactionDigest || '',
      contract_id: config.PACKAGE_ID,
      nft_id: dataToSave.nftId || '',
      nft_mint_trx_id: dataToSave.transactionDigest || '',
      published_date: null, // Backend will set current timestamp
      other_data: {
        walrus_blob_id: dataToSave.walrusBlobId || '', // Changed from blobId
        walrus_url: dataToSave.walrusUrl || '',
        access_cap_id: dataToSave.accessCapId || '',
        seal_session_key: dataToSave.sessionKey || '',
        encryption_details: {
          encrypted_id: dataToSave.encryptedId || '', // Added encryptedId
          file_size: dataToSave.selectedFile?.size || 0, // Get from selectedFile
          mime_type: dataToSave.selectedFile?.type || '', // Get from selectedFile
          original_filename: dataToSave.selectedFile?.name || '' // Get from selectedFile
        },
        file_metadata: {
          agent_id: agentId,
          agent_name: agentData?.name || '',
          description: dataToSave.nftDescription || '',
          publisher_address: account?.address || ''
        }
      }
    }
    
    console.log('Prepared blockchain data for backend:', blockchainData)
    
    // Call API to save blockchain data
    const response = await agentAPI.publishToBlockchain(agentId, blockchainData)
    
    console.log('Backend save response:', response)
    toast.success('Successfully saved to blockchain!')
    
    return true
  } catch (error) {
    console.error('Error saving to backend:', error)
    toast.error(`Failed to save blockchain data: ${error.message}`)
    throw error
  }
}