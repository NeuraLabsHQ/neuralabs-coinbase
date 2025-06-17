# Complete NFT Monetization System Architecture

## System Overview and Purpose

This smart contract system implements an advanced NFT platform specifically designed for tokenizing and monetizing intellectual property (IP), particularly AI models, with sophisticated access control and multiple monetization models. The system enables creators to mint NFTs representing their IP with granular permission levels and various revenue models including pay-per-use, subscriptions, and direct sales. A key feature is IP type-based restrictions where "data" type intellectual property can only be monetized through buy-ownership, while "flow" and "model" types support all monetization options.

**Core Objectives:**
- Create NFTs representing intellectual property with comprehensive metadata
- Implement a 7-tier access control system with sales protection
- Enable multiple monetization models with commitment periods (restricted by IP type)
- Support locked NFTs with time-based unlocking mechanisms
- Maintain secure payment flows and AI service agreement management
- Protect paid users from unauthorized access revocation through immutable service agreements
- Enforce IP type-based monetization restrictions (data type limited to buy-ownership only)
- Prevent owners from bypassing service commitments through strict lock enforcement

**Key Innovation:** The system implements a novel locking mechanism tied to monetization commitments, ensuring creators cannot withdraw from service agreements prematurely while protecting user investments. The **AIServiceAgreementManagement** contract specifically treats each purchase as a binding service agreement, reflecting the professional nature of AI model provisioning. Creators must explicitly set commitment times and notice periods before enabling service-based monetization options. Critically, the buy-ownership option cannot bypass locked NFTs, preventing owners from escaping their service commitments by selling the NFT.

---

## Contract Deployment and Initialization Order

### 1. Deployment Sequence
The contracts must be deployed in the following order due to dependencies:

1. **MasterAccessControl** - No dependencies
2. **NFTAccessControl** - Requires MasterAccessControl address
3. **NFTMetadata** - Requires MasterAccessControl and NFTAccessControl addresses
4. **AIServiceAgreementManagement** - Requires MasterAccessControl and NFTAccessControl addresses
5. **NFTContract** - Requires MasterAccessControl, NFTAccessControl, and NFTMetadata addresses
6. **Monetization** - Requires all previous contract addresses

### 2. Post-Deployment Initialization

After deployment, the following initialization steps must be performed:

1. **Grant Cross-Contract Access via MasterAccessControl:**
   ```
   MasterAccessControl.grantAccess(NFTAccessControl, NFTContract)
   MasterAccessControl.grantAccess(NFTAccessControl, Monetization)
   MasterAccessControl.grantAccess(NFTAccessControl, AIServiceAgreementManagement)
   MasterAccessControl.grantAccess(NFTMetadata, NFTContract)
   MasterAccessControl.grantAccess(NFTMetadata, Monetization)
   MasterAccessControl.grantAccess(NFTContract, Monetization)
   MasterAccessControl.grantAccess(AIServiceAgreementManagement, Monetization)
   MasterAccessControl.grantAccess(AIServiceAgreementManagement, NFTAccessControl)
   ```

2. **Set Contract References in Monetization:**
   - Call `setContractReferences` with all contract addresses

3. **Set Initial Commission Percentage:**
   - Call `setCommissionPercentage` in Monetization contract

4. **Before Enabling Monetization Options:**
   - NFT owners must call `setCommitmentTime` with desired commitment timestamp
   - NFT owners must call `setNoticeBeforeUnlockCommitment` with notice period
   - These are required before enabling pay-per-use, subscription, or buy-access options

---

# MasterAccessControl

Central authorization contract managing permissions across all system contracts. Acts as the single source of truth for inter-contract communication permissions and system-wide access control.

**Purpose:** Provides unified access control mechanism preventing unauthorized contract interactions and enabling secure cross-contract communication.

## State Variables

### accessRights
- **Type:** `mapping(address => mapping(address => bool))`
- **Description:** Nested mapping tracking access permissions where first address is the contract being protected, second address is the caller, and boolean indicates if access is granted

## Events

### AccessGranted
- **Parameters:** `address indexed contractAddress, address indexed caller`
- **Description:** Emitted when access is granted to a caller for a specific contract

### AccessRevoked
- **Parameters:** `address indexed contractAddress, address indexed caller`
- **Description:** Emitted when access is revoked from a caller for a specific contract

## Functions

### constructor
- **Inputs:** None
- **Outputs:** None
- **Description:** Initializes the contract and grants the deployer access to the MasterAccessControl contract itself
- **Internal Logic:** 
  1. Sets `accessRights[address(this)][msg.sender] = true`
  2. Emits AccessGranted event

### grantAccess
- **Inputs:** `address _contract, address _caller`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Grants a caller access to interact with a specific contract
- **Internal Logic:** 
  1. Validates caller has authorization
  2. Sets `accessRights[_contract][_caller] = true`
  3. Emits AccessGranted event

### revokeAccess
- **Inputs:** `address _contract, address _caller`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Revokes a caller's access to interact with a specific contract
- **Internal Logic:** 
  1. Validates caller has authorization
  2. Sets `accessRights[_contract][_caller] = false`
  3. Emits AccessRevoked event

### grantSelfAccess
- **Inputs:** `address _addressToGrant`
- **Outputs:** None
- **Description:** Allows a contract to grant access to a specific address for itself
- **Internal Logic:** 
  1. Sets `accessRights[msg.sender][_addressToGrant] = true` where msg.sender is the calling contract
  2. Emits AccessGranted event
- **Usage:** Called by each contract during construction to grant deployer access

### revokeSelfAccess
- **Inputs:** `address _addressToRevoke`
- **Outputs:** None
- **Description:** Allows a contract to revoke access from a specific address for itself
- **Internal Logic:** 
  1. Sets `accessRights[msg.sender][_addressToRevoke] = false`
  2. Emits AccessRevoked event

### hasAccess
- **Inputs:** `address _contract, address _caller`
- **Outputs:** `bool`
- **Description:** Checks if a caller has access to a specific contract
- **Internal Logic:** Returns `accessRights[_contract][_caller]`

### selfCheckAccess
- **Inputs:** `address _addressToCheck`
- **Outputs:** `bool`
- **Description:** Allows contracts to check if an address has access to them
- **Internal Logic:** Returns `accessRights[msg.sender][_addressToCheck]` where msg.sender is the calling contract

---

# NFTContract

Core NFT contract implementing modified ERC721 standard with locking mechanism, ownership levels, and monetization integration.

**Purpose:** Manages NFT lifecycle with integrated locking system for monetization commitments, automatic permission management, and metadata handling.

## State Variables

### masterAccessControl
- **Type:** `MasterAccessControl`
- **Description:** Reference to MasterAccessControl contract for authorization

### nftAccessControl
- **Type:** `NFTAccessControl`
- **Description:** Reference to NFTAccessControl contract for managing NFT-specific permissions

### nftMetadata
- **Type:** `NFTMetadata`
- **Description:** Reference to NFTMetadata contract for managing NFT metadata

