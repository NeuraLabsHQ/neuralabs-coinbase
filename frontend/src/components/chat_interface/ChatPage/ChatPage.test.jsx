/**
 * Basic test file for ChatPage component
 * Tests the integration with chat history persistence
 */

import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ChatPage from './ChatPage';
import chatService from '../../../services/chatService';

// Mock the chatService
jest.mock('../../../services/chatService');

// Mock the WalletContextProvider
jest.mock('../../../contexts/WalletContextProvider', () => ({
  useWallet: () => ({ address: 'test-wallet-address' })
}));

// Mock the useUiColors hook
jest.mock('../../../utils/uiColors', () => ({
  __esModule: true,
  default: () => ({
    bgPrimary: '#ffffff'
  })
}));

describe('ChatPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('loads conversations on mount', async () => {
    const mockConversations = [
      { id: '1', title: 'Test Chat 1', created_at: new Date().toISOString() },
      { id: '2', title: 'Test Chat 2', created_at: new Date().toISOString() }
    ];

    chatService.getConversations.mockResolvedValue(mockConversations);

    render(
      <ChakraProvider>
        <ChatPage />
      </ChakraProvider>
    );

    // Wait for conversations to load
    await waitFor(() => {
      expect(chatService.getConversations).toHaveBeenCalled();
    });
  });

  test('creates new conversation when sending first message', async () => {
    const mockNewConversation = {
      id: 'new-chat-id',
      title: 'Hello, how can I help...',
      created_at: new Date().toISOString()
    };

    chatService.getConversations.mockResolvedValue([]);
    chatService.createConversation.mockResolvedValue(mockNewConversation);
    chatService.addMessage.mockResolvedValue({
      id: 'msg-1',
      content: 'Hello, how can I help?',
      role: 'user'
    });

    render(
      <ChakraProvider>
        <ChatPage />
      </ChakraProvider>
    );

    // Test would continue with simulating user input...
  });
});