# Smart Contract Function List

## MasterAccessControl.sol

### State Variables
- `accessRights`: mapping(address => mapping(address => bool))

### Functions
- `constructor()` -- Events: AccessGranted -- Grants deployer access to MasterAccessControl itself
- `grantAccess(address _contract, address _caller) external onlyAuthorized` -- Events: AccessGranted -- Grants caller access to interact with specific contract
- `revokeAccess(address _contract, address _caller) external onlyAuthorized` -- Events: AccessRevoked -- Revokes caller's access to interact with specific contract
- `grantSelfAccess(address _addressToGrant) external` -- Events: AccessGranted -- Allows contract to grant access to address for itself
- `revokeSelfAccess(address _addressToRevoke) external` -- Events: AccessRevoked -- Allows contract to revoke access from address for itself
- `hasAccess(address _contract, address _caller) external view returns (bool)` -- Checks if caller has access to specific contract
- `selfCheckAccess(address _addressToCheck) external view returns (bool)` -- Allows contracts to check if address has access to them

## NFTAccessControl.sol

### State Variables
- `accessControl`: MasterAccessControl
- `aiServiceAgreementManagement`: IAIServiceAgreementManagement
- `nftAccess`: mapping(uint256 => mapping(address => AccessLevel))
- `defaultAccessLevel`: mapping(uint256 => AccessLevel)
- `maxAccessLevel`: mapping(uint256 => AccessLevel)
- `userAccessList`: mapping(address => AccessEntry[])
- `nftAccessList`: mapping(uint256 => UserAccess[])

### Functions
- `constructor(address _accessControlAddress)` -- Initializes contract with reference to MasterAccessControl
- `setAIServiceAgreementManagement(address _aiServiceAgreementManagementAddress) external` -- Sets reference to AIServiceAgreementManagement contract
- `setMaxAccessLevel(uint256 _nftId, AccessLevel _accessLevel) external onlyAuthorizedOrOwner` -- Sets maximum access level that can be granted for NFT
- `setDefaultAccessLevel(uint256 _nftId, AccessLevel _accessLevel) external onlyAuthorizedOrOwner` -- Sets default access level for all users
- `grantAccess(uint256 _nftId, address _user, AccessLevel _accessLevel) external onlyAuthorizedOrOwner` -- Events: AccessGranted, AccessLevelChanged -- Grants specific access level to a user
- `revokeAccess(uint256 _nftId, address _user) external` -- Events: AccessRevoked, AccessLevelChanged -- Removes all access permissions with sales protection
- `getAllAccessForUser(address _user) external view returns (AccessEntry[] memory)` -- Returns all NFT access entries for a user
- `getAccessLevel(uint256 _nftId, address _user) external view returns (AccessLevel)` -- Returns user's access level for an NFT
- `checkMinimumAccess(uint256 _nftId, address _user, AccessLevel _accessLevel) external view returns (bool)` -- Checks if user has at least specified access level
- `getAllUsersAccessForNFT(uint256 _nftId) external view returns (UserAccess[] memory)` -- Returns all users with access to specific NFT
- `canRevokeAccess(uint256 _nftId, address _user) external view returns (bool)` -- Checks if access can be revoked (no active paid access)

## NFTContract.sol

### State Variables
- `masterAccessControl`: MasterAccessControl
- `nftAccessControl`: NFTAccessControl
- `nftMetadata`: NFTMetadata
- `monetization`: IMonetization
- `nfts`: mapping(uint256 => NFTInfo)
- `locked`: mapping(uint256 => LockStatus)
- `balances`: mapping(address => uint256)
- `totalSupply`: uint256

### Functions
- `constructor(address _masterAccessControlAddress, address _nftAccessControlAddress, address _nftMetadataAddress, address _monetizationAddress)` -- Initializes contract with references to system contracts
- `setMonetizationContract(address _monetizationAddress) external onlyAuthorized` -- Set monetization contract address after deployment
- `createNFT(string memory _name, uint8 _levelOfOwnership) external returns (uint256)` -- Events: NFTCreated, Transfer -- Mints new NFT with specified ownership level
- `burnNFT(uint256 _tokenId) external` -- Events: NFTBurned, Transfer -- Permanently destroys NFT and cleans up associated data
- `lockNFT(uint256 _tokenId) external onlyAuthorized` -- Events: NFTLocked -- Locks NFT preventing transfers and burns
- `startUnlocking(uint256 _tokenId) external onlyAuthorized` -- Events: NFTLocked -- Initiates unlocking process
- `markCanBeUnlocked(uint256 _tokenId) external onlyAuthorized` -- Events: NFTLocked -- Marks NFT as ready to be unlocked
- `unlockNFT(uint256 _tokenId) external onlyAuthorized` -- Events: NFTLocked -- Completes unlocking process
- `transferNFT(uint256 _tokenId, address _to) external` -- Convenience function that calls safeTransferFrom
- `getLockStatus(uint256 _tokenId) external view returns (LockStatus)` -- Returns current lock status of NFT
- `getNFTInfo(uint256 _tokenId) external view returns (NFTInfo memory)` -- Returns all information about an NFT
- `balanceOf(address owner) public view override returns (uint256)` -- Returns number of NFTs owned by address
- `ownerOf(uint256 tokenId) public view override returns (address)` -- Returns owner address of specific token
- `safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override` -- Events: Transfer -- Safely transfers NFT with data
- `safeTransferFrom(address from, address to, uint256 tokenId) public override` -- Events: Transfer -- Safely transfers NFT without data
- `transferFrom(address from, address to, uint256 tokenId) public override` -- Events: Transfer -- Transfers NFT ownership
- `approve(address to, uint256 tokenId) public override` -- Events: Approval -- Approves address to transfer specific NFT
- `setApprovalForAll(address operator, bool approved) public override` -- Events: ApprovalForAll -- Sets operator approval for all NFTs
- `getApproved(uint256 tokenId) public view override returns (address)` -- Returns approved address for specific token
- `isApprovedForAll(address owner, address operator) public view override returns (bool)` -- Checks if operator is approved for all tokens
- `supportsInterface(bytes4 interfaceId) public view virtual override returns (bool)` -- Checks if contract supports specific interface