### monetization
- **Type:** `Monetization`
- **Description:** Reference to Monetization contract for payment handling and cleanup on burn

### nfts
- **Type:** `mapping(uint256 => NFTInfo)`
- **Description:** Maps token ID to NFT information structure

### locked
- **Type:** `mapping(uint256 => LockStatus)`
- **Description:** Maps token ID to lock status (1=locked, 2=unlocking, 3=can be unlocked, 4=unlocked)

### balances
- **Type:** `mapping(address => uint256)`
- **Description:** Tracks total number of NFTs owned by each address

### tokenApprovals
- **Type:** `mapping(uint256 => address)`
- **Description:** Maps token ID to approved address for transfers

### operatorApprovals
- **Type:** `mapping(address => mapping(address => bool))`
- **Description:** Tracks operator approvals for managing all NFTs of an owner

### totalSupply
- **Type:** `uint256`
- **Description:** Total number of NFTs minted (also serves as the next token ID)

### LockStatus (Enum)
- **Values:** Locked (1), Unlocking (2), CanBeUnlocked (3), Unlocked (4)
- **Description:** Represents the four states of NFT lock status

### NFTInfo (Struct)
- **levelOfOwnership:** `uint8` - Access level (1-6) granted to the NFT owner
- **name:** `string` - Name of the NFT
- **creator:** `address` - Original creator address
- **creationDate:** `uint256` - Timestamp of creation
- **owner:** `address` - Current owner address

## Events

### Transfer
- **Parameters:** `address indexed from, address indexed to, uint256 indexed tokenId`
- **Description:** Standard ERC721 transfer event

### Approval
- **Parameters:** `address indexed owner, address indexed approved, uint256 indexed tokenId`
- **Description:** Standard ERC721 approval event

### ApprovalForAll
- **Parameters:** `address indexed owner, address indexed operator, bool approved`
- **Description:** Standard ERC721 operator approval event

### NFTCreated
- **Parameters:** `uint256 indexed tokenId, string name, address creator`
- **Description:** Emitted when a new NFT is minted

### NFTBurned
- **Parameters:** `uint256 indexed tokenId`
- **Description:** Emitted when an NFT is burned

### NFTLocked
- **Parameters:** `uint256 indexed tokenId, LockStatus status`
- **Description:** Emitted when NFT lock status changes

## Functions

### constructor
- **Inputs:** `address _masterAccessControlAddress, address _nftAccessControlAddress, address _nftMetadataAddress, address _monetizationAddress`
- **Outputs:** None
- **Description:** Initializes contract with references to other system contracts
- **Internal Logic:** 
  1. Sets all contract references
  2. Calls `masterAccessControl.grantSelfAccess(msg.sender)`
  3. Initializes contract state

### createNFT
- **Inputs:** `string memory _name, uint8 _levelOfOwnership`
- **Outputs:** `uint256` (token ID)
- **Description:** Mints a new NFT with specified ownership level
- **Internal Logic:**
  1. Validates ownership level is between 1-6
  2. Increments totalSupply to get new token ID
  3. Creates NFTInfo struct with caller as creator and owner
  4. Sets initial lock status to Unlocked
  5. Updates balances mapping
  6. Calls `nftAccessControl.grantAccess` with AbsoluteOwnership level
  7. Emits NFTCreated and Transfer events

### burnNFT
- **Inputs:** `uint256 _tokenId`
- **Outputs:** None
- **Modifiers:** Only NFT owner can burn
- **Description:** Permanently destroys an NFT and cleans up associated data
- **Internal Logic:**
  1. Verifies caller owns the NFT
  2. Checks NFT is not locked (status must be Unlocked)
  3. Deletes NFT from storage
  4. Updates balance mappings
  5. Calls `nftMetadata.deleteMetadata` if metadata exists
  6. Calls `nftAccessControl.revokeAccess` for owner
  7. Calls `monetization.cleanupMonetization` to remove monetization data
  8. Emits NFTBurned and Transfer events

### lockNFT
- **Inputs:** `uint256 _tokenId`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Locks an NFT preventing transfers and burns
- **Internal Logic:**
  1. Validates caller authorization
  2. Requires current status is Unlocked
  3. Sets lock status to Locked
  4. Emits NFTLocked event

### startUnlocking
- **Inputs:** `uint256 _tokenId`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Initiates unlocking process
- **Internal Logic:**
  1. Validates caller authorization
  2. Requires current status is Locked
  3. Sets lock status to Unlocking
  4. Emits NFTLocked event

### markCanBeUnlocked
- **Inputs:** `uint256 _tokenId`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Marks NFT as ready to be unlocked
- **Internal Logic:**
  1. Validates caller authorization
  2. Requires current status is Unlocking
  3. Sets lock status to CanBeUnlocked
  4. Emits NFTLocked event

### unlockNFT
- **Inputs:** `uint256 _tokenId`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Completes unlocking process
- **Internal Logic:**
  1. Validates caller authorization
  2. Requires current status is CanBeUnlocked
  3. Sets lock status to Unlocked
  4. Emits NFTLocked event

### transferNFT
- **Inputs:** `uint256 _tokenId, address _to`
- **Outputs:** None
- **Description:** Convenience function that calls safeTransferFrom
- **Internal Logic:** 
  1. Checks NFT is not locked
  2. Calls `safeTransferFrom(msg.sender, _to, _tokenId)`

### getLockStatus
- **Inputs:** `uint256 _tokenId`
- **Outputs:** `LockStatus`
- **Description:** Returns current lock status of NFT
- **Internal Logic:** Returns value from locked mapping

### getNFTInfo
- **Inputs:** `uint256 _tokenId`
- **Outputs:** `NFTInfo memory`
- **Description:** Returns all information about an NFT
- **Internal Logic:** Returns the NFTInfo struct for the given token ID

### balanceOf
- **Inputs:** `address owner`
- **Outputs:** `uint256`
- **Description:** Returns number of NFTs owned by an address
- **Internal Logic:** Returns value from balances mapping

### ownerOf
- **Inputs:** `uint256 tokenId`
- **Outputs:** `address`
- **Description:** Returns the owner of a specific NFT
- **Internal Logic:** Returns owner field from NFTInfo struct, reverts if NFT doesn't exist

### safeTransferFrom
- **Inputs:** `address from, address to, uint256 tokenId, bytes memory data`
- **Outputs:** None
- **Description:** Transfers NFT with receiver contract check
- **Internal Logic:**
  1. Performs standard transfer
  2. Checks if receiver is a contract
  3. If contract, calls onERC721Received and verifies response

### transferFrom
- **Inputs:** `address from, address to, uint256 tokenId`
- **Outputs:** None
- **Description:** Transfers NFT ownership
- **Internal Logic:**
  1. Verifies caller is owner, approved, or operator
  2. Calls internal _transfer function

### approve
- **Inputs:** `address to, uint256 tokenId`
- **Outputs:** None
- **Description:** Approves another address to transfer a specific NFT
- **Internal Logic:**
  1. Verifies caller is owner or operator
  2. Sets approval in tokenApprovals mapping
  3. Emits Approval event

