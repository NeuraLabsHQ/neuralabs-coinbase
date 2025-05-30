import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'

import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

// Import all page components from new structure
import AccessControl from './pages/AccessControl'
import ContractInfo from './pages/ContractInfo'
import NFTDetails from './pages/NFTDetails'
import NFTManager from './pages/NFTManager'
import SealEncryption from './pages/SealEncryption'
import SUIToWALConverter from './pages/SUIToWALConverter'
import WalrusStorage from './pages/WalrusStorage'

// Import modularized journey component from new structure
import InteractiveEncryptionJourney from './pages/InteractiveEncryptionJourney'
import InteractivePublish from './pages/InteractivePublish'

// Configuration based on deployment-config.json
const CONFIG = {
  PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID || '0x040e550205820846970d5dcc1490911c85aacef73b819d66d9f76fd779219184',
  REGISTRY_ID: import.meta.env.VITE_REGISTRY_ID || '0x8ef28e813a10aabf456a7f188ab60e08233fcf2c7a527436485e6ce007de651f',
  ACCESS_REGISTRY_ID: import.meta.env.VITE_ACCESS_REGISTRY_ID || '0xb01b33f8038a78532a946b3d9093616cf050f23f01fb3cfa94d19d2bfc7a2125',
  WALRUS_AGGREGATOR: import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
  WALRUS_PUBLISHER: import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  SEAL_APP_NAME: 'NeuraLabs',
  SEAL_URL: 'https://seal-testnet.mystenlabs.com',
  // Exchange configuration
  EXCHANGE_PACKAGE_ID: import.meta.env.VITE_EXCHANGE_PACKAGE_ID || '0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f',
  EXCHANGE_SHARED_OBJECT_ID: import.meta.env.VITE_EXCHANGE_SHARED_OBJECT_ID || '0x8d63209cf8589ce7aef8f262437163c67577ed09f3e636a9d8e0813843fb8bf1',
  EXCHANGE_INITIAL_SHARED_VERSION: import.meta.env.VITE_EXCHANGE_INITIAL_SHARED_VERSION || '400185628',
  // WAL Token configuration
  WAL_TOKEN_TYPE: import.meta.env.VITE_WAL_TOKEN_TYPE || '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL',
}

function App() {



  const account = useCurrentAccount()
  const [activeTab, setActiveTab] = useState('info')

const client = useSuiClient()
const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()


useEffect(() => {
  // Set global references for blockchain wrapper
  window.config = CONFIG
  window.suiClient = client
  window.signAndExecute = signAndExecuteTransaction
  window.currentAccount = account
}, [account, client, signAndExecuteTransaction])

  const tabs = [
    { id: 'info', label: 'Contract Info', icon: '📄' },
    { id: 'nft', label: 'NFT Manager', icon: '🎨' },
    { id: 'access', label: 'Access Control', icon: '🔐' },
    { id: 'seal', label: 'Seal Encryption', icon: '🔒' },
    { id: 'walrus', label: 'Walrus Storage', icon: '🐋' },
    { id: 'details', label: 'NFT Details', icon: '🔍' },
    { id: 'converter', label: 'SUI ↔ WAL', icon: '💱' },
    { id: 'interactive', label: 'Interactive Journey', icon: '✨' },
    { id: 'publish', label: 'Interactive Publish', icon: '📤' }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                NeuraLabs Test App
              </h1>
              <span className="ml-4 text-sm text-gray-500">
                NFT + Seal + Walrus Integration
              </span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!account ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to NeuraLabs Test App</h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to test NFT creation, access control, and encrypted storage.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-6">
              <nav className="flex space-x-1 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className={activeTab === 'interactive' || activeTab === 'publish' ? '' : 'bg-white rounded-lg shadow p-6'}>
              {activeTab === 'info' && <ContractInfo config={CONFIG} />}
              {activeTab === 'nft' && <NFTManager config={CONFIG} />}
              {activeTab === 'access' && <AccessControl config={CONFIG} />}
              {activeTab === 'seal' && <SealEncryption config={CONFIG} />}
              {activeTab === 'walrus' && <WalrusStorage config={CONFIG} />}
              {activeTab === 'details' && <NFTDetails config={CONFIG} />}
              {activeTab === 'converter' && <SUIToWALConverter config={CONFIG} />}
              {activeTab === 'interactive' && <InteractiveEncryptionJourney config={CONFIG} />}
              {activeTab === 'publish' && <InteractivePublish config={CONFIG} />}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            NeuraLabs Test Application - Built on Sui Network
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App