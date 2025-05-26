import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { ConnectButton } from '@mysten/dapp-kit'
import { useCurrentAccount } from '@mysten/dapp-kit'

// Import page components from new structure
import ContractInfo from '@pages/ContractInfo'
import NFTManager from '@pages/NFTManager'

// Import old components (will be refactored later)
import AccessControl from './components/AccessControl'
import SealEncryption from './components/SealEncryption'
import WalrusStorage from './components/WalrusStorage'
import NFTDetailsPage from './components/NFTDetailsPage'
import SUIToWALConverter from './components/SUIToWALConverter'
import EncryptionJourney from './components/EncryptionJourney'
import InteractiveEncryptionJourney from './components/InteractiveEncryptionJourney'
import InteractiveEncryptionJourneyV2 from './components/InteractiveEncryptionJourneyV2'

// Configuration based on deployment-config.json
const CONFIG = {
  PACKAGE_ADDRESS: import.meta.env.VITE_PACKAGE_ADDRESS || '0x31717ba3482c33f3bfe0bab05b3f509053a206b01e727c3184c0bb791d74c7fe',
  REGISTRY_ADDRESS: import.meta.env.VITE_REGISTRY_ADDRESS || '0xd7092aa8c1614c522f42b42cc3410b1276083eea23e66ef83051c9716f8b9970',
  ACCESS_REGISTRY_ADDRESS: import.meta.env.VITE_ACCESS_REGISTRY_ADDRESS || '0xb01b33f8038a78532a946b3d9093616cf050f23f01fb3cfa94d19d2bfc7a2125',
  WALRUS_AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space',
  WALRUS_PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  SEAL_APP_NAME: 'NeuraLabs',
  SEAL_URL: 'https://seal-testnet.mystenlabs.com',
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
              {activeTab === 'interactive' && <InteractiveEncryptionJourneyV2 config={CONFIG} />}
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