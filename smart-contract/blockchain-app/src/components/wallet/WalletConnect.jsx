import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

function WalletConnect() {
  const wallet = useWallet();

  if (wallet.isConnecting) {
    return (
      <button className="btn btn-primary" disabled>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Connecting...
      </button>
    );
  }

  if (wallet.isConnected) {
    return (
      <div className="dropdown">
        <button 
          className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2" 
          type="button" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>{wallet.formattedAddress}</span>
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li className="px-3 py-2">
            <div className="text-muted small">Balance</div>
            <div className="fw-semibold">{wallet.formattedBalance}</div>
          </li>
          <li><hr className="dropdown-divider" /></li>
          <li>
            <button 
              className="dropdown-item d-flex align-items-center gap-2" 
              onClick={() => navigator.clipboard.writeText(wallet.account)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Address
            </button>
          </li>
          <li>
            <button 
              className="dropdown-item d-flex align-items-center gap-2 text-danger" 
              onClick={wallet.disconnect}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <button 
      className="btn btn-primary d-flex align-items-center gap-2" 
      onClick={wallet.connect}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      Connect Wallet
    </button>
  );
}

export default WalletConnect;