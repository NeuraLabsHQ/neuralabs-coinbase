import React, { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'

/**
 * SUI to WAL Token Converter Component
 * Converts SUI tokens to Walrus (WAL) tokens using the exchange contract
 */
function SUIToWALConverter({ config }) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  const [suiBalance, setSuiBalance] = useState('0')
  const [walBalance, setWalBalance] = useState('0')
  const [convertAmount, setConvertAmount] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [exchangeRate, setExchangeRate] = useState('1:1') // Default rate

  // Exchange contract configuration (from the transaction sample)
  const EXCHANGE_CONFIG = {
    PACKAGE_ID: '0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f',
    SHARED_OBJECT_ID: '0x83b454e524c71f30803f4d6c302a86fb6a39e96cdfb873c2d1e93bc1c26a3bc5',
    INITIAL_SHARED_VERSION: '400185628'
  }

  // WAL Token configuration  
  const WAL_TOKEN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL'

  // Load balances
  const loadBalances = async () => {
    if (!account) return

    try {
      // Get SUI balance
      const suiBalanceData = await client.getBalance({
        owner: account.address,
        coinType: '0x2::sui::SUI'
      })
      setSuiBalance((parseInt(suiBalanceData.totalBalance) / 1e9).toFixed(4))

      // Get WAL balance
      try {
        const walBalanceData = await client.getBalance({
          owner: account.address,
          coinType: WAL_TOKEN_TYPE
        })
        setWalBalance((parseInt(walBalanceData.totalBalance) / 1e9).toFixed(4))
      } catch (error) {
        // WAL token might not exist for this user yet
        setWalBalance('0.0000')
      }
    } catch (error) {
      console.error('Error loading balances:', error)
      toast.error('Failed to load balances')
    }
  }

  // Convert SUI to WAL
  const convertSUIToWAL = async () => {
    if (!account || !convertAmount) {
      toast.error('Please enter an amount to convert')
      return
    }

    const amount = parseFloat(convertAmount)
    if (amount <= 0 || amount > parseFloat(suiBalance)) {
      toast.error('Invalid amount or insufficient SUI balance')
      return
    }

    setIsConverting(true)
    const toastId = toast.loading('Converting SUI to WAL...')

    try {
      const tx = new Transaction()
      
      // Convert SUI amount to MIST (1 SUI = 1e9 MIST)
      const amountInMist = Math.floor(amount * 1e9)

      // Build transaction based on the provided structure
      // 1. Split coins from gas coin
      const [splitCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])

      // 2. Call exchange function
      const [walTokens] = tx.moveCall({
        target: `${EXCHANGE_CONFIG.PACKAGE_ID}::wal_exchange::exchange_all_for_wal`,
        arguments: [
          tx.sharedObjectRef({
            objectId: EXCHANGE_CONFIG.SHARED_OBJECT_ID,
            initialSharedVersion: EXCHANGE_CONFIG.INITIAL_SHARED_VERSION,
            mutable: true
          }),
          splitCoin
        ],
      })

      // 3. Transfer WAL tokens to user
      tx.transferObjects([walTokens], tx.pure.address(account.address))

      // Execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        },
        {
          onSuccess: (result) => {
            console.log('Conversion successful:', result)
            toast.success(`Successfully converted ${amount} SUI to WAL!`, { id: toastId })
            
            // Reload balances
            setTimeout(() => {
              loadBalances()
            }, 2000)
            
            // Reset form
            setConvertAmount('')
          },
          onError: (error) => {
            console.error('Error converting SUI to WAL:', error)
            toast.error(`Conversion failed: ${error.message}`, { id: toastId })
          }
        }
      )
    } catch (error) {
      console.error('Error in conversion:', error)
      toast.error(`Conversion failed: ${error.message}`, { id: toastId })
    } finally {
      setIsConverting(false)
    }
  }

  // Load balances on mount and when account changes
  useEffect(() => {
    if (account) {
      loadBalances()
      // Refresh balances every 30 seconds
      const interval = setInterval(loadBalances, 30000)
      return () => clearInterval(interval)
    }
  }, [account])

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">SUI to WAL Token Converter</h2>
        <p className="text-gray-600 mb-4">
          Convert your SUI tokens to Walrus (WAL) tokens to pay for Walrus storage fees.
        </p>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-6 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">SUI Balance</h3>
              <p className="text-2xl font-bold text-blue-700">{formatBalance(suiBalance)} SUI</p>
            </div>
            <div className="text-blue-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900">WAL Balance</h3>
              <p className="text-2xl font-bold text-purple-700">{formatBalance(walBalance)} WAL</p>
            </div>
            <div className="text-purple-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Balances Button */}
      <div className="flex justify-center">
        <button
          onClick={loadBalances}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          🔄 Refresh Balances
        </button>
      </div>

      {/* Conversion Form */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">Convert SUI to WAL</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount to Convert (SUI)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                step="0.0001"
                min="0"
                max={suiBalance}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.25"
              />
              <button
                onClick={() => setConvertAmount((parseFloat(suiBalance) * 0.5).toString())}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                50%
              </button>
              <button
                onClick={() => setConvertAmount((parseFloat(suiBalance) * 0.9).toString())}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                90%
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Available: {formatBalance(suiBalance)} SUI
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Exchange Rate:</span>
              <span className="text-sm font-medium">{exchangeRate}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">You will receive:</span>
              <span className="text-sm font-medium">
                ~{convertAmount ? formatBalance(convertAmount) : '0.0000'} WAL
              </span>
            </div>
          </div>

          <button
            onClick={convertSUIToWAL}
            disabled={!convertAmount || isConverting || !account}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isConverting ? 'Converting...' : 'Convert SUI to WAL'}
          </button>
        </div>
      </div>

      {/* Sample Transaction Details */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="font-medium mb-4">📋 Transaction Details</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Exchange Contract</label>
            <p className="font-mono text-xs break-all">{EXCHANGE_CONFIG.PACKAGE_ID}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Shared Object</label>
            <p className="font-mono text-xs break-all">{EXCHANGE_CONFIG.SHARED_OBJECT_ID}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">WAL Token Type</label>
            <p className="font-mono text-xs break-all">{WAL_TOKEN_TYPE}</p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">🔄 How the Conversion Works</h3>
        <ol className="text-sm text-gray-600 space-y-2">
          <li>1. <strong>Split Coins:</strong> The specified SUI amount is split from your gas coin</li>
          <li>2. <strong>Exchange Call:</strong> The split SUI is sent to the exchange contract</li>
          <li>3. <strong>Receive WAL:</strong> The contract returns equivalent WAL tokens</li>
          <li>4. <strong>Transfer:</strong> WAL tokens are transferred to your address</li>
        </ol>
      </div>

      {/* Sample Transaction Structure */}
      <div className="border rounded-lg p-6">
        <details className="group">
          <summary className="font-medium cursor-pointer group-open:mb-4">
            📄 Sample Transaction Structure (Click to expand)
          </summary>
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-sm font-medium text-gray-600">Transaction Commands:</label>
              <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mt-1">
{`[
  {"SplitCoins":["GasCoin",[{"Input":2}]]},
  {"MoveCall":{
    "package":"${EXCHANGE_CONFIG.PACKAGE_ID}",
    "module":"wal_exchange",
    "function":"exchange_all_for_wal",
    "arguments":[{"Input":0},{"NestedResult":[0,0]}]
  }},
  {"TransferObjects":[[{"Result":1}],{"Input":1}]}
]`}
              </pre>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Input Parameters:</label>
              <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mt-1">
{`[
  {
    "type":"object",
    "objectType":"sharedObject",
    "objectId":"${EXCHANGE_CONFIG.SHARED_OBJECT_ID}",
    "initialSharedVersion":"${EXCHANGE_CONFIG.INITIAL_SHARED_VERSION}",
    "mutable":true
  },
  {
    "type":"pure",
    "valueType":"address",
    "value":"${account?.address || 'USER_ADDRESS'}"
  },
  {
    "type":"pure",
    "valueType":"u64",
    "value":"${convertAmount ? Math.floor(parseFloat(convertAmount) * 1e9) : '250000000'}"
  }
]`}
              </pre>
            </div>
          </div>
        </details>
      </div>

      {/* Important Notes */}
      <div className="border rounded-lg p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-medium mb-2 text-yellow-800">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• WAL tokens are required to pay for Walrus storage fees</li>
          <li>• The conversion rate is typically 1:1 but may vary based on market conditions</li>
          <li>• You need some SUI for gas fees even after conversion</li>
          <li>• WAL tokens can be used across the Walrus network ecosystem</li>
          <li>• This is a testnet converter - use testnet SUI only</li>
        </ul>
      </div>
    </div>
  )
}

export default SUIToWALConverter