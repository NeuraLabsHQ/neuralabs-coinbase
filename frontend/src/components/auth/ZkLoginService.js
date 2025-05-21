import { 
  generateNonce, 
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
  genAddressSeed,
  getZkLoginSignature
} from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';

// JWT decoder library (you'll need to install this with npm install jwt-decode)
import { jwtDecode } from 'jwt-decode';
/* global BigInt */

class ZkLoginService {
  constructor() {
    // Configuration
    this.clientId = ''; // Your Google OAuth Client ID
    this.redirectUrl = window.location.origin + '/auth/callback';
    this.fullnodeUrl = 'https://fullnode.devnet.sui.io'; // Use devnet for testing
    this.suiClient = new SuiClient({ url: this.fullnodeUrl });
    
    // Storage keys
    this.STORAGE_SUI_SEED_KEY     = 'zklogin_sui_seed_key';
    this.STORAGE_RANDOMNESS       = 'zklogin_randomness';
    this.STORAGE_MAX_EPOCH        = 'zklogin_max_epoch';
    this.STORAGE_SALT             = 'zklogin_user_salt';
    this.STORAGE_PARTIAL_ZK_LOGIN = 'zklogin_partial_signature';
  }

  // Set up client ID for OAuth
  setClientId(clientId) {
    if (!clientId || clientId.includes('YOUR_') || clientId === '') {
      console.error('Invalid Google Client ID provided. Make sure to replace the placeholder with your actual Google OAuth Client ID.');
      return;
    }
    
    this.clientId = clientId;
    console.log('Google Client ID set successfully:', this.clientId);
  }

  // Get the current SUI epoch data
  async getCurrentEpoch() {
    try {
      const { epoch, epochDurationMs, epochStartTimestampMs } = await this.suiClient.getLatestSuiSystemState();
      return {
        epoch: Number(epoch),
        epochDurationMs,
        epochStartTimestampMs
      };
    } catch (error) {
      console.error("Error fetching epoch data:", error);
      throw error;
    }
  }

  // Generate ephemeral key pair and prepare for zkLogin
  async beginLogin() {
    try {
      // Check if client ID is set
      if (!this.clientId || this.clientId.includes('YOUR_') || this.clientId === '') {
        throw new Error('Google Client ID not properly configured. Please set a valid Client ID.');
      }
      
      // Generate or retrieve a keypair
      const ephemeralKeyPair = this._generateNewKeypair();
      const ephemeralPublicKey = ephemeralKeyPair.getPublicKey(); 
      
      // Get current epoch and set max epoch (active for 2 epochs)
      const { epoch } = await this.getCurrentEpoch();
      const maxEpoch = epoch + 2; // max number of blockchain epochs for which the zkLogin is valid
      
      // Store max epoch for later use
      sessionStorage.setItem(this.STORAGE_MAX_EPOCH, maxEpoch.toString());
      
      // Generate randomness for the nonce
      const randomness = generateRandomness();
      sessionStorage.setItem(this.STORAGE_RANDOMNESS, randomness.toString());
      
      // Generate nonce using the ephemeral public key, max epoch, and randomness
      const nonce = generateNonce(ephemeralPublicKey, maxEpoch.toString(), randomness.toString());



      
      // Construct the Google OAuth URL
      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUrl,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: nonce
      });
      
