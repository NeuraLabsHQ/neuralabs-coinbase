/**
 * x402 Payment Handler
 * Creates wallet client for micropayments following x402-pay pattern
 */
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

/**
 * Create an x402-compatible wallet client from private key
 * Following the exact pattern from x402-pay App.jsx
 * @param {string} privateKey - The agent wallet private key
 * @returns {Object} Wallet client compatible with x402
 */
export const createX402WalletClient = (privateKey) => {
  if (!privateKey) {
    throw new Error('Private key is required to create wallet client');
  }
  
  // Ensure private key has 0x prefix
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  
  // Create account from private key (following x402-axios example)
  const account = privateKeyToAccount(formattedKey);
  console.log('Created account from private key:', account.address);
  
  // Create wallet client with publicActions extension (exactly like the example)
  const walletClient = createWalletClient({
    account,
    transport: http(),
    chain: baseSepolia,
  }).extend(publicActions);
  
  console.log('Created wallet client with publicActions');
  console.log('Client has signTypedData:', typeof walletClient.signTypedData === 'function');
  
  return walletClient;
};