### setApprovalForAll
- **Inputs:** `address operator, bool approved`
- **Outputs:** None
- **Description:** Approves/revokes operator for all caller's NFTs
- **Internal Logic:** Updates operatorApprovals mapping and emits ApprovalForAll event

### getApproved
- **Inputs:** `uint256 tokenId`
- **Outputs:** `address`
- **Description:** Returns approved address for a token
- **Internal Logic:** Returns value from tokenApprovals mapping

### isApprovedForAll
- **Inputs:** `address owner, address operator`
- **Outputs:** `bool`
- **Description:** Checks if operator is approved for all owner's NFTs
- **Internal Logic:** Returns value from operatorApprovals mapping

### _transfer (Internal)
- **Inputs:** `address from, address to, uint256 tokenId`
- **Outputs:** None
- **Description:** Internal transfer logic with lock checking
- **Internal Logic:**
  1. Validates NFT is not locked
  2. Validates ownership and recipient
  3. Clears existing approvals
  4. Updates balances
  5. Changes owner in NFTInfo
  6. Gets current access level from nftAccessControl
  7. Revokes access from previous owner
  8. Grants same access level to new owner
  9. Emits Transfer event

---

# NFTAccessControl

Sophisticated access control system implementing 7 permission tiers with sales protection for purchased access.

**Purpose:** Enables complex licensing models with granular permissions while protecting paid users from unauthorized access revocation.

## State Variables

### accessControl
- **Type:** `MasterAccessControl`
- **Description:** Reference to MasterAccessControl for authorization

### aiServiceAgreementManagement
- **Type:** `AIServiceAgreementManagement`
- **Description:** Reference to AIServiceAgreementManagement for checking paid access

### AccessLevel (Enum)
- **Values:** None (0), UseModel (1), Resale (2), CreateReplica (3), ViewAndDownload (4), EditData (5), AbsoluteOwnership (6)
- **Description:** Defines the 7 access tiers

### nftAccess
- **Type:** `mapping(uint256 => mapping(address => AccessLevel))`
- **Description:** Maps token ID to user address to their access level

### defaultAccessLevel
- **Type:** `mapping(uint256 => AccessLevel)`
- **Description:** Default access level for all users per NFT

### maxAccessLevel
- **Type:** `mapping(uint256 => AccessLevel)`
- **Description:** Maximum access level that can be granted for each NFT

### userAccessList
- **Type:** `mapping(address => AccessEntry[])`
- **Description:** List of all NFT access entries for each user

### userAccessIndex
- **Type:** `mapping(address => mapping(uint256 => uint256))`
- **Description:** Maps user and token ID to index in userAccessList for efficient updates

### nftAccessList
- **Type:** `mapping(uint256 => UserAccess[])`
- **Description:** List of all users with access to each NFT

### nftAccessIndex
- **Type:** `mapping(uint256 => mapping(address => uint256))`
- **Description:** Maps token ID and user to index in nftAccessList

### AccessEntry (Struct)
- **nftId:** `uint256` - Token ID
- **accessLevel:** `AccessLevel` - Permission level

### UserAccess (Struct)
- **user:** `address` - User address
- **accessLevel:** `AccessLevel` - Permission level

## Events

### AccessGranted
- **Parameters:** `uint256 indexed nftId, address indexed user, AccessLevel accessLevel`
- **Description:** Emitted when access is granted to a user

### AccessRevoked
- **Parameters:** `uint256 indexed nftId, address indexed user`
- **Description:** Emitted when access is revoked from a user

### AccessLevelChanged
- **Parameters:** `address indexed user, uint256 indexed nftId, AccessLevel newAccessLevel`
- **Description:** Emitted when a user's access level changes

## Functions

### constructor
- **Inputs:** `address _accessControlAddress`
- **Outputs:** None
- **Description:** Initializes contract with reference to MasterAccessControl
- **Internal Logic:** Sets access control reference and grants self access

### setAIServiceAgreementManagement
- **Inputs:** `address _aiServiceAgreementManagementAddress`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Sets reference to AIServiceAgreementManagement contract
- **Internal Logic:** Updates aiServiceAgreementManagement reference

### setMaxAccessLevel
- **Inputs:** `uint256 _nftId, AccessLevel _accessLevel`
- **Outputs:** None
- **Modifiers:** Only authorized or NFT owner with AbsoluteOwnership
- **Description:** Sets the maximum access level that can be granted for an NFT
- **Internal Logic:** Updates maxAccessLevel mapping after validating caller permissions

### setDefaultAccessLevel
- **Inputs:** `uint256 _nftId, AccessLevel _accessLevel`
- **Outputs:** None
- **Modifiers:** Only authorized or NFT owner, must not exceed max access level
- **Description:** Sets default access level for all users
- **Internal Logic:** Updates defaultAccessLevel mapping after validation

### grantAccess
- **Inputs:** `uint256 _nftId, address _user, AccessLevel _accessLevel`
- **Outputs:** None
- **Modifiers:** Only authorized or NFT owner, must not exceed max access level
- **Description:** Grants specific access level to a user
- **Internal Logic:**
  1. Validates access level is not None and doesn't exceed max
  2. Updates nftAccess mapping
  3. Updates both user and NFT access lists
  4. Emits AccessGranted and AccessLevelChanged events

### revokeAccess
- **Inputs:** `uint256 _nftId, address _user`
- **Outputs:** None
- **Modifiers:** Only authorized
- **Description:** Removes all access permissions for a user with sales protection
- **Internal Logic:**
  1. Checks if user has active paid access via `aiServiceAgreementManagement.hasActiveAccess`
  2. If user has paid access, reverts with "Cannot revoke paid access"
  3. If no paid access, proceeds with revocation:
     - Deletes entries from nftAccess mapping
     - Removes from both user and NFT access lists
     - Updates indices
     - Emits AccessRevoked and AccessLevelChanged events

### getAllAccessForUser
- **Inputs:** `address _user`
- **Outputs:** `AccessEntry[] memory`
- **Description:** Returns all NFT access entries for a user
- **Internal Logic:** Returns the userAccessList array for the given address

### getAccessLevel
- **Inputs:** `uint256 _nftId, address _user`
- **Outputs:** `AccessLevel`
- **Description:** Returns user's access level for an NFT
- **Internal Logic:** Returns specific user access if set, otherwise returns default access level

### checkMinimumAccess
- **Inputs:** `uint256 _nftId, address _user, AccessLevel _accessLevel`
- **Outputs:** `bool`
- **Description:** Checks if user has at least the specified access level
- **Internal Logic:**
  1. First checks if default access level meets requirement
  2. If not, checks user's specific access level
  3. Returns true if either meets or exceeds required level

### getAllUsersAccessForNFT
- **Inputs:** `uint256 _nftId`
- **Outputs:** `UserAccess[] memory`
- **Description:** Returns all users with access to a specific NFT
- **Internal Logic:** Returns the nftAccessList array for the given token ID

