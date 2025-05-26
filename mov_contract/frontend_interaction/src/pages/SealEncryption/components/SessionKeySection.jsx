import React from 'react'
import { createSealSessionKey, exportSessionKey, importSessionKey } from '@blockchain/seal-encryption'
import { useSignPersonalMessage } from '@mysten/dapp-kit'
import toast from 'react-hot-toast'

export function SessionKeySection({ account, sessionKey, setSessionKey, config }) {
  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const [exportedKey, setExportedKey] = React.useState('')
  const [importKey, setImportKey] = React.useState('')

  const handleCreateSessionKey = () => {
    if (!account) {
      toast.error('Please connect wallet first')
      return
    }

    const toastId = toast.loading('Creating session key...')

    try {
      const key = createSealSessionKey({
        address: account.address,
        packageId: config.PACKAGE_ID,
        ttlMin: 30
      })

      // Get the personal message
      const messageBytes = key.getPersonalMessage()

      signPersonalMessage(
        {
          message: messageBytes,
        },
        {
          onSuccess: async (result) => {
            await key.setPersonalMessageSignature(result.signature)
            setSessionKey(key)
            toast.success('Session key created!', { id: toastId })
          },
          onError: (error) => {
            console.error('Error signing message:', error)
            if (error.message?.includes('rejected')) {
              toast.error('Signature rejected by user', { id: toastId })
            } else {
              toast.error(`Failed to sign message: ${error.message}`, { id: toastId })
            }
          },
        }
      )
    } catch (error) {
      console.error('Error creating session key:', error)
      toast.error(`Failed to create session key: ${error.message}`, { id: toastId })
    }
  }

  const handleExportSessionKey = async () => {
    if (!sessionKey) {
      toast.error('No session key to export')
      return
    }

    try {
      const exported = await exportSessionKey(sessionKey)
      setExportedKey(exported)
      toast.success('Session key exported!')
    } catch (error) {
      console.error('Error exporting key:', error)
      toast.error(`Failed to export key: ${error.message}`)
    }
  }

  const handleImportSessionKey = async () => {
    if (!importKey) {
      toast.error('Please enter a session key to import')
      return
    }

    try {
      const key = await importSessionKey(importKey, {
        address: account.address,
        packageId: config.PACKAGE_ID
      })
      setSessionKey(key)
      setImportKey('')
      toast.success('Session key imported!')
    } catch (error) {
      console.error('Error importing key:', error)
      toast.error(`Failed to import key: ${error.message}`)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Session Key Management</h3>
      
      {!sessionKey ? (
        <div className="space-y-4">
          <button
            onClick={handleCreateSessionKey}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Session Key
          </button>
          
          <div>
            <label className="block text-sm font-medium mb-1">Import Session Key</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste exported session key..."
              />
              <button
                onClick={handleImportSessionKey}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">✓ Session key active</p>
            <p className="text-sm text-gray-600 mt-1">Valid for 30 minutes</p>
          </div>
          
          <button
            onClick={handleExportSessionKey}
            className="w-full py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Export Session Key
          </button>
          
          {exportedKey && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Exported Key</label>
              <textarea
                readOnly
                value={exportedKey}
                className="w-full px-3 py-2 border rounded-md bg-gray-50 font-mono text-xs"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Save this key to use in another session
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}