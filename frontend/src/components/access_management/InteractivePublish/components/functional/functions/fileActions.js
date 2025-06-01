import { encryptData, uploadToWalrus } from '../../../../../../utils/blockchain';
import agentAPI from '../../../../../../utils/agent-api';

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
    
    // Create a file-like object from the workflow
    const pseudoFile = {
      name: `${agent.name || 'workflow'}-v${agent.version || '1.0'}.json`,
      type: 'application/json',
      size: blob.size,
      arrayBuffer: async () => blob.arrayBuffer(),
    };
    
    console.log('Workflow file prepared:', pseudoFile.name, 'size:', pseudoFile.size);
    
    updateState({
      selectedFile: pseudoFile,
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
    const fileData = await state.selectedFile.arrayBuffer();
    console.log('File data length:', fileData.byteLength);
    
    const encryptedData = await encryptData(
      state.sealClient,
      new Uint8Array(fileData),
      state.sessionKeyObject
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
};