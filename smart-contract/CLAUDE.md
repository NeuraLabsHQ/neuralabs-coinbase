# Enhanced NFT System with Monetization - Complete Architecture

## System Overview and Purpose

This smart contract system implements an advanced NFT platform specifically designed for tokenizing and monetizing intellectual property (IP), particularly AI models, with sophisticated access control and multiple monetization models. The system enables creators to mint NFTs representing their IP with granular permission levels and various revenue models including pay-per-use, subscriptions, and direct sales.

**Core Objectives:**
- Create NFTs representing intellectual property with comprehensive metadata
- Implement a 7-tier access control system with sales protection
- Enable multiple monetization models with commitment periods
- Support locked NFTs with time-based unlocking mechanisms
- Maintain secure payment flows and AI service agreement management
- Protect paid users from unauthorized access revocation through immutable service agreements

**Key Innovation:** The system implements a novel locking mechanism tied to monetization commitments, ensuring creators cannot withdraw from service agreements prematurely while protecting user investments. The **AIServiceAgreementManagement** contract specifically treats each purchase as a binding service agreement, reflecting the professional nature of AI model provisioning.

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
- **Description:** Reference to Monetization contract for payment handling

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

## Functions

### setAIServiceAgreementManagement
- **Inputs:** `address _aiServiceAgreementManagementAddress`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Sets reference to AIServiceAgreementManagement contract
- **Internal Logic:** Updates aiServiceAgreementManagement reference

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

### canRevokeAccess
- **Inputs:** `uint256 _nftId, address _user`
- **Outputs:** `bool`
- **Description:** Checks if access can be revoked (no active paid access)
- **Internal Logic:**
  1. If aiServiceAgreementManagement not set, returns true
  2. Returns false if user has active paid access
  3. Returns true otherwise

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
- **intellectual_property_type:** `string` - Type of IP (flow/model/data)
- **encrypted:** `bool` - Whether the IP is encrypted
- **encryption_id:** `string` - Encryption identifier if encrypted
- **intellectual_property_id:** `string` - Unique IP identifier
- **intellectual_property_storage:** `string` - Storage location (neuralabs/neuralabs-decentralized/custom)
- **md5:** `string` - MD5 hash of the IP content
- **version:** `string` - Version identifier

### Replica (Struct)
- **replicaNFTId:** `uint256` - Token ID of the replica

## Functions

### createMetadata
- **Inputs:** `uint256 _nftId, Metadata memory _metadata`
- **Outputs:** None
- **Description:** Creates new metadata entry for an NFT
- **Internal Logic:**
  1. Validates intellectual_property_type is one of: flow, model, data
  2. Validates intellectual_property_storage is one of: neuralabs, neuralabs-decentralized, custom
  3. Stores metadata in mapping
  4. Emits MetadataCreated event

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
- **Description:** Unix timestamp until which NFT cannot be transferred

### noticeBeforeUnlockCommitment
- **Type:** `mapping(uint256 => uint256)`
- **Description:** Notice period in seconds before unlock

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
- **commitment_time:** `uint256` - Days of commitment (0 = indefinite)
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

## Key Functions

### setCommissionPercentage
- **Inputs:** `uint256 _percentage`
- **Outputs:** None
- **Modifiers:** `onlyAuthorized`
- **Description:** Sets platform commission percentage
- **Internal Logic:**
  1. Validates percentage is 0-100
  2. Updates commission_percentage

### enablePayPerUse
- **Inputs:** `uint256 _nftId, uint256 _costPerUse, address _platformCostPaidBy`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Enables pay-per-use monetization
- **Internal Logic:**
  1. Validates ownership and access level >= 3
  2. Checks not already enabled with buy-ownership
  3. Sets pay-per-use data
  4. Updates monetization_combination bit 0
  5. Locks NFT via nftContract.lockNFT
  6. Sets commitment time to 100 years
  7. Grants UseModel access to subscriptionHandlerPublicKey

### enableSubscription
- **Inputs:** `uint256 _nftId, uint256 _cost, uint256 _time, uint256 _limit, uint256 _limitTime`
- **Outputs:** None
- **Modifiers:** NFT owner only
- **Description:** Enables subscription monetization
- **Internal Logic:**
  1. Similar validation to pay-per-use
  2. Sets subscription data
  3. Updates monetization_combination bit 1
  4. Locks NFT and sets commitment
  5. Grants UseModel access to handler

### buyOwnership
- **Inputs:** `uint256 _nftId`
- **Outputs:** None
- **Payable:** Yes
- **Description:** Purchase NFT ownership
- **Internal Logic:**
  1. Validates buy-ownership is enabled
  2. Checks msg.value meets price
  3. Calculates commission: `(msg.value * commission_percentage) / 100`
  4. Transfers commission to platform
  5. Transfers remaining to current owner
  6. Calls nftContract._transfer to transfer NFT
  7. Updates access levels
  8. Disables all monetization options
  9. Unlocks NFT

### buyReplica
- **Inputs:** `uint256 _nftId`
- **Outputs:** `uint256` (new NFT ID)
- **Payable:** Yes
- **Description:** Purchase NFT replica
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
- **Description:** Purchase temporary access
- **Internal Logic:**
  1. Validates buy-access is enabled
  2. Checks msg.value meets price
  3. Handles payment distribution
  4. Grants specified access level
  5. Records sale in aiServiceAgreementManagement
  6. Sets expiry based on access_time

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
- **Inputs:** Complex struct with all monetization parameters
- **Outputs:** None
- **Description:** Composite function to set all options at once
- **Internal Logic:**
  1. Validates option combinations (no pay-per-use/subscription with buy-ownership)
  2. Calls individual enable/disable functions
  3. Ensures atomic update of all options

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

### getTotalActiveAccess
- **Inputs:** `uint256 _nftId`
- **Outputs:** `uint256`
- **Description:** Returns total active access sales
- **Internal Logic:** Returns sum of active access sales and subscriptions

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

User → Monetization.setAllMonetizationOptions
    ├→ Validates option combinations
    ├→ Enables selected options
    ├→ Locks NFT if pay-per-use/subscription
    └→ Sets commitment periods
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
    ├→ Validates no active commitments
    ├→ Processes payment
    ├→ NFTContract._transfer
    │   ├→ Updates ownership
    │   ├→ Transfers access rights
    │   └→ Clears approvals
    ├→ Disables all monetization
    └→ Unlocks NFT
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

---

## Security Considerations

1. **Reentrancy Protection:** All payment functions should use checks-effects-interactions pattern
2. **Access Control:** Every cross-contract call validates permissions via MasterAccessControl
3. **Lock State Management:** NFTs cannot be transferred/burned while locked
4. **Payment Protection:** Paid users cannot have access revoked while payment is active
5. **Overflow Protection:** Use SafeMath for all arithmetic operations
6. **Time Manipulation:** Use block.timestamp carefully for time-based logic

---

## Gas Optimization Strategies

1. **Packed Structs:** Order struct members by size to minimize storage slots
2. **Minimal Storage Writes:** Cache frequently accessed values in memory
3. **Batch Operations:** Provide batch functions for multiple operations
4. **Event Emission:** Emit events instead of storing unnecessary data
5. **Access Patterns:** Use mappings for O(1) lookups instead of arrays where possible