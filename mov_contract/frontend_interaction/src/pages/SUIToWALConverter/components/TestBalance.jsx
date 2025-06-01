import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useState } from 'react'

export function TestBalance() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const [balance, setBalance] = useState('Loading...')
  const [error, setError] = useState(null)

  useEffect(() => {
    async function testBalance() {
      if (!account || !client) {
        setBalance('No account or client')
        return
      }

      try {
        console.log('Client:', client)
        console.log('Client.getBalance:', client.getBalance)
        console.log('Account:', account.address)
        
        const balanceData = await client.getBalance({
          owner: account.address,
          coinType: '0x2::sui::SUI'
        })
        
        setBalance(`SUI Balance: ${(parseInt(balanceData.totalBalance) / 1e9).toFixed(4)}`)
        setError(null)
      } catch (err) {
        console.error('Test balance error:', err)
        setError(err.message)
        setBalance('Error')
      }
    }

    testBalance()
  }, [account, client])

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h4 className="font-medium mb-2">Direct Client Test:</h4>
      <p>{balance}</p>
      {error && <p className="text-red-500 text-sm mt-1">Error: {error}</p>}
    </div>
  )
}