### canRevokeAccess
- **Inputs:** `uint256 _nftId, address _user`
- **Outputs:** `bool`
- **Description:** Checks if access can be revoked (no active paid access)
- **Internal Logic:**
  1. If aiServiceAgreementManagement not set, returns true
  2. Returns false if user has active paid access
  3. Returns true otherwise

### _updateUserAccessList (Internal)
- **Inputs:** `address _user, uint256 _nftId, AccessLevel _accessLevel`
- **Outputs:** None
- **Description:** Updates user's access list when granting access
- **Internal Logic:**
  1. Checks if entry exists using index mapping
  2. If new entry, adds to list and updates index
  3. If existing, updates access level

### _updateNFTAccessList (Internal)
- **Inputs:** `uint256 _nftId, address _user, AccessLevel _accessLevel`
- **Outputs:** None
- **Description:** Updates NFT's user list when granting access
- **Internal Logic:** Similar to _updateUserAccessList but for NFT-centric view

### _updateUserAccessListOnRevoke (Internal)
- **Inputs:** `address _user, uint256 _nftId`
- **Outputs:** None
- **Description:** Removes entry from user's access list
- **Internal Logic:** Uses swap-and-pop pattern for efficient removal

### _updateNFTAccessListOnRevoke (Internal)
- **Inputs:** `uint256 _nftId, address _user`
- **Outputs:** None
- **Description:** Removes user from NFT's access list
- **Internal Logic:** Uses swap-and-pop pattern for efficient removal

---

# NFTMetadata

Manages intellectual property-specific metadata for NFTs including encryption, storage location, and versioning.

**Purpose:** Stores and manages structured metadata for IP NFTs with support for encrypted content and multiple storage providers.

## State Variables

### accessControl
- **Type:** `MasterAccessControl`
- **Description:** Reference to MasterAccessControl for authorization

### nftAccessControl
- **Type:** `NFTAccessControl`
- **Description:** Reference to NFTAccessControl for permission checks

### metadataMap
- **Type:** `mapping(uint256 => Metadata)`
- **Description:** Maps token ID to metadata structure

### replicaMap
- **Type:** `mapping(uint256 => Replica)`
- **Description:** Maps original NFT to its replica information

### Metadata (Struct)
- **image:** `string` - Visual representation URL
- **intellectual_property_type:** `string` - Type of IP (flow/model/data) - determines available monetization options
- **encrypted:** `bool` - Whether the IP is encrypted
- **encryption_id:** `string` - Encryption identifier if encrypted
- **intellectual_property_id:** `string` - Unique IP identifier
- **intellectual_property_storage:** `string` - Storage location (neuralabs/neuralabs-decentralized/custom)
- **md5:** `string` - MD5 hash of the IP content
- **version:** `string` - Version identifier

### Replica (Struct)
- **replicaNFTId:** `uint256` - Token ID of the replica

## Events

### MetadataCreated
- **Parameters:** `uint256 indexed nftId, Metadata metadata`
- **Description:** Emitted when metadata is created for an NFT

### MetadataUpdated
- **Parameters:** `uint256 indexed nftId, Metadata metadata`
- **Description:** Emitted when metadata is updated

### MetadataDeleted
- **Parameters:** `uint256 indexed nftId`
- **Description:** Emitted when metadata is deleted

### ReplicaCreated
- **Parameters:** `uint256 indexed nftId, Replica replica`
- **Description:** Emitted when a replica is created

## Functions

### constructor
- **Inputs:** `address _accessControlAddress, address _nftAccessControlAddress`
- **Outputs:** None
- **Description:** Initializes contract with references to access control contracts
- **Internal Logic:** Sets contract references and grants self access

### createMetadata
- **Inputs:** `uint256 _nftId, Metadata memory _metadata`
- **Outputs:** None
- **Description:** Creates new metadata entry for an NFT
- **Internal Logic:**
  1. Validates intellectual_property_type is one of: flow, model, data
  2. Validates intellectual_property_storage is one of: neuralabs, neuralabs-decentralized, custom
  3. Stores metadata in mapping
  4. Emits MetadataCreated event
- **Note:** If intellectual_property_type is "data", only buy-ownership monetization will be available for this NFT

### replicateNFT
- **Inputs:** `uint256 _nftId, uint256 _replicaNFTId`
- **Outputs:** None
- **Modifiers:** Only authorized
- **Description:** Creates a replica of NFT metadata
- **Internal Logic:**
  1. Verifies original metadata exists
  2. Records replica relationship
  3. Copies metadata to replica NFT
  4. Emits ReplicaCreated event

### updateMetadata
- **Inputs:** `uint256 _nftId, Metadata memory _metadata`
- **Outputs:** None
- **Modifiers:** Requires EditData access level or higher
- **Description:** Updates existing metadata
- **Internal Logic:**
  1. Checks caller has EditData access via nftAccessControl
  2. Verifies metadata exists
  3. Validates new metadata fields
  4. Overwrites with new metadata
  5. Emits MetadataUpdated event

### deleteMetadata
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** Only authorized
- **Description:** Removes metadata entry
- **Internal Logic:**
  1. Verifies metadata exists
  2. Deletes from storage
  3. Emits MetadataDeleted event

### getMetadata
- **Inputs:** `uint256 _nftId`
- **Outputs:** `Metadata memory`
- **Description:** Retrieves metadata for an NFT
- **Internal Logic:** Returns metadata from mapping, reverts if doesn't exist

### metadataExists
- **Inputs:** `uint256 _nftId`
- **Outputs:** `bool`
- **Description:** Checks if metadata exists for an NFT
- **Internal Logic:** Returns true if image field has content

### _metadataExists (Internal)
- **Inputs:** `uint256 _nftId`
- **Outputs:** `bool`
- **Description:** Internal check for metadata existence
- **Internal Logic:** Returns true if metadata has been set

---

# Monetization

Comprehensive monetization contract handling multiple revenue models with commitment periods and payment flows.

**Purpose:** Enables creators to monetize their NFTs through various models while managing commitments and ensuring proper payment distribution.

## State Variables

### masterAccessControl
- **Type:** `MasterAccessControl`
- **Description:** Reference for authorization

### nftContract
- **Type:** `NFTContract`
- **Description:** Reference for NFT operations

### nftAccessControl
- **Type:** `NFTAccessControl`
- **Description:** Reference for access management

### nftMetadata
- **Type:** `NFTMetadata`
- **Description:** Reference to NFTMetadata contract for checking IP type

### aiServiceAgreementManagement
- **Type:** `AIServiceAgreementManagement`
- **Description:** Reference for tracking sales

### commission_percentage
- **Type:** `uint256`
- **Description:** Platform commission percentage (0-100)

### monetization_combination
- **Type:** `mapping(uint256 => uint8)`
- **Description:** 5-bit binary representing enabled monetization options per NFT

### payPerUseData
- **Type:** `mapping(uint256 => PayPerUseStruct)`
- **Description:** Pay-per-use configuration per NFT

