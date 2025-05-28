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
import { jwtDecode } from 'jwt-decode';
/* global BigInt */
class ZkLoginService {
  constructor() {
    this.clientId = '';
    this.redirectUrl = window.location.origin + '/auth/callback';
    this.fullnodeUrl = `https://fullnode.${import.meta.env.VITE_SUI_NETWORK}.sui.io`;
    this.suiClient = new SuiClient({ url: this.fullnodeUrl });
    
    // Storage keys
    this.STORAGE_SUI_SEED_KEY     = 'zklogin_sui_seed_key';
    this.STORAGE_RANDOMNESS       = 'zklogin_randomness';
    this.STORAGE_MAX_EPOCH        = 'zklogin_max_epoch';
    this.STORAGE_SALT             = 'zklogin_user_salt';
    this.STORAGE_PARTIAL_ZK_LOGIN = 'zklogin_partial_signature';
    this.STORAGE_EMAIL            = 'zklogin_user_email';
    this.STORAGE_JWT_TOKEN        = 'zklogin_jwt_token';
  }

  setClientId(clientId) {
    if (!clientId || clientId.includes('YOUR_') || clientId === '') {
      console.error('Invalid Google Client ID provided.');
      return;
    }
    this.clientId = clientId;
  }

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

  async beginLogin() {
    try {
      if (!this.clientId || this.clientId.includes('YOUR_') || this.clientId === '') {
        throw new Error('Google Client ID not properly configured.');
      }
      
      const ephemeralKeyPair = this._generateNewKeypair();
      const ephemeralPublicKey = ephemeralKeyPair.getPublicKey(); 
      
      const { epoch } = await this.getCurrentEpoch();
      const maxEpoch = epoch + 2;
      
      sessionStorage.setItem(this.STORAGE_MAX_EPOCH, maxEpoch.toString());
      
      const randomness = generateRandomness();
      sessionStorage.setItem(this.STORAGE_RANDOMNESS, randomness.toString());
      
      const nonce = generateNonce(ephemeralPublicKey, maxEpoch.toString(), randomness.toString());
      
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

  // *** UPDATED: Complete login with authentication ***
  async completeLogin(jwt, shouldSign = false) {
    try {
      const decodedJwt = jwtDecode(jwt);
      const email = decodedJwt.email;
      
      // Store email for later use
      sessionStorage.setItem(this.STORAGE_EMAIL, email);
      
      // STEP 1: Get salt from backend
      const saltResponse = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/zk-login/zklogin-salt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
      });
      
      if (!saltResponse.ok) {
        throw new Error(`Backend service error: ${saltResponse.status} ${saltResponse.statusText}`);
      }
      
      const { salt: userSalt } = await saltResponse.json();
      sessionStorage.setItem(this.STORAGE_SALT, userSalt);

      // STEP 2: Derive zkLogin address
      const zkLoginAddress = jwtToAddress(jwt, userSalt);
      
      // STEP 3: Get ZK proof
      const ephemeralKeyPair = this._retrieveKeypair();
      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());
      
      const randomness = sessionStorage.getItem(this.STORAGE_RANDOMNESS);
      const maxEpoch = sessionStorage.getItem(this.STORAGE_MAX_EPOCH);

      const zkProof = await this._getZkProof({
        jwt,
        extendedEphemeralPublicKey,
        maxEpoch,
        jwtRandomness: randomness,
        salt: userSalt,
        keyClaimName: 'sub'
      });
      
      sessionStorage.setItem(this.STORAGE_PARTIAL_ZK_LOGIN, JSON.stringify(zkProof));
      sessionStorage.setItem('zkLoginJwt', jwt);
      sessionStorage.setItem('zkLoginAddress', zkLoginAddress);
      
      // If shouldSign is false, return early with preparation data
      if (!shouldSign) {
        return {
          success: false,
          needsSignature: true,
          email,
          timestamp: Date.now(),
          address: zkLoginAddress
        };
      }
      
      // STEP 4: *** NEW *** - Sign authentication message and get JWT token
      const authResult = await this._authenticateWithBackend(
        decodedJwt, 
        userSalt, 
        zkProof, 
        Number(maxEpoch),
        ephemeralKeyPair,
        zkLoginAddress,
        email
      );
      
      if (authResult.success) {
        // Store the JWT token from backend
        sessionStorage.setItem(this.STORAGE_JWT_TOKEN, authResult.access_token);
        
        return {
          success: true,
          address: zkLoginAddress,
          partialZkSignature: zkProof,
          decodedJwt,
          jwtToken: authResult.access_token,
          userId: authResult.user_id
        };
      } else {
        throw new Error('Authentication failed: ' + (authResult.errors || ['Unknown error']).join(', '));
      }
      
    } catch (error) {
      console.error("Error completing zkLogin flow:", error);
      throw error;
    }
  }

  // *** NEW METHOD: Authenticate with backend using zkLogin signature ***
  async _authenticateWithBackend(decodedJwt, userSalt, partialZkSignature, maxEpoch, ephemeralKeyPair, zkLoginAddress, email) {
    try {
      // Create authentication message
      const timestamp = Date.now();
      const authMessage = `Authenticate with zkLogin for ${email} at ${timestamp}`;
      
      // Sign the authentication message
      const authMessageBytes = new TextEncoder().encode(authMessage);
      
      // Create a mock transaction to get the signature format
      // We'll use the message bytes directly
      const messageBase64 = btoa(String.fromCharCode(...authMessageBytes));
      
      // Sign with ephemeral key
      const ephemeralSignature = await ephemeralKeyPair.signPersonalMessage(authMessageBytes);
      
      console.log('Ephemeral Signature:', ephemeralSignature);
      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(userSalt),
        'sub',
        decodedJwt.sub,
        decodedJwt.aud,
      ).toString();
      
      // Assemble zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...partialZkSignature,
          addressSeed,
        },
        maxEpoch,
        userSignature: ephemeralSignature.signature,
      });

      console.log('ZkLogin Signature:', zkLoginSignature);
      
      // Send to backend for verification and JWT generation
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/zk-login/zklogin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bytes: messageBase64,
          signature: zkLoginSignature,
          author: zkLoginAddress,
          intent_scope: 0, // 0 for personal message
          email: email
        })
      });
      
      if (!response.ok) {
        throw new Error(`Authentication request failed: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error("Error authenticating with backend:", error);
      throw error;
    }
  }

  // *** NEW METHOD: Get stored JWT token ***
  getStoredAuthToken() {
    return sessionStorage.getItem(this.STORAGE_JWT_TOKEN);
  }

  // *** NEW METHOD: Check if authenticated ***
  isAuthenticated() {
    const token = this.getStoredAuthToken();
    const address = sessionStorage.getItem('zkLoginAddress');
    return !!(token && address);
  }

  // *** NEW METHOD: Make authenticated API calls ***
  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getStoredAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired - clear stored data
      this.logout();
      throw new Error('Authentication token expired');
    }

    return response;
  }

  // Sign a transaction with zkLogin (separate from authentication)
  async signTransaction(transactionBlock) {
    try {
      const ephemeralKeyPair = this._retrieveKeypair();
      const zkLoginAddress = sessionStorage.getItem('zkLoginAddress');
      const partialZkSignature = JSON.parse(sessionStorage.getItem(this.STORAGE_PARTIAL_ZK_LOGIN));
      const userSalt = sessionStorage.getItem(this.STORAGE_SALT);
      const maxEpoch = Number(sessionStorage.getItem(this.STORAGE_MAX_EPOCH));
      
      transactionBlock.setSender(zkLoginAddress);
      
      const { bytes, signature: userSignature } = await transactionBlock.sign({
        client: this.suiClient,
        signer: ephemeralKeyPair,
      });
      
      const jwt = sessionStorage.getItem('zkLoginJwt');
      const decodedJwt = jwtDecode(jwt);
      
      const addressSeed = genAddressSeed(
        BigInt(userSalt),
        'sub',
        decodedJwt.sub,
        decodedJwt.aud,
      ).toString();
      
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

  // Helper methods (keeping existing implementation)
  _generateNewKeypair() {
    try {
      const newKeyPair = new Ed25519Keypair();
      const secretKey = newKeyPair.getSecretKey();
      sessionStorage.setItem(this.STORAGE_SUI_SEED_KEY, secretKey);
      return newKeyPair;
    } catch (error) {
      console.error('Error generating keypair:', error);
      throw error;
    }
  }

  _retrieveKeypair() {
    const sui_secrete_key = sessionStorage.getItem(this.STORAGE_SUI_SEED_KEY);
    if (!sui_secrete_key) {
      throw new Error('No keypair found in storage');
    }
    try {
      return Ed25519Keypair.fromSecretKey(sui_secrete_key);
    } catch (error) {
      console.error('Error retrieving keypair:', error);
      throw new Error('Failed to retrieve keypair');
    }
  }

  async _getZkProof(requestData) {
    try {
      const proverUrl = import.meta.env.VITE_PROVER_URL;
      
      const requestBody = JSON.stringify({
        jwt: requestData.jwt,
        extendedEphemeralPublicKey: requestData.extendedEphemeralPublicKey,
        maxEpoch: requestData.maxEpoch,
        jwtRandomness: requestData.jwtRandomness,
        salt: requestData.salt,
        keyClaimName: requestData.keyClaimName
      });
      
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
      
      const proofData = await response.json();
      return proofData;
    } catch (error) {
      console.error("Error fetching ZK proof:", error);
      throw error;
    }
  }

  logout() {
    // Clear all zkLogin related data
    sessionStorage.removeItem(this.STORAGE_RANDOMNESS);
    sessionStorage.removeItem(this.STORAGE_MAX_EPOCH);
    sessionStorage.removeItem(this.STORAGE_PARTIAL_ZK_LOGIN);
    sessionStorage.removeItem(this.STORAGE_SUI_SEED_KEY);
    sessionStorage.removeItem(this.STORAGE_SALT);
    sessionStorage.removeItem(this.STORAGE_EMAIL);
    sessionStorage.removeItem(this.STORAGE_JWT_TOKEN);
    sessionStorage.removeItem('zkLoginAddress');
    sessionStorage.removeItem('zkLoginJwt');
  }
}

export default new ZkLoginService();