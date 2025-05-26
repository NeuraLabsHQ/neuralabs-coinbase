;

export default function NFTStats({ userNFTCount, totalNFTCount, userAddress }) {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm">Your NFTs</p>
            <p className="text-3xl font-bold mt-2">{userNFTCount}</p>
          </div>
          <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-600/20 to-purple-700/20 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm">Total NFTs</p>
            <p className="text-3xl font-bold mt-2">{totalNFTCount}</p>
          </div>
          <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-lg p-6 border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm">Connected Wallet</p>
            <p className="text-lg font-mono mt-2">{formatAddress(userAddress)}</p>
          </div>
          <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}