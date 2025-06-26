import React from 'react';
import { useWallet } from '../../contexts/WalletContext';
import WalletConnect from '../wallet/WalletConnect';
import ThemeToggle from './ThemeToggle';

function Header({ theme, toggleTheme, toggleSidebar }) {
  const wallet = useWallet();

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <button 
          className="btn btn-link text-decoration-none p-0 me-3"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="navbar-brand mb-0 h1">
          Blockchain Contract Manager
        </span>

        <div className="ms-auto d-flex align-items-center gap-3">
          {/* Network Status */}
          {wallet.isConnected && (
            <div className="d-flex align-items-center text-muted">
              <span className="badge bg-secondary">
                {wallet.network?.name || `Chain ${wallet.network?.chainId || 'Unknown'}`}
              </span>
            </div>
          )}

          {/* Wallet Connection */}
          <WalletConnect />

          {/* Theme Toggle */}
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
    </nav>
  );
}

export default Header;