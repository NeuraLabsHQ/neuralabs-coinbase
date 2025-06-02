import { initializeSealClient, createSealSessionKey } from '../../../../../../utils/blockchain';

export const initializeSeal = async (state, updateState, config) => {
  try {
    updateState({ loading: true, error: null });
    
    const client = window.suiClient;
    const finalConfig = config || window.config;
    
    console.log('Initializing Seal with client:', client);
    
    if (!client) {
      throw new Error('SUI client not available. Please ensure wallet is connected.');
    }
    
    const sealClient = initializeSealClient(client);
    console.log('Seal client initialized:', sealClient);
    
    // Just initialize the seal client, session key will be created in next step
    updateState({
      sealClient,
      loading: false,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in initializeSeal:', error);
    console.error('Error stack:', error.stack);
    updateState({ error: error.message || 'Failed to initialize Seal', loading: false });
    return { success: false, error: error.message || 'Failed to initialize Seal' };
  }
};

export const createSessionKey = async (state, updateState, config) => {
  try {
    updateState({ loading: true, error: null });
    
    const finalConfig = config || window.config;
    const currentAccount = window.currentAccount;
    
    if (!currentAccount) {
      throw new Error('Please connect wallet first');
    }
    
    console.log('Creating session key for address:', currentAccount.address);
    
    // Create session key using blockchain utils pattern
    const sessionKey = createSealSessionKey({
      address: currentAccount.address,
      packageId: finalConfig.PACKAGE_ID,
      ttlMin: 30,
      suiClient: window.suiClient
    });

    // Get the personal message that needs to be signed
    const messageBytes = sessionKey.getPersonalMessage();
    console.log('Session key created, needs signature for message:', messageBytes);
    console.log('Session key object:', sessionKey);
    console.log('Message type:', typeof messageBytes);
    console.log('Message value:', messageBytes);
    
    // Store the session key temporarily
    const displayString = `sk_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store session key data immediately
    updateState({
      sessionKey: displayString,
      sessionKeyObject: sessionKey,
      sessionKeyMessage: messageBytes,
      sessionKeyNeedsSignature: true, // Flag to indicate signature is needed
      loading: false,
    });
    
    console.log('Session key stored, signature needed');
    
    // Return success but indicate signature is still needed
    return { 
      success: true, 
      needsSignature: true,
      sessionKey: sessionKey,
      message: messageBytes
    };
  } catch (error) {
    console.error('Error creating session key:', error);
    updateState({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
};