### subscriptionData
- **Type:** `mapping(uint256 => SubscriptionStruct)`
- **Description:** Subscription configuration per NFT

### buyAccessData
- **Type:** `mapping(uint256 => BuyAccessStruct)`
- **Description:** Access purchase configuration per NFT

### buyOwnershipData
- **Type:** `mapping(uint256 => BuyOwnershipStruct)`
- **Description:** Ownership purchase configuration per NFT

### buyReplicaData
- **Type:** `mapping(uint256 => BuyReplicaStruct)`
- **Description:** Replica purchase configuration per NFT

### subscriptionHandlerPublicKey
- **Type:** `address`
- **Description:** Address handling off-chain subscription and pay-per-use

### commitmentTime
- **Type:** `mapping(uint256 => uint256)`
- **Description:** Unix timestamp until which NFT cannot be transferred (must be set before enabling pay-per-use, subscription, or buy-access)

### noticeBeforeUnlockCommitment
- **Type:** `mapping(uint256 => uint256)`
- **Description:** Notice period in seconds before unlock (must be set before enabling pay-per-use, subscription, or buy-access)

### lockOpensDate
- **Type:** `mapping(uint256 => uint256)`
- **Description:** Timestamp when unlocking process can begin

## Structs

### PayPerUseStruct
- **cost_per_use:** `uint256` - Cost in USD per use
- **platform_cost_paid_by:** `address` - Who pays platform fees (user/owner)
- **enabled:** `bool` - Whether this option is active

### SubscriptionStruct
- **subscription_cost:** `uint256` - Cost per subscription period
- **subscription_time:** `uint256` - Period length in days
- **limit:** `uint256` - Call limit per period
- **limit_time:** `uint256` - Time window for limits in minutes
- **enabled:** `bool` - Whether this option is active

### BuyAccessStruct
- **access_level:** `AccessLevel` - Level of access granted
- **access_time:** `uint256` - Access duration in days (0 = indefinite)
- **cost:** `uint256` - Cost in wei
- **enabled:** `bool` - Whether this option is active

### BuyOwnershipStruct
- **cost:** `uint256` - Cost in wei
- **ownership_level:** `uint8` - Ownership level granted (1-6)
- **enabled:** `bool` - Whether this option is active

### BuyReplicaStruct
- **cost:** `uint256` - Cost in wei
- **ownership_level:** `uint8` - Ownership level for replica
- **enabled:** `bool` - Whether this option is active

## Events

### CommitmentTimeSet
- **Parameters:** `uint256 indexed nftId, uint256 timestamp`
- **Description:** Emitted when commitment time is set

### NoticeBeforeUnlockSet
- **Parameters:** `uint256 indexed nftId, uint256 seconds`
- **Description:** Emitted when notice period is set

### MonetizationEnabled
- **Parameters:** `uint256 indexed nftId, uint8 optionIndex`
- **Description:** Emitted when a monetization option is enabled

### MonetizationDisabled
- **Parameters:** `uint256 indexed nftId, uint8 optionIndex`
- **Description:** Emitted when a monetization option is disabled

### AllMonetizationOptionsSet
- **Parameters:** `uint256 indexed nftId, uint8 combination`
- **Description:** Emitted when all monetization options are set at once

### PaymentProcessed
- **Parameters:** `uint256 indexed nftId, address buyer, uint256 amount, string paymentType`
- **Description:** Emitted when a payment is processed

## Key Functions

### setCommissionPercentage
- **Inputs:** `uint256 _percentage`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Sets platform commission percentage
- **Internal Logic:**
  1. Validates percentage is 0-100
  2. Updates commission_percentage

### setCommitmentTime
- **Inputs:** `uint256 _nftId, uint256 _timestamp`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Sets the commitment time for an NFT
- **Internal Logic:**
  1. Validates caller owns the NFT
  2. Checks NFT is not locked (reverts with "Cannot change commitment while locked")
  3. Validates timestamp is in the future
  4. Updates commitmentTime mapping
  5. Emits CommitmentTimeSet event

### setNoticeBeforeUnlockCommitment
- **Inputs:** `uint256 _nftId, uint256 _seconds`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Sets the notice period before unlock
- **Internal Logic:**
  1. Validates caller owns the NFT
  2. Checks NFT is not locked (reverts with "Cannot change notice while locked")
  3. Validates notice period is reasonable (e.g., max 365 days)
  4. Updates noticeBeforeUnlockCommitment mapping
  5. Emits NoticeBeforeUnlockSet event

### enablePayPerUse
- **Inputs:** `uint256 _nftId, uint256 _costPerUse, address _platformCostPaidBy`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Enables pay-per-use monetization
- **Internal Logic:**
  1. Validates ownership and access level >= 3
  2. Checks IP type is not "data" (reverts with "Data type only supports buy-ownership")
  3. Checks commitment time is set (reverts with "Commitment time not set")
  4. Checks notice period is set (reverts with "Notice period not set")
  5. Checks not already enabled with buy-ownership
  6. Sets pay-per-use data
  7. Updates monetization_combination bit 0
  8. Locks NFT via nftContract.lockNFT
  9. Grants UseModel access to subscriptionHandlerPublicKey
  10. Emits MonetizationEnabled event

### enableSubscription
- **Inputs:** `uint256 _nftId, uint256 _cost, uint256 _time, uint256 _limit, uint256 _limitTime`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Enables subscription monetization
- **Internal Logic:**
  1. Validates ownership and access level >= 3
  2. Checks IP type is not "data" (reverts with "Data type only supports buy-ownership")
  3. Checks commitment time is set (reverts with "Commitment time not set")
  4. Checks notice period is set (reverts with "Notice period not set")
  5. Checks not enabled with buy-ownership
  6. Sets subscription data
  7. Updates monetization_combination bit 1
  8. Locks NFT
  9. Grants UseModel access to handler

### enableBuyAccess
- **Inputs:** `uint256 _nftId, AccessLevel _level, uint256 _accessTime, uint256 _cost`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Enables access purchase option
- **Internal Logic:**
  1. Validates ownership and access level >= 3
  2. Checks IP type is not "data" (reverts with "Data type only supports buy-ownership")
  3. Checks commitment time is set (reverts with "Commitment time not set")
  4. Checks notice period is set (reverts with "Notice period not set")
  5. Validates access_time <= remaining commitment time
  6. Sets buy-access data
  7. Updates monetization_combination bit 2
  8. If first monetization option, locks NFT

### enableBuyOwnership
- **Inputs:** `uint256 _nftId, uint256 _cost, uint8 _ownershipLevel`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Enables ownership purchase option (available for all IP types including data)
- **Internal Logic:**
  1. Validates ownership and access level >= 2
  2. No IP type restriction - available for all types
  3. Validates ownership level <= max ownership
  4. Sets buy-ownership data
  5. Updates monetization_combination bit 3
  6. Emits MonetizationEnabled event

