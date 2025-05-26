// Wallet connection module for SUI blockchain

import { WalletState } from '../types';
import { ERROR_MESSAGES } from '../utils/constants';

export class WalletConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export function checkWalletConnection(currentWallet: any): void {
  if (!currentWallet?.isConnected) {
    throw new WalletConnectionError(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
  }
}

export function getWalletAddress(currentWallet: any): string {
  checkWalletConnection(currentWallet);
  
  if (!currentWallet.accounts || currentWallet.accounts.length === 0) {
    throw new WalletConnectionError('No wallet accounts found');
  }
  
  return currentWallet.accounts[0].address;
}

export function getWalletState(currentWallet: any): WalletState {
  if (!currentWallet) {
    return { isConnected: false };
  }
  
  const isConnected = currentWallet.isConnected ?? false;
  const address = isConnected && currentWallet.accounts?.[0]?.address;
  
  return {
    isConnected,
    address: address || undefined,
  };
}

export async function ensureWalletBalance(
  client: any,
  address: string,
  requiredAmount: bigint
): Promise<void> {
  const balance = await client.getBalance({
    owner: address,
    coinType: '0x2::sui::SUI',
  });
  
  const totalBalance = BigInt(balance.totalBalance);
  
  if (totalBalance < requiredAmount) {
    throw new WalletConnectionError(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
  }
}