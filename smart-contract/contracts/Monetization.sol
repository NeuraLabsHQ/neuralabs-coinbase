// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MasterAccessControl.sol";
import "./NFTContract.sol";
import "./NFTAccessControl.sol";
import "./NFTMetadata.sol";
import "./AIServiceAgreementManagement.sol";

/**
 * @title Monetization
 * @dev Comprehensive monetization contract handling multiple revenue models with commitment periods
 */
contract Monetization {
    // Contract references
    MasterAccessControl public masterAccessControl;
    NFTContract public nftContract;
    NFTAccessControl public nftAccessControl;
    NFTMetadata public nftMetadata;
    AIServiceAgreementManagement public aiServiceAgreementManagement;

    // Platform commission percentage (0-100)
    uint256 public commission_percentage;

    // Address handling off-chain subscription and pay-per-use
    address public subscriptionHandlerPublicKey;

    // Monetization structs
    struct PayPerUseStruct {
        uint256 cost_per_use;       // Cost in USD per use
        address platform_cost_paid_by; // Who pays platform fees (user/owner)
        bool enabled;               // Whether this option is active
    }

    struct SubscriptionStruct {
        uint256 subscription_cost;  // Cost per subscription period
        uint256 subscription_time;  // Period length in days
        uint256 limit;             // Call limit per period
        uint256 limit_time;        // Time window for limits in minutes
        bool enabled;              // Whether this option is active
    }

    struct BuyAccessStruct {
        NFTAccessControl.AccessLevel access_level; // Level of access granted
        uint256 access_time;       // Access duration in days (0 = indefinite)
        uint256 cost;              // Cost in wei
        bool enabled;              // Whether this option is active
    }

    struct BuyOwnershipStruct {
        uint256 cost;              // Cost in wei
        uint8 ownership_level;     // Ownership level granted (1-6)
        bool enabled;              // Whether this option is active
    }

    struct BuyReplicaStruct {
        uint256 cost;              // Cost in wei
        uint8 ownership_level;     // Ownership level for replica
        bool enabled;              // Whether this option is active
    }

    // Mappings for monetization data
    mapping(uint256 => uint8) public monetization_combination; // 5-bit binary for enabled options
    mapping(uint256 => PayPerUseStruct) public payPerUseData;
    mapping(uint256 => SubscriptionStruct) public subscriptionData;
    mapping(uint256 => BuyAccessStruct) public buyAccessData;
    mapping(uint256 => BuyOwnershipStruct) public buyOwnershipData;
    mapping(uint256 => BuyReplicaStruct) public buyReplicaData;

    // Commitment and notice period mappings
    mapping(uint256 => uint256) public commitmentTime; // Unix timestamp until which NFT cannot be transferred
    mapping(uint256 => uint256) public noticeBeforeUnlockCommitment; // Notice period in seconds
    mapping(uint256 => uint256) public lockOpensDate; // Timestamp when unlocking process can begin

    // Events
    event CommitmentTimeSet(uint256 indexed nftId, uint256 timestamp);
    event NoticeBeforeUnlockSet(uint256 indexed nftId, uint256 seconds);
    event MonetizationEnabled(uint256 indexed nftId, uint8 optionIndex);
    event MonetizationDisabled(uint256 indexed nftId, uint8 optionIndex);
    event AllMonetizationOptionsSet(uint256 indexed nftId, uint8 combination);
    event PaymentProcessed(uint256 indexed nftId, address buyer, uint256 amount, string paymentType);

    /**
     * @dev Modifier to check if caller is authorized
     */
    modifier onlyAuthorized() {
        require(
            masterAccessControl.selfCheckAccess(msg.sender),
            "Monetization: Caller not authorized"
        );
        _;
    }

    /**
     * @dev Modifier to check if caller is NFT owner
     */
    modifier onlyNFTOwner(uint256 _nftId) {
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        require(nftInfo.owner == msg.sender, "Monetization: Caller is not NFT owner");
        _;
    }

    /**
     * @dev Constructor
     */
    constructor(
        address _masterAccessControlAddress,
        address _nftContractAddress,
        address _nftAccessControlAddress,
        address _nftMetadataAddress,
        address _aiServiceAgreementManagementAddress
    ) {
        require(_masterAccessControlAddress != address(0), "Monetization: Invalid master access control");
        require(_nftContractAddress != address(0), "Monetization: Invalid NFT contract");
        require(_nftAccessControlAddress != address(0), "Monetization: Invalid NFT access control");
        require(_nftMetadataAddress != address(0), "Monetization: Invalid NFT metadata");
        require(_aiServiceAgreementManagementAddress != address(0), "Monetization: Invalid AI service agreement");

        masterAccessControl = MasterAccessControl(_masterAccessControlAddress);
        nftContract = NFTContract(_nftContractAddress);
        nftAccessControl = NFTAccessControl(_nftAccessControlAddress);
        nftMetadata = NFTMetadata(_nftMetadataAddress);
        aiServiceAgreementManagement = AIServiceAgreementManagement(_aiServiceAgreementManagementAddress);

        masterAccessControl.grantSelfAccess(msg.sender);
    }

    /**
     * @dev Set contract references (for post-deployment setup)
     */
    function setContractReferences(
        address _subscriptionHandler
    ) external onlyAuthorized {
        require(_subscriptionHandler != address(0), "Monetization: Invalid subscription handler");
        subscriptionHandlerPublicKey = _subscriptionHandler;
    }

    /**
     * @dev Sets platform commission percentage
     */
    function setCommissionPercentage(uint256 _percentage) external onlyAuthorized {
        require(_percentage <= 100, "Monetization: Invalid commission percentage");
        commission_percentage = _percentage;
    }

    /**
     * @dev Sets the commitment time for an NFT
     */
    function setCommitmentTime(uint256 _nftId, uint256 _timestamp) external onlyNFTOwner(_nftId) {
        require(
            nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Unlocked,
            "Monetization: Cannot change commitment while locked"
        );
        require(_timestamp > block.timestamp, "Monetization: Commitment time must be in the future");
        
        commitmentTime[_nftId] = _timestamp;
        emit CommitmentTimeSet(_nftId, _timestamp);
    }

    /**
     * @dev Sets the notice period before unlock
     */
    function setNoticeBeforeUnlockCommitment(uint256 _nftId, uint256 _seconds) external onlyNFTOwner(_nftId) {
        require(
            nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Unlocked,
            "Monetization: Cannot change notice while locked"
        );
        require(_seconds <= 365 days, "Monetization: Notice period too long");
        
        noticeBeforeUnlockCommitment[_nftId] = _seconds;
        emit NoticeBeforeUnlockSet(_nftId, _seconds);
    }

    /**
     * @dev Enables pay-per-use monetization
     */
    function enablePayPerUse(
        uint256 _nftId,
        uint256 _costPerUse,
        address _platformCostPaidBy
    ) external onlyNFTOwner(_nftId) {
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        require(nftInfo.levelOfOwnership >= 3, "Monetization: Insufficient ownership level");
        
        // Check IP type
        NFTMetadata.Metadata memory metadata = nftMetadata.getMetadata(_nftId);
        require(
            keccak256(bytes(metadata.intellectual_property_type)) != keccak256(bytes("data")),
            "Monetization: Data type only supports buy-ownership"
        );
        
        require(commitmentTime[_nftId] > 0, "Monetization: Commitment time not set");
        require(noticeBeforeUnlockCommitment[_nftId] > 0, "Monetization: Notice period not set");
        require(!buyOwnershipData[_nftId].enabled, "Monetization: Cannot enable with buy-ownership");
        
        payPerUseData[_nftId] = PayPerUseStruct({
            cost_per_use: _costPerUse,
            platform_cost_paid_by: _platformCostPaidBy,
            enabled: true
        });
        
        monetization_combination[_nftId] |= 1; // Set bit 0
        
        // Lock NFT if not already locked
        if (nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Unlocked) {
            nftContract.lockNFT(_nftId);
        }
        
        // Grant UseModel access to handler
        nftAccessControl.grantAccess(_nftId, subscriptionHandlerPublicKey, NFTAccessControl.AccessLevel.UseModel);
        
        emit MonetizationEnabled(_nftId, 0);
    }

    /**
     * @dev Enables subscription monetization
     */
    function enableSubscription(
        uint256 _nftId,
        uint256 _cost,
        uint256 _time,
        uint256 _limit,
        uint256 _limitTime
    ) external onlyNFTOwner(_nftId) {
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        require(nftInfo.levelOfOwnership >= 3, "Monetization: Insufficient ownership level");
        
        // Check IP type
        NFTMetadata.Metadata memory metadata = nftMetadata.getMetadata(_nftId);
        require(
            keccak256(bytes(metadata.intellectual_property_type)) != keccak256(bytes("data")),
            "Monetization: Data type only supports buy-ownership"
        );
        
        require(commitmentTime[_nftId] > 0, "Monetization: Commitment time not set");
        require(noticeBeforeUnlockCommitment[_nftId] > 0, "Monetization: Notice period not set");
        require(!buyOwnershipData[_nftId].enabled, "Monetization: Cannot enable with buy-ownership");
        
        subscriptionData[_nftId] = SubscriptionStruct({
            subscription_cost: _cost,
            subscription_time: _time,
            limit: _limit,
            limit_time: _limitTime,
            enabled: true
        });
        
        monetization_combination[_nftId] |= 2; // Set bit 1
        
        // Lock NFT if not already locked
        if (nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Unlocked) {
            nftContract.lockNFT(_nftId);
        }
        
        // Grant UseModel access to handler
        nftAccessControl.grantAccess(_nftId, subscriptionHandlerPublicKey, NFTAccessControl.AccessLevel.UseModel);
        
        emit MonetizationEnabled(_nftId, 1);
    }

    /**
     * @dev Enables access purchase option
     */
    function enableBuyAccess(
        uint256 _nftId,
        NFTAccessControl.AccessLevel _level,
        uint256 _accessTime,
        uint256 _cost
    ) external onlyNFTOwner(_nftId) {
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        require(nftInfo.levelOfOwnership >= 3, "Monetization: Insufficient ownership level");
        
        // Check IP type
        NFTMetadata.Metadata memory metadata = nftMetadata.getMetadata(_nftId);
        require(
            keccak256(bytes(metadata.intellectual_property_type)) != keccak256(bytes("data")),
            "Monetization: Data type only supports buy-ownership"
        );
        
        require(commitmentTime[_nftId] > 0, "Monetization: Commitment time not set");
        require(noticeBeforeUnlockCommitment[_nftId] > 0, "Monetization: Notice period not set");
        
        // Validate access time doesn't exceed commitment
        if (_accessTime > 0) {
            require(
                block.timestamp + (_accessTime * 1 days) <= commitmentTime[_nftId],
                "Monetization: Access time exceeds commitment"
            );
        }
        
        buyAccessData[_nftId] = BuyAccessStruct({
            access_level: _level,
            access_time: _accessTime,
            cost: _cost,
            enabled: true
        });
        
        monetization_combination[_nftId] |= 4; // Set bit 2
        
        // Lock NFT if first monetization option
        if (monetization_combination[_nftId] == 4 && nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Unlocked) {
            nftContract.lockNFT(_nftId);
        }
        
        emit MonetizationEnabled(_nftId, 2);
    }

    /**
     * @dev Enables ownership purchase option
     */
    function enableBuyOwnership(
        uint256 _nftId,
        uint256 _cost,
        uint8 _ownershipLevel
    ) external onlyNFTOwner(_nftId) {
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        require(nftInfo.levelOfOwnership >= 2, "Monetization: Insufficient ownership level");
        require(_ownershipLevel <= nftInfo.levelOfOwnership, "Monetization: Exceeds max ownership");
        
        // No IP type restriction - available for all types
        
        buyOwnershipData[_nftId] = BuyOwnershipStruct({
            cost: _cost,
            ownership_level: _ownershipLevel,
            enabled: true
        });
        
        monetization_combination[_nftId] |= 8; // Set bit 3
        
        emit MonetizationEnabled(_nftId, 3);
    }

    /**
     * @dev Enables replica purchase option
     */
    function enableBuyReplica(
        uint256 _nftId,
        uint256 _cost,
        uint8 _ownershipLevel
    ) external onlyNFTOwner(_nftId) {
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        require(nftInfo.levelOfOwnership >= 3, "Monetization: Insufficient ownership level");
        require(_ownershipLevel <= nftInfo.levelOfOwnership, "Monetization: Exceeds max ownership");
        
        // Check IP type
        NFTMetadata.Metadata memory metadata = nftMetadata.getMetadata(_nftId);
        require(
            keccak256(bytes(metadata.intellectual_property_type)) != keccak256(bytes("data")),
            "Monetization: Data type only supports buy-ownership"
        );
        
        buyReplicaData[_nftId] = BuyReplicaStruct({
            cost: _cost,
            ownership_level: _ownershipLevel,
            enabled: true
        });
        
        monetization_combination[_nftId] |= 16; // Set bit 4
        
        emit MonetizationEnabled(_nftId, 4);
    }

    /**
     * @dev Disables pay-per-use monetization
     */
    function disablePayPerUse(uint256 _nftId) external onlyNFTOwner(_nftId) {
        require(payPerUseData[_nftId].enabled, "Monetization: Pay-per-use not enabled");
        
        // Check no active subscriptions
        require(
            !aiServiceAgreementManagement.hasActiveSubscriptions(_nftId),
            "Monetization: Active subscriptions exist"
        );
        
        // Revoke handler access
        if (nftAccessControl.canRevokeAccess(_nftId, subscriptionHandlerPublicKey)) {
            nftAccessControl.revokeAccess(_nftId, subscriptionHandlerPublicKey);
        }
        
        delete payPerUseData[_nftId];
        monetization_combination[_nftId] &= ~uint8(1); // Clear bit 0
        
        // Start unlock if no other options enabled
        if (monetization_combination[_nftId] == 0 && nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Locked) {
            _startUnlockProcess(_nftId);
        }
        
        emit MonetizationDisabled(_nftId, 0);
    }

    /**
     * @dev Disables subscription monetization
     */
    function disableSubscription(uint256 _nftId) external onlyNFTOwner(_nftId) {
        require(subscriptionData[_nftId].enabled, "Monetization: Subscription not enabled");
        
        // Check no active subscriptions
        require(
            !aiServiceAgreementManagement.hasActiveSubscriptions(_nftId),
            "Monetization: Active subscriptions exist"
        );
        
        // Revoke handler access if no pay-per-use
        if (!payPerUseData[_nftId].enabled && nftAccessControl.canRevokeAccess(_nftId, subscriptionHandlerPublicKey)) {
            nftAccessControl.revokeAccess(_nftId, subscriptionHandlerPublicKey);
        }
        
        delete subscriptionData[_nftId];
        monetization_combination[_nftId] &= ~uint8(2); // Clear bit 1
        
        // Start unlock if no other options enabled
        if (monetization_combination[_nftId] == 0 && nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Locked) {
            _startUnlockProcess(_nftId);
        }
        
        emit MonetizationDisabled(_nftId, 1);
    }

    /**
     * @dev Disables buy-access monetization
     */
    function disableBuyAccess(uint256 _nftId) external onlyNFTOwner(_nftId) {
        require(buyAccessData[_nftId].enabled, "Monetization: Buy-access not enabled");
        
        // Check no active access sales
        require(
            !aiServiceAgreementManagement.hasActiveAccessSales(_nftId),
            "Monetization: Active access sales exist"
        );
        
        delete buyAccessData[_nftId];
        monetization_combination[_nftId] &= ~uint8(4); // Clear bit 2
        
        // Start unlock if no other options enabled
        if (monetization_combination[_nftId] == 0 && nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Locked) {
            _startUnlockProcess(_nftId);
        }
        
        emit MonetizationDisabled(_nftId, 2);
    }

    /**
     * @dev Disables buy-ownership monetization
     */
    function disableBuyOwnership(uint256 _nftId) external onlyNFTOwner(_nftId) {
        require(buyOwnershipData[_nftId].enabled, "Monetization: Buy-ownership not enabled");
        
        delete buyOwnershipData[_nftId];
        monetization_combination[_nftId] &= ~uint8(8); // Clear bit 3
        
        emit MonetizationDisabled(_nftId, 3);
    }

    /**
     * @dev Disables buy-replica monetization
     */
    function disableBuyReplica(uint256 _nftId) external onlyNFTOwner(_nftId) {
        require(buyReplicaData[_nftId].enabled, "Monetization: Buy-replica not enabled");
        
        delete buyReplicaData[_nftId];
        monetization_combination[_nftId] &= ~uint8(16); // Clear bit 4
        
        emit MonetizationDisabled(_nftId, 4);
    }

    /**
     * @dev Purchase NFT ownership
     */
    function buyOwnership(uint256 _nftId) external payable {
        require(buyOwnershipData[_nftId].enabled, "Monetization: Buy-ownership not enabled");
        require(
            nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Unlocked,
            "Monetization: Cannot sell locked NFT - commitment active"
        );
        require(msg.value >= buyOwnershipData[_nftId].cost, "Monetization: Insufficient payment");
        
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        address currentOwner = nftInfo.owner;
        
        // Calculate and transfer commission
        uint256 commission = (msg.value * commission_percentage) / 100;
        uint256 ownerAmount = msg.value - commission;
        
        if (commission > 0) {
            payable(owner()).transfer(commission);
        }
        payable(currentOwner).transfer(ownerAmount);
        
        // Transfer NFT
        nftContract.safeTransferFrom(currentOwner, msg.sender, _nftId);
        
        // Update access level
        nftAccessControl.grantAccess(_nftId, msg.sender, NFTAccessControl.AccessLevel(buyOwnershipData[_nftId].ownership_level));
        
        // Disable all monetization options
        _disableAllMonetizationOptions(_nftId);
        
        emit PaymentProcessed(_nftId, msg.sender, msg.value, "buy-ownership");
    }

    /**
     * @dev Purchase NFT replica
     */
    function buyReplica(uint256 _nftId) external payable returns (uint256) {
        require(buyReplicaData[_nftId].enabled, "Monetization: Buy-replica not enabled");
        require(msg.value >= buyReplicaData[_nftId].cost, "Monetization: Insufficient payment");
        
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        
        // Calculate and transfer commission
        uint256 commission = (msg.value * commission_percentage) / 100;
        uint256 ownerAmount = msg.value - commission;
        
        if (commission > 0) {
            payable(owner()).transfer(commission);
        }
        payable(nftInfo.owner).transfer(ownerAmount);
        
        // Create replica NFT
        uint256 replicaId = nftContract.createNFT(
            string(abi.encodePacked(nftInfo.name, " - Replica")),
            buyReplicaData[_nftId].ownership_level
        );
        
        // Replicate metadata
        nftMetadata.replicateNFT(_nftId, replicaId);
        
        // Transfer to buyer
        nftContract.safeTransferFrom(address(this), msg.sender, replicaId);
        
        emit PaymentProcessed(_nftId, msg.sender, msg.value, "buy-replica");
        
        return replicaId;
    }

    /**
     * @dev Purchase temporary access
     */
    function buyAccess(uint256 _nftId) external payable {
        require(buyAccessData[_nftId].enabled, "Monetization: Buy-access not enabled");
        require(msg.value >= buyAccessData[_nftId].cost, "Monetization: Insufficient payment");
        
        // Validate access duration doesn't exceed commitment
        if (buyAccessData[_nftId].access_time > 0) {
            require(
                block.timestamp + (buyAccessData[_nftId].access_time * 1 days) <= commitmentTime[_nftId],
                "Monetization: Access time exceeds commitment"
            );
        }
        
        NFTContract.NFTInfo memory nftInfo = nftContract.getNFTInfo(_nftId);
        
        // Calculate and transfer commission
        uint256 commission = (msg.value * commission_percentage) / 100;
        uint256 ownerAmount = msg.value - commission;
        
        if (commission > 0) {
            payable(owner()).transfer(commission);
        }
        payable(nftInfo.owner).transfer(ownerAmount);
        
        // Grant access
        nftAccessControl.grantAccess(_nftId, msg.sender, buyAccessData[_nftId].access_level);
        
        // Record sale
        uint256 duration = buyAccessData[_nftId].access_time > 0 ? buyAccessData[_nftId].access_time * 1 days : 0;
        aiServiceAgreementManagement.recordAccessSale(
            _nftId,
            msg.sender,
            msg.value,
            duration,
            buyAccessData[_nftId].access_level
        );
        
        emit PaymentProcessed(_nftId, msg.sender, msg.value, "buy-access");
    }

    /**
     * @dev Initiates unlock process for committed NFT
     */
    function startUnlockProcess(uint256 _nftId) external onlyNFTOwner(_nftId) {
        require(
            nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Locked,
            "Monetization: NFT not locked"
        );
        
        // Check if commitment time has passed or no active subscriptions/sales
        bool canUnlock = block.timestamp > commitmentTime[_nftId] ||
            (!aiServiceAgreementManagement.hasActiveSubscriptions(_nftId) &&
             !aiServiceAgreementManagement.hasActiveAccessSales(_nftId));
        
        require(canUnlock, "Monetization: Cannot unlock yet");
        
        nftContract.startUnlocking(_nftId);
        lockOpensDate[_nftId] = block.timestamp + noticeBeforeUnlockCommitment[_nftId];
    }

    /**
     * @dev Completes unlock process
     */
    function completeUnlock(uint256 _nftId) external onlyNFTOwner(_nftId) {
        require(
            nftContract.getLockStatus(_nftId) == NFTContract.LockStatus.Unlocking,
            "Monetization: NFT not in unlocking state"
        );
        require(block.timestamp >= lockOpensDate[_nftId], "Monetization: Notice period not complete");
        
        nftContract.markCanBeUnlocked(_nftId);
        
        // Unlock if no active subscriptions/sales
        if (!aiServiceAgreementManagement.hasActiveSubscriptions(_nftId) &&
            !aiServiceAgreementManagement.hasActiveAccessSales(_nftId)) {
            nftContract.unlockNFT(_nftId);
        }
    }

    /**
     * @dev Composite function to set all monetization options
     */
    function setAllMonetizationOptions(
        uint256 _nftId,
        uint256 _commitmentTimestamp,
        uint256 _noticeSeconds,
        PayPerUseParams memory _payPerUse,
        SubscriptionParams memory _subscription,
        BuyAccessParams memory _buyAccess,
        BuyOwnershipParams memory _buyOwnership,
        BuyReplicaParams memory _buyReplica
    ) external onlyNFTOwner(_nftId) {
        // Set commitment and notice if provided
        if (_commitmentTimestamp > 0) {
            setCommitmentTime(_nftId, _commitmentTimestamp);
        }
        if (_noticeSeconds > 0) {
            setNoticeBeforeUnlockCommitment(_nftId, _noticeSeconds);
        }
        
        // Get IP type
        NFTMetadata.Metadata memory metadata = nftMetadata.getMetadata(_nftId);
        bool isDataType = keccak256(bytes(metadata.intellectual_property_type)) == keccak256(bytes("data"));
        
        // Validate data type restrictions
        if (isDataType) {
            require(
                !_payPerUse.enabled && !_subscription.enabled && !_buyAccess.enabled && !_buyReplica.enabled,
                "Monetization: Data type only supports buy-ownership"
            );
        }
        
        // Validate option combinations
        if (_buyOwnership.enabled) {
            require(
                !_payPerUse.enabled && !_subscription.enabled,
                "Monetization: Cannot enable buy-ownership with pay-per-use or subscription"
            );
        }
        
        // Enable/disable each option
        _updateMonetizationOption(_nftId, 0, _payPerUse.enabled, payPerUseData[_nftId].enabled);
        _updateMonetizationOption(_nftId, 1, _subscription.enabled, subscriptionData[_nftId].enabled);
        _updateMonetizationOption(_nftId, 2, _buyAccess.enabled, buyAccessData[_nftId].enabled);
        _updateMonetizationOption(_nftId, 3, _buyOwnership.enabled, buyOwnershipData[_nftId].enabled);
        _updateMonetizationOption(_nftId, 4, _buyReplica.enabled, buyReplicaData[_nftId].enabled);
        
        // Set data for enabled options
        if (_payPerUse.enabled) {
            enablePayPerUse(_nftId, _payPerUse.costPerUse, _payPerUse.platformCostPaidBy);
        }
        if (_subscription.enabled) {
            enableSubscription(_nftId, _subscription.cost, _subscription.time, _subscription.limit, _subscription.limitTime);
        }
        if (_buyAccess.enabled) {
            enableBuyAccess(_nftId, _buyAccess.accessLevel, _buyAccess.accessTime, _buyAccess.cost);
        }
        if (_buyOwnership.enabled) {
            enableBuyOwnership(_nftId, _buyOwnership.cost, _buyOwnership.ownershipLevel);
        }
        if (_buyReplica.enabled) {
            enableBuyReplica(_nftId, _buyReplica.cost, _buyReplica.ownershipLevel);
        }
        
        emit AllMonetizationOptionsSet(_nftId, monetization_combination[_nftId]);
    }

    /**
     * @dev Cleans up all monetization data when NFT is burned
     */
    function cleanupMonetization(uint256 _nftId) external {
        require(
            msg.sender == address(nftContract),
            "Monetization: Only NFT contract can cleanup"
        );
        
        // Disable all monetization options
        _disableAllMonetizationOptions(_nftId);
        
        // Clear commitment data
        delete commitmentTime[_nftId];
        delete noticeBeforeUnlockCommitment[_nftId];
        delete lockOpensDate[_nftId];
    }

    /**
     * @dev Internal function to start unlock process
     */
    function _startUnlockProcess(uint256 _nftId) private {
        if (block.timestamp > commitmentTime[_nftId] ||
            (!aiServiceAgreementManagement.hasActiveSubscriptions(_nftId) &&
             !aiServiceAgreementManagement.hasActiveAccessSales(_nftId))) {
            nftContract.startUnlocking(_nftId);
            lockOpensDate[_nftId] = block.timestamp + noticeBeforeUnlockCommitment[_nftId];
        }
    }

    /**
     * @dev Internal function to disable all monetization options
     */
    function _disableAllMonetizationOptions(uint256 _nftId) private {
        delete payPerUseData[_nftId];
        delete subscriptionData[_nftId];
        delete buyAccessData[_nftId];
        delete buyOwnershipData[_nftId];
        delete buyReplicaData[_nftId];
        monetization_combination[_nftId] = 0;
        
        // Revoke handler access if needed
        if (nftAccessControl.canRevokeAccess(_nftId, subscriptionHandlerPublicKey)) {
            nftAccessControl.revokeAccess(_nftId, subscriptionHandlerPublicKey);
        }
    }

    /**
     * @dev Internal function to update monetization option
     */
    function _updateMonetizationOption(
        uint256 _nftId,
        uint8 _optionIndex,
        bool _shouldBeEnabled,
        bool _currentlyEnabled
    ) private {
        if (_shouldBeEnabled && !_currentlyEnabled) {
            // Need to enable
        } else if (!_shouldBeEnabled && _currentlyEnabled) {
            // Need to disable
            if (_optionIndex == 0) disablePayPerUse(_nftId);
            else if (_optionIndex == 1) disableSubscription(_nftId);
            else if (_optionIndex == 2) disableBuyAccess(_nftId);
            else if (_optionIndex == 3) disableBuyOwnership(_nftId);
            else if (_optionIndex == 4) disableBuyReplica(_nftId);
        }
    }

    /**
     * @dev Returns contract owner for commission payments
     */
    function owner() public view returns (address) {
        // In production, this should return the actual platform owner address
        // For now, returning the deployer stored in master access control
        return address(0); // Replace with actual owner mechanism
    }

    // Struct definitions for setAllMonetizationOptions
    struct PayPerUseParams {
        bool enabled;
        uint256 costPerUse;
        address platformCostPaidBy;
    }

    struct SubscriptionParams {
        bool enabled;
        uint256 cost;
        uint256 time;
        uint256 limit;
        uint256 limitTime;
    }

    struct BuyAccessParams {
        bool enabled;
        NFTAccessControl.AccessLevel accessLevel;
        uint256 accessTime;
        uint256 cost;
    }

    struct BuyOwnershipParams {
        bool enabled;
        uint256 cost;
        uint8 ownershipLevel;
    }

    struct BuyReplicaParams {
        bool enabled;
        uint256 cost;
        uint8 ownershipLevel;
    }
}