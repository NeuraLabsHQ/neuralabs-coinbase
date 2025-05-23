from fastapi import HTTPException, status
from pysui.sui.sui_crypto import SuiSignature
from base64 import b64decode, b64encode
import binascii
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def verify_sui_signature(public_key: str, signature: str, message: str) -> bool:
    """
    Verify a signature from Sui wallet using pysui's Ed25519 verification.

    Args:
        public_key (str): Hex-encoded Sui address (with or without '0x' prefix) or Base64-encoded public key.
        signature (str): Hex, Base64-encoded signature, or JSON-serialized signature object from Sui wallet.
        message (str): The original message that was signed.

    Returns:
        bool: True if the signature is valid, False otherwise.

    Raises:
        HTTPException: If the public key or signature is invalid.
    """
    try:
        # Clean public key
        public_key = public_key.strip()
        if public_key.startswith("0x"):
            public_key = public_key[2:]  # Remove '0x' prefix

        # Decode public key (try hex, then Base64)
        try:
            pub_key_bytes = bytes.fromhex(public_key)
            logger.debug(f"Public key decoded as hex: {pub_key_bytes.hex()}")
        except ValueError:
            try:
                pub_key_bytes = b64decode(public_key)
                logger.debug(f"Public key decoded as Base64: {pub_key_bytes.hex()}")
            except binascii.Error as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid public key format: {str(e)}"
                )

        # Ensure public key is 32 bytes (Ed25519 public key length)
        if len(pub_key_bytes) != 32:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid public key length: {len(pub_key_bytes)} bytes, expected 32"
            )

        # Clean signature
        signature = signature.strip()
        if signature.startswith("0x"):
            signature = signature[2:]  # Remove '0x' prefix

        # Try parsing signature as JSON (in case it's a serialized object)
        signature_bytes = None
        try:
            parsed = json.loads(signature)
            logger.debug(f"Signature parsed as JSON: {parsed}")
            if isinstance(parsed, dict) and "signature" in parsed:
                signature = parsed["signature"]
                logger.debug(f"Extracted signature from JSON: {signature}")
            else:
                raise ValueError("No 'signature' field in JSON object")
        except json.JSONDecodeError:
            logger.debug("Signature is not JSON, proceeding with direct decoding")

        # Decode signature (try hex, then Base64)
        try:
            signature_bytes = bytes.fromhex(signature)
            logger.debug(f"Signature decoded as hex: {signature_bytes.hex()}")
        except ValueError:
            try:
                signature_bytes = b64decode(signature)
                logger.debug(f"Signature decoded as Base64: {signature_bytes.hex()}")
            except binascii.Error as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid signature format: {str(e)}"
                )

        # Log raw signature for debugging
        logger.debug(f"Raw signature: {signature}")
        logger.debug(f"Signature length: {len(signature_bytes)} bytes")

        # Handle Sui signature (64 bytes for Ed25519 + optional 1-byte scheme flag)
        if len(signature_bytes) == 65 and signature_bytes[0] in [0x00, 0x01]:
            signature_bytes = signature_bytes[1:]  # Strip flag
            logger.debug(f"Stripped signature scheme flag, new length: {len(signature_bytes)}")
        elif len(signature_bytes) > 64:
            # Attempt to extract 64-byte signature (e.g., from 97-byte input)
            # Assuming flag + 64-byte signature + extra bytes
            if signature_bytes[0] in [0x00, 0x01]:
                signature_bytes = signature_bytes[1:65]  # Extract flag + 64 bytes
                logger.debug(f"Extracted 64-byte signature, new length: {len(signature_bytes)}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid signature length: {len(signature_bytes)} bytes, expected 64 or 65"
                )
        elif len(signature_bytes) != 64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid signature length: {len(signature_bytes)} bytes, expected 64 or 65"
            )

        # Encode message with Sui PersonalMessage intent
        # Sui prepends: 0x00 (intent) + 0x00 (PersonalMessage) + 0x00 (version) + message length (u32) + message
        message_bytes = message.encode('utf-8')
        message_len = len(message_bytes).to_bytes(4, byteorder='big')
        intent_prefix = b"\x00\x00\x00"
        message_bytes = intent_prefix + message_len + message_bytes
        logger.debug(f"Message with intent: {message_bytes.hex()}")

        # Convert to Base64 for SuiSignature
        pub_key_b64 = b64encode(pub_key_bytes).decode('utf-8')
        signature_b64 = b64encode(signature_bytes).decode('utf-8')

        # Create and verify SuiSignature
        try:
            sui_sig = SuiSignature(pub_key_b64, signature_b64)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create SuiSignature: {str(e)}"
            )

        if not sui_sig.verify(message_bytes):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature verification failed"
            )

        logger.debug("Signature verified successfully")
        return True

    except Exception as e:
        logger.error(f"Signature verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid signature data: {str(e)}"
        )