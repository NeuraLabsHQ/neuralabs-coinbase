import { read, batchRead } from '../core/read.js';
import { execute, estimateTransaction } from '../core/execute.js';
import blockchainConfig from '../../config/blockchain-config.json';
import { ethers } from 'ethers';

const CONTRACT_NAME = 'NFTContract';
const config = blockchainConfig.contracts[CONTRACT_NAME];

/**
 * NFTContract interaction functions
 */
export const nftContract = {
  // Contract address and ABI
  address: config.address,
  abi: config.abi,

  // Lock Status Enum
  LockStatus: {
    Unlocked: 0,
    Locked: 1,
    UnlockRequested: 2,
    CanBeUnlocked: 3
  },

  // Read Functions

  /**
   * Get NFT information
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<Object>} NFT information
   */
  async getNFTInfo({ tokenId, provider }) {
    const info = await read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'getNFTInfo',
      args: [tokenId],
      provider
    });

    return {
      name: info.name,
      owner: info.owner,
      levelOfOwnership: parseInt(info.levelOfOwnership),
      exists: info.exists
    };
  },

  /**
   * Get lock status of an NFT
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<number>} Lock status
   */
  async getLockStatus({ tokenId, provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'getLockStatus',
      args: [tokenId],
      provider
    });
  },

  /**
   * Get balance of NFTs for an address
   * @param {Object} params
   * @param {string} params.owner - Owner address
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<string>} Number of NFTs owned
   */
  async balanceOf({ owner, provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'balanceOf',
      args: [owner],
      provider
    });
  },

  /**
   * Get owner of an NFT
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<string>} Owner address
   */
  async ownerOf({ tokenId, provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'ownerOf',
      args: [tokenId],
      provider
    });
  },

  /**
   * Get total supply of NFTs
   * @param {Object} params
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<string>} Total supply
   */
  async totalSupply({ provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'totalSupply',
      args: [],
      provider
    });
  },

  /**
   * Check if an address is approved for an NFT
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<string>} Approved address
   */
  async getApproved({ tokenId, provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'getApproved',
      args: [tokenId],
      provider
    });
  },

  /**
   * Check if an operator is approved for all NFTs of an owner
   * @param {Object} params
   * @param {string} params.owner - Owner address
   * @param {string} params.operator - Operator address
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<boolean>} Approval status
   */
  async isApprovedForAll({ owner, operator, provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'isApprovedForAll',
      args: [owner, operator],
      provider
    });
  },

  /**
   * Get comprehensive NFT data
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<Object>} Comprehensive NFT data
   */
  async getComprehensiveNFTData({ tokenId, provider }) {
    const calls = [
      { methodName: 'getNFTInfo', args: [tokenId] },
      { methodName: 'getLockStatus', args: [tokenId] },
      { methodName: 'getApproved', args: [tokenId] }
    ];

    const results = await batchRead({
      contractAddress: this.address,
      abi: this.abi,
      calls,
      provider
    });

    return {
      info: results.getNFTInfo,
      lockStatus: results.getLockStatus,
      approved: results.getApproved
    };
  },

  // Write Functions

  /**
   * Create a new NFT
   * @param {Object} params
   * @param {string} params.name - NFT name
   * @param {number} params.levelOfOwnership - Ownership level (1-10)
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result with NFT ID
   */
  async createNFT({ name, levelOfOwnership, signer }) {
    const result = await execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'createNFT',
      args: [name, levelOfOwnership],
      signer
    });

    // Extract NFT ID from events
    const nftCreatedEvent = result.events.find(e => e.name === 'NFTCreated');
    if (nftCreatedEvent) {
      result.nftId = nftCreatedEvent.args.tokenId;
    }

    return result;
  },

  /**
   * Burn an NFT
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async burnNFT({ tokenId, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'burnNFT',
      args: [tokenId],
      signer
    });
  },

  /**
   * Transfer NFT to another address
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {string} params.to - Recipient address
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async transferNFT({ tokenId, to, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'transferNFT',
      args: [tokenId, to],
      signer
    });
  },

  /**
   * Safe transfer NFT with data
   * @param {Object} params
   * @param {string} params.from - From address
   * @param {string} params.to - To address
   * @param {string|number} params.tokenId - NFT token ID
   * @param {string} params.data - Additional data (optional)
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async safeTransferFrom({ from, to, tokenId, data = '0x', signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'safeTransferFrom',
      args: data === '0x' ? [from, to, tokenId] : [from, to, tokenId, data],
      signer
    });
  },

  /**
   * Approve an address to transfer an NFT
   * @param {Object} params
   * @param {string} params.to - Address to approve
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async approve({ to, tokenId, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'approve',
      args: [to, tokenId],
      signer
    });
  },

  /**
   * Set approval for all NFTs
   * @param {Object} params
   * @param {string} params.operator - Operator address
   * @param {boolean} params.approved - Approval status
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async setApprovalForAll({ operator, approved, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'setApprovalForAll',
      args: [operator, approved],
      signer
    });
  },

  // Lock Management Functions

  /**
   * Lock an NFT
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async lockNFT({ tokenId, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'lockNFT',
      args: [tokenId],
      signer
    });
  },

  /**
   * Start unlocking process for an NFT
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async startUnlocking({ tokenId, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'startUnlocking',
      args: [tokenId],
      signer
    });
  },

  /**
   * Mark NFT as ready to be unlocked
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async markCanBeUnlocked({ tokenId, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'markCanBeUnlocked',
      args: [tokenId],
      signer
    });
  },

  /**
   * Complete unlock process
   * @param {Object} params
   * @param {string|number} params.tokenId - NFT token ID
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async unlockNFT({ tokenId, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'unlockNFT',
      args: [tokenId],
      signer
    });
  },

  // Utility Functions

  /**
   * Estimate gas for creating an NFT
   * @param {Object} params
   * @param {string} params.name - NFT name
   * @param {number} params.levelOfOwnership - Ownership level
   * @param {Object} params.provider - Ethers provider
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Gas estimation
   */
  async estimateCreateNFT({ name, levelOfOwnership, provider, signer }) {
    return estimateTransaction({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'createNFT',
      args: [name, levelOfOwnership],
      provider,
      signer
    });
  },

  /**
   * Get NFT events
   * @param {Object} params
   * @param {string} params.eventName - Event name (NFTCreated, NFTBurned, Transfer, etc.)
   * @param {Object} params.filters - Event filters
   * @param {Object} params.provider - Ethers provider
   * @param {number} params.fromBlock - Starting block
   * @param {number} params.toBlock - Ending block
   * @returns {Promise<Array>} Array of events
   */
  async getEvents({ eventName, filters = {}, provider, fromBlock = 0, toBlock = 'latest' }) {
    const contract = new ethers.Contract(this.address, this.abi, provider);
    const eventFilter = contract.filters[eventName](...Object.values(filters));
    
    const events = await contract.queryFilter(eventFilter, fromBlock, toBlock);
    
    return events.map(event => ({
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      args: Object.fromEntries(
        Object.entries(event.args).filter(([key]) => isNaN(key))
      )
    }));
  },

  /**
   * Get all NFTs owned by an address
   * @param {Object} params
   * @param {string} params.owner - Owner address
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<Array>} Array of NFT IDs and info
   */
  async getNFTsByOwner({ owner, provider }) {
    // Get Transfer events where the owner is the recipient
    const transferEvents = await this.getEvents({
      eventName: 'Transfer',
      filters: { to: owner },
      provider
    });

    // Get unique token IDs
    const tokenIds = [...new Set(transferEvents.map(e => e.args.tokenId))];
    
    // Filter out tokens that may have been transferred away
    const ownedTokens = [];
    for (const tokenId of tokenIds) {
      const currentOwner = await this.ownerOf({ tokenId, provider });
      if (currentOwner.toLowerCase() === owner.toLowerCase()) {
        const info = await this.getNFTInfo({ tokenId, provider });
        ownedTokens.push({ tokenId, ...info });
      }
    }

    return ownedTokens;
  }
};

// Helper functions for UI formatting
export function formatNFTInfo(nftInfo) {
  return {
    ...nftInfo,
    ownerShort: `${nftInfo.owner.slice(0, 6)}...${nftInfo.owner.slice(-4)}`,
    ownershipLevel: `Level ${nftInfo.levelOfOwnership}/10`
  };
}

export function getLockStatusText(lockStatus) {
  const statusMap = {
    0: 'Unlocked',
    1: 'Locked',
    2: 'Unlock Requested',
    3: 'Ready to Unlock'
  };
  return statusMap[lockStatus] || 'Unknown';
}