import React from 'react'

export function BalanceDisplay({ suiBalance, walBalance, onRefresh }) {
  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4)
  }

  return (
    <>
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
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          🔄 Refresh Balances
        </button>
      </div>
    </>
  )
}