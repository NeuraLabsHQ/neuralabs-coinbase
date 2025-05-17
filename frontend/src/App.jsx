import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/layout';
import FlowBuilderPage from './pages/flow_builder_page';
import DashboardPage from './pages/home_page';
import MarketplacePage from './pages/marketplace_page';
import ChatInterfacePage from './pages/chat_interface_page';
import AccessManagementPage from './pages/access_management_page';
import theme from './theme';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import api_key from './api_key.json';
import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect={true} preferredWallets={['Slush']}>
          <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <Layout>
                    <DashboardPage />
                  </Layout>
                } />
                <Route path="/flow-builder" element={
                  <Layout>
                    <FlowBuilderPage />
                  </Layout>
                } />
                <Route path="/marketplace" element={
                  <Layout>
                    <MarketplacePage />
                  </Layout>
                } />
                <Route path="/chat" element={
                  <Layout>
                    <ChatInterfacePage />
                  </Layout>
                } />
                <Route path="/access-management" element={
                  <Layout>
                    <AccessManagementPage />
                  </Layout>
                } />
              </Routes>
            </BrowserRouter>
          </ChakraProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;