import React from 'react'

export function ImportantNotes() {
  return (
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
  )
}