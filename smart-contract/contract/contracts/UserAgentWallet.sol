// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title UserAgentWallet
 * @dev Contract for managing user-to-agent wallet mappings with digital signature verification
 */
contract UserAgentWallet {
    // Bidirectional mappings
    mapping(address => address) private userToAgent;
    mapping(address => address) private agentToUser;
    
    // Events
    event AgentWalletRegistered(address indexed userWallet, address indexed agentWallet);
    event AgentWalletUpdated(address indexed userWallet, address indexed oldAgentWallet, address indexed newAgentWallet);
    
    /**
     * @dev Registers a new agent wallet for the message sender
     * @param _signature Digital signature proving ownership of the agent wallet
     * @param _agentWallet Address of the agent wallet to register
     */
    function registerAgentWallet(bytes memory _signature, address _agentWallet) external {
        require(_agentWallet != address(0), "UserAgentWallet: Invalid agent wallet");
        require(userToAgent[msg.sender] == address(0), "UserAgentWallet: User already has agent wallet");
        require(agentToUser[_agentWallet] == address(0), "UserAgentWallet: Agent wallet already assigned");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "I authorize ",
            addressToString(msg.sender),
            " as the owner of agent wallet ",
            addressToString(_agentWallet)
        ));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);
        
        require(signer == _agentWallet, "UserAgentWallet: Invalid signature");
        
        // Create bidirectional mapping
        userToAgent[msg.sender] = _agentWallet;
        agentToUser[_agentWallet] = msg.sender;
        
        emit AgentWalletRegistered(msg.sender, _agentWallet);
    }
    
    /**
     * @dev Updates the agent wallet for the message sender
     * @param _signature Digital signature proving ownership of the new agent wallet
     * @param _newAgentWallet Address of the new agent wallet
     */
    function updateAgentWallet(bytes memory _signature, address _newAgentWallet) external {
        require(_newAgentWallet != address(0), "UserAgentWallet: Invalid agent wallet");
        require(userToAgent[msg.sender] != address(0), "UserAgentWallet: No existing agent wallet");
        require(agentToUser[_newAgentWallet] == address(0), "UserAgentWallet: New agent wallet already assigned");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "I authorize ",
            addressToString(msg.sender),
            " as the owner of agent wallet ",
            addressToString(_newAgentWallet)
        ));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);
        
        require(signer == _newAgentWallet, "UserAgentWallet: Invalid signature");
        
        // Get old agent wallet
        address oldAgentWallet = userToAgent[msg.sender];
        
        // Remove old mapping
        delete agentToUser[oldAgentWallet];
        
        // Create new mapping
        userToAgent[msg.sender] = _newAgentWallet;
        agentToUser[_newAgentWallet] = msg.sender;
        
        emit AgentWalletUpdated(msg.sender, oldAgentWallet, _newAgentWallet);
    }
    
    /**
     * @dev Gets the user wallet address associated with an agent wallet
     * @param _agentWallet The agent wallet address to query
     * @return The user wallet address
     */
    function getUserWallet(address _agentWallet) external view returns (address) {
        return agentToUser[_agentWallet];
    }
    
    /**
     * @dev Gets the agent wallet address associated with a user wallet
     * @param _userWallet The user wallet address to query
     * @return The agent wallet address
     */
    function getAgentWallet(address _userWallet) external view returns (address) {
        return userToAgent[_userWallet];
    }
    
    /**
     * @dev Checks if a user wallet has an associated agent wallet
     * @param _userWallet The user wallet address to check
     * @return True if the user has an agent wallet, false otherwise
     */
    function hasAgentWallet(address _userWallet) external view returns (bool) {
        return userToAgent[_userWallet] != address(0);
    }
    
    /**
     * @dev Checks if an agent wallet is already assigned to a user
     * @param _agentWallet The agent wallet address to check
     * @return True if the agent wallet is assigned, false otherwise
     */
    function isAgentWalletAssigned(address _agentWallet) external view returns (bool) {
        return agentToUser[_agentWallet] != address(0);
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
        require(_signature.length == 65, "UserAgentWallet: Invalid signature length");
        
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
}