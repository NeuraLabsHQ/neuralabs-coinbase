import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';

// Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import AccessManagement from './pages/AccessManagement';
import NFTManagement from './pages/NFTManagement';
import Monetization from './pages/Monetization';
import AgentWallets from './pages/AgentWallets';
import Agreements from './pages/Agreements';
import Settings from './pages/Settings';

// Styles
import './styles/global.css';

function App() {
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to light
    return localStorage.getItem('theme') || 'light';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <WalletProvider>
      <Router>
        <div className="app-layout">
          <Sidebar collapsed={sidebarCollapsed} />
          <div className="main-content">
            <Header 
              theme={theme} 
              toggleTheme={toggleTheme}
              toggleSidebar={toggleSidebar}
            />
            <div className="content-area">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/access" element={<AccessManagement />} />
                <Route path="/nfts" element={<NFTManagement />} />
                <Route path="/monetization" element={<Monetization />} />
                <Route path="/wallets" element={<AgentWallets />} />
                <Route path="/agreements" element={<Agreements />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App