### enableBuyReplica
- **Inputs:** `uint256 _nftId, uint256 _cost, uint8 _ownershipLevel`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Enables replica purchase option
- **Internal Logic:**
  1. Validates ownership and access level >= 3
  2. Checks IP type is not "data" (reverts with "Data type only supports buy-ownership")
  3. Validates ownership level <= max ownership
  4. Sets buy-replica data
  5. Updates monetization_combination bit 4
  6. Emits MonetizationEnabled event

### disablePayPerUse
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Disables pay-per-use monetization
- **Internal Logic:**
  1. Validates ownership
  2. Checks if pay-per-use is currently enabled
  3. Checks no active subscriptions via aiServiceAgreementManagement
  4. Revokes access from subscriptionHandlerPublicKey
  5. Clears pay-per-use data
  6. Updates monetization_combination bit 0 to 0
  7. If no other monetization options enabled, initiates unlock process
  8. Emits MonetizationDisabled event

### disableSubscription
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Disables subscription monetization
- **Internal Logic:**
  1. Validates ownership
  2. Checks if subscription is currently enabled
  3. Checks no active subscriptions via aiServiceAgreementManagement
  4. Revokes access from subscriptionHandlerPublicKey
  5. Clears subscription data
  6. Updates monetization_combination bit 1 to 0
  7. If no other monetization options enabled, initiates unlock process
  8. Emits MonetizationDisabled event

### disableBuyAccess
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Disables buy-access monetization
- **Internal Logic:**
  1. Validates ownership
  2. Checks if buy-access is currently enabled
  3. Checks no active access sales via aiServiceAgreementManagement
  4. Clears buy-access data
  5. Updates monetization_combination bit 2 to 0
  6. If no other monetization options enabled, initiates unlock process
  7. Emits MonetizationDisabled event

### disableBuyOwnership
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Disables buy-ownership monetization
- **Internal Logic:**
  1. Validates ownership
  2. Checks if buy-ownership is currently enabled
  3. Clears buy-ownership data
  4. Updates monetization_combination bit 3 to 0
  5. Emits MonetizationDisabled event

### disableBuyReplica
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Disables buy-replica monetization
- **Internal Logic:**
  1. Validates ownership
  2. Checks if buy-replica is currently enabled
  3. Clears buy-replica data
  4. Updates monetization_combination bit 4 to 0
  5. Emits MonetizationDisabled event

### buyOwnership
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Payable:** Yes
- **Description:** Purchase NFT ownership (no commitment time required, available for all IP types)
- **Internal Logic:**
  1. Validates buy-ownership is enabled
  2. Checks NFT is not locked (reverts with "Cannot sell locked NFT - commitment active")
  3. Checks msg.value meets price
  4. Calculates commission: `(msg.value * commission_percentage) / 100`
  5. Transfers commission to platform
  6. Transfers remaining to current owner
  7. Calls nftContract._transfer to transfer NFT
  8. Updates access levels
  9. Disables all monetization options

### buyReplica
- **Inputs:** `uint256 _nftId`
- **Outputs:** `uint256` (new NFT ID)
- **Payable:** Yes
- **Description:** Purchase NFT replica (not available for data type IP)
- **Internal Logic:**
  1. Validates buy-replica is enabled
  2. Checks msg.value meets price
  3. Handles payment distribution
  4. Calls nftContract.createNFT for buyer
  5. Calls nftMetadata.replicateNFT
  6. Sets ownership level on new NFT
  7. Returns new NFT ID

### buyAccess
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Payable:** Yes
- **Description:** Purchase temporary access within NFT commitment period
- **Internal Logic:**
  1. Validates buy-access is enabled
  2. Checks msg.value meets price
  3. Validates access duration doesn't exceed remaining commitment time
  4. Handles payment distribution
  5. Grants specified access level
  6. Records sale in aiServiceAgreementManagement
  7. Sets expiry based on access_time (cannot exceed commitment time)

### startUnlockProcess
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Initiates unlock process for committed NFT
- **Internal Logic:**
  1. Checks commitment time has passed OR no active subscriptions/sales
  2. Calls nftContract.startUnlocking
  3. Sets lockOpensDate to current time + notice period

### completeUnlock
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Completes unlock process
- **Internal Logic:**
  1. Verifies lock status is Unlocking
  2. Checks notice period has passed
  3. Calls nftContract.markCanBeUnlocked
  4. If no active subscriptions/sales, calls nftContract.unlockNFT

### setAllMonetizationOptions
- **Inputs:** Complex struct containing:
  - `uint256 nftId`
  - `uint256 commitmentTimestamp` - Unix timestamp for commitment (0 to skip)
  - `uint256 noticeSeconds` - Notice period in seconds (0 to skip)
  - `PayPerUseParams` (set enabled=false to disable)
  - `SubscriptionParams` (set enabled=false to disable)
  - `BuyAccessParams` (set enabled=false to disable)
  - `BuyOwnershipParams` (set enabled=false to disable)
  - `BuyReplicaParams` (set enabled=false to disable)
- **Outputs:** None
- **Description:** Composite function to enable/disable all monetization options at once
- **Internal Logic:**
  1. Validates NFT ownership
  2. Gets IP type from metadata
  3. If IP type is "data", validates only buy-ownership is being enabled
  4. If commitmentTimestamp provided, calls setCommitmentTime
  5. If noticeSeconds provided, calls setNoticeBeforeUnlockCommitment
  6. Validates option combinations (no pay-per-use/subscription with buy-ownership)
  7. For each option:
     - If enabled=true and not currently enabled, calls enable function
     - If enabled=false and currently enabled, calls disable function
  8. Ensures atomic update of all options
  9. Emits AllMonetizationOptionsSet event

### cleanupMonetization
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Modifiers:** Only NFTContract can call
- **Description:** Cleans up all monetization data when NFT is burned
- **Internal Logic:**
  1. Validates caller is NFTContract
  2. Disables all monetization options
  3. Clears all monetization data structures
  4. Revokes any handler access
  5. Resets commitment times

### getIPType (Internal Helper)
- **Inputs:** `uint256 _nftId`
- **Outputs:** `string memory`
- **Description:** Retrieves IP type from metadata
- **Internal Logic:**
  1. Calls nftMetadata.getMetadata(_nftId)
  2. Returns intellectual_property_type field
  3. Used internally to validate monetization options

---

# AIServiceAgreementManagement

Tracks and manages AI service agreements including purchased access rights and subscriptions to protect user investments.

**Purpose:** Maintains immutable records of all paid service agreements for AI models, preventing unauthorized revocation of purchased rights and ensuring compliance with service commitments. The contract name reflects its specific role in managing service-level agreements (SLAs) for AI model access, treating each purchase as a binding service agreement between the model owner and user.

## State Variables

### masterAccessControl
- **Type:** `MasterAccessControl`
- **Description:** Reference for authorization

### nftAccessControl
- **Type:** `NFTAccessControl`
- **Description:** Reference for access verification

### access_sale
- **Type:** `mapping(uint256 => mapping(address => AccessSaleDetails))`
- **Description:** NFT ID => User => Sale details

