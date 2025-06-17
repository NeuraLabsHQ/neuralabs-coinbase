// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MasterAccessControl.sol";

interface IAIServiceAgreementManagement {
    function hasActiveAccess(uint256 _nftId, address _user) external view returns (bool);
}

/**
 * @title NFTAccessControl
 * @dev Sophisticated access control system implementing 7 permission tiers with sales protection
 */
contract NFTAccessControl {
    // Reference to MasterAccessControl for authorization
    MasterAccessControl public accessControl;
    
    // Reference to AIServiceAgreementManagement for checking paid access
    IAIServiceAgreementManagement public aiServiceAgreementManagement;

    // Access level enumeration
    enum AccessLevel {
        None,               // 0 - No access
        UseModel,          // 1 - Can use the model
        Resale,            // 2 - Can resell access
        CreateReplica,     // 3 - Can create replicas
        ViewAndDownload,   // 4 - Can view and download
        EditData,          // 5 - Can edit data
        AbsoluteOwnership  // 6 - Full ownership rights
    }

    // Struct to store access entries for users
    struct AccessEntry {
        uint256 nftId;
        AccessLevel accessLevel;
    }

    // Struct to store user access for NFTs
    struct UserAccess {
        address user;
        AccessLevel accessLevel;
    }

    // Maps token ID to user address to their access level
    mapping(uint256 => mapping(address => AccessLevel)) public nftAccess;
    
    // Default access level for all users per NFT
    mapping(uint256 => AccessLevel) public defaultAccessLevel;
    
    // Maximum access level that can be granted for each NFT
    mapping(uint256 => AccessLevel) public maxAccessLevel;
    
    // List of all NFT access entries for each user
    mapping(address => AccessEntry[]) private userAccessList;
    
    // Maps user and token ID to index in userAccessList for efficient updates
    mapping(address => mapping(uint256 => uint256)) private userAccessIndex;
    
    // List of all users with access to each NFT
    mapping(uint256 => UserAccess[]) private nftAccessList;
    
    // Maps token ID and user to index in nftAccessList
    mapping(uint256 => mapping(address => uint256)) private nftAccessIndex;

    // Events
    event AccessGranted(uint256 indexed nftId, address indexed user, AccessLevel accessLevel);
    event AccessRevoked(uint256 indexed nftId, address indexed user);
    event AccessLevelChanged(address indexed user, uint256 indexed nftId, AccessLevel newAccessLevel);

    /**
     * @dev Modifier to check if caller is authorized or NFT owner with sufficient access
     */
    modifier onlyAuthorizedOrOwner(uint256 _nftId) {
        require(
            accessControl.selfCheckAccess(msg.sender) || 
            nftAccess[_nftId][msg.sender] == AccessLevel.AbsoluteOwnership,
            "NFTAccessControl: Caller not authorized"
        );
        _;
    }

    /**
     * @dev Constructor initializes contract with reference to MasterAccessControl
     */
    constructor(address _accessControlAddress) {
        require(_accessControlAddress != address(0), "NFTAccessControl: Invalid access control address");
        accessControl = MasterAccessControl(_accessControlAddress);
        accessControl.grantSelfAccess(msg.sender);
    }

    /**
     * @dev Sets reference to AIServiceAgreementManagement contract
     */
    function setAIServiceAgreementManagement(address _aiServiceAgreementManagementAddress) external {
        require(
            accessControl.selfCheckAccess(msg.sender),
            "NFTAccessControl: Caller not authorized"
        );
        require(_aiServiceAgreementManagementAddress != address(0), "NFTAccessControl: Invalid address");
        aiServiceAgreementManagement = IAIServiceAgreementManagement(_aiServiceAgreementManagementAddress);
    }

    /**
     * @dev Sets the maximum access level that can be granted for an NFT
     */
    function setMaxAccessLevel(uint256 _nftId, AccessLevel _accessLevel) external onlyAuthorizedOrOwner(_nftId) {
        require(_accessLevel != AccessLevel.None, "NFTAccessControl: Invalid access level");
        maxAccessLevel[_nftId] = _accessLevel;
    }

    /**
     * @dev Sets default access level for all users
     */
    function setDefaultAccessLevel(uint256 _nftId, AccessLevel _accessLevel) external onlyAuthorizedOrOwner(_nftId) {
        require(_accessLevel <= maxAccessLevel[_nftId], "NFTAccessControl: Exceeds max access level");
        defaultAccessLevel[_nftId] = _accessLevel;
    }

    /**
     * @dev Grants specific access level to a user
     */
    function grantAccess(uint256 _nftId, address _user, AccessLevel _accessLevel) external onlyAuthorizedOrOwner(_nftId) {
        require(_user != address(0), "NFTAccessControl: Invalid user address");
        require(_accessLevel != AccessLevel.None, "NFTAccessControl: Invalid access level");
        require(_accessLevel <= maxAccessLevel[_nftId], "NFTAccessControl: Exceeds max access level");

        AccessLevel previousLevel = nftAccess[_nftId][_user];
        nftAccess[_nftId][_user] = _accessLevel;

        // Update user access list
        _updateUserAccessList(_user, _nftId, _accessLevel);
        
        // Update NFT access list
        _updateNFTAccessList(_nftId, _user, _accessLevel);

        emit AccessGranted(_nftId, _user, _accessLevel);
        emit AccessLevelChanged(_user, _nftId, _accessLevel);
    }

    /**
     * @dev Removes all access permissions for a user with sales protection
     */
    function revokeAccess(uint256 _nftId, address _user) external {
        require(
            accessControl.selfCheckAccess(msg.sender),
            "NFTAccessControl: Caller not authorized"
        );
        require(_user != address(0), "NFTAccessControl: Invalid user address");
        
        // Check if user has active paid access
        if (address(aiServiceAgreementManagement) != address(0)) {
            require(
                !aiServiceAgreementManagement.hasActiveAccess(_nftId, _user),
                "NFTAccessControl: Cannot revoke paid access"
            );
        }

        AccessLevel previousLevel = nftAccess[_nftId][_user];
        delete nftAccess[_nftId][_user];

        // Update user access list
        _updateUserAccessListOnRevoke(_user, _nftId);
        
        // Update NFT access list
        _updateNFTAccessListOnRevoke(_nftId, _user);

        emit AccessRevoked(_nftId, _user);
        emit AccessLevelChanged(_user, _nftId, AccessLevel.None);
    }

    /**
     * @dev Returns all NFT access entries for a user
     */
    function getAllAccessForUser(address _user) external view returns (AccessEntry[] memory) {
        return userAccessList[_user];
    }

    /**
     * @dev Returns user's access level for an NFT
     */
    function getAccessLevel(uint256 _nftId, address _user) external view returns (AccessLevel) {
        AccessLevel specificAccess = nftAccess[_nftId][_user];
        if (specificAccess != AccessLevel.None) {
            return specificAccess;
        }
        return defaultAccessLevel[_nftId];
    }

    /**
     * @dev Checks if user has at least the specified access level
     */
    function checkMinimumAccess(uint256 _nftId, address _user, AccessLevel _accessLevel) external view returns (bool) {
        // First check default access
        if (defaultAccessLevel[_nftId] >= _accessLevel) {
            return true;
        }
        
        // Then check specific user access
        AccessLevel userLevel = nftAccess[_nftId][_user];
        return userLevel >= _accessLevel;
    }

    /**
     * @dev Returns all users with access to a specific NFT
     */
    function getAllUsersAccessForNFT(uint256 _nftId) external view returns (UserAccess[] memory) {
        return nftAccessList[_nftId];
    }

    /**
     * @dev Checks if access can be revoked (no active paid access)
     */
    function canRevokeAccess(uint256 _nftId, address _user) external view returns (bool) {
        if (address(aiServiceAgreementManagement) == address(0)) {
            return true;
        }
        return !aiServiceAgreementManagement.hasActiveAccess(_nftId, _user);
    }

    /**
     * @dev Internal function to update user's access list when granting access
     */
    function _updateUserAccessList(address _user, uint256 _nftId, AccessLevel _accessLevel) private {
        uint256 index = userAccessIndex[_user][_nftId];
        
        // Check if this is a new entry or update
        if (index == 0 && (userAccessList[_user].length == 0 || userAccessList[_user][0].nftId != _nftId)) {
            // New entry
            userAccessList[_user].push(AccessEntry({
                nftId: _nftId,
                accessLevel: _accessLevel
            }));
            userAccessIndex[_user][_nftId] = userAccessList[_user].length - 1;
        } else {
            // Update existing entry
            userAccessList[_user][index].accessLevel = _accessLevel;
        }
    }

    /**
     * @dev Internal function to update NFT's user list when granting access
     */
    function _updateNFTAccessList(uint256 _nftId, address _user, AccessLevel _accessLevel) private {
        uint256 index = nftAccessIndex[_nftId][_user];
        
        // Check if this is a new entry or update
        if (index == 0 && (nftAccessList[_nftId].length == 0 || nftAccessList[_nftId][0].user != _user)) {
            // New entry
            nftAccessList[_nftId].push(UserAccess({
                user: _user,
                accessLevel: _accessLevel
            }));
            nftAccessIndex[_nftId][_user] = nftAccessList[_nftId].length - 1;
        } else {
            // Update existing entry
            nftAccessList[_nftId][index].accessLevel = _accessLevel;
        }
    }

    /**
     * @dev Internal function to remove entry from user's access list
     */
    function _updateUserAccessListOnRevoke(address _user, uint256 _nftId) private {
        uint256 index = userAccessIndex[_user][_nftId];
        uint256 lastIndex = userAccessList[_user].length - 1;
        
        if (index != lastIndex) {
            // Move last element to the removed position
            userAccessList[_user][index] = userAccessList[_user][lastIndex];
            // Update index mapping for the moved element
            userAccessIndex[_user][userAccessList[_user][index].nftId] = index;
        }
        
        // Remove last element
        userAccessList[_user].pop();
        delete userAccessIndex[_user][_nftId];
    }

    /**
     * @dev Internal function to remove user from NFT's access list
     */
    function _updateNFTAccessListOnRevoke(uint256 _nftId, address _user) private {
        uint256 index = nftAccessIndex[_nftId][_user];
        uint256 lastIndex = nftAccessList[_nftId].length - 1;
        
        if (index != lastIndex) {
            // Move last element to the removed position
            nftAccessList[_nftId][index] = nftAccessList[_nftId][lastIndex];
            // Update index mapping for the moved element
            nftAccessIndex[_nftId][nftAccessList[_nftId][index].user] = index;
        }
        
        // Remove last element
        nftAccessList[_nftId].pop();
        delete nftAccessIndex[_nftId][_user];
    }
}