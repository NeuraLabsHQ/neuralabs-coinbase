// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MasterAccessControl.sol";

/**
 * @title NFTAgentWallet
 * @dev Contract for managing NFT-to-agent wallet mappings with digital signature verification
 */
contract NFTAgentWallet {
    // Contract references
    MasterAccessControl public masterAccessControl;
    
    // Bidirectional mappings
    mapping(uint256 => address) private nftToAgent;
    mapping(address => uint256) private agentToNft;
    
    // Events
    event AgentWalletRegistered(uint256 indexed nftId, address indexed agentWallet);
    event AgentWalletUpdated(uint256 indexed nftId, address indexed oldAgentWallet, address indexed newAgentWallet);
    
    /**
     * @dev Modifier to check if caller is authorized through MasterAccessControl
     */
    modifier onlyAuthorized() {
        require(
            masterAccessControl.selfCheckAccess(msg.sender),
            "NFTAgentWallet: Caller not authorized"
        );
        _;
    }
    
    /**
     * @dev Constructor
     * @param _masterAccessControlAddress Address of the MasterAccessControl contract
     */
    constructor(address _masterAccessControlAddress) {
        require(_masterAccessControlAddress != address(0), "NFTAgentWallet: Invalid master access control");
        masterAccessControl = MasterAccessControl(_masterAccessControlAddress);
        masterAccessControl.grantSelfAccess(msg.sender);
    }
    
    /**
     * @dev Registers a new agent wallet for an NFT (only callable by authorized contracts)
     * @param _nftId The ID of the NFT
     * @param _signature Digital signature proving ownership of the agent wallet
     * @param _agentWallet Address of the agent wallet to register
     */
    function registerAgentWallet(
        uint256 _nftId,
        bytes memory _signature,
        address _agentWallet
    ) external onlyAuthorized {
        require(_agentWallet != address(0), "NFTAgentWallet: Invalid agent wallet");
        require(nftToAgent[_nftId] == address(0), "NFTAgentWallet: NFT already has agent wallet");
        require(agentToNft[_agentWallet] == 0, "NFTAgentWallet: Agent wallet already assigned");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "I authorize NFT ID ",
            uint256ToString(_nftId),
            " to be connected with agent wallet ",
            addressToString(_agentWallet)
        ));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);
        
        require(signer == _agentWallet, "NFTAgentWallet: Invalid signature");
        
        // Create bidirectional mapping
        nftToAgent[_nftId] = _agentWallet;
        agentToNft[_agentWallet] = _nftId;
        
        emit AgentWalletRegistered(_nftId, _agentWallet);
    }
    
    /**
     * @dev Updates the agent wallet for an NFT (only callable by authorized contracts)
     * @param _nftId The ID of the NFT
     * @param _signature Digital signature proving ownership of the new agent wallet
     * @param _newAgentWallet Address of the new agent wallet
     */
    function updateAgentWallet(
        uint256 _nftId,
        bytes memory _signature,
        address _newAgentWallet
    ) external onlyAuthorized {
        require(_newAgentWallet != address(0), "NFTAgentWallet: Invalid agent wallet");
        require(nftToAgent[_nftId] != address(0), "NFTAgentWallet: No existing agent wallet");
        require(agentToNft[_newAgentWallet] == 0, "NFTAgentWallet: New agent wallet already assigned");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "I authorize NFT ID ",
            uint256ToString(_nftId),
            " to be connected with agent wallet ",
            addressToString(_newAgentWallet)
        ));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);
        
        require(signer == _newAgentWallet, "NFTAgentWallet: Invalid signature");
        
        // Get old agent wallet
        address oldAgentWallet = nftToAgent[_nftId];
        
        // Remove old mapping
        delete agentToNft[oldAgentWallet];
        
        // Create new mapping
        nftToAgent[_nftId] = _newAgentWallet;
        agentToNft[_newAgentWallet] = _nftId;
        
        emit AgentWalletUpdated(_nftId, oldAgentWallet, _newAgentWallet);
    }
    
    /**
     * @dev Gets the NFT ID associated with an agent wallet
     * @param _agentWallet The agent wallet address to query
     * @return The NFT ID (returns 0 if not found, but 0 is not a valid NFT ID in our system)
     */
    function getNFTId(address _agentWallet) external view returns (uint256) {
        return agentToNft[_agentWallet];
    }
    
    /**
     * @dev Gets the agent wallet address associated with an NFT
     * @param _nftId The NFT ID to query
     * @return The agent wallet address
     */
    function getAgentWallet(uint256 _nftId) external view returns (address) {
        return nftToAgent[_nftId];
    }
    
    /**
     * @dev Checks if an NFT has an associated agent wallet
     * @param _nftId The NFT ID to check
     * @return True if the NFT has an agent wallet, false otherwise
     */
    function hasAgentWallet(uint256 _nftId) external view returns (bool) {
        return nftToAgent[_nftId] != address(0);
    }
    
    /**
     * @dev Checks if an agent wallet is already assigned to an NFT
     * @param _agentWallet The agent wallet address to check
     * @return True if the agent wallet is assigned, false otherwise
     */
    function isAgentWalletAssigned(address _agentWallet) external view returns (bool) {
        return agentToNft[_agentWallet] != 0;
    }
    
    /**
     * @dev Prefixes a bytes32 value with "\x19Ethereum Signed Message:" for signature verification
     * @param _messageHash The message hash to prefix
     * @return The prefixed message hash
     */
    function getEthSignedMessageHash(bytes32 _messageHash) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }
    
    /**
     * @dev Recovers the signer address from a signature
     * @param _ethSignedMessageHash The prefixed message hash
     * @param _signature The signature bytes
     * @return The recovered signer address
     */
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) private pure returns (address) {
        require(_signature.length == 65, "NFTAgentWallet: Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
    
    /**
     * @dev Converts an address to its string representation
     * @param _addr The address to convert
     * @return The string representation of the address
     */
    function addressToString(address _addr) private pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        
        return string(str);
    }
    
    /**
     * @dev Converts a uint256 to its string representation
     * @param _value The value to convert
     * @return The string representation of the value
     */
    function uint256ToString(uint256 _value) private pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        
        uint256 temp = _value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        
        return string(buffer);
    }
}