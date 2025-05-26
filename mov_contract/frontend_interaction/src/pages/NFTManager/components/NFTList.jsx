;

export default function NFTList({ nfts, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My NFTs</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My NFTs ({nfts.length})</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {nfts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No NFTs found</p>
          <p className="text-gray-500 mt-2">Mint your first NFT to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}

function NFTCard({ nft }) {
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-gray-800">
        <img 
          src={nft.url} 
          alt={nft.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23374151"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{nft.description}</p>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Created:</span>
          <span className="text-gray-300">{formatDate(nft.creation_date)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-500">ID:</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-300 font-mono text-xs">
              {`${nft.id.substring(0, 6)}...${nft.id.substring(nft.id.length - 4)}`}
            </span>
            <button
              onClick={() => copyToClipboard(nft.id)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Copy NFT ID"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}