import React from 'react'
import { ACCESS_LEVELS } from '@blockchain/utils/constants'

export function AccessControlMatrix() {
  const permissions = [
    { name: 'Use', levels: [true, true, true, true, true, true] },
    { name: 'Resell', levels: [false, true, true, true, true, true] },
    { name: 'Replicate', levels: [false, false, true, true, true, true] },
    { name: 'Decrypt', levels: [false, false, false, true, true, true] },
    { name: 'Edit', levels: [false, false, false, false, true, true] },
    { name: 'Grant', levels: [false, false, false, false, false, true] }
  ]

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Access Control Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Level</th>
              <th className="text-left py-2">Name</th>
              {permissions.map(perm => (
                <th key={perm.name} className="text-center py-2">{perm.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(ACCESS_LEVELS).map(([level, info]) => (
              <tr key={level} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium access-level-${level}`}>
                    {level}
                  </span>
                </td>
                <td className="py-2">{info.name}</td>
                {permissions.map((perm, idx) => (
                  <td key={idx} className="text-center py-2">
                    <span className={perm.levels[parseInt(level) - 1] ? 'text-green-600' : 'text-gray-400'}>
                      {perm.levels[parseInt(level) - 1] ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}