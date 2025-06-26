import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { masterAccessControl, nftContract, formatAddress } from '../blockchain/modules';

function Dashboard() {
  const wallet = useWallet();
  const [stats, setStats] = useState({
    isAuthorized: false,
    nftBalance: '0',
    totalSupply: '0',
    loading: false, // Start with false since wallet isn't connected initially
    error: null
  });

  useEffect(() => {
    // Skip initial render
    if (!wallet.account) {
      return;
    }

    if (wallet.isConnected && wallet.provider && wallet.signer) {
      // Add a small delay to ensure provider is fully initialized
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 500); // Increased delay
      return () => clearTimeout(timer);
    } else {
      // Reset stats when wallet disconnects
      setStats({
        isAuthorized: false,
        nftBalance: '0',
        totalSupply: '0',
        loading: false,
        error: null
      });
    }
  }, [wallet.isConnected, wallet.account, wallet.provider, wallet.signer]);

  const loadDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Double-check provider exists
      if (!wallet.provider || !wallet.account) {
        throw new Error('Wallet not properly connected');
      }


      // Check if user is authorized in master access control
      const isAuthorized = await masterAccessControl.isAuthorized({
        userAddress: wallet.account,
        provider: wallet.provider
      });

      // Get NFT balance
      const nftBalance = await nftContract.balanceOf({
        owner: wallet.account,
        provider: wallet.provider
      });

      // Get total supply
      const totalSupply = await nftContract.totalSupply({
        provider: wallet.provider
      });

      setStats({
        isAuthorized,
        nftBalance,
        totalSupply,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
    }
  };

  return (
    <div className="container-fluid">
      <h1 className="mb-4">Dashboard</h1>

      {/* Wallet Status Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Wallet Status</h5>
            </div>
            <div className="card-body">
              {wallet.isConnected ? (
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Address:</strong> {wallet.account}
                    </p>
                    <p className="mb-2">
                      <strong>Balance:</strong> {wallet.formattedBalance}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Network:</strong> {wallet.network?.name || `Chain ${wallet.network?.chainId || 'Unknown'}`}
                    </p>
                    <p className="mb-2">
                      <strong>Authorization:</strong>{' '}
                      {stats.loading ? (
                        <span className="text-muted">Loading...</span>
                      ) : (
                        <span className={stats.isAuthorized ? 'text-success' : 'text-warning'}>
                          {stats.isAuthorized ? 'Authorized' : 'Not Authorized'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">Please connect your wallet to view dashboard</p>
                  <button className="btn btn-primary" onClick={wallet.connect}>
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {wallet.isConnected && (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h6 className="text-muted mb-2">Your NFTs</h6>
                <h2 className="mb-0">
                  {stats.loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    stats.nftBalance
                  )}
                </h2>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total NFT Supply</h6>
                <h2 className="mb-0">
                  {stats.loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    stats.totalSupply
                  )}
                </h2>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h6 className="text-muted mb-2">Contract Status</h6>
                <h2 className="mb-0">
                  <span className="badge bg-success">Active</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {wallet.isConnected && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <a href="/nfts" className="btn btn-outline-primary w-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 4v16m8-8H4" />
                      </svg>
                      <div>Create NFT</div>
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="/access" className="btn btn-outline-primary w-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <div>Manage Access</div>
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="/monetization" className="btn btn-outline-primary w-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>Set Pricing</div>
                    </a>
                  </div>
                  <div className="col-md-3">
                    <a href="/agreements" className="btn btn-outline-primary w-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div>View Agreements</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {stats.error && (
        <div className="alert alert-danger mt-4" role="alert">
          {stats.error}
        </div>
      )}
    </div>
  );
}

export default Dashboard;