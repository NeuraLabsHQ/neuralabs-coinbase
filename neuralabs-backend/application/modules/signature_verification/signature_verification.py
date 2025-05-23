from fastapi import HTTPException, status
from pysui.sui.sui_crypto import IntentScope, SignatureScheme
import pysui_fastcrypto as pfc
from base64 import b64decode, b64encode
import hashlib

def verify_sui_signature(public_key: str, signature: str, message: str) -> bool:
    """
    Verify a signature from Sui wallet using pysui's approach.

    Args:
        public_key (str): Hex-encoded Sui address (with or without '0x' prefix)
        signature (str): Base64-encoded signature from Sui wallet
        message (str): The original message that was signed

    Returns:
        bool: True if the signature is valid

    Raises:
        HTTPException: If the signature verification fails
    """
    try:
        # Clean public key
        public_key = public_key.strip()
        if public_key.startswith("0x"):
            public_key = public_key[2:]
        
        # Decode public key from hex
        pub_key_bytes = bytes.fromhex(public_key)
        
        # Decode signature from Base64
        signature_bytes = b64decode(signature)
        
        # Extract scheme flag and signature
        scheme_flag = 0x00  # Default to ED25519
        if len(signature_bytes) > 64:
            scheme_flag = signature_bytes[0]
            signature_bytes = signature_bytes[1:65]
        
        # Determine signature scheme
        if scheme_flag == 0x00:
            scheme = SignatureScheme.ED25519
        elif scheme_flag == 0x01:
            scheme = SignatureScheme.SECP256K1
        elif scheme_flag == 0x02:
            scheme = SignatureScheme.SECP256R1
        else:
            scheme = SignatureScheme.ED25519
        
        # Build intent message with Sui PersonalMessage scope
        intent_msg = bytearray([IntentScope.PersonalMessage, 0, 0])
        message_bytes = message.encode('utf-8')
        
        # Encode message length in ULEB128 format
        message_len = len(message_bytes)
        while message_len >= 0x80:
            intent_msg.append((message_len & 0x7F) | 0x80)
            message_len >>= 7
        intent_msg.append(message_len)
        
        # Append the actual message
        intent_msg.extend(message_bytes)
        
        # Hash the intent message
        hashed_msg = hashlib.blake2b(intent_msg, digest_size=32).digest()
        
        # Verify using pysui_fastcrypto
        result = pfc.verify(
            scheme,
            pub_key_bytes,
            b64encode(hashed_msg).decode(),
            b64encode(signature_bytes).decode()
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature verification failed"
            )
        
        return True
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signature verification error: {str(e)}"
        )