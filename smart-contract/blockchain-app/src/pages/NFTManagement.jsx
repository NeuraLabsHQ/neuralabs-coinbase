import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { nftContract, formatAddress } from '../blockchain/modules';

function NFTManagement() {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userNFTs, setUserNFTs] = useState([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  // Create NFT form state
  const [createForm, setCreateForm] = useState({
    name: '',
    levelOfOwnership: '6',
    metadata: {
      image: '',
      intellectual_property_type: 'model',
      encrypted: false,
      encryption_id: '',
      intellectual_property_id: '',
      intellectual_property_storage: 'neuralabs',
      md5: '',
      version: '1.0.0'
    }
  });

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    tokenId: '',
    toAddress: ''
  });

  useEffect(() => {
    if (wallet.isConnected && activeTab === 'manage') {
      loadUserNFTs();
    }
  }, [wallet.isConnected, activeTab]);

  const loadUserNFTs = async () => {
    if (!wallet.provider || !wallet.account) return;

    setLoadingNFTs(true);
    try {
      const nfts = await nftContract.getNFTsByOwner({
        owner: wallet.account,
        provider: wallet.provider
      });
      setUserNFTs(nfts);
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load your NFTs');
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleCreateNFT = async (e) => {
    e.preventDefault();
    if (!wallet.signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create the NFT
      const createResult = await nftContract.createNFT({
        name: createForm.name,
        levelOfOwnership: parseInt(createForm.levelOfOwnership),
        signer: wallet.signer
      });

      const nftId = createResult.nftId;
      setSuccess(`NFT created successfully! Token ID: ${nftId}`);

      // Step 2: Add metadata if provided
      if (createForm.metadata.image || createForm.metadata.intellectual_property_id) {
        // Note: In a real app, you'd need to implement the metadata contract interaction
        console.log('Metadata would be added here:', createForm.metadata);
      }

      // Reset form
      setCreateForm({
        name: '',
        levelOfOwnership: '6',
        metadata: {
          image: '',
          intellectual_property_type: 'model',
          encrypted: false,
          encryption_id: '',
          intellectual_property_id: '',
          intellectual_property_storage: 'neuralabs',
          md5: '',
          version: '1.0.0'
        }
      });

      // Reload NFTs if on manage tab
      if (activeTab === 'manage') {
        loadUserNFTs();
      }
    } catch (err) {
      console.error('Error creating NFT:', err);
      setError(err.error || err.message || 'Failed to create NFT');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferNFT = async (e) => {
    e.preventDefault();
    if (!wallet.signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await nftContract.transferNFT({
        tokenId: transferForm.tokenId,
        to: transferForm.toAddress,
        signer: wallet.signer
      });

      setSuccess(`NFT #${transferForm.tokenId} transferred successfully!`);
      setTransferForm({ tokenId: '', toAddress: '' });
      loadUserNFTs();
    } catch (err) {
      console.error('Error transferring NFT:', err);
      setError(err.error || err.message || 'Failed to transfer NFT');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="container-fluid">
        <h1>NFT Management</h1>
        <div className="alert alert-info">
          Please connect your wallet to manage NFTs.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h1 className="mb-4">NFT Management</h1>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create NFT
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            My NFTs
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            Transfer
          </button>
        </li>
      </ul>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      {/* Create NFT Tab */}
      {activeTab === 'create' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Create New NFT</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateNFT}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">NFT Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                      placeholder="My Awesome NFT"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ownership Level</label>
                    <select
                      className="form-select"
                      value={createForm.levelOfOwnership}
                      onChange={(e) => setCreateForm({ ...createForm, levelOfOwnership: e.target.value })}
                    >
                      <option value="1">1 - Basic</option>
                      <option value="2">2 - Limited</option>
                      <option value="3">3 - Standard</option>
                      <option value="4">4 - Enhanced</option>
                      <option value="5">5 - Premium</option>
                      <option value="6">6 - Full Ownership</option>
                      <option value="7">7 - Absolute</option>
                      <option value="8">8 - Supreme</option>
                      <option value="9">9 - Ultimate</option>
                      <option value="10">10 - Maximum</option>
                    </select>
                    <div className="form-text">Higher levels grant more control over the NFT</div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">IP Type</label>
                    <select
                      className="form-select"
                      value={createForm.metadata.intellectual_property_type}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        metadata: { ...createForm.metadata, intellectual_property_type: e.target.value }
                      })}
                    >
                      <option value="model">AI Model</option>
                      <option value="flow">Workflow</option>
                      <option value="data">Data</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Image URL (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.metadata.image}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        metadata: { ...createForm.metadata, image: e.target.value }
                      })}
                      placeholder="ipfs://..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !createForm.name}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating...
                  </>
                ) : (
                  'Create NFT'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My NFTs Tab */}
      {activeTab === 'manage' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">My NFTs</h5>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={loadUserNFTs}
              disabled={loadingNFTs}
            >
              {loadingNFTs ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="card-body">
            {loadingNFTs ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : userNFTs.length === 0 ? (
              <p className="text-muted">You don't own any NFTs yet. Create one to get started!</p>
            ) : (
              <div className="row g-3">
                {userNFTs.map((nft) => (
                  <div key={nft.tokenId} className="col-md-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title">{nft.name}</h6>
                        <p className="card-text">
                          <small className="text-muted">Token ID: {nft.tokenId}</small><br />
                          <small className="text-muted">Level: {nft.levelOfOwnership}/10</small>
                        </p>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary">View Details</button>
                          <button className="btn btn-sm btn-outline-secondary">Manage Access</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer Tab */}
      {activeTab === 'transfer' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Transfer NFT</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleTransferNFT}>
              <div className="mb-3">
                <label className="form-label">Token ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={transferForm.tokenId}
                  onChange={(e) => setTransferForm({ ...transferForm, tokenId: e.target.value })}
                  required
                  placeholder="1"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Recipient Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={transferForm.toAddress}
                  onChange={(e) => setTransferForm({ ...transferForm, toAddress: e.target.value })}
                  required
                  placeholder="0x..."
                />
                <div className="form-text">Enter the Ethereum address of the recipient</div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !transferForm.tokenId || !transferForm.toAddress}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Transferring...
                  </>
                ) : (
                  'Transfer NFT'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NFTManagement;