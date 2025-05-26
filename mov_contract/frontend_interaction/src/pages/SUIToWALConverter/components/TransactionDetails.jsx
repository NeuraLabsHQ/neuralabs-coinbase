import React from 'react'

export function TransactionDetails({ exchangeConfig, walTokenType }) {
  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h3 className="font-medium mb-4">📋 Transaction Details</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">Exchange Contract</label>
          <p className="font-mono text-xs break-all">{exchangeConfig.PACKAGE_ID}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Shared Object</label>
          <p className="font-mono text-xs break-all">{exchangeConfig.SHARED_OBJECT_ID}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">WAL Token Type</label>
          <p className="font-mono text-xs break-all">{walTokenType}</p>
        </div>
      </div>
    </div>
  )
}