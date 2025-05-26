// Balance query functionality

import { SuiClient } from '@mysten/sui/client';

export interface CoinBalance {
  coinType: string;
  totalBalance: bigint;
  availableBalance: bigint;
  lockedBalance: bigint;
  coinObjectCount: number;
}

export async function getSuiBalance(
  client: SuiClient,
  address: string
): Promise<CoinBalance> {
  try {
    const balance = await client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI',
    });
    
    return {
      coinType: '0x2::sui::SUI',
      totalBalance: BigInt(balance.totalBalance),
      availableBalance: BigInt(balance.totalBalance), // SUI doesn't have locked balance
      lockedBalance: BigInt(0),
      coinObjectCount: balance.coinObjectCount,
    };
  } catch (error) {
    console.error('Error fetching SUI balance:', error);
    throw new Error('Failed to fetch SUI balance');
  }
}

export async function getWalBalance(
  client: SuiClient,
  address: string,
  walCoinType: string = '0x9f992cc2430a1f442ca7a5ca7638169f5d5c00e0ebc3977a65e9ac6e497fe5ef::wal::WAL'
): Promise<CoinBalance> {
  try {
    const balance = await client.getBalance({
      owner: address,
      coinType: walCoinType,
    });
    
    return {
      coinType: walCoinType,
      totalBalance: BigInt(balance.totalBalance),
      availableBalance: BigInt(balance.totalBalance),
      lockedBalance: BigInt(0),
      coinObjectCount: balance.coinObjectCount,
    };
  } catch (error) {
    console.error('Error fetching WAL balance:', error);
    // Return zero balance if coin type doesn't exist
    return {
      coinType: walCoinType,
      totalBalance: BigInt(0),
      availableBalance: BigInt(0),
      lockedBalance: BigInt(0),
      coinObjectCount: 0,
    };
  }
}

export async function getAllBalances(
  client: SuiClient,
  address: string
): Promise<CoinBalance[]> {
  try {
    const balances = await client.getAllBalances({ owner: address });
    
    return balances.map(balance => ({
      coinType: balance.coinType,
      totalBalance: BigInt(balance.totalBalance),
      availableBalance: BigInt(balance.totalBalance),
      lockedBalance: BigInt(0),
      coinObjectCount: balance.coinObjectCount,
    }));
  } catch (error) {
    console.error('Error fetching all balances:', error);
    return [];
  }
}

export function formatBalance(balance: bigint, decimals: number = 9): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return wholePart.toString();
  }
  
  return `${wholePart}.${trimmedFractional}`;
}