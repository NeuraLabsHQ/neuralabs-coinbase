// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MasterAccessControl
 * @dev Central authorization contract managing permissions across all system contracts
 */
contract MasterAccessControl {
    // Nested mapping tracking access permissions
    // First address is the contract being protected, second address is the caller
    mapping(address => mapping(address => bool)) public accessRights;

    // Events
    event AccessGranted(address indexed contractAddress, address indexed caller);
    event AccessRevoked(address indexed contractAddress, address indexed caller);

    /**
     * @dev Modifier to check if caller has authorization
     */
    modifier onlyAuthorized() {
        require(
            accessRights[address(this)][msg.sender],
            "MasterAccessControl: Caller not authorized"
        );
        _;
    }

    /**
     * @dev Constructor grants the deployer access to the MasterAccessControl contract itself
     */
    constructor() {
        accessRights[address(this)][msg.sender] = true;
        emit AccessGranted(address(this), msg.sender);
    }

    /**
     * @dev Grants a caller access to interact with a specific contract
     * @param _contract The contract address to grant access to
     * @param _caller The address that will be granted access
     */
    function grantAccess(address _contract, address _caller) external onlyAuthorized {
        require(_contract != address(0), "MasterAccessControl: Invalid contract address");
        require(_caller != address(0), "MasterAccessControl: Invalid caller address");
        
        accessRights[_contract][_caller] = true;
        emit AccessGranted(_contract, _caller);
    }

    /**
     * @dev Revokes a caller's access to interact with a specific contract
     * @param _contract The contract address to revoke access from
     * @param _caller The address that will have access revoked
     */
    function revokeAccess(address _contract, address _caller) external onlyAuthorized {
        require(_contract != address(0), "MasterAccessControl: Invalid contract address");
        require(_caller != address(0), "MasterAccessControl: Invalid caller address");
        
        accessRights[_contract][_caller] = false;
        emit AccessRevoked(_contract, _caller);
    }

    /**
     * @dev Allows a contract to grant access to a specific address for itself
     * @param _addressToGrant The address to grant access to
     */
    function grantSelfAccess(address _addressToGrant) external {
        require(_addressToGrant != address(0), "MasterAccessControl: Invalid address");
        
        accessRights[msg.sender][_addressToGrant] = true;
        emit AccessGranted(msg.sender, _addressToGrant);
    }

    /**
     * @dev Allows a contract to revoke access from a specific address for itself
     * @param _addressToRevoke The address to revoke access from
     */
    function revokeSelfAccess(address _addressToRevoke) external {
        require(_addressToRevoke != address(0), "MasterAccessControl: Invalid address");
        
        accessRights[msg.sender][_addressToRevoke] = false;
        emit AccessRevoked(msg.sender, _addressToRevoke);
    }

    /**
     * @dev Checks if a caller has access to a specific contract
     * @param _contract The contract address to check
     * @param _caller The caller address to check
     * @return bool indicating if the caller has access
     */
    function hasAccess(address _contract, address _caller) external view returns (bool) {
        return accessRights[_contract][_caller];
    }

    /**
     * @dev Allows contracts to check if an address has access to them
     * @param _addressToCheck The address to check for access
     * @return bool indicating if the address has access
     */
    function selfCheckAccess(address _addressToCheck) external view returns (bool) {
        return accessRights[msg.sender][_addressToCheck];
    }
}