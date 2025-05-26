import React, { useState } from 'react';

export default function MintNFTForm({ onMint, minting }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.url) {
      return;
    }
    
    try {
      await onMint(formData);
      // Reset form on success
      setFormData({ name: '', description: '', url: '' });
    } catch (error) {
      // Error is handled in parent component
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6">Mint New NFT</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            NFT Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My Awesome NFT"
            required
            disabled={minting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your NFT..."
            rows="3"
            required
            disabled={minting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Image URL
          </label>
          <input
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/image.png"
            required
            disabled={minting}
          />
        </div>
        
        {formData.url && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Preview:</p>
            <img 
              src={formData.url} 
              alt="NFT Preview" 
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={minting || !formData.name || !formData.description || !formData.url}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            minting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {minting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Minting...
            </span>
          ) : (
            'Mint NFT'
          )}
        </button>
      </form>
    </div>
  );
}