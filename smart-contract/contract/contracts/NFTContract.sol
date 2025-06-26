// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./MasterAccessControl.sol";
import "./NFTAccessControl.sol";
import "./NFTMetadata.sol";

interface IMonetization {
    function cleanupMonetization(uint256 _nftId) external;
}

/**
 * @title NFTContract
 * @dev Core NFT contract implementing modified ERC721 standard with locking mechanism
 */
contract NFTContract is IERC721, ERC165 {
    // Reference to MasterAccessControl contract for authorization
    MasterAccessControl public masterAccessControl;
    
    // Reference to NFTAccessControl contract for managing NFT-specific permissions
    NFTAccessControl public nftAccessControl;
    
    // Reference to NFTMetadata contract for managing NFT metadata
    NFTMetadata public nftMetadata;
    
    // Reference to Monetization contract for payment handling and cleanup on burn
    IMonetization public monetization;

    // Lock status enumeration
    enum LockStatus {
        Locked,         // 1 - NFT is locked
        Unlocking,      // 2 - Unlock process initiated
        CanBeUnlocked,  // 3 - Ready to be unlocked
        Unlocked        // 4 - NFT is unlocked
    }

    // NFT information structure
    struct NFTInfo {
        uint8 levelOfOwnership;     // Access level (1-6) granted to the NFT owner
        string name;                // Name of the NFT
        address creator;            // Original creator address
        uint256 creationDate;       // Timestamp of creation
        address owner;              // Current owner address
    }

    // Maps token ID to NFT information structure
    mapping(uint256 => NFTInfo) public nfts;
    
    // Maps token ID to lock status
    mapping(uint256 => LockStatus) public locked;
    
    // Tracks total number of NFTs owned by each address
    mapping(address => uint256) private balances;
    
    // Maps token ID to approved address for transfers
    mapping(uint256 => address) private tokenApprovals;
    
    // Tracks operator approvals for managing all NFTs of an owner
    mapping(address => mapping(address => bool)) private operatorApprovals;
    
    // Total number of NFTs minted (also serves as the next token ID)
    uint256 public totalSupply;

    // Events
    event NFTCreated(uint256 indexed tokenId, string name, address creator);
    event NFTBurned(uint256 indexed tokenId);
    event NFTLocked(uint256 indexed tokenId, LockStatus status);

    /**
     * @dev Modifier to check if caller is authorized
     */
    modifier onlyAuthorized() {
        require(
            masterAccessControl.selfCheckAccess(msg.sender),
            "NFTContract: Caller not authorized"
        );
        _;
    }

    /**
     * @dev Constructor initializes contract with references to other system contracts
     */
    constructor(
        address _masterAccessControlAddress,
        address _nftAccessControlAddress,
        address _nftMetadataAddress,
        address _monetizationAddress
    ) {
        require(_masterAccessControlAddress != address(0), "NFTContract: Invalid master access control address");
        require(_nftAccessControlAddress != address(0), "NFTContract: Invalid NFT access control address");
        require(_nftMetadataAddress != address(0), "NFTContract: Invalid NFT metadata address");
        
        masterAccessControl = MasterAccessControl(_masterAccessControlAddress);
        nftAccessControl = NFTAccessControl(_nftAccessControlAddress);
        nftMetadata = NFTMetadata(_nftMetadataAddress);
        
        // Monetization can be set later
        if (_monetizationAddress != address(0)) {
            monetization = IMonetization(_monetizationAddress);
        }
        
        masterAccessControl.grantSelfAccess(msg.sender);
    }

    /**
     * @dev Set monetization contract address (can be called after deployment)
     */
    function setMonetizationContract(address _monetizationAddress) external onlyAuthorized {
        require(_monetizationAddress != address(0), "NFTContract: Invalid monetization address");
        monetization = IMonetization(_monetizationAddress);
    }

    /**
     * @dev Mints a new NFT with specified ownership level
     */
    function createNFT(string memory _name, uint8 _levelOfOwnership) external returns (uint256) {
        require(_levelOfOwnership >= 1 && _levelOfOwnership <= 6, "NFTContract: Invalid ownership level");
        require(bytes(_name).length > 0, "NFTContract: Name cannot be empty");
        
        uint256 tokenId = totalSupply;
        totalSupply++;
        
        nfts[tokenId] = NFTInfo({
            levelOfOwnership: _levelOfOwnership,
            name: _name,
            creator: msg.sender,
            creationDate: block.timestamp,
            owner: msg.sender
        });
        
        locked[tokenId] = LockStatus.Unlocked;
        balances[msg.sender]++;
        
        // Set max access level to AbsoluteOwnership for the new NFT
        nftAccessControl.setMaxAccessLevel(tokenId, NFTAccessControl.AccessLevel.AbsoluteOwnership);
        
        // Grant absolute ownership access to creator
        nftAccessControl.grantAccess(tokenId, msg.sender, NFTAccessControl.AccessLevel.AbsoluteOwnership);
        
        emit NFTCreated(tokenId, _name, msg.sender);
        emit Transfer(address(0), msg.sender, tokenId);
        
        return tokenId;
    }

    /**
     * @dev Permanently destroys an NFT and cleans up associated data
     */
    function burnNFT(uint256 _tokenId) external {
        require(_exists(_tokenId), "NFTContract: NFT does not exist");
        require(nfts[_tokenId].owner == msg.sender, "NFTContract: Only owner can burn");
        require(locked[_tokenId] == LockStatus.Unlocked, "NFTContract: Cannot burn locked NFT");
        
        address owner = nfts[_tokenId].owner;
        
        // Delete NFT from storage
        delete nfts[_tokenId];
        delete locked[_tokenId];
        delete tokenApprovals[_tokenId];
        
        balances[owner]--;
        
        // Delete metadata if exists
        if (nftMetadata.metadataExists(_tokenId)) {
            nftMetadata.deleteMetadata(_tokenId);
        }
        
        // Revoke access
        nftAccessControl.revokeAccess(_tokenId, owner);
        
        // Cleanup monetization if contract is set
        if (address(monetization) != address(0)) {
            monetization.cleanupMonetization(_tokenId);
        }
        
        emit NFTBurned(_tokenId);
        emit Transfer(owner, address(0), _tokenId);
    }

    /**
     * @dev Locks an NFT preventing transfers and burns
     */
    function lockNFT(uint256 _tokenId) external onlyAuthorized {
        require(_exists(_tokenId), "NFTContract: NFT does not exist");
        require(locked[_tokenId] == LockStatus.Unlocked, "NFTContract: NFT already locked");
        
        locked[_tokenId] = LockStatus.Locked;
        emit NFTLocked(_tokenId, LockStatus.Locked);
    }

    /**
     * @dev Initiates unlocking process
     */
    function startUnlocking(uint256 _tokenId) external onlyAuthorized {
        require(_exists(_tokenId), "NFTContract: NFT does not exist");
        require(locked[_tokenId] == LockStatus.Locked, "NFTContract: NFT not locked");
        
        locked[_tokenId] = LockStatus.Unlocking;
        emit NFTLocked(_tokenId, LockStatus.Unlocking);
    }

    /**
     * @dev Marks NFT as ready to be unlocked
     */
    function markCanBeUnlocked(uint256 _tokenId) external onlyAuthorized {
        require(_exists(_tokenId), "NFTContract: NFT does not exist");
        require(locked[_tokenId] == LockStatus.Unlocking, "NFTContract: NFT not in unlocking state");
        
        locked[_tokenId] = LockStatus.CanBeUnlocked;
        emit NFTLocked(_tokenId, LockStatus.CanBeUnlocked);
    }

    /**
     * @dev Completes unlocking process
     */
    function unlockNFT(uint256 _tokenId) external onlyAuthorized {
        require(_exists(_tokenId), "NFTContract: NFT does not exist");
        require(locked[_tokenId] == LockStatus.CanBeUnlocked, "NFTContract: NFT cannot be unlocked yet");
        
        locked[_tokenId] = LockStatus.Unlocked;
        emit NFTLocked(_tokenId, LockStatus.Unlocked);
    }

    /**
     * @dev Convenience function that calls safeTransferFrom
     */
    function transferNFT(uint256 _tokenId, address _to) external {
        safeTransferFrom(msg.sender, _to, _tokenId);
    }

    /**
     * @dev Returns current lock status of NFT
     */
    function getLockStatus(uint256 _tokenId) external view returns (LockStatus) {
        require(_exists(_tokenId), "NFTContract: NFT does not exist");
        return locked[_tokenId];
    }

    /**
     * @dev Returns all information about an NFT
     */
    function getNFTInfo(uint256 _tokenId) external view returns (NFTInfo memory) {
        require(_exists(_tokenId), "NFTContract: NFT does not exist");
        return nfts[_tokenId];
    }

    /**
     * @dev See {IERC721-balanceOf}
     */
    function balanceOf(address owner) public view override returns (uint256) {
        require(owner != address(0), "NFTContract: Balance query for zero address");
        return balances[owner];
    }

    /**
     * @dev See {IERC721-ownerOf}
     */
    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = nfts[tokenId].owner;
        require(owner != address(0), "NFTContract: Owner query for nonexistent token");
        return owner;
    }

    /**
     * @dev See {IERC721-safeTransferFrom}
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "NFTContract: Transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, data);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-transferFrom}
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "NFTContract: Transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-approve}
     */
    function approve(address to, uint256 tokenId) public override {
        address owner = ownerOf(tokenId);
        require(to != owner, "NFTContract: Approval to current owner");
        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "NFTContract: Approve caller is not owner nor approved for all"
        );

        tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}
     */
    function setApprovalForAll(address operator, bool approved) public override {
        require(operator != msg.sender, "NFTContract: Approve to caller");
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /**
     * @dev See {IERC721-getApproved}
     */
    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_exists(tokenId), "NFTContract: Approved query for nonexistent token");
        return tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-isApprovedForAll}
     */
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return operatorApprovals[owner][operator];
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Internal transfer logic with lock checking
     */
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "NFTContract: Transfer from incorrect owner");
        require(to != address(0), "NFTContract: Transfer to zero address");
        require(locked[tokenId] == LockStatus.Unlocked, "NFTContract: Cannot transfer locked NFT");

        // Clear approvals
        delete tokenApprovals[tokenId];

        // Update balances
        balances[from]--;
        balances[to]++;
        
        // Update owner
        nfts[tokenId].owner = to;

        // Transfer access rights
        NFTAccessControl.AccessLevel currentAccessLevel = nftAccessControl.getAccessLevel(tokenId, from);
        nftAccessControl.revokeAccess(tokenId, from);
        nftAccessControl.grantAccess(tokenId, to, currentAccessLevel);

        emit Transfer(from, to, tokenId);
    }

    /**
     * @dev Internal safe transfer implementation
     */
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "NFTContract: Transfer to non ERC721Receiver implementer");
    }

    /**
     * @dev Returns whether `tokenId` exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return nfts[tokenId].owner != address(0);
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_exists(tokenId), "NFTContract: Operator query for nonexistent token");
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    /**
     * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address
     */
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (isContract(to)) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("NFTContract: Transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    /**
     * @dev Returns true if `account` is a contract
     */
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}