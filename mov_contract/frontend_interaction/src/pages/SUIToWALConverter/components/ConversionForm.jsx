

export function ConversionForm({ 
  suiBalance, 
  convertAmount, 
  setConvertAmount, 
  exchangeRate, 
  isConverting, 
  onConvert 
}) {
  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4)
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-medium mb-4">Convert SUI to WAL</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount to Convert (SUI)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              step="0.0001"
              min="0"
              max={suiBalance}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.25"
            />
            <button
              onClick={() => setConvertAmount((parseFloat(suiBalance) * 0.5).toString())}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              50%
            </button>
            <button
              onClick={() => setConvertAmount((parseFloat(suiBalance) * 0.9).toString())}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              90%
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {formatBalance(suiBalance)} SUI
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Exchange Rate:</span>
            <span className="text-sm font-medium">{exchangeRate}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">You will receive:</span>
            <span className="text-sm font-medium">
              ~{convertAmount ? formatBalance(convertAmount) : '0.0000'} WAL
            </span>
          </div>
        </div>

        <button
          onClick={onConvert}
          disabled={!convertAmount || isConverting}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isConverting ? 'Converting...' : 'Convert SUI to WAL'}
        </button>
      </div>
    </div>
  )
}