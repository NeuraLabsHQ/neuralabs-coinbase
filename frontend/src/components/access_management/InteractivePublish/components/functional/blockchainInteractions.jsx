// Import individual functions from their respective files
import { connectWallet } from './functions/connectWallet';
import { checkBalances } from './functions/checkBalances';
import { mintNFTAction } from './functions/mintNFT';
import { createAccessCapAction, grantSelfAccess, verifyAccess } from './functions/accessCapActions';
import { initializeSeal, createSessionKey } from './functions/sealActions';
import { selectFile, encryptFile, storeFile } from './functions/fileActions';

// Export all functions as journeyActions object
export const journeyActions = {
  connectWallet,
  checkBalances,
  mintNFT: mintNFTAction,
  createAccessCap: createAccessCapAction,
  grantSelfAccess,
  verifyAccess,
  initializeSeal,
  createSessionKey,
  selectFile,
  encryptFile,
  storeFile,
};