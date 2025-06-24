// Agent Wallet API Service
import { makeAuthenticatedRequest } from '../components/auth/WalletSignatureService';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Get or create agent wallet for the authenticated user
 * @returns {Promise<Object>} Agent wallet data
 */
export const getOrCreateAgentWallet = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/neuralock-temp/agent-wallet`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to get agent wallet: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting/creating agent wallet:', error);
    throw error;
  }
};

/**
 * Get agent wallet details
 * @returns {Promise<Object>} Agent wallet details
 */
export const getAgentWalletDetails = async () => {
  try {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/neuralock-temp/agent-wallet/details`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to get agent wallet details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting agent wallet details:', error);
    throw error;
  }
};

/**
 * Get agent wallet balance (ETH and USDC)
 * @param {string} agentAddress - Agent wallet address
 * @param {Object} publicClient - Viem public client
 * @returns {Promise<Object>} Balance data
 */
export const getAgentBalance = async (agentAddress, publicClient) => {
  try {
    if (!publicClient) {
      throw new Error('Public client not initialized');
    }
    
    // Get ETH balance
    const ethBalance = await publicClient.getBalance({
      address: agentAddress,
    });

    // USDC contract address on Base Sepolia
    const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    
    // USDC ABI for balanceOf
    const USDC_ABI = [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
      },
    ];

    // Get USDC balance
    const usdcBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [agentAddress],
    });

    return {
      eth: ethBalance,
      usdc: usdcBalance,
    };
  } catch (error) {
    console.error('Error getting agent balance:', error);
    throw error;
  }
};

/**
 * Transfer USDC from user to agent wallet
 * @param {Object} params - Transfer parameters
 * @param {string} params.agentAddress - Agent wallet address
 * @param {string} params.amount - Amount in USDC (human readable, e.g., "10" for 10 USDC)
 * @param {Object} params.walletClient - Viem wallet client
 * @returns {Promise<string>} Transaction hash
 */
export const transferUsdcToAgent = async ({ agentAddress, amount, walletClient }) => {
  try {
    // USDC contract address on Base Sepolia
    const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    
    // USDC has 6 decimals
    const USDC_DECIMALS = 6;
    
    // Convert human readable amount to contract amount
    const amountInUnits = BigInt(Math.floor(parseFloat(amount) * 10 ** USDC_DECIMALS));
    
    // USDC ABI for transfer
    const USDC_ABI = [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
    ];

    // Execute transfer
    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [agentAddress, amountInUnits],
    });

    return hash;
  } catch (error) {
    console.error('Error transferring USDC to agent:', error);
    throw error;
  }
};

/**
 * Format balance for display
 * @param {BigInt} balance - Balance in wei/units
 * @param {number} decimals - Token decimals
 * @returns {string} Formatted balance
 */
export const formatBalance = (balance, decimals = 18) => {
  const divisor = BigInt(10 ** decimals);
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;
  
  // Convert to string with proper decimal places
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const significantDecimals = decimals === 18 ? 4 : 2; // Show 4 decimals for ETH, 2 for USDC
  
  return `${wholePart}.${fractionalStr.slice(0, significantDecimals)}`;
};