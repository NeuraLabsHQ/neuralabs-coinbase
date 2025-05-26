import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { ConnectButton } from '@mysten/dapp-kit'
import { useCurrentAccount } from '@mysten/dapp-kit'

// Import components
import ContractInfo from './components/ContractInfo'
import NFTManager from './components/NFTManager'
import AccessControl from './components/AccessControl'
import SealEncryption from './components/SealEncryption'
import WalrusStorage from './components/WalrusStorage'
import NFTDetailsPage from './components/NFTDetailsPage'
import SUIToWALConverter from './components/SUIToWALConverter'
import EncryptionJourney from './components/EncryptionJourney'
import InteractiveEncryptionJourney from './components/InteractiveEncryptionJourney'

// Configuration
const CONFIG = {
  PACKAGE_ID: process.env.REACT_APP_PACKAGE_ID || '0x0',
  REGISTRY_ID: process.env.REACT_APP_REGISTRY_ID || '0x0',
  SEAL_KEY_SERVERS: [
    {
      name: 'mysten-testnet-1',
      url: 'https://seal-key-server-testnet-1.mystenlabs.com',
      objectId: '0x13a86a87ab1bf3a2e81b3c13b2e7a3b0db8b3c4d5e6f708192a3b4c5d6e7f809'
    },
    {
      name: 'mysten-testnet-2',
      url: 'https://seal-key-server-testnet-2.mystenlabs.com',
      objectId: '0x23b97b98bc2cf4a3f92c4d14c3f8b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6'
    }
  ]
}

function App() {
  const account = useCurrentAccount()
  const [activeTab, setActiveTab] = useState('info')

  const tabs = [
    { id: 'info', label: 'Contract Info', icon: '📄' },
    { id: 'nft', label: 'NFT Manager', icon: '🎨' },
    { id: 'access', label: 'Access Control', icon: '🔐' },
    { id: 'seal', label: 'Seal Encryption', icon: '🔒' },
    { id: 'walrus', label: 'Walrus Storage', icon: '🐋' },
    { id: 'details', label: 'NFT Details', icon: '🔍' },
    { id: 'converter', label: 'SUI ↔ WAL', icon: '💱' },
    { id: 'journey', label: 'Encryption Journey', icon: '🚀' },
    { id: 'interactive', label: 'Interactive Journey', icon: '✨' }
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
            <div className={activeTab === 'journey' || activeTab === 'interactive' ? '' : 'bg-white rounded-lg shadow p-6'}>
              {activeTab === 'info' && <ContractInfo config={CONFIG} />}
              {activeTab === 'nft' && <NFTManager config={CONFIG} />}
              {activeTab === 'access' && <AccessControl config={CONFIG} />}
              {activeTab === 'seal' && <SealEncryption config={CONFIG} />}
              {activeTab === 'walrus' && <WalrusStorage config={CONFIG} />}
              {activeTab === 'details' && <NFTDetailsPage config={CONFIG} />}
              {activeTab === 'converter' && <SUIToWALConverter config={CONFIG} />}
              {activeTab === 'journey' && <EncryptionJourney config={CONFIG} />}
              {activeTab === 'interactive' && <InteractiveEncryptionJourney config={CONFIG} />}
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