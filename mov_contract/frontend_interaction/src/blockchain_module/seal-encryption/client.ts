// Seal client management

import {getAllowlistedKeyServers ,  SealClient, SessionKey } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';

let sealClientInstance: SealClient | null = null;

export interface SealClientConfig {
  suiClient: SuiClient;
  network?: 'mainnet' | 'testnet';
  verifyKeyServers?: boolean;
}

export function getSealClient(config: SealClientConfig): SealClient {
  if (!sealClientInstance) {
    // Use the fixed testnet key servers from the example
    const network = config.network || 'testnet';
    
    // Get allowlisted key servers for the network
    const serverObjectIds = getAllowlistedKeyServers(network).map(
      id => [id, 1] as [string, number]
    );
    
    
    
    sealClientInstance = new SealClient({
      suiClient: config.suiClient,
      serverObjectIds: serverObjectIds,
      verifyKeyServers: config.verifyKeyServers ?? false,
    });
  }
  
  return sealClientInstance;
}

export function resetSealClient(): void {
  sealClientInstance = null;
}

export interface SessionKeyResult {
  sessionKey: SessionKey;
  exported: string;
  expiresAt: number;
}

// Create a new session key
export async function createSessionKey(
  address: string,
  packageId: string,
  signPersonalMessage: any,
  ttlMin: number = 10
): Promise<SessionKeyResult> {
  try {
    const sessionKey = new SessionKey({
      address: address,
      packageId: packageId,
      ttlMin: ttlMin,
    });
    
    const message = sessionKey.getPersonalMessage();
    
    const { signature } = await signPersonalMessage({
      message,
    });
    
    await sessionKey.setPersonalMessageSignature(signature);
    
    const exported = JSON.stringify(await sessionKey.export());
    const expiresAt = Date.now() + (ttlMin * 60 * 1000);
    
    return {
      sessionKey,
      exported,
      expiresAt,
    };
  } catch (error) {
    console.error('Error creating session key:', error);
    throw new Error('Failed to create session key');
  }
}

export async function importSessionKey(
  exported: string,
  options: { signer?: any; client?: any } = {}
): Promise<SessionKey> {
  try {
    const sessionKey = await SessionKey.import(JSON.parse(exported), options);
    
    if (sessionKey.isExpired()) {
      throw new Error('Session key has expired');
    }
    
    return sessionKey;
  } catch (error) {
    console.error('Error importing session key:', error);
    throw new Error('Failed to import session key');
  }
}

export function isSessionKeyExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}