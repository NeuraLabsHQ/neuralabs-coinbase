import React, { useState, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { getSUIBalance, getWALBalance, convertSUIToWAL } from '@blockchain/exchange'
import { BalanceDisplay } from './components/BalanceDisplay'
import { ConversionForm } from './components/ConversionForm'
import { TransactionDetails } from './components/TransactionDetails'
import { HowItWorks } from './components/HowItWorks'
import { ImportantNotes } from './components/ImportantNotes'
import toast from 'react-hot-toast'

/**
 * SUI to WAL Token Converter Page Component
 * Converts SUI tokens to Walrus (WAL) tokens using the exchange contract
 */
function SUIToWALConverter({ config }) {
  const account = useCurrentAccount()
  
  const [suiBalance, setSuiBalance] = useState('0')
  const [walBalance, setWalBalance] = useState('0')
  const [convertAmount, setConvertAmount] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [exchangeRate] = useState('1:1') // Default rate

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
      const suiBalanceValue = await getSUIBalance(account.address)
      setSuiBalance(suiBalanceValue)

      // Get WAL balance
      const walBalanceValue = await getWALBalance(account.address)
      setWalBalance(walBalanceValue)
    } catch (error) {
      console.error('Error loading balances:', error)
      toast.error('Failed to load balances')
    }
  }

  // Convert SUI to WAL
  const handleConvertSUIToWAL = async () => {
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
      await convertSUIToWAL({
        amount,
        senderAddress: account.address,
        exchangeConfig: EXCHANGE_CONFIG
      })

      toast.success(`Successfully converted ${amount} SUI to WAL!`, { id: toastId })
      
      // Reload balances
      setTimeout(() => {
        loadBalances()
      }, 2000)
      
      // Reset form
      setConvertAmount('')
    } catch (error) {
      console.error('Error converting SUI to WAL:', error)
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

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to use the SUI to WAL converter.</p>
      </div>
    )
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
      <BalanceDisplay
        suiBalance={suiBalance}
        walBalance={walBalance}
        onRefresh={loadBalances}
      />

      {/* Conversion Form */}
      <ConversionForm
        suiBalance={suiBalance}
        convertAmount={convertAmount}
        setConvertAmount={setConvertAmount}
        exchangeRate={exchangeRate}
        isConverting={isConverting}
        onConvert={handleConvertSUIToWAL}
      />

      {/* Transaction Details */}
      <TransactionDetails
        exchangeConfig={EXCHANGE_CONFIG}
        walTokenType={WAL_TOKEN_TYPE}
      />

      {/* How it Works */}
      <HowItWorks />

      {/* Important Notes */}
      <ImportantNotes />
    </div>
  )
}

export default SUIToWALConverter