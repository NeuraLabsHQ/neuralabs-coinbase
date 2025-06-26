// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MasterAccessControl.sol";
import "./NFTAccessControl.sol";

/**
 * @title NFTMetadata
 * @dev Manages intellectual property-specific metadata for NFTs including encryption, storage location, and versioning
 */
contract NFTMetadata {
    // Reference to MasterAccessControl for authorization
    MasterAccessControl public accessControl;
    
    // Reference to NFTAccessControl for permission checks
    NFTAccessControl public nftAccessControl;

    // Struct to store metadata
    struct Metadata {
        string image;                           // Visual representation URL
        string intellectual_property_type;      // Type of IP (flow/model/data)
        bool encrypted;                         // Whether the IP is encrypted
        string encryption_id;                   // Encryption identifier if encrypted
        string intellectual_property_id;        // Unique IP identifier
        string intellectual_property_storage;   // Storage location (neuralabs/neuralabs-decentralized/custom)
        string md5;                            // MD5 hash of the IP content
        string version;                        // Version identifier
    }

    // Struct to store replica information
    struct Replica {
        uint256 replicaNFTId;                  // Token ID of the replica
    }

    // Maps token ID to metadata structure
    mapping(uint256 => Metadata) private metadataMap;
    
    // Maps original NFT to its replica information
    mapping(uint256 => Replica) private replicaMap;

    // Events
    event MetadataCreated(uint256 indexed nftId, Metadata metadata);
    event MetadataUpdated(uint256 indexed nftId, Metadata metadata);
    event MetadataDeleted(uint256 indexed nftId);
    event ReplicaCreated(uint256 indexed nftId, Replica replica);

    /**
     * @dev Modifier to check if caller is authorized
     */
    modifier onlyAuthorized() {
        require(
            accessControl.selfCheckAccess(msg.sender),
            "NFTMetadata: Caller not authorized"
        );
        _;
    }

    /**
     * @dev Constructor initializes contract with references to access control contracts
     */
    constructor(address _accessControlAddress, address _nftAccessControlAddress) {
        require(_accessControlAddress != address(0), "NFTMetadata: Invalid access control address");
        require(_nftAccessControlAddress != address(0), "NFTMetadata: Invalid NFT access control address");
        
        accessControl = MasterAccessControl(_accessControlAddress);
        nftAccessControl = NFTAccessControl(_nftAccessControlAddress);
        
        accessControl.grantSelfAccess(msg.sender);
    }

    /**
     * @dev Creates new metadata entry for an NFT
     */
    function createMetadata(uint256 _nftId, Metadata memory _metadata) external {
        require(
            accessControl.selfCheckAccess(msg.sender) || 
            nftAccessControl.checkMinimumAccess(_nftId, msg.sender, NFTAccessControl.AccessLevel.AbsoluteOwnership),
            "NFTMetadata: Caller not authorized"
        );
        require(!_metadataExists(_nftId), "NFTMetadata: Metadata already exists");
        
        // Validate intellectual_property_type
        require(
            keccak256(bytes(_metadata.intellectual_property_type)) == keccak256(bytes("flow")) ||
            keccak256(bytes(_metadata.intellectual_property_type)) == keccak256(bytes("model")) ||
            keccak256(bytes(_metadata.intellectual_property_type)) == keccak256(bytes("data")),
            "NFTMetadata: Invalid IP type. Must be flow, model, or data"
        );
        
        // Validate intellectual_property_storage
        require(
            keccak256(bytes(_metadata.intellectual_property_storage)) == keccak256(bytes("neuralabs")) ||
            keccak256(bytes(_metadata.intellectual_property_storage)) == keccak256(bytes("neuralabs-decentralized")) ||
            keccak256(bytes(_metadata.intellectual_property_storage)) == keccak256(bytes("custom")),
            "NFTMetadata: Invalid storage type. Must be neuralabs, neuralabs-decentralized, or custom"
        );
        
        metadataMap[_nftId] = _metadata;
        emit MetadataCreated(_nftId, _metadata);
    }

    /**
     * @dev Creates a replica of NFT metadata
     */
    function replicateNFT(uint256 _nftId, uint256 _replicaNFTId) external onlyAuthorized {
        require(_metadataExists(_nftId), "NFTMetadata: Original metadata does not exist");
        require(!_metadataExists(_replicaNFTId), "NFTMetadata: Replica metadata already exists");
        
        // Record replica relationship
        replicaMap[_nftId] = Replica({
            replicaNFTId: _replicaNFTId
        });
        
        // Copy metadata to replica NFT
        metadataMap[_replicaNFTId] = metadataMap[_nftId];
        
        emit ReplicaCreated(_nftId, replicaMap[_nftId]);
        emit MetadataCreated(_replicaNFTId, metadataMap[_replicaNFTId]);
    }

    /**
     * @dev Updates existing metadata
     */
    function updateMetadata(uint256 _nftId, Metadata memory _metadata) external {
        require(
            nftAccessControl.checkMinimumAccess(_nftId, msg.sender, NFTAccessControl.AccessLevel.EditData),
            "NFTMetadata: Insufficient access level"
        );
        require(_metadataExists(_nftId), "NFTMetadata: Metadata does not exist");
        
        // Validate intellectual_property_type
        require(
            keccak256(bytes(_metadata.intellectual_property_type)) == keccak256(bytes("flow")) ||
            keccak256(bytes(_metadata.intellectual_property_type)) == keccak256(bytes("model")) ||
            keccak256(bytes(_metadata.intellectual_property_type)) == keccak256(bytes("data")),
            "NFTMetadata: Invalid IP type. Must be flow, model, or data"
        );
        
        // Validate intellectual_property_storage
        require(
            keccak256(bytes(_metadata.intellectual_property_storage)) == keccak256(bytes("neuralabs")) ||
            keccak256(bytes(_metadata.intellectual_property_storage)) == keccak256(bytes("neuralabs-decentralized")) ||
            keccak256(bytes(_metadata.intellectual_property_storage)) == keccak256(bytes("custom")),
            "NFTMetadata: Invalid storage type. Must be neuralabs, neuralabs-decentralized, or custom"
        );
        
        metadataMap[_nftId] = _metadata;
        emit MetadataUpdated(_nftId, _metadata);
    }

    /**
     * @dev Removes metadata entry
     */
    function deleteMetadata(uint256 _nftId) external onlyAuthorized {
        require(_metadataExists(_nftId), "NFTMetadata: Metadata does not exist");
        
        delete metadataMap[_nftId];
        delete replicaMap[_nftId];
        
        emit MetadataDeleted(_nftId);
    }

    /**
     * @dev Retrieves metadata for an NFT
     */
    function getMetadata(uint256 _nftId) external view returns (Metadata memory) {
        require(_metadataExists(_nftId), "NFTMetadata: Metadata does not exist");
        return metadataMap[_nftId];
    }

    /**
     * @dev Checks if metadata exists for an NFT
     */
    function metadataExists(uint256 _nftId) external view returns (bool) {
        return bytes(metadataMap[_nftId].image).length > 0;
    }

    /**
     * @dev Internal check for metadata existence
     */
    function _metadataExists(uint256 _nftId) internal view returns (bool) {
        return bytes(metadataMap[_nftId].image).length > 0;
    }
}