import { encryptData, uploadToWalrus } from '../../../../../../utils/blockchain';
import {agentAPI} from '../../../../../../utils/agent-api';

import { initializeSealClient } from '../../../../../../utils/blockchain';


export const selectFile = async (state, updateState, config) => {
  try {
    updateState({ loading: true, error: null });
    
    // Get agent ID from state
    const agentId = state.agentId || state.agentData?.id;
    
    if (!agentId) {
      throw new Error('No agent ID available');
    }
    
    console.log('Fetching workflow for agent:', agentId);
    
    // Fetch the agent's workflow from backend
    const agent = await agentAPI.getAgent(agentId);
    
    if (!agent || !agent.workflow) {
      throw new Error('No workflow found for this agent');
    }
    
    // Parse workflow if it's a string
    const workflowData = typeof agent.workflow === 'string' 
      ? JSON.parse(agent.workflow) 
      : agent.workflow;
    
    const workflowJson = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([workflowJson], { type: 'application/json' });
    
    // Convert blob to array buffer immediately
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Create a file object that stores the data directly
    const fileData = {
      name: `${agent.name || 'workflow'}-v${agent.version || '1.0'}.json`,
      type: 'application/json',
      size: blob.size,
      data: Array.from(uint8Array), // Store as array for JSON serialization
    };
    
    console.log('Workflow file prepared:', fileData.name, 'size:', fileData.size);
    
    updateState({
      selectedFile: fileData,
      loading: false,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error selecting workflow:', error);
    updateState({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
};

export const encryptFile = async (state, updateState, config) => {
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
    
    // Convert the stored array back to Uint8Array
    const fileData = new Uint8Array(state.selectedFile.data);
    console.log('File data length:', fileData.length);
    
    // Get config for package ID
    const finalConfig = config || window.config || {};
    
    // Check if we have the required IDs
    if (!finalConfig.PACKAGE_ID) {
      throw new Error('Package ID not configured');
    }
    
    if (!state.nftId) {
      throw new Error('NFT ID not available - please mint NFT first');
    }
    
    console.log('Using Package ID:', finalConfig.PACKAGE_ID);
    console.log('Using NFT ID as Policy ID:', state.nftId);
    
    const client = window.suiClient;

    const sealClient = initializeSealClient(client);
    
    
    // Call encryptData with proper parameters
    // Package ID from config, NFT ID as policy ID
    const encryptResult = await encryptData(
      // state.sealClient,
      sealClient,
      {
        data: fileData,
        packageId: finalConfig.PACKAGE_ID,
        policyId: state.nftId, // Use NFT ID as policy ID
        threshold: 2 // Default threshold
      }
    );
    
    // Extract the encrypted data from the result
    const encryptedData = encryptResult.encryptedData;
    
    console.log('Encryption completed, encrypted data:', !!encryptedData);
    console.log('Encrypted ID:', encryptResult.encryptedId);
    
    updateState({
      encryptedData,
      encryptedId: encryptResult.encryptedId,
      loading: false,
    });
    
    return { success: true };
  } catch (error) {
    updateState({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
};

export const storeFile = async (state, updateState, config) => {
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
    const walrusUrl = `${aggregatorUrl}/v1/blobs/${blobId}`;
    
    updateState({
      walrusUrl: walrusUrl,
      walrusBlobId: blobId,
      loading: false,
    });
    
    return { success: true, walrus_data: {
        walrusUrl: walrusUrl,
        walrusBlobId: blobId,
      } 
    };
  } catch (error) {
    updateState({ error: error.message, loading: false });
    return { success: false, error: error.message };
  }
};