### subscription_sale
- **Type:** `mapping(uint256 => mapping(address => SubscriptionDetails))`
- **Description:** NFT ID => User => Subscription details

### total_active_access_sales
- **Type:** `mapping(uint256 => uint256)`
- **Description:** Count of active access sales per NFT

### total_active_subscriptions
- **Type:** `mapping(uint256 => uint256)`
- **Description:** Count of active subscriptions per NFT

## Structs

### AccessSaleDetails
- **amount:** `uint256` - Amount paid
- **purchase_date:** `uint256` - Purchase timestamp
- **expiry_date:** `uint256` - Access expiry (0 = indefinite)
- **access_level:** `AccessLevel` - Granted access level
- **active:** `bool` - Whether access is currently active

### SubscriptionDetails
- **amount:** `uint256` - Subscription fee paid
- **start_date:** `uint256` - Subscription start
- **end_date:** `uint256` - Current period end
- **auto_renew:** `bool` - Auto-renewal flag
- **active:** `bool` - Whether subscription is active

## Functions

### recordAccessSale
- **Inputs:** `uint256 _nftId, address _user, uint256 _amount, uint256 _duration, AccessLevel _level`
- **Outputs:** None
- **Modifiers:** Only Monetization contract
- **Description:** Records a new access purchase
- **Internal Logic:**
  1. Creates AccessSaleDetails struct
  2. Calculates expiry_date if duration > 0
  3. Updates mappings and counters
  4. Emits AccessSaleRecorded event

### recordSubscriptionSale
- **Inputs:** `uint256 _nftId, address _user, uint256 _amount, uint256 _duration`
- **Outputs:** None
- **Modifiers:** Only Monetization contract
- **Description:** Records a new subscription
- **Internal Logic:**
  1. Creates SubscriptionDetails struct
  2. Sets end_date based on duration
  3. Updates mappings and counters
  4. Emits SubscriptionRecorded event

### hasActiveAccess
- **Inputs:** `uint256 _nftId, address _user`
- **Outputs:** `bool`
- **Description:** Checks if user has any active paid access
- **Internal Logic:**
  1. Checks access_sale for active non-expired access
  2. Checks subscription_sale for active subscription
  3. Returns true if either is active

### getTotalActiveAccess
- **Inputs:** `uint256 _nftId`
- **Outputs:** `uint256`
- **Description:** Returns total active access sales
- **Internal Logic:** Returns sum of active access sales and subscriptions

### batchReevaluate
- **Inputs:** `uint256 _nftId, address[] memory _users`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Batch removes expired subscriptions/access
- **Internal Logic:**
  1. Iterates through user addresses
  2. For each user:
     - Checks if access has expired
     - Checks if subscription has ended
     - Deactivates expired entries
     - Updates counters
  3. Emits events for each change

---

# Information

Note to enable pay-per-use or subscription buy-replica, buy-access you need minimum access level of 3
for buy-ownership you need minimum level 2

**IP Type Restrictions:**
- **For "data" type intellectual property:** 
  - Only buy-ownership monetization option is available
  - All other monetization options (pay-per-use, subscription, buy-access, buy-replica) are disabled
  - No commitment time required since only buy-ownership is allowed
- **For "flow" and "model" type intellectual property:**
  - All monetization options are available based on access level

**Commitment Requirements:**
- Pay-per-use, subscription, and buy-access require commitment time and notice period to be set first
- Buy-ownership and buy-replica do not require commitment time
- Commitment times cannot be modified while NFT is locked

commitment-time: date before which the user cannot transfer ownership or sell the nft. Must be explicitly set before enabling pay-per-use, subscription, or buy-access options.

when setting these options the nft is locked. this cannot be unlocked until the time is up. user needs to manually unlock it before selling. (add a function for manually unlocking which check time and then calls the NFT manager functions)

The other case in which this can be disabled is when there is no other subscription

In this. notice before disable commitment. when the user disables or wants to disable a commitment and wants to actually unlock there. is a notice before disable commitment. unlock time. so when he wants to do this he has to complete this period.

so 

locked -- commitment time/no (subscription + access granted through monetization) --> if unlocked--unlocking stage -- notice time --> unlockable --> unlocked

for every nft monetization data can be

	1. pay-per-use: bool
	2. subscription : bool
	3. buy access : bool
	4. buy-ownership : bool
	5. buy-replica : bool

the user can have a combination of monetization option

Note user cannot enable buy-ownership along with pay-per-user or subscription due to commitment
so (11X1X 10X1X 01X1X) are not possible  

Note for data type intellectual property only buy ownership is available - attempting to enable any other option will revert with "Data type only supports buy-ownership"

for each the options there are structures 

# pay-per-use: 

variables 
	- cost per use
	- platform cost paid by

cost per use : amount in usd how much would it cost per user

platform_cost_paid_by: user/owner who will pay the platform charges (this is sepereate for commision)

if selecting pay-per-use the buy-ownership option is disabled automatically

# buy access

variables
	- level of access (1 -max access of nft) : note all max access of nft is from access contract
	- access time in days 0 for indefinite access, cannot be more than the commitment time 
	

# subscription:

variables 

	- subscription cost : subscription cost is cost per subscription time FLOAT
	- subscription time : time in days INT
	- limit : calls per time limits
	- limit-time : in minutes (time for which the limit applies)

# buy-ownership

variables

	- cost
	- ownership level - (1-6) (1-max ownership of NFT)


# buy-replica

variables
	- cost
	- ownership level on replication (1 - max ownership if NFT)

these all operations like providing access managing transfers are done by the monetization contract itself
so it will require other contracts to the deployed and access to them can be provided later .

this monetization contracts would have separate functions to enable and disable the monetization options
these separate functions would perform the checks and call the other contract functions to perform operations

functions 
	1. buy-ownership function that calls to transfer ownership if the price amount is met. transaction is in eth so it should first transfer eth to itself and then to the owner and then call the nft manager contract to transfer ownership. NFT must be unlocked for this to work.
	2. buy-replica function: same goes for this, transfer eth and then create replica nft with variables use logic that best works here 
	3. buy-access would also manage transfer of eth and call access management function to provide access to the respective user 
	

pay as you go and subscription wont have such logics and would be managed offchain but information is onchain

both pay-per-use and subscription manages access differently. They upon the owner activating this. the access for use (level 1) is provided to public key of `the account that would handle subscription and pay as you go model`

there will also be 10 functions to enable and disable the monetization options for each NFT (5 enable + 5 disable)

the monetization contract would also have a composite function that can be called to set all the 5 options like a single function call to set the complete monetization options by calling the 10 functions. This composite function also allows setting commitment time and notice period in the same transaction.

# how subscription and buy access is managed 

create another contract to manage access through subscription and buy access

this will have mapping of

	- access_sale: nft id => user => details (amount, date)
	- subscription_sale: nftid => user => details (amount, date) 
	- total active access_sale: nftid => number
	- toatl active subscription: nftid => number

