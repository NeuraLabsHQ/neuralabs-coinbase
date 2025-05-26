import { getAccessCaps, getUserNFTs } from '../../utils/blockchain'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AccessControlMatrix } from './components/AccessControlMatrix'
import { AccessList } from './components/AccessList'
import { CheckAccessSection } from './components/CheckAccessSection'
import { GrantAccessForm } from './components/GrantAccessForm'
import { MyNFTsSection } from './components/MyNFTsSection'

/**
 * AccessControl Page Component
 * Manages access rights for NFTs using blockchain modules
 */
function AccessControl({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  
  const [myNFTs, setMyNFTs] = useState([])
  const [myAccessCaps, setMyAccessCaps] = useState([])
  const [accessList, setAccessList] = useState([]) // Access I've granted to others
  const [accessGrantedToMe, setAccessGrantedToMe] = useState([]) // Access others have granted to me
  const [isLoading, setIsLoading] = useState(false)

  // Load user's NFTs
  const loadMyNFTs = async () => {
    if (!account) return

    try {
      const nfts = await getUserNFTs(client, config, account.address)
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
      const caps = await getAccessCaps(client, config, account.address)
      setMyAccessCaps(caps)
    } catch (error) {
      console.error('Error loading AccessCaps:', error)
      toast.error('Failed to load AccessCaps')
    }
  }

  // Load access data from localStorage (for persistence across sessions)
  const loadStoredAccessData = () => {
    try {
      // Load access I've granted
      const grantedAccess = localStorage.getItem(`granted_access_${account?.address}`)
      if (grantedAccess) {
        setAccessList(JSON.parse(grantedAccess))
      }
      
      // Load access granted to me  
      const receivedAccess = localStorage.getItem(`received_access_${account?.address}`)
      if (receivedAccess) {
        setAccessGrantedToMe(JSON.parse(receivedAccess))
      }
    } catch (error) {
      console.error('Error loading stored access data:', error)
    }
  }

  // Load all data
  const loadAllData = async () => {
    if (!account) return
    
    setIsLoading(true)
    try {
      await Promise.all([
        loadMyNFTs(),
        loadMyAccessCaps(),
        loadStoredAccessData()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    if (account) {
      loadAllData()
    }
  }, [account])

  // Handle access granted
  const handleAccessGranted = (accessEntry) => {
    const newAccessList = [...accessList, accessEntry]
    setAccessList(newAccessList)
    
    // Store in localStorage
    localStorage.setItem(`granted_access_${account.address}`, JSON.stringify(newAccessList))
    
    // Reload AccessCaps after delay
    setTimeout(() => {
      loadMyAccessCaps()
    }, 1000)
  }

  // Handle access revoked
  const handleAccessRevoked = (tokenId, user) => {
    const updatedAccessList = accessList.filter(
      item => !(item.tokenId === tokenId && item.user === user)
    )
    setAccessList(updatedAccessList)
    
    // Update localStorage
    localStorage.setItem(`granted_access_${account.address}`, JSON.stringify(updatedAccessList))
    
    // Reload AccessCaps after delay
    setTimeout(() => {
      loadMyAccessCaps()
    }, 1000)
  }

  // Handle access found when checking
  const handleAccessFound = (accessEntry) => {
    const existingAccess = accessGrantedToMe.find(item => item.tokenId === accessEntry.tokenId)
    
    if (!existingAccess) {
      const updatedList = [...accessGrantedToMe, accessEntry]
      setAccessGrantedToMe(updatedList)
      
      // Store in localStorage
      localStorage.setItem(`received_access_${account.address}`, JSON.stringify(updatedList))
    }
  }

  // Clear cache and reload
  const handleClearCache = () => {
    localStorage.removeItem(`granted_access_${account?.address}`)
    localStorage.removeItem(`received_access_${account?.address}`)
    window.location.reload()
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to manage access control.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Access Control</h2>
          <button
            onClick={handleClearCache}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 border rounded"
          >
            🔄 Clear Cache & Reload
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Grant or revoke access to your NFTs. Users with level 4+ can decrypt associated files.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {/* My NFTs and AccessCaps */}
          <MyNFTsSection
            nfts={myNFTs}
            accessCaps={myAccessCaps}
            onAccessCapCreated={loadMyAccessCaps}
            account={account}
          />

          {/* Grant Access Form */}
          <GrantAccessForm
            nfts={myNFTs}
            accessCaps={myAccessCaps}
            account={account}
            onAccessGranted={handleAccessGranted}
          />

          {/* Access I've Granted */}
          <AccessList
            accessList={accessList}
            accessCaps={myAccessCaps}
            account={account}
            onAccessRevoked={handleAccessRevoked}
            title="Access I've Granted to Others"
            showRevoke={true}
          />

          {/* Check Access to Specific NFT */}
          <CheckAccessSection
            account={account}
            onAccessFound={handleAccessFound}
          />

          {/* Access Granted to Me */}
          <AccessList
            accessList={accessGrantedToMe}
            accessCaps={[]}
            account={account}
            onAccessRevoked={() => {}}
            title="Access Granted to Me"
            showRevoke={false}
          />

          {/* Access Control Matrix */}
          <AccessControlMatrix />
        </>
      )}
    </div>
  )
}

export default AccessControl