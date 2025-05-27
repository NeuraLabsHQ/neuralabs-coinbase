import { getUserNFTs } from '../../utils/blockchain'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { DownloadSection } from './components/DownloadSection'
import { StoredFilesList } from './components/StoredFilesList'
import { UploadSection } from './components/UploadSection'
import { WalrusInfo } from './components/WalrusInfo'

/**
 * WalrusStorage Page Component
 * Manages file storage on Walrus decentralized network
 */
function WalrusStorage({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [myNFTs, setMyNFTs] = useState([])
  const [storedFiles, setStoredFiles] = useState([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  // Load user's NFTs
  const loadMyNFTs = async () => {
    if (!account) return

    setIsLoadingNFTs(true)
    try {
      const nfts = await getUserNFTs(client, config, account.address)
      setMyNFTs(nfts)
    } catch (error) {
      console.error('Error loading NFTs:', error)
      toast.error('Failed to load NFTs')
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  // Load stored files from localStorage
  const loadStoredFiles = () => {
    if (!account) return
    
    try {
      const stored = localStorage.getItem(`walrus_files_${account.address}`)
      if (stored) {
        setStoredFiles(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading stored files:', error)
    }
  }

  // Save stored files to localStorage
  const saveStoredFiles = (files) => {
    if (!account) return
    
    try {
      localStorage.setItem(`walrus_files_${account.address}`, JSON.stringify(files))
    } catch (error) {
      console.error('Error saving stored files:', error)
    }
  }

  // Load data on mount
  useEffect(() => {
    if (account) {
      loadMyNFTs()
      loadStoredFiles()
    }
  }, [account])

  // Handle file uploaded
  const handleFileUploaded = (fileInfo) => {
    const updatedFiles = [...storedFiles, fileInfo]
    setStoredFiles(updatedFiles)
    saveStoredFiles(updatedFiles)
  }

  // Clear stored files
  const clearStoredFiles = () => {
    if (window.confirm('Are you sure you want to clear all stored file records?')) {
      setStoredFiles([])
      if (account) {
        localStorage.removeItem(`walrus_files_${account.address}`)
      }
      toast.success('Stored files cleared')
    }
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to use Walrus storage.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Walrus Storage</h2>
          {storedFiles.length > 0 && (
            <button
              onClick={clearStoredFiles}
              className="text-sm text-red-500 hover:text-red-600 px-2 py-1 border border-red-300 rounded"
            >
              Clear History
            </button>
          )}
        </div>
        <p className="text-gray-600">
          Store and retrieve files on the Walrus decentralized storage network. 
          Files are permanently stored and can be accessed using their blob ID.
        </p>
      </div>

      {isLoadingNFTs ? (
        <div className="border rounded-lg p-6">
          <p className="text-gray-500 text-center">Loading NFTs...</p>
        </div>
      ) : myNFTs.length === 0 ? (
        <div className="border rounded-lg p-6">
          <p className="text-gray-500 text-center">
            No NFTs found. Create NFTs in the NFT Manager to use Walrus storage.
          </p>
        </div>
      ) : (
        <>
          {/* Upload Section */}
          <UploadSection
            account={account}
            myNFTs={myNFTs}
            onFileUploaded={handleFileUploaded}
          />

          {/* Download Section */}
          <DownloadSection />

          {/* Stored Files List */}
          <StoredFilesList storedFiles={storedFiles} />
        </>
      )}

      {/* Walrus Info */}
      <WalrusInfo />
    </div>
  )
}

export default WalrusStorage