      const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      return {
        loginUrl,
        ephemeralPublicKey: ephemeralPublicKey.toBase64(),
        maxEpoch,
        randomness: randomness.toString()
      };
    } catch (error) {
      console.error("Error beginning zkLogin flow:", error);
      throw error;
    }
  }

  // Complete the zkLogin process after OAuth redirect
  async completeLogin(jwt) {
    try {
      // Decode the JWT
      const decodedJwt = jwtDecode(jwt);
      

      const userSalt = this._generateSalt();
      sessionStorage.setItem(this.STORAGE_SALT, userSalt);


      // Get user salt (either from storage or generate a new one)
      // const userSalt = sessionStorage.getItem(this.STORAGE_SALT);
      // if (!userSalt) {
      //   // raise an error if the salt is not found
      //   throw new Error('User salt not found in local storage. Please initiate the login process again.');
      // }
      
      // Derive the zkLogin address
      const zkLoginAddress = jwtToAddress(jwt, userSalt);
      
      // Get the extended ephemeral public key for ZK proof
      const ephemeralKeyPair = this._retrieveKeypair();
      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());

      

      // Get randomness and max epoch from session storage
      const randomness  = sessionStorage.getItem(this.STORAGE_RANDOMNESS);
      const maxEpoch    = sessionStorage.getItem(this.STORAGE_MAX_EPOCH);

      const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch.toString(), randomness);

      // Request ZK proof from the prover service
      const zkProof = await this._getZkProof({
        jwt,
        extendedEphemeralPublicKey,
        maxEpoch,
        jwtRandomness: randomness,
        salt: userSalt,
        keyClaimName: 'sub' // For Google, the claim with the user ID is 'sub'
      });
      
      // Store partial zkLogin signature for later use
      sessionStorage.setItem(this.STORAGE_PARTIAL_ZK_LOGIN, JSON.stringify(zkProof));
      
      // Store JWT and address for later use
      sessionStorage.setItem('zkLoginJwt', jwt);
      sessionStorage.setItem('zkLoginAddress', zkLoginAddress);
      
      return {
        success: true,
        address: zkLoginAddress,
        partialZkSignature: zkProof,
        decodedJwt
      };
    } catch (error) {
      console.error("Error completing zkLogin flow:", error);
      throw error;
    }
  }

  // Sign a transaction with zkLogin
  async signTransaction(transactionBlock) {
    try {
      // Retrieve stored data
      const ephemeralKeyPair = this._retrieveKeypair();
      const zkLoginAddress = sessionStorage.getItem('zkLoginAddress');
      const partialZkSignature = JSON.parse(sessionStorage.getItem(this.STORAGE_PARTIAL_ZK_LOGIN));
      const userSalt = sessionStorage.getItem(this.STORAGE_SALT);
      const maxEpoch = Number(sessionStorage.getItem(this.STORAGE_MAX_EPOCH));
      
      // Set the sender to the zkLogin address
      transactionBlock.setSender(zkLoginAddress);
      
      // Sign the transaction with the ephemeral key
      const { bytes, signature: userSignature } = await transactionBlock.sign({
        client: this.suiClient,
        signer: ephemeralKeyPair,
      });
      
      // Get the user's JWT from storage
      const jwt = sessionStorage.getItem('zkLoginJwt');
      const decodedJwt = jwtDecode(jwt);
      
      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(userSalt),
        'sub',
        decodedJwt.sub,
        decodedJwt.aud,
      ).toString();
      
      // Assemble the zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...partialZkSignature,
          addressSeed,
        },
        maxEpoch,
        userSignature,
      });
      
      return {
        transactionBytes: bytes,
        signature: zkLoginSignature
      };
    } catch (error) {
      console.error("Error signing transaction with zkLogin:", error);
      throw error;
    }
  }

// Helper: Generate a new keypair and store it
_generateNewKeypair() {
  try {
    const newKeyPair  = new Ed25519Keypair();
    const secretKey   = newKeyPair.getSecretKey();
  
    // Store seed in sessionStorage
    sessionStorage.setItem(this.STORAGE_SUI_SEED_KEY, secretKey);
    
    return newKeyPair;
  } 
  catch (error) {
    console.error('Error generating keypair:', error);
    throw error;
  }
}

// Helper: Retrieve ephemeral keypair from local storage
_retrieveKeypair() {

  const sui_secrete_key = sessionStorage.getItem(this.STORAGE_SUI_SEED_KEY);
  
  if (!sui_secrete_key) {
    throw new Error('No keypair found in storage');
  }
  
  try {
        return Ed25519Keypair.fromSecretKey(sui_secrete_key);
  } 
  catch (error) {
    console.error('Error retrieving keypair:', error);
    throw new Error('Failed to retrieve keypair');
  }
}

  // Helper: Generate a random salt
  _generateSalt() {
    // Generate a random number and convert to a suitable salt format
    // We need to ensure it's smaller than 2^128
    // const random1 = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    // const random2 = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const random1 = Math.floor(0.56 * Number.MAX_SAFE_INTEGER);
    const random2 = Math.floor(0.71 * Number.MAX_SAFE_INTEGER);
    // Use BigInt to ensure we can handle large integers
    const randomBigInt = BigInt(random1) * BigInt(random2);
    return randomBigInt.toString();
  }

  // Helper: Get zero-knowledge proof from the prover service
  async _getZkProof(requestData) {
    try {
      // For Devnet, use the Mysten Labs development prover
      const proverUrl = process.env.REACT_APP_PROVER_URL;
      
      // Prepare request body
      const requestBody = JSON.stringify({
        jwt: requestData.jwt,
        extendedEphemeralPublicKey: requestData.extendedEphemeralPublicKey,
        maxEpoch: requestData.maxEpoch,
        jwtRandomness: requestData.jwtRandomness,
        salt: requestData.salt,
        keyClaimName: requestData.keyClaimName
      });
      
      // Make request to prover service
      const response = await fetch(proverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      if (!response.ok) {
        throw new Error(`Prover service error: ${response.status} ${response.statusText}`);
      }
      
      // Parse and return the proof
      const proofData = await response.json();
      return proofData;
    } catch (error) {
      console.error("Error fetching ZK proof:", error);
      throw error;
    }
  }

  // Clear all zkLogin data
  logout() {
    // Clear session storage
    sessionStorage.removeItem(this.STORAGE_RANDOMNESS);
    sessionStorage.removeItem(this.STORAGE_MAX_EPOCH);
    sessionStorage.removeItem(this.STORAGE_PARTIAL_ZK_LOGIN);
    
    // Clear local storage
    sessionStorage.removeItem(this.STORAGE_SUI_SEED_KEY);
    sessionStorage.removeItem(this.STORAGE_SALT);
    sessionStorage.removeItem('zkLoginAddress');
    sessionStorage.removeItem('zkLoginJwt');
  }
}

export default new ZkLoginService();