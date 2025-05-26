import React, { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import toast from 'react-hot-toast';
import { contracts } from '@blockchain/index';
import ContractInfoDisplay from './components/ContractInfoDisplay';
import LoadingSpinner from './components/LoadingSpinner';

export default function ContractInfo({ config }) {
  const client = useSuiClient();
  const [contractInfo, setContractInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContractInfo();
  }, []);

  const fetchContractInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const info = await contracts.getContractInfo(client, config);
      setContractInfo(info);
      
      toast.success('Contract information loaded successfully');
    } catch (err) {
      console.error('Error fetching contract info:', err);
      setError(err.message);
      toast.error('Failed to load contract information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchContractInfo();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Contract Information</h1>
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-xl mb-4">Error loading contract information</p>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Contract Information</h1>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {contractInfo && <ContractInfoDisplay info={contractInfo} config={config} />}
      </div>
    </div>
  );
}