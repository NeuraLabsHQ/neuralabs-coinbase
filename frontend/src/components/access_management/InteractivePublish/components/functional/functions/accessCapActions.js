import { createAccessCap, grantAccessToUser, checkUserAccess } from '../../../../../../utils/blockchain';
import { executeTransactionWithRetry } from '../../../functions/objectRefresh';

export const createAccessCapAction = async (state, updateState, config) => {
  try {
    console.log('createAccessCap called with state:', state);
    updateState({ loading: true, error: null });
    
    const client = window.suiClient;
    const signAndExecute = window.signAndExecute;
    const currentAccount = window.currentAccount;
    
    if (!state.nftId) {
      console.error('No NFT ID found in state');
      throw new Error('NFT ID is required to create AccessCap');
    }
    
    // Add a delay to ensure the NFT object is fully propagated
    console.log('Waiting for NFT to be fully propagated...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Calling createAccessCap with NFT ID:', state.nftId);
    
    // Use retry logic to handle version conflicts
    const result = await executeTransactionWithRetry(async () => {
      return await createAccessCap(state.nftId);
    }, 5); // Increase retries to 5
    
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
};

export const grantSelfAccess = async (state, updateState, config) => {
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
    
    // Add delay and retry logic for grant access as well
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = await executeTransactionWithRetry(async () => {
      return await grantAccessToUser(params);
    });
    
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
};

export const verifyAccess = async (state, updateState, config) => {
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
};