// frontend/src/App.jsx

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/layout';
import FlowBuilderPage from './pages/flow_builder_page';
import DashboardPage from './pages/home_page';
import MarketplacePage from './pages/marketplace_page';
import ChatInterfacePage from './pages/chat_interface_page';
import AccessManagementPage from './pages/access_management_page';
import theme from './theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import { Buffer } from 'buffer';


// Required for buffer operations
window.Buffer = window.Buffer || Buffer;

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
           <WalletContextProvider>
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
                  {/* Add route with agent_id parameter */}
                  <Route path="/flow-builder/:agentId" element={
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
                  {/* Add route with agent_id parameter for chat */}
                  <Route path="/chat/:agentId" element={
                    <Layout>
                      <ChatInterfacePage />
                    </Layout>
                  } />
                  <Route path="/access-management" element={
                    <Layout>
                      <AccessManagementPage />
                    </Layout>
                  } />
                  {/* Add route with agent_id parameter for agent detail */}
                  <Route path="/access-management/:agentId" element={
                    <Layout>
                      <AccessManagementPage />
                    </Layout>
                  } />
                </Routes>
              </BrowserRouter>
              </WalletContextProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;