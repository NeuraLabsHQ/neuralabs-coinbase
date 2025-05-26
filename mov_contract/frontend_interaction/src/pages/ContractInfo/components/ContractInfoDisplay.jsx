import React from 'react';

export default function ContractInfoDisplay({ info, config }) {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const InfoCard = ({ title, items }) => (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-gray-400">{item.label}:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-blue-300">
                {item.value.length > 20 
                  ? `${item.value.substring(0, 10)}...${item.value.substring(item.value.length - 10)}` 
                  : item.value}
              </span>
              {item.copyable && (
                <button
                  onClick={() => copyToClipboard(item.value)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InfoCard
        title="Package Information"
        items={[
          { label: "Package Address", value: info.package.id, copyable: true },
          { label: "Version", value: info.package.version },
          { label: "Published At", value: info.package.published_at },
        ]}
      />
      
      <InfoCard
        title="Registry Information"
        items={[
          { label: "Registry Address", value: info.registry.id, copyable: true },
          { label: "Creator", value: info.registry.creator, copyable: true },
          { label: "Total NFTs", value: info.registry.nft_count.toString() },
        ]}
      />
      
      <InfoCard
        title="Access Registry"
        items={[
          { label: "Address", value: info.accessRegistry.id, copyable: true },
          { label: "Creator", value: info.accessRegistry.creator, copyable: true },
          { label: "Total Grants", value: info.accessRegistry.grant_count.toString() },
        ]}
      />
      
      <InfoCard
        title="Configuration"
        items={[
          { label: "Walrus Aggregator", value: config.WALRUS_AGGREGATOR },
          { label: "Walrus Publisher", value: config.WALRUS_PUBLISHER },
          { label: "Network", value: "Testnet" },
        ]}
      />
    </div>
  );
}