// Use the blockchain utility wrapper which handles JS/TS compatibility
import { 
  mintNFT, 
  createAccessCap, 
  grantAccessToUser, 
  checkUserAccess,
  initializeSealClient,
  createSealSessionKey,
  encryptDataWithSeal,
  uploadToWalrus,
  getSuiBalance,
  getWalBalance
} from '../../../../utils/blockchain';

export const journeyActions = {
  connectWallet: async (state, updateState, config) => {
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
  },

  checkBalances: async (state, updateState, config) => {
    try {
      updateState({ loading: true, error: null });
      
      const [suiBalance, walBalance] = await Promise.all([
        getSuiBalance(state.walletAddress),
        getWalBalance(state.walletAddress)
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
  },

  mintNFT: async (state, updateState, config) => {
    try {
      updateState({ loading: true, error: null });
      
      const client = window.suiClient;
      const signAndExecute = window.signAndExecute;
      const config = window.config;
      const currentAccount = window.currentAccount;
      
      console.log('Minting NFT with params:', {
        name: state.nftName,
        description: state.nftDescription,
      });
      
      const result = await mintNFT(client, config, currentAccount, signAndExecute, {
        name: state.nftName,
        description: state.nftDescription,
        url: 'https://neuralabs.ai/placeholder.png',
      });
      
      console.log('Mint NFT result:', result);
      
      // Extract NFT ID from transaction
      let nftId = null;
      
      // First try object changes (if available)
      if (result.objectChanges && result.objectChanges.length > 0) {
        const createdNFT = result.objectChanges.find(
          (change) => change.type === 'created'
        );
        if (createdNFT) {
          nftId = createdNFT.objectId;
          console.log('Found NFT ID from object changes:', nftId);
        }
      }
      
      // If no NFT ID yet, query the transaction for details
      if (!nftId && result.digest) {
        console.log('Querying transaction for created objects...');
        try {
          // Wait a moment for the transaction to be indexed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get transaction details from the chain
          const txDetails = await client.getTransactionBlock({
            digest: result.digest,
            options: {
              showEffects: true,
              showObjectChanges: true,
            }
          });
          
          console.log('Transaction details:', txDetails);
          
          // Check object changes in the full transaction
          if (txDetails.objectChanges) {
            const createdNFT = txDetails.objectChanges.find(
              (change) => {
                return change.type === 'created' && 
                       change.objectType && 
                       (change.objectType.includes('::nft::') || 
                        change.objectType.includes('::NeuraNFT') ||
                        change.objectType.includes('::NFT'));
              }
            );
            
            if (createdNFT) {
              nftId = createdNFT.objectId;
              console.log('Found NFT ID from transaction query:', nftId);
            } else {
              // If no NFT type found, take the first created object owned by the user
              const anyCreated = txDetails.objectChanges.find(
                (change) => change.type === 'created' && 
                           change.owner?.AddressOwner === currentAccount.address
              );
              if (anyCreated) {
                nftId = anyCreated.objectId;
                console.log('Using first created object as NFT ID:', nftId);
              }
            }
          }
          
          // Also check effects if still no ID
          if (!nftId && txDetails.effects?.created) {
            const created = txDetails.effects.created.find(
              (obj) => obj.owner?.AddressOwner === currentAccount.address
            );
            if (created) {
              nftId = created.reference.objectId;
              console.log('Found NFT ID from effects:', nftId);
            }
          }
        } catch (queryError) {
          console.error('Error querying transaction:', queryError);
        }
      }
      
      if (!nftId) {
        console.error('No NFT ID found after querying transaction');
        throw new Error('Failed to get NFT ID from transaction');
      }
      
      updateState({
        nftId: nftId,
        transactionDigest: result.digest,
        loading: false,
      });
      
      console.log('NFT minted successfully, ID:', nftId);
      
      return { success: true };
    } catch (error) {
      updateState({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  createAccessCap: async (state, updateState, config) => {
    try {
      console.log('createAccessCap called with state:', state);
      updateState({ loading: true, error: null });
      
      const client = window.suiClient;
      const signAndExecute = window.signAndExecute;
      const config = window.config;
      const currentAccount = window.currentAccount;
      
      if (!state.nftId) {
        console.error('No NFT ID found in state');
        throw new Error('NFT ID is required to create AccessCap');
      }
      
      console.log('Calling createAccessCap with NFT ID:', state.nftId);
      const result = await createAccessCap(state.nftId);
      console.log('createAccessCap result:', result);
      
      // Extract the created AccessCap ID from object changes
      let accessCapId = null;
      
      // First try object changes (if available)
      if (result.objectChanges && result.objectChanges.length > 0) {
        const createdCap = result.objectChanges.find(
          (change) => change.type === 'created' && 
          change.objectType?.includes('::access::AccessCap')
        );
        if (createdCap) {
          accessCapId = createdCap.objectId;
          console.log('Found AccessCap ID from object changes:', accessCapId);
        }
      }
      
      // If no AccessCap ID yet, query the transaction for details
      if (!accessCapId && result.digest) {
        console.log('Querying transaction for created AccessCap...');
        try {
          // Wait a moment for the transaction to be indexed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get transaction details from the chain
          const txDetails = await client.getTransactionBlock({
            digest: result.digest,
            options: {
              showEffects: true,
              showObjectChanges: true,
            }
          });
          
          console.log('AccessCap transaction details:', txDetails);
          
          // Check object changes in the full transaction
          if (txDetails.objectChanges) {
            const createdCap = txDetails.objectChanges.find(
              (change) => {
                return change.type === 'created' && 
                       change.objectType && 
                       (change.objectType.includes('::access::AccessCap') || 
                        change.objectType.includes('::AccessCap'));
              }
            );
            
            if (createdCap) {
              accessCapId = createdCap.objectId;
              console.log('Found AccessCap ID from transaction query:', accessCapId);
            } else {
              // If no specific AccessCap type found, take the first created object owned by the user
              const anyCreated = txDetails.objectChanges.find(
                (change) => change.type === 'created' && 
                           change.owner?.AddressOwner === currentAccount.address
              );
              if (anyCreated) {
                accessCapId = anyCreated.objectId;
                console.log('Using first created object as AccessCap ID:', accessCapId);
              }
            }
          }
          
          // Also check effects if still no ID
          if (!accessCapId && txDetails.effects?.created) {
            const created = txDetails.effects.created.find(
              (obj) => obj.owner?.AddressOwner === currentAccount.address
            );
            if (created) {
              accessCapId = created.reference.objectId;
              console.log('Found AccessCap ID from effects:', accessCapId);
            }
          }
        } catch (queryError) {
          console.error('Error querying AccessCap transaction:', queryError);
        }
      }
      
      if (!accessCapId) {
        console.error('No AccessCap ID found after querying transaction');
        throw new Error('Failed to get AccessCap ID from transaction');
      }
      
      updateState({
        accessCapId: accessCapId,
        transactionDigest: result.digest,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error in createAccessCap:', error);
      updateState({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  grantSelfAccess: async (state, updateState, config) => {
    try {
      console.log('grantSelfAccess called with state:', state);
      console.log('NFT ID:', state.nftId);
      console.log('Access Cap ID:', state.accessCapId);
      console.log('Wallet Address:', state.walletAddress);
      
      updateState({ loading: true, error: null });
      
      // Check required fields
      if (!state.nftId) {
        throw new Error('NFT ID is required for granting access');
      }
      if (!state.walletAddress) {
        throw new Error('Wallet address is required for granting access');
      }
      if (!state.accessCapId) {
        throw new Error('Access Capability ID is required for granting access. Please create AccessCap first.');
      }
      
      // Build parameters for grantAccess
      const params = {
        nftId: state.nftId,
        userAddress: state.walletAddress,
        accessLevel: 6, // Full access
        accessCapId: state.accessCapId,
      };
      
      console.log('Using accessCapId:', state.accessCapId);
      
      console.log('Calling grantAccessToUser with params:', params);
      const result = await grantAccessToUser(params);
      console.log('grantAccessToUser result:', result);
      
      updateState({
        transactionDigest: result.digest,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error in grantSelfAccess:', error);
      updateState({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  verifyAccess: async (state, updateState, config) => {
    try {
      updateState({ loading: true, error: null });
      
      const accessLevel = await checkUserAccess(state.nftId, state.walletAddress);
      
      updateState({
        accessLevel,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      updateState({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  initializeSeal: async (state, updateState, config) => {
    try {
      updateState({ loading: true, error: null });
      
      const client = window.suiClient;
      const finalConfig = config || window.config;
      
      const sealClient = initializeSealClient(client);
      
      // Just initialize the seal client, session key will be created in next step
      updateState({
        sealClient,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      updateState({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  createSessionKey: async (state, updateState, config) => {
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
        ttlMin: 30
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
  },

  selectFile: async (state, updateState, config) => {
    // This will be handled by the UI component
    return { success: true };
  },

  encryptFile: async (state, updateState, config) => {
    try {
      console.log('encryptFile called with config:', !!config);
      updateState({ loading: true, error: null });
      
      if (!state.selectedFile) {
        throw new Error('No file selected');
      }
      
      if (!state.sealClient) {
        throw new Error('Seal client not initialized');
      }
      
      if (!state.sessionKeyObject) {
        throw new Error('Session key not available or not signed');
      }

      console.log('Starting file encryption...');
      const fileData = await state.selectedFile.arrayBuffer();
      console.log('File data length:', fileData.byteLength);
      
      const encryptedData = await encryptDataWithSeal(
        state.sealClient,
        new Uint8Array(fileData),
        state.sessionKeyObject,
        config
      );
      
      console.log('Encryption completed, encrypted data:', !!encryptedData);
      
      updateState({
        encryptedData,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      updateState({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  storeFile: async (state, updateState, config) => {
    try {
      console.log('storeFile called with config:', !!config);
      updateState({ loading: true, error: null });
      
      if (!state.encryptedData) {
        throw new Error('No encrypted data to store');
      }
      
      if (!state.selectedFile) {
        throw new Error('No file information available');
      }
      
      console.log('Preparing metadata for Walrus storage...');
      const metadata = {
        nftId: state.nftId,
        fileName: state.selectedFile.name,
        fileType: state.selectedFile.type,
        encryptedAt: new Date().toISOString(),
      };

      console.log('Creating blob for storage...');
      const blob = new Blob([JSON.stringify({
        encryptedData: Array.from(state.encryptedData),
        metadata,
      })], { type: 'application/json' });
      
      console.log('Blob size:', blob.size, 'bytes');

      console.log('Uploading to Walrus...');
      const blobId = await uploadToWalrus(blob);
      console.log('Walrus upload result - blob ID:', blobId);
      
      // Create the URL from the blob ID (same pattern as storeToWalrus)
      const finalConfig = config || window.config || {};
      const aggregatorUrl = finalConfig.WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space';
      const walrusUrl = `${aggregatorUrl}/v1/${blobId}`;
      
      updateState({
        walrusUrl: walrusUrl,
        walrusBlobId: blobId,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      updateState({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },
};