import { mintNFT } from '../../../../../../utils/blockchain';

export const mintNFTAction = async (state, updateState, config) => {
  try {

    updateState({ loading: true, error: null });
    
    // Validate required state
    if (!state.nftName || !state.nftDescription) {
      const missingFields = [];
      if (!state.nftName) missingFields.push('nftName');
      if (!state.nftDescription) missingFields.push('nftDescription');
      
      console.error('Missing required fields for NFT mint:', missingFields);
      console.error('Current state:', state);
      
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    const client = window.suiClient;
    const signAndExecute = window.signAndExecute;
    const currentAccount = window.currentAccount;
    
    console.log('=== ATTEMPTING NFT MINT ===');
    console.log('Minting NFT with params:', {
      name: state.nftName,
      description: state.nftDescription,
    });
    
    const result = await mintNFT(client, config, currentAccount, signAndExecute, {
      name: state.nftName,
      description: state.nftDescription,
      url: 'https://neuralabs.org/placeholder.png',
    });
    
    // Log essential transaction result info
    console.log('=== MINT NFT TRANSACTION RESULT ===');
    console.log('Digest:', result.digest);
    console.log('Effects status:', result.effects?.status);
    
    // Check if transaction actually succeeded
    // If we have a digest, the transaction was submitted successfully
    // SUI transaction results can have different status structures
    const txStatus = result.effects?.status?.status || result.effects?.status || result.status;
    const hasError = result.effects?.status?.error;
    
    // Consider successful if we have a digest and no explicit error
    const isSuccess = result.digest && !hasError;
    
    if (!isSuccess) {
      console.error('Transaction did not succeed!');
      console.error('Error in effects:', hasError);
      throw new Error(`Transaction failed: ${hasError || txStatus || 'No digest returned'}`);
    }
    
    console.log('Transaction successful! Digest:', result.digest);
    
    // Extract NFT ID from transaction
    let nftId = null;
    
    // First try object changes (if available)
    if (result.objectChanges && result.objectChanges.length > 0) {
      const createdNFT = result.objectChanges.find(
        (change) => change.type === 'created'
      );
      if (createdNFT) {
        nftId = createdNFT.objectId;
      }
    }
    
    // If no NFT ID yet, query the transaction for details
    if (!nftId && result.digest) {
      try {
        // Wait a moment for the transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get transaction details from the chain
        const txDetails = await client.getTransactionBlock({
          digest: result.digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
          }
        });
        
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
          } else {
            // If no NFT type found, take the first created object owned by the user
            const anyCreated = txDetails.objectChanges.find(
              (change) => change.type === 'created' && 
                         change.owner?.AddressOwner === currentAccount.address
            );
            if (anyCreated) {
              nftId = anyCreated.objectId;
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
          }
        }
      } catch (queryError) {
        console.error('Error querying transaction:', queryError);
      }
    }
    
    if (!nftId) {
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
    console.error('=== NFT MINT TRANSACTION FAILED ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Mint parameters:', {
      name: state.nftName,
      nameLength: state.nftName?.length,
      description: state.nftDescription,
      descriptionLength: state.nftDescription?.length,
      url: 'https://neuralabs.ai/placeholder.png'
    });
    console.error('Account:', window.currentAccount?.address);
    console.error('Config:', config);
    
    // Check if it's a specific transaction error
    if (error.message?.includes('Transaction failed')) {
      console.error('Transaction failure details:', error.details || 'No details available');
    }
    
    updateState({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
};