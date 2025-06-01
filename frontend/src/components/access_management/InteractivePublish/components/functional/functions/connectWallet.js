export const connectWallet = async (state, updateState, config) => {
  try {
    updateState({ loading: true, error: null });
    
    // Wallet connection is handled by the dapp-kit ConnectButton
    // Just check if account exists
    const account = window.currentAccount;
    if (!account) {
      throw new Error('Please connect your wallet using the Connect button');
    }
    
    updateState({
      walletConnected: true,
      walletAddress: account.address,
      loading: false,
    });
    
    return { success: true };
  } catch (error) {
    updateState({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
};