this contract will be called to make entry when a user is buying an subscription or access

this function will be used to determine user current active sale for locks etc

if any subscription needs to be removed or re evaluated the owner can call

batch revaluate (nftid, [address array to be re evalauted] ) this will remove the subscription information of expired subscriptions

in the NFT access contract also use this to determine can is change the access in an nft

so add a logic in change access that it will query this contract to check if an particular address for a particular nft has been sold access or granted. if its still in the list and the access is not expired then owner or editor cannot remove them as they have paid for it 

these are the users who have got the access through sale rather than owner access so this is to user protection 

---

## System Control Flow

### 1. NFT Creation and Monetization Setup Flow

```
User → NFTContract.createNFT
    ├→ Mints NFT with ownership level
    ├→ Grants AbsoluteOwnership to creator
    └→ Returns tokenId

User → NFTMetadata.createMetadata
    └→ Stores IP metadata

User → Monetization.setCommitmentTime
    └→ Sets commitment end timestamp

User → Monetization.setNoticeBeforeUnlockCommitment
    └→ Sets notice period in seconds

User → Monetization.setAllMonetizationOptions
    ├→ Optionally updates commitment/notice
    ├→ Validates option combinations
    ├→ Validates commitment/notice are set for pay-per-use/subscription/buy-access
    ├→ Enables selected options
    ├→ Locks NFT if pay-per-use/subscription/buy-access
    └→ Manages access permissions
```

### 2. Access Purchase Flow

```
Buyer → Monetization.buyAccess (with payment)
    ├→ Validates payment amount
    ├→ Splits payment (commission + owner)
    ├→ NFTAccessControl.grantAccess
    ├→ AIServiceAgreementManagement.recordAccessSale
    └→ Emits purchase events
```

### 3. Ownership Transfer Flow

```
Buyer → Monetization.buyOwnership (with payment)
    ├→ Validates buy-ownership is enabled
    ├→ Checks NFT is NOT locked (reverts if locked)
    ├→ Processes payment
    ├→ NFTContract._transfer
    │   ├→ Updates ownership
    │   ├→ Transfers access rights
    │   └→ Clears approvals
    └→ Disables all monetization
```

### 4. NFT Unlock Flow

```
Owner → Monetization.startUnlockProcess
    ├→ Checks commitment time OR no active sales
    ├→ NFTContract.startUnlocking
    └→ Sets notice period timer

[After notice period]

Owner → Monetization.completeUnlock
    ├→ NFTContract.markCanBeUnlocked
    ├→ Checks no active subscriptions
    └→ NFTContract.unlockNFT
```

### 5. Access Revocation Protection Flow

```
Owner → NFTAccessControl.revokeAccess
    ├→ AIServiceAgreementManagement.hasActiveAccess
    ├→ If active: REVERT "Cannot revoke paid access"
    └→ If inactive: Proceed with revocation
```

### 6. Monetization Disable Flow

```
Owner → Monetization.disable[Option] (e.g., disablePayPerUse)
    ├→ Validates ownership
    ├→ Checks option is currently enabled
    ├→ For pay-per-use/subscription/buy-access:
    │   ├→ Checks no active subscriptions/sales
    │   └→ Revokes handler access if applicable
    ├→ Clears option data
    ├→ Updates monetization_combination
    └→ If no options remain and NFT is locked:
        └→ Initiates unlock process
```

---

## Key Features:

### **Monetization Options:**
1. **Pay-per-use**: Off-chain management with on-chain configuration (requires commitment time, not available for data type)
2. **Subscription**: Recurring access with limits (requires commitment time, not available for data type)
3. **Buy-access**: Time-limited or indefinite access purchase (requires commitment time, not available for data type)
4. **Buy-ownership**: Direct NFT purchase with ownership transfer (no commitment time required, available for all IP types, requires NFT to be unlocked)
5. **Buy-replica**: Create and purchase NFT copies (no commitment time required, not available for data type)

### **Monetization Management:**
- **10 Functions**: 5 enable functions + 5 disable functions for complete control
- **Composite Function**: setAllMonetizationOptions can enable/disable all options in one transaction
- **Disable Protection**: Options can only be disabled if no active users/subscriptions exist

### **Protection Mechanisms:**
- Users who purchased access cannot have it revoked (enforced by AIServiceAgreementManagement)
- NFTs with active monetization cannot be transferred until commitment ends
- Buy-ownership cannot be executed on locked NFTs (prevents commitment bypass)
- Commitment time and notice period must be set before enabling pay-per-use, subscription, or buy-access
- Commitment time cannot be changed while NFT is locked
- Notice period required before unlocking committed NFTs
- Monetization options can only be disabled if no active users exist
- Validation prevents incompatible monetization combinations
- Service agreements are immutable once created
- IP type "data" is restricted to buy-ownership monetization only

### **Control Flow Examples:**
- Detailed step-by-step flows for NFT creation, access purchase, ownership transfer
- Lock/unlock process with time-based conditions
- Access revocation protection flow via AIServiceAgreementManagement

### **Deployment and Initialization:**
The document includes critical setup information:
- Exact deployment order (6 contracts)
- Required cross-contract permissions (9 permission grants)
- Post-deployment initialization steps

---

## Security Considerations

1. **Reentrancy Protection:** All payment functions should use checks-effects-interactions pattern
2. **Access Control:** Every cross-contract call validates permissions via MasterAccessControl
3. **Lock State Management:** NFTs cannot be transferred/burned while locked
4. **Payment Protection:** Paid users cannot have access revoked while payment is active
5. **Overflow Protection:** Use SafeMath for all arithmetic operations
6. **Time Manipulation:** Use block.timestamp carefully for time-based logic
7. **Commitment Validation:** Functions revert with descriptive errors if commitment time or notice period not set
8. **Lock Protection:** Commitment times and notice periods cannot be changed while NFT is locked
9. **IP Type Validation:** Monetization options are restricted based on intellectual property type - data type only allows buy-ownership
10. **Buy-Ownership Lock Check:** buyOwnership must verify NFT is unlocked to prevent owners from escaping service commitments

---

## Gas Optimization Strategies

1. **Packed Structs:** Order struct members by size to minimize storage slots
2. **Minimal Storage Writes:** Cache frequently accessed values in memory
3. **Batch Operations:** Provide batch functions for multiple operations
4. **Event Emission:** Emit events instead of storing unnecessary data
5. **Access Patterns:** Use mappings for O(1) lookups instead of arrays where possible

---

This architecture enables sophisticated business models like:
- AI models with usage-based pricing and SLA guarantees
- Subscription services with commitment periods and service agreements
- Tiered access licensing with protected service terms
- Protected user investments through immutable agreement records
- Hybrid monetization strategies with professional service management

The system maintains security through comprehensive access controls, payment protection, and careful state management while optimizing for gas efficiency through strategic data structure choices. The **AIServiceAgreementManagement** contract ensures that all paid access is treated as a professional service agreement, providing enterprise-grade reliability for AI model provisioning.