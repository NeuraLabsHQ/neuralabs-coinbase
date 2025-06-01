import { getSUIBalance, getWALBalance } from '../../../../../../utils/blockchain';

export const checkBalances = async (state, updateState, config) => {
  try {
    updateState({ loading: true, error: null });
    
    const [suiBalance, walBalance] = await Promise.all([
      getSUIBalance(state.walletAddress),
      getWALBalance(state.walletAddress)
    ]);
    
    updateState({
      suiBalance,
      walBalance,
      loading: false,
    });
    
    return { success: true };
  } catch (error) {
    updateState({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
};