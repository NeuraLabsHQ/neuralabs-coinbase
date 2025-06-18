import { read, batchRead } from '../core/read.js';
import { execute, estimateTransaction } from '../core/execute.js';
import blockchainConfig from '../../config/blockchain-config.json';

const CONTRACT_NAME = 'MasterAccessControl';
const config = blockchainConfig.contracts[CONTRACT_NAME];

/**
 * MasterAccessControl contract interaction functions
 */
export const masterAccessControl = {
  // Contract address and ABI
  address: config.address,
  abi: config.abi,

  // Read Functions
  
  /**
   * Check if a caller has access to interact with a specific contract
   * @param {Object} params
   * @param {string} params.contract - Contract address to check
   * @param {string} params.caller - Caller address to check
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<boolean>} Whether the caller has access
   */
  async hasAccess({ contract, caller, provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'hasAccess',
      args: [contract, caller],
      provider
    });
  },

  /**
   * Allow contracts to check if an address has access to them
   * @param {Object} params
   * @param {string} params.addressToCheck - Address to check
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<boolean>} Whether the address has access
   */
  async selfCheckAccess({ addressToCheck, provider }) {
    return read({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'selfCheckAccess',
      args: [addressToCheck],
      provider
    });
  },

  /**
   * Batch check multiple access permissions
   * @param {Object} params
   * @param {Array} params.checks - Array of {contract, caller} objects
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<Object>} Object with check results
   */
  async batchCheckAccess({ checks, provider }) {
    const calls = checks.map(({ contract, caller }) => ({
      methodName: 'hasAccess',
      args: [contract, caller]
    }));

    const results = await batchRead({
      contractAddress: this.address,
      abi: this.abi,
      calls,
      provider
    });

    // Format results with original check data
    const formattedResults = {};
    checks.forEach((check, index) => {
      const key = `${check.contract}_${check.caller}`;
      formattedResults[key] = results[`hasAccess`]; // Note: batchRead might return indexed results
    });

    return formattedResults;
  },

  // Write Functions

  /**
   * Grant access to a caller for a specific contract
   * @param {Object} params
   * @param {string} params.contract - Contract address
   * @param {string} params.caller - Caller address to grant access
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async grantAccess({ contract, caller, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'grantAccess',
      args: [contract, caller],
      signer
    });
  },

  /**
   * Revoke access from a caller for a specific contract
   * @param {Object} params
   * @param {string} params.contract - Contract address
   * @param {string} params.caller - Caller address to revoke access
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async revokeAccess({ contract, caller, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'revokeAccess',
      args: [contract, caller],
      signer
    });
  },

  /**
   * Allow contract to grant access to an address for itself
   * @param {Object} params
   * @param {string} params.addressToGrant - Address to grant access to
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async grantSelfAccess({ addressToGrant, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'grantSelfAccess',
      args: [addressToGrant],
      signer
    });
  },

  /**
   * Allow contract to revoke access from an address for itself
   * @param {Object} params
   * @param {string} params.addressToRevoke - Address to revoke access from
   * @param {Object} params.signer - Ethers signer
   * @returns {Promise<Object>} Transaction result
   */
  async revokeSelfAccess({ addressToRevoke, signer }) {
    return execute({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'revokeSelfAccess',
      args: [addressToRevoke],
      signer
    });
  },

  // Utility Functions

  /**
   * Estimate gas for granting access
   * @param {Object} params
   * @param {string} params.contract - Contract address
   * @param {string} params.caller - Caller address
   * @param {Object} params.provider - Ethers provider
   * @param {Object} params.signer - Ethers signer (optional)
   * @returns {Promise<Object>} Gas estimation details
   */
  async estimateGrantAccess({ contract, caller, provider, signer }) {
    return estimateTransaction({
      contractAddress: this.address,
      abi: this.abi,
      methodName: 'grantAccess',
      args: [contract, caller],
      provider,
      signer
    });
  },

  /**
   * Get all events for a specific filter
   * @param {Object} params
   * @param {string} params.eventName - Event name to filter (AccessGranted, AccessRevoked)
   * @param {Object} params.filters - Event filters (contract, caller)
   * @param {Object} params.provider - Ethers provider
   * @param {number} params.fromBlock - Starting block (optional)
   * @param {number} params.toBlock - Ending block (optional)
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
   * Check if current user is authorized to manage access
   * @param {Object} params
   * @param {string} params.userAddress - User address to check
   * @param {Object} params.provider - Ethers provider
   * @returns {Promise<boolean>} Whether user is authorized
   */
  async isAuthorized({ userAddress, provider }) {
    // User is authorized if they have access to the MasterAccessControl contract itself
    return this.hasAccess({
      contract: this.address,
      caller: userAddress,
      provider
    });
  }
};

// Helper function to format access data for UI
export function formatAccessData(contract, caller, hasAccess) {
  return {
    contract,
    caller,
    hasAccess,
    contractShort: `${contract.slice(0, 6)}...${contract.slice(-4)}`,
    callerShort: `${caller.slice(0, 6)}...${caller.slice(-4)}`
  };
}