import React from 'react'
import { ACCESS_LEVELS } from '@blockchain/utils/constants'

export function AccessControlSection({ accessDetails }) {
  if (accessDetails.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="font-medium mb-4">🔐 Access Control</h3>
        <p className="text-gray-500 text-center py-8">
          No access information available
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">🔐 Access Control</h3>
      <div className="space-y-3">
        {accessDetails.map((access, index) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm">
                    {String(access.address).slice(0, 10)}...{String(access.address).slice(-6)}
                  </span>
                  {access.isOwner && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      Owner/Creator
                    </span>
                  )}
                  {access.isCurrentUser && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      You
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className={`px-2 py-1 rounded text-xs font-medium access-level-${access.level}`}>
                  Level {access.level} - {ACCESS_LEVELS[access.level]?.name || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}