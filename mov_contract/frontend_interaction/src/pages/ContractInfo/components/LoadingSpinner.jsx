import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-xl text-gray-300">Loading contract information...</p>
      </div>
    </div>
  );
}