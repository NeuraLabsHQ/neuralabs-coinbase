import React from 'react'

export function HowItWorks() {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">🔄 How the Conversion Works</h3>
      <ol className="text-sm text-gray-600 space-y-2">
        <li>1. <strong>Split Coins:</strong> The specified SUI amount is split from your gas coin</li>
        <li>2. <strong>Exchange Call:</strong> The split SUI is sent to the exchange contract</li>
        <li>3. <strong>Receive WAL:</strong> The contract returns equivalent WAL tokens</li>
        <li>4. <strong>Transfer:</strong> WAL tokens are transferred to your address</li>
      </ol>
    </div>
  )
}