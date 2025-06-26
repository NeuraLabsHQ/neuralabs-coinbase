// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MasterAccessControl.sol";
import "./NFTAccessControl.sol";

/**
 * @title AIServiceAgreementManagement
 * @dev Tracks and manages AI service agreements including purchased access rights and subscriptions
 */
contract AIServiceAgreementManagement {
    // Reference to MasterAccessControl for authorization
    MasterAccessControl public masterAccessControl;
    
    // Reference to NFTAccessControl for access verification
    NFTAccessControl public nftAccessControl;

    // Struct to store access sale details
    struct AccessSaleDetails {
        uint256 amount;         // Amount paid
        uint256 purchase_date;  // Purchase timestamp
        uint256 expiry_date;    // Access expiry (0 = indefinite)
        NFTAccessControl.AccessLevel access_level;  // Granted access level
        bool active;            // Whether access is currently active
    }

    // Struct to store subscription details
    struct SubscriptionDetails {
        uint256 amount;         // Subscription fee paid
        uint256 start_date;     // Subscription start
        uint256 end_date;       // Current period end
        bool auto_renew;        // Auto-renewal flag
        bool active;            // Whether subscription is active
    }

    // NFT ID => User => Sale details
    mapping(uint256 => mapping(address => AccessSaleDetails)) public access_sale;
    
    // NFT ID => User => Subscription details
    mapping(uint256 => mapping(address => SubscriptionDetails)) public subscription_sale;
    
    // Count of active access sales per NFT
    mapping(uint256 => uint256) public total_active_access_sales;
    
    // Count of active subscriptions per NFT
    mapping(uint256 => uint256) public total_active_subscriptions;

    // Events
    event AccessSaleRecorded(uint256 indexed nftId, address indexed user, uint256 amount, uint256 expiry);
    event SubscriptionRecorded(uint256 indexed nftId, address indexed user, uint256 amount, uint256 endDate);
    event AccessExpired(uint256 indexed nftId, address indexed user);
    event SubscriptionExpired(uint256 indexed nftId, address indexed user);

    /**
     * @dev Modifier to check if caller is authorized
     */
    modifier onlyAuthorized() {
        require(
            masterAccessControl.selfCheckAccess(msg.sender),
            "AIServiceAgreementManagement: Caller not authorized"
        );
        _;
    }

    /**
     * @dev Modifier to check if caller is NFT owner
     */
    modifier onlyNFTOwner(uint256 _nftId) {
        require(
            nftAccessControl.checkMinimumAccess(_nftId, msg.sender, NFTAccessControl.AccessLevel.AbsoluteOwnership),
            "AIServiceAgreementManagement: Caller is not NFT owner"
        );
        _;
    }

    /**
     * @dev Constructor initializes contract with references
     */
    constructor(address _masterAccessControlAddress, address _nftAccessControlAddress) {
        require(_masterAccessControlAddress != address(0), "AIServiceAgreementManagement: Invalid master access control address");
        require(_nftAccessControlAddress != address(0), "AIServiceAgreementManagement: Invalid NFT access control address");
        
        masterAccessControl = MasterAccessControl(_masterAccessControlAddress);
        nftAccessControl = NFTAccessControl(_nftAccessControlAddress);
        
        masterAccessControl.grantSelfAccess(msg.sender);
    }

    /**
     * @dev Records a new access purchase
     */
    function recordAccessSale(
        uint256 _nftId,
        address _user,
        uint256 _amount,
        uint256 _duration,
        NFTAccessControl.AccessLevel _level
    ) external onlyAuthorized {
        require(_user != address(0), "AIServiceAgreementManagement: Invalid user address");
        require(_amount > 0, "AIServiceAgreementManagement: Invalid amount");
        
        uint256 expiryDate = _duration > 0 ? block.timestamp + _duration : 0;
        
        access_sale[_nftId][_user] = AccessSaleDetails({
            amount: _amount,
            purchase_date: block.timestamp,
            expiry_date: expiryDate,
            access_level: _level,
            active: true
        });
        
        total_active_access_sales[_nftId]++;
        
        emit AccessSaleRecorded(_nftId, _user, _amount, expiryDate);
    }

    /**
     * @dev Records a new subscription
     */
    function recordSubscriptionSale(
        uint256 _nftId,
        address _user,
        uint256 _amount,
        uint256 _duration
    ) external onlyAuthorized {
        require(_user != address(0), "AIServiceAgreementManagement: Invalid user address");
        require(_amount > 0, "AIServiceAgreementManagement: Invalid amount");
        require(_duration > 0, "AIServiceAgreementManagement: Invalid duration");
        
        uint256 endDate = block.timestamp + _duration;
        
        subscription_sale[_nftId][_user] = SubscriptionDetails({
            amount: _amount,
            start_date: block.timestamp,
            end_date: endDate,
            auto_renew: false,
            active: true
        });
        
        total_active_subscriptions[_nftId]++;
        
        emit SubscriptionRecorded(_nftId, _user, _amount, endDate);
    }

    /**
     * @dev Checks if user has any active paid access
     */
    function hasActiveAccess(uint256 _nftId, address _user) external view returns (bool) {
        // Check access sale
        AccessSaleDetails memory accessDetails = access_sale[_nftId][_user];
        if (accessDetails.active) {
            if (accessDetails.expiry_date == 0 || accessDetails.expiry_date > block.timestamp) {
                return true;
            }
        }
        
        // Check subscription
        SubscriptionDetails memory subDetails = subscription_sale[_nftId][_user];
        if (subDetails.active && subDetails.end_date > block.timestamp) {
            return true;
        }
        
        return false;
    }

    /**
     * @dev Returns total active access sales and subscriptions
     */
    function getTotalActiveAccess(uint256 _nftId) external view returns (uint256) {
        return total_active_access_sales[_nftId] + total_active_subscriptions[_nftId];
    }

    /**
     * @dev Batch removes expired subscriptions/access
     */
    function batchReevaluate(uint256 _nftId, address[] memory _users) external onlyNFTOwner(_nftId) {
        for (uint256 i = 0; i < _users.length; i++) {
            address user = _users[i];
            
            // Check and update access sale
            AccessSaleDetails storage accessDetails = access_sale[_nftId][user];
            if (accessDetails.active && accessDetails.expiry_date > 0 && accessDetails.expiry_date <= block.timestamp) {
                accessDetails.active = false;
                total_active_access_sales[_nftId]--;
                emit AccessExpired(_nftId, user);
            }
            
            // Check and update subscription
            SubscriptionDetails storage subDetails = subscription_sale[_nftId][user];
            if (subDetails.active && subDetails.end_date <= block.timestamp) {
                subDetails.active = false;
                total_active_subscriptions[_nftId]--;
                emit SubscriptionExpired(_nftId, user);
            }
        }
    }

    /**
     * @dev Get access sale details for a user
     */
    function getAccessSaleDetails(uint256 _nftId, address _user) external view returns (AccessSaleDetails memory) {
        return access_sale[_nftId][_user];
    }

    /**
     * @dev Get subscription details for a user
     */
    function getSubscriptionDetails(uint256 _nftId, address _user) external view returns (SubscriptionDetails memory) {
        return subscription_sale[_nftId][_user];
    }

    /**
     * @dev Check if a specific NFT has any active subscriptions
     */
    function hasActiveSubscriptions(uint256 _nftId) external view returns (bool) {
        return total_active_subscriptions[_nftId] > 0;
    }

    /**
     * @dev Check if a specific NFT has any active access sales
     */
    function hasActiveAccessSales(uint256 _nftId) external view returns (bool) {
        return total_active_access_sales[_nftId] > 0;
    }
}