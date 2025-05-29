// Wallet connection module for SUI blockchain

import { WalletAccount } from '@mysten/wallet-standard';
import { WalletState } from '../types';
import { ERROR_MESSAGES } from '../utils/constants';

export class WalletConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export function checkWalletConnection(currentAccount: WalletAccount | null): void {
  if (!currentAccount || !currentAccount.address) {
    throw new WalletConnectionError(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
  }
}

export function getWalletAddress(currentAccount: WalletAccount | null): string {
  checkWalletConnection(currentAccount);
  return currentAccount!.address;
}

export function getWalletState(currentAccount: WalletAccount | null): WalletState {
  if (!currentAccount) {
    return { isConnected: false };
  }
  
  return {
    isConnected: true,
    address: currentAccount.address,
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