## NFTMetadata.sol

### State Variables
- `accessControl`: MasterAccessControl
- `nftAccessControl`: NFTAccessControl
- `metadataMap`: mapping(uint256 => Metadata)
- `replicaMap`: mapping(uint256 => Replica)

### Functions
- `constructor(address _accessControlAddress, address _nftAccessControlAddress)` -- Initializes contract with access control references
- `createMetadata(uint256 _nftId, Metadata memory _metadata) external` -- Events: MetadataCreated -- Creates new metadata entry for an NFT
- `replicateNFT(uint256 _nftId, uint256 _replicaNFTId) external onlyAuthorized` -- Events: ReplicaCreated, MetadataCreated -- Creates replica of NFT metadata
- `updateMetadata(uint256 _nftId, Metadata memory _metadata) external` -- Events: MetadataUpdated -- Updates existing metadata
- `deleteMetadata(uint256 _nftId) external onlyAuthorized` -- Events: MetadataDeleted -- Removes metadata entry
- `getMetadata(uint256 _nftId) external view returns (Metadata memory)` -- Retrieves metadata for an NFT
- `metadataExists(uint256 _nftId) external view returns (bool)` -- Checks if metadata exists for an NFT

## AIServiceAgreementManagement.sol

### State Variables
- `masterAccessControl`: MasterAccessControl
- `nftAccessControl`: NFTAccessControl
- `access_sale`: mapping(uint256 => mapping(address => AccessSaleDetails))
- `subscription_sale`: mapping(uint256 => mapping(address => SubscriptionDetails))
- `total_active_access_sales`: mapping(uint256 => uint256)
- `total_active_subscriptions`: mapping(uint256 => uint256)

### Functions
- `constructor(address _masterAccessControlAddress, address _nftAccessControlAddress)` -- Initializes contract with references
- `recordAccessSale(uint256 _nftId, address _user, uint256 _amount, uint256 _duration, NFTAccessControl.AccessLevel _level) external onlyAuthorized` -- Events: AccessSaleRecorded -- Records new access purchase
- `recordSubscriptionSale(uint256 _nftId, address _user, uint256 _amount, uint256 _duration) external onlyAuthorized` -- Events: SubscriptionRecorded -- Records new subscription
- `hasActiveAccess(uint256 _nftId, address _user) external view returns (bool)` -- Checks if user has any active paid access
- `getTotalActiveAccess(uint256 _nftId) external view returns (uint256)` -- Returns total active access sales and subscriptions
- `batchReevaluate(uint256 _nftId, address[] memory _users) external onlyNFTOwner` -- Events: AccessExpired, SubscriptionExpired -- Batch removes expired subscriptions/access
- `getAccessSaleDetails(uint256 _nftId, address _user) external view returns (AccessSaleDetails memory)` -- Get access sale details for user
- `getSubscriptionDetails(uint256 _nftId, address _user) external view returns (SubscriptionDetails memory)` -- Get subscription details for user
- `hasActiveSubscriptions(uint256 _nftId) external view returns (bool)` -- Check if NFT has any active subscriptions
- `hasActiveAccessSales(uint256 _nftId) external view returns (bool)` -- Check if NFT has any active access sales

## Monetization.sol

### State Variables
- `masterAccessControl`: MasterAccessControl
- `nftContract`: NFTContract
- `nftAccessControl`: NFTAccessControl
- `nftMetadata`: NFTMetadata
- `aiServiceAgreementManagement`: AIServiceAgreementManagement
- `commission_percentage`: uint256
- `subscriptionHandlerPublicKey`: address
- `monetization_combination`: mapping(uint256 => uint8)
- `payPerUseData`: mapping(uint256 => PayPerUseStruct)
- `subscriptionData`: mapping(uint256 => SubscriptionStruct)
- `buyAccessData`: mapping(uint256 => BuyAccessStruct)
- `buyOwnershipData`: mapping(uint256 => BuyOwnershipStruct)
- `buyReplicaData`: mapping(uint256 => BuyReplicaStruct)
- `commitmentTime`: mapping(uint256 => uint256)
- `noticeBeforeUnlockCommitment`: mapping(uint256 => uint256)
- `lockOpensDate`: mapping(uint256 => uint256)

### Functions
- `constructor(address _masterAccessControlAddress, address _nftContractAddress, address _nftAccessControlAddress, address _nftMetadataAddress, address _aiServiceAgreementManagementAddress)` -- Initializes contract with system references
- `setContractReferences(address _subscriptionHandler) external onlyAuthorized` -- Set contract references for post-deployment setup
- `setCommissionPercentage(uint256 _percentage) external onlyAuthorized` -- Sets platform commission percentage
- `setCommitmentTime(uint256 _nftId, uint256 _timestamp) external onlyNFTOwner` -- Events: CommitmentTimeSet -- Sets commitment time for an NFT
- `setNoticeBeforeUnlockCommitment(uint256 _nftId, uint256 _seconds) external onlyNFTOwner` -- Events: NoticeBeforeUnlockSet -- Sets notice period before unlock
- `enablePayPerUse(uint256 _nftId, uint256 _costPerUse, address _platformCostPaidBy) external onlyNFTOwner` -- Events: MonetizationEnabled -- Enables pay-per-use monetization
- `enableSubscription(uint256 _nftId, uint256 _cost, uint256 _time, uint256 _limit, uint256 _limitTime) external onlyNFTOwner` -- Events: MonetizationEnabled -- Enables subscription monetization
- `enableBuyAccess(uint256 _nftId, NFTAccessControl.AccessLevel _level, uint256 _accessTime, uint256 _cost) external onlyNFTOwner` -- Events: MonetizationEnabled -- Enables access purchase option
- `enableBuyOwnership(uint256 _nftId, uint256 _cost, uint8 _ownershipLevel) external onlyNFTOwner` -- Events: MonetizationEnabled -- Enables ownership purchase option
- `enableBuyReplica(uint256 _nftId, uint256 _cost, uint8 _ownershipLevel) external onlyNFTOwner` -- Events: MonetizationEnabled -- Enables replica purchase option
- `disablePayPerUse(uint256 _nftId) external onlyNFTOwner` -- Events: MonetizationDisabled -- Disables pay-per-use monetization
- `disableSubscription(uint256 _nftId) external onlyNFTOwner` -- Events: MonetizationDisabled -- Disables subscription monetization
- `disableBuyAccess(uint256 _nftId) external onlyNFTOwner` -- Events: MonetizationDisabled -- Disables buy-access monetization
- `disableBuyOwnership(uint256 _nftId) external onlyNFTOwner` -- Events: MonetizationDisabled -- Disables buy-ownership monetization
- `disableBuyReplica(uint256 _nftId) external onlyNFTOwner` -- Events: MonetizationDisabled -- Disables buy-replica monetization
- `buyOwnership(uint256 _nftId) external payable` -- Events: PaymentProcessed, Transfer -- Purchase NFT ownership
- `buyReplica(uint256 _nftId) external payable returns (uint256)` -- Events: PaymentProcessed, NFTCreated, Transfer -- Purchase NFT replica
- `buyAccess(uint256 _nftId) external payable` -- Events: PaymentProcessed -- Purchase temporary access
- `startUnlockProcess(uint256 _nftId) external onlyNFTOwner` -- Initiates unlock process for committed NFT
- `completeUnlock(uint256 _nftId) external onlyNFTOwner` -- Completes unlock process
- `setAllMonetizationOptions(uint256 _nftId, uint256 _commitmentTimestamp, uint256 _noticeSeconds, PayPerUseParams memory _payPerUse, SubscriptionParams memory _subscription, BuyAccessParams memory _buyAccess, BuyOwnershipParams memory _buyOwnership, BuyReplicaParams memory _buyReplica) external onlyNFTOwner` -- Events: AllMonetizationOptionsSet -- Composite function to set all monetization options
- `cleanupMonetization(uint256 _nftId) external` -- Cleans up all monetization data when NFT burned
- `owner() public view returns (address)` -- Returns contract owner for commission payments

## Important Notes:
1. **NFTAccessControl** has `setMaxAccessLevel` NOT `setMaximumAccessLevel` - tests need to be updated
2. **NFTContract.createNFT** only takes 2 parameters: name and levelOfOwnership - tests passing 12 parameters need fixing
3. **MasterAccessControl** events emit `caller` not `callerAddress` - test assertions need updating
4. Several test functions don't exist in contracts (e.g., `masterAccessControl()` getter, `deployer()` function)