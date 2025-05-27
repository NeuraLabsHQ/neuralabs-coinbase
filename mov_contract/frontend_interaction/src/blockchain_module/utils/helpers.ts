// Utility helper functions

import { SuiObjectResponse } from '@mysten/sui/client';
import { NFT_CONSTANTS } from './constants';

export function getObjectFields(object: SuiObjectResponse): any {
  if (object.data && 'content' in object.data && object.data.content && 'fields' in object.data.content) {
    return object.data.content.fields;
  }
  return null;
}

export function formatSuiAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export function getNFTType(packageAddress: string, typeName: string): string {
  return `${packageAddress}::${NFT_CONSTANTS.TYPE_PREFIX}${typeName}`;
}

export function parseError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isTransactionSuccessful(result: any): boolean {
  return result?.effects?.status?.status === 'success';
}