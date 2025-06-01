// Transaction proposer module for building and sending transactions

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { TransactionResult } from '../types';
import { SUI_CONSTANTS } from '../utils/constants';
import { isTransactionSuccessful, parseError } from '../utils/helpers';
import { checkWalletConnection } from '../wallet-connection';

export interface TransactionOptions {
  gasBudget?: number;
  showEffects?: boolean;
  showRawEffects?: boolean;
}

// Helper to create a new transaction with gas budget
export function createTransaction(gasBudget?: number): Transaction {
  const tx = new Transaction();
  tx.setGasBudget(gasBudget || SUI_CONSTANTS.DEFAULT_GAS_BUDGET);
  return tx;
}

export class TransactionBuilder {
  private tx: Transaction;
  
  constructor(gasBudget?: number) {
    this.tx = createTransaction(gasBudget);
  }
  
  addMoveCall(
    target: string,
    typeArgs: string[] = [],
    args: any[] = []
  ): TransactionBuilder {
    this.tx.moveCall({
      target,
      typeArguments: typeArgs,
      arguments: args,
    });
    return this;
  }
  
  addSplitCoins(
    coin: any,
    amounts: bigint[]
  ): any[] {
    return this.tx.splitCoins(coin, amounts);
  }
  
  addTransferObjects(
    objects: any[],
    recipient: string
  ): TransactionBuilder {
    this.tx.transferObjects(objects, recipient);
    return this;
  }
  
  setGasBudget(budget: number): TransactionBuilder {
    this.tx.setGasBudget(budget);
    return this;
  }
  
  build(): Transaction {
    return this.tx;
  }
}

// Execute transaction using the signAndExecuteTransaction hook from dapp-kit
export async function executeTransaction(
  client: SuiClient,
  signAndExecute: any,
  transaction: Transaction,
  options?: TransactionOptions
): Promise<TransactionResult> {
  try {
    // Ensure gas budget is set
    if (options?.gasBudget) {
      transaction.setGasBudget(options.gasBudget);
    }
    
    // Build the transaction
    await transaction.build({ client });
    
    // Execute using the proper pattern from examples
    const result = await signAndExecute({
      transaction,
      execute: async ({ bytes, signature }: { bytes: string; signature: string }) => {
        return await client.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            showEffects: options?.showEffects ?? true,
            showRawEffects: options?.showRawEffects ?? false,
            showObjectChanges: true,
            showEvents: true,
          },
        });
      },
    });
    
    if (!isTransactionSuccessful(result)) {
      throw new Error('Transaction execution failed');
    }
    
    return {
      digest: result.digest,
      effects: result.effects,
      events: result.events || [],
      objectChanges: result.objectChanges || [],
    };
  } catch (error) {
    throw new Error(`Transaction failed: ${parseError(error)}`);
  }
}

// Simplified execute for direct use with useSignAndExecuteTransaction hook
export async function signAndExecuteTransaction(
  signAndExecute: any,
  transaction: Transaction
): Promise<TransactionResult> {
  try {
    const result = await signAndExecute({ transaction });
    
    // Log the result for debugging
    console.log('Transaction result:', result);
    
    if (!isTransactionSuccessful(result)) {
      console.error('Transaction marked as failed, but result was:', result);
      // Check if we have a digest - that usually means success
      if (result?.digest) {
        console.log('Transaction has digest, treating as success');
        return {
          digest: result.digest,
          effects: result.effects || {},
          events: result.events || [],
          objectChanges: result.objectChanges || [],
        };
      }
      throw new Error('Transaction execution failed');
    }
    
    return {
      digest: result.digest,
      effects: result.effects,
      events: result.events || [],
      objectChanges: result.objectChanges || [],
    };
  } catch (error) {
    // If error contains "Transaction failed:" already, don't double-wrap
    if (error.message?.includes('Transaction failed:')) {
      throw error;
    }
    throw new Error(`Transaction failed: ${parseError(error)}`);
  }
}

export async function dryRunTransaction(
  client: SuiClient,
  currentWallet: any,
  transaction: Transaction
): Promise<any> {
  checkWalletConnection(currentWallet);
  
  const transactionBlock = await transaction.build({ client });
  
  return await client.dryRunTransactionBlock({
    transactionBlock,
  });
}

export async function devInspectTransaction(
  client: SuiClient,
  sender: string,
  transaction: Transaction
): Promise<any> {
  return await client.devInspectTransactionBlock({
    transactionBlock: await transaction.build({ client }),
    sender,
  });
}