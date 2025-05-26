// Seal client management

import { getAllowlistedKeyServers, SealClient, SessionKey } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';

let sealClientInstance: SealClient | null = null;

export interface SealClientConfig {
  suiClient: SuiClient;
  network?: 'mainnet' | 'testnet';
  verifyKeyServers?: boolean;
}

export function getSealClient(config: SealClientConfig): SealClient {
  if (!sealClientInstance) {
    const network = config.network || 'testnet';
    
    // Get allowlisted key servers for the network
    const serverObjectIds = getAllowlistedKeyServers(network).map(
      id => [id, 1] as [string, number]
    );
    
    sealClientInstance = new SealClient({
      suiClient: config.suiClient,
      serverObjectIds,
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
  exported: string; // Keep as string for JSON storage
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
    // Create a new session key
    const sessionKey = new SessionKey({
      address,
      packageId,
      ttlMin, // Time to live in minutes
    });
    
    // Get the personal message to sign
    const message = sessionKey.getPersonalMessage();
    
    // Sign the message
    const { signature } = await signPersonalMessage({
      message,
    });
    
    // Set the signature on the session key
    await sessionKey.setPersonalMessageSignature(signature);
    
    // Export for persistence
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

// Import an existing session key
export async function importSessionKey(
  exported: string,
  options: { signer?: any; client?: any } = {}
): Promise<SessionKey> {
  try {
    // SessionKey.import needs parsed export and options
    const sessionKey = await SessionKey.import(JSON.parse(exported), options);
    
    // Check if expired
    if (sessionKey.isExpired()) {
      throw new Error('Session key has expired');
    }
    
    return sessionKey;
  } catch (error) {
    console.error('Error importing session key:', error);
    throw new Error('Failed to import session key');
  }
}

// Helper to check if a session key is expired
export function isSessionKeyExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}