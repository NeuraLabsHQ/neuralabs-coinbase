import React from 'react'
import { useSuiClient } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'

/**
 * ContractInfo Component
 * Displays contract deployment information and configuration
 */
function ContractInfo({ config }) {
  const client = useSuiClient()
  
  // Fetch package info
  const { data: packageInfo, isLoading: packageLoading } = useQuery({
    queryKey: ['package', config.PACKAGE_ID],
    queryFn: async () => {
      try {
        return await client.getObject({
          id: config.PACKAGE_ID,
          options: { showContent: true, showType: true }
        })
      } catch (error) {
        console.error('Error fetching package:', error)
        return null
      }
    },
    enabled: config.PACKAGE_ID !== '0x0'
  })

  // Fetch registry info
  const { data: registryInfo, isLoading: registryLoading } = useQuery({
    queryKey: ['registry', config.REGISTRY_ID],
    queryFn: async () => {
      try {
        return await client.getObject({
          id: config.REGISTRY_ID,
          options: { showContent: true, showType: true }
        })
      } catch (error) {
        console.error('Error fetching registry:', error)
        return null
      }
    },
    enabled: config.REGISTRY_ID !== '0x0' && config.REGISTRY_ID !== 'YOUR_REGISTRY_ID'
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
        <p className="text-gray-600 mb-4">
          View deployment details and current configuration for the NeuraLabs NFT contract.
        </p>
      </div>

      {/* Package Information */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2 flex items-center">
          📦 Package Details
          {packageLoading && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Package ID:</span>
            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
              {config.PACKAGE_ID}
            </code>
          </div>
          {packageInfo && (
            <>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 text-green-600">✓ Deployed</span>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-2">Move Package</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Registry Information */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2 flex items-center">
          🗂️ Access Registry
          {registryLoading && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Registry ID:</span>
            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
              {config.REGISTRY_ID || 'Not initialized'}
            </code>
          </div>
          {registryInfo && registryInfo.data && (
            <>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 text-green-600">✓ Active</span>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-2">AccessRegistry</span>
              </div>
            </>
          )}
          {config.REGISTRY_ID === 'YOUR_REGISTRY_ID' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              ⚠️ Run <code>python initialize.py</code> to create the AccessRegistry
            </div>
          )}
        </div>
      </div>

      {/* Seal Configuration */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2">🔐 Seal Configuration</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Key Servers:</span>
            <span className="ml-2">{config.SEAL_KEY_SERVERS.length} configured</span>
          </div>
          {config.SEAL_KEY_SERVERS.map((server, index) => (
            <div key={index} className="ml-4 p-2 bg-gray-50 rounded">
              <div className="font-medium">{server.name}</div>
              <div className="text-xs text-gray-600 truncate">{server.url}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Access Levels */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2">🎯 Access Levels</h3>
        <div className="space-y-1 text-sm">
          {[
            { level: 1, name: 'USE_MODEL', desc: 'Basic usage rights' },
            { level: 2, name: 'RESALE', desc: 'Can resell the NFT' },
            { level: 3, name: 'CREATE_REPLICA', desc: 'Can create copies' },
            { level: 4, name: 'VIEW_DOWNLOAD', desc: 'Can decrypt files (min for Seal)' },
            { level: 5, name: 'EDIT_DATA', desc: 'Can modify encrypted data' },
            { level: 6, name: 'ABSOLUTE_OWNERSHIP', desc: 'Full control' }
          ].map(({ level, name, desc }) => (
            <div key={level} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium access-level-${level}`}>
                  Level {level}
                </span>
                <span className="ml-2 font-medium">{name}</span>
              </div>
              <span className="text-gray-500 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Network Info */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2">🌐 Network</h3>
        <div className="text-sm">
          <span className="font-medium">Connected to:</span>
          <span className="ml-2">Sui Testnet</span>
        </div>
      </div>
    </div>
  )
}

export default ContractInfo