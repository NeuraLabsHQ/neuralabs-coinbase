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
    
    try {
      // Get allowlisted key servers for the network
      const allowlistedServers = getAllowlistedKeyServers(network);
      console.log('Allowlisted servers:', allowlistedServers);
      
      if (!allowlistedServers || !Array.isArray(allowlistedServers)) {
        console.error('getAllowlistedKeyServers returned invalid result:', allowlistedServers);
        throw new Error('Failed to get allowlisted key servers');
      }
      
      // Convert server IDs to KeyServerConfig format
      const serverConfigs = allowlistedServers.map(
        objectId => ({
          objectId,
          weight: 1
        })
      );
      
      sealClientInstance = new SealClient({
        suiClient: config.suiClient,
        serverConfigs: serverConfigs,
        verifyKeyServers: config.verifyKeyServers ?? false,
      });
    } catch (error) {
      console.error('Error creating Seal client:', error);
      throw error;
    }
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
  ttlMin: number = 10,
  suiClient: SuiClient
): Promise<SessionKeyResult> {
  try {
    const sessionKey = new SessionKey({
      address: address,
      packageId: packageId,
      ttlMin: ttlMin,
      suiClient: suiClient,
    });
    
    const message = sessionKey.getPersonalMessage();
    
    const { signature } = await signPersonalMessage({
      message,
    });
    
    await sessionKey.setPersonalMessageSignature(signature);
    
    const exported = JSON.stringify(sessionKey.export());
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
  suiClient: SuiClient,
  signer?: any
): Promise<SessionKey> {
  try {
    const sessionKey = SessionKey.import(JSON.parse(exported), suiClient, signer);
    
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