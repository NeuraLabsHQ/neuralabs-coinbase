# NFT Monetization System - Detailed Documentation

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Contract Interaction Flows](#contract-interaction-flows)
3. [Detailed Contract Specifications](#detailed-contract-specifications)
4. [State Transitions](#state-transitions)
5. [Security Model](#security-model)
6. [Integration Guide](#integration-guide)

## System Architecture Overview

The NFT Monetization System consists of 6 interconnected smart contracts that work together to provide a comprehensive IP monetization platform.

### High-Level Architecture

```mermaid
graph TB
    subgraph "Core Access Control"
        MAC[MasterAccessControl]
    end
    
    subgraph "NFT Management"
        NC[NFTContract]
        NAC[NFTAccessControl]
        NM[NFTMetadata]
    end
    
    subgraph "Monetization Layer"
        MON[Monetization]
        ASAM[AIServiceAgreementManagement]
    end
    
    MAC -->|Authorization| NAC
    MAC -->|Authorization| NM
    MAC -->|Authorization| NC
    MAC -->|Authorization| MON
    MAC -->|Authorization| ASAM
    
    NC <-->|Access Rights| NAC
    NC <-->|Metadata| NM
    NC <-->|Lock/Unlock| MON
    
    NAC <-->|Sales Protection| ASAM
    NAC -->|Access Verification| MON
    
    MON <-->|Record Sales| ASAM
    MON -->|IP Type Check| NM
    
    style MAC fill:#f9f,stroke:#333,stroke-width:4px
    style NC fill:#bbf,stroke:#333,stroke-width:4px
    style MON fill:#bfb,stroke:#333,stroke-width:4px
```

## Contract Interaction Flows

### 1. NFT Creation and Setup Flow

```mermaid
sequenceDiagram
    participant User
    participant NFTContract
    participant NFTAccessControl
    participant NFTMetadata
    participant Monetization
    
    User->>NFTContract: createNFT(name, ownershipLevel)
    NFTContract->>NFTContract: Mint NFT (tokenId)
    NFTContract->>NFTContract: Set lock status = Unlocked
    NFTContract->>NFTAccessControl: grantAccess(tokenId, creator, AbsoluteOwnership)
    NFTContract-->>User: Return tokenId
    
    User->>NFTMetadata: createMetadata(tokenId, metadata)
    NFTMetadata->>NFTMetadata: Validate IP type (flow/model/data)
    NFTMetadata->>NFTMetadata: Store metadata
    
    User->>Monetization: setCommitmentTime(tokenId, timestamp)
    Monetization->>NFTContract: Check if unlocked
    Monetization->>Monetization: Store commitment time
    
    User->>Monetization: setNoticeBeforeUnlockCommitment(tokenId, seconds)
    Monetization->>Monetization: Store notice period
```

### 2. Monetization Enable Flow

```mermaid
sequenceDiagram
    participant User
    participant Monetization
    participant NFTMetadata
    participant NFTContract
    participant NFTAccessControl
    participant ASAM
    
    User->>Monetization: enablePayPerUse(tokenId, cost, payer)
    Monetization->>NFTContract: Check ownership
    Monetization->>NFTMetadata: getMetadata(tokenId)
    NFTMetadata-->>Monetization: Return metadata
    
    alt IP Type is "data"
        Monetization-->>User: Revert "Data type only supports buy-ownership"
    else IP Type is "flow" or "model"
        Monetization->>Monetization: Check commitment time set
        Monetization->>Monetization: Check notice period set
        Monetization->>NFTContract: lockNFT(tokenId)
        NFTContract->>NFTContract: Set status = Locked
        Monetization->>NFTAccessControl: grantAccess(tokenId, handler, UseModel)
        Monetization-->>User: Success
    end
```

### 3. Purchase Access Flow

```mermaid
sequenceDiagram
    participant Buyer
    participant Monetization
    participant NFTContract
    participant NFTAccessControl
    participant ASAM
    
    Buyer->>Monetization: buyAccess(tokenId) + payment
    Monetization->>Monetization: Verify payment amount
    Monetization->>Monetization: Check access time < commitment time
    Monetization->>NFTContract: Get owner info
    
    Monetization->>Monetization: Calculate commission
    Monetization->>Platform: Transfer commission
    Monetization->>Owner: Transfer payment - commission
    
    Monetization->>NFTAccessControl: grantAccess(tokenId, buyer, accessLevel)
    Monetization->>ASAM: recordAccessSale(tokenId, buyer, amount, duration, level)
    ASAM->>ASAM: Store sale details
    ASAM->>ASAM: Increment active sales counter
    
    Monetization-->>Buyer: Access granted
```

### 4. Buy Ownership Flow (with Lock Protection)

```mermaid
sequenceDiagram
    participant Buyer
    participant Monetization
    participant NFTContract
    participant NFTAccessControl
    
    Buyer->>Monetization: buyOwnership(tokenId) + payment
    Monetization->>NFTContract: getLockStatus(tokenId)
    
    alt NFT is Locked
        Monetization-->>Buyer: Revert "Cannot sell locked NFT"
    else NFT is Unlocked
        Monetization->>Monetization: Process payment
        Monetization->>NFTContract: safeTransferFrom(owner, buyer, tokenId)
        NFTContract->>NFTAccessControl: revokeAccess(tokenId, previousOwner)
        NFTContract->>NFTAccessControl: grantAccess(tokenId, buyer, ownershipLevel)
        Monetization->>Monetization: Disable all monetization options
        Monetization-->>Buyer: Ownership transferred
    end
```

### 5. Unlock Process Flow

```mermaid
sequenceDiagram
    participant Owner
    participant Monetization
    participant NFTContract
    participant ASAM
    
    Owner->>Monetization: startUnlockProcess(tokenId)
    Monetization->>NFTContract: Check lock status = Locked
    
    alt Commitment time passed
        Monetization->>NFTContract: startUnlocking(tokenId)
        NFTContract->>NFTContract: Set status = Unlocking
        Monetization->>Monetization: Set lockOpensDate = now + notice period
    else Check active sales
        Monetization->>ASAM: hasActiveSubscriptions(tokenId)
        Monetization->>ASAM: hasActiveAccessSales(tokenId)
        alt No active sales
            Monetization->>NFTContract: startUnlocking(tokenId)
            Monetization->>Monetization: Set lockOpensDate
        else Active sales exist
            Monetization-->>Owner: Revert "Cannot unlock yet"
        end
    end
    
    Note over Owner: Wait for notice period
    
    Owner->>Monetization: completeUnlock(tokenId)
    Monetization->>Monetization: Check lockOpensDate passed
    Monetization->>NFTContract: markCanBeUnlocked(tokenId)
    NFTContract->>NFTContract: Set status = CanBeUnlocked
    
    Monetization->>ASAM: Check active sales again
    alt No active sales
        Monetization->>NFTContract: unlockNFT(tokenId)
        NFTContract->>NFTContract: Set status = Unlocked
    end
```

### 6. Access Revocation with Sales Protection

```mermaid
sequenceDiagram
    participant Admin
    participant NFTAccessControl
    participant ASAM
    
    Admin->>NFTAccessControl: revokeAccess(tokenId, user)
    NFTAccessControl->>ASAM: hasActiveAccess(tokenId, user)
    
    alt User has paid access
        ASAM->>ASAM: Check access_sale[tokenId][user]
        ASAM->>ASAM: Check subscription_sale[tokenId][user]
        ASAM-->>NFTAccessControl: true (has active access)
        NFTAccessControl-->>Admin: Revert "Cannot revoke paid access"
    else No paid access
        ASAM-->>NFTAccessControl: false
        NFTAccessControl->>NFTAccessControl: Delete access rights
        NFTAccessControl->>NFTAccessControl: Update access lists
        NFTAccessControl-->>Admin: Access revoked
    end
```

## Detailed Contract Specifications

### 1. MasterAccessControl

**Purpose**: Central authorization hub for all cross-contract calls.

**Key Functions**:
- `grantAccess(address _contract, address _caller)`: Grant permission for caller to access contract
- `revokeAccess(address _contract, address _caller)`: Revoke permission
- `grantSelfAccess(address _addressToGrant)`: Contract grants access to itself
- `hasAccess(address _contract, address _caller)`: Check if caller has access
- `selfCheckAccess(address _addressToCheck)`: Contract checks if address has access to it

**State Variables**:
- `mapping(address => mapping(address => bool)) accessRights`: Nested mapping of permissions

### 2. NFTContract

**Purpose**: Core NFT implementation with locking mechanism.

**Lock States**:
```mermaid
stateDiagram-v2
    [*] --> Unlocked: Initial State
    Unlocked --> Locked: lockNFT()
    Locked --> Unlocking: startUnlocking()
    Unlocking --> CanBeUnlocked: markCanBeUnlocked()
    CanBeUnlocked --> Unlocked: unlockNFT()
    
    Unlocked --> [*]: burnNFT()
```

**Key Functions**:
- `createNFT(string _name, uint8 _levelOfOwnership)`: Mint new NFT
- `burnNFT(uint256 _tokenId)`: Destroy NFT (only when unlocked)
- `lockNFT(uint256 _tokenId)`: Lock NFT for monetization
- `transferNFT(uint256 _tokenId, address _to)`: Transfer NFT (only when unlocked)

**State Variables**:
- `mapping(uint256 => NFTInfo) nfts`: NFT information
- `mapping(uint256 => LockStatus) locked`: Lock status per NFT
- `uint256 totalSupply`: Total minted NFTs

### 3. NFTAccessControl

**Access Levels**:
```mermaid
graph TD
    A0[None - 0] --> A1[UseModel - 1]
    A1 --> A2[Resale - 2]
    A2 --> A3[CreateReplica - 3]
    A3 --> A4[ViewAndDownload - 4]
    A4 --> A5[EditData - 5]
    A5 --> A6[AbsoluteOwnership - 6]
    
    style A0 fill:#f99
    style A6 fill:#9f9
```

**Key Functions**:
- `grantAccess(uint256 _nftId, address _user, AccessLevel _level)`: Grant access
- `revokeAccess(uint256 _nftId, address _user)`: Revoke access (with sales protection)
- `setMaxAccessLevel(uint256 _nftId, AccessLevel _level)`: Set maximum grantable level
- `checkMinimumAccess(uint256 _nftId, address _user, AccessLevel _level)`: Verify access

**State Variables**:
- `mapping(uint256 => mapping(address => AccessLevel)) nftAccess`: User access levels
- `mapping(uint256 => AccessLevel) defaultAccessLevel`: Default access per NFT
- `mapping(uint256 => AccessLevel) maxAccessLevel`: Maximum access per NFT

### 4. NFTMetadata

**Purpose**: Manage IP-specific metadata with type validation.

**IP Type Restrictions**:
```mermaid
graph LR
    subgraph "IP Types"
        D[data]
        F[flow]
        M[model]
    end
    
    subgraph "Monetization Options"
        BO[Buy Ownership]
        PPU[Pay Per Use]
        SUB[Subscription]
        BA[Buy Access]
        BR[Buy Replica]
    end
    
    D --> BO
    F --> BO
    F --> PPU
    F --> SUB
    F --> BA
    F --> BR
    M --> BO
    M --> PPU
    M --> SUB
    M --> BA
    M --> BR
    
    style D fill:#faa
    style BO fill:#afa
```

**Key Functions**:
- `createMetadata(uint256 _nftId, Metadata _metadata)`: Create metadata entry
- `updateMetadata(uint256 _nftId, Metadata _metadata)`: Update (requires EditData access)
- `replicateNFT(uint256 _nftId, uint256 _replicaNFTId)`: Copy metadata for replica

**Metadata Structure**:
```solidity
struct Metadata {
    string image;
    string intellectual_property_type; // "flow", "model", or "data"
    bool encrypted;
    string encryption_id;
    string intellectual_property_id;
    string intellectual_property_storage; // "neuralabs", "neuralabs-decentralized", "custom"
    string md5;
    string version;
}
```

### 5. AIServiceAgreementManagement

**Purpose**: Track and protect paid access rights.

**Key Functions**:
- `recordAccessSale(uint256 _nftId, address _user, uint256 _amount, uint256 _duration, AccessLevel _level)`: Record purchase
- `recordSubscriptionSale(uint256 _nftId, address _user, uint256 _amount, uint256 _duration)`: Record subscription
- `hasActiveAccess(uint256 _nftId, address _user)`: Check if user has paid access
- `batchReevaluate(uint256 _nftId, address[] _users)`: Cleanup expired access

**State Variables**:
- `mapping(uint256 => mapping(address => AccessSaleDetails)) access_sale`: Access purchases
- `mapping(uint256 => mapping(address => SubscriptionDetails)) subscription_sale`: Subscriptions
- `mapping(uint256 => uint256) total_active_access_sales`: Active sales counter
- `mapping(uint256 => uint256) total_active_subscriptions`: Active subscription counter

### 6. Monetization

**Purpose**: Handle all monetization models and payment flows.

**Monetization Options Binary Representation**:
```
Bit 0: Pay-per-use
Bit 1: Subscription
Bit 2: Buy-access
Bit 3: Buy-ownership
Bit 4: Buy-replica

Example: 10101 = Pay-per-use + Buy-access + Buy-replica enabled
```

**Key Functions**:
- `enablePayPerUse/Subscription/BuyAccess/BuyOwnership/BuyReplica()`: Enable options
- `disablePayPerUse/Subscription/BuyAccess/BuyOwnership/BuyReplica()`: Disable options
- `buyOwnership(uint256 _nftId)`: Purchase NFT (requires unlocked)
- `buyReplica(uint256 _nftId)`: Purchase replica NFT
- `buyAccess(uint256 _nftId)`: Purchase temporary access
- `setAllMonetizationOptions()`: Composite function for batch configuration

**State Variables**:
- `mapping(uint256 => uint8) monetization_combination`: Enabled options bitmap
- `mapping(uint256 => PayPerUseStruct) payPerUseData`: Pay-per-use config
- `mapping(uint256 => SubscriptionStruct) subscriptionData`: Subscription config
- `mapping(uint256 => BuyAccessStruct) buyAccessData`: Buy-access config
- `mapping(uint256 => BuyOwnershipStruct) buyOwnershipData`: Buy-ownership config
- `mapping(uint256 => BuyReplicaStruct) buyReplicaData`: Buy-replica config
- `mapping(uint256 => uint256) commitmentTime`: Lock commitment timestamp
- `mapping(uint256 => uint256) noticeBeforeUnlockCommitment`: Notice period
- `mapping(uint256 => uint256) lockOpensDate`: Unlock process start time

## State Transitions

### NFT Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: createNFT()
    
    Created --> MetadataAdded: createMetadata()
    
    MetadataAdded --> CommitmentSet: setCommitmentTime()
    
    CommitmentSet --> NoticeSet: setNoticeBeforeUnlock()
    
    NoticeSet --> MonetizationEnabled: enable[Option]()
    
    MonetizationEnabled --> Locked: Auto-lock on first option
    
    Locked --> Unlocking: startUnlockProcess()
    
    Unlocking --> CanBeUnlocked: After notice period
    
    CanBeUnlocked --> Unlocked: completeUnlock()
    
    Unlocked --> Transferred: transferNFT()
    
    Unlocked --> Burned: burnNFT()
    
    Transferred --> MonetizationEnabled: New owner setup
    
    Burned --> [*]
    
    note right of Locked
        Cannot transfer
        Cannot burn
        Cannot change commitment
    end note
    
    note right of MonetizationEnabled
        Can enable/disable options
        Can process sales
    end note
```

### Access Level Progression

```mermaid
graph TD
    subgraph "User Journey"
        U1[No Access] -->|buyAccess| U2[Temporary Access]
        U2 -->|Expires| U1
        U1 -->|buyOwnership| U3[Permanent Owner]
        U2 -->|buyOwnership| U3
    end
    
    subgraph "Creator Journey"
        C1[Create NFT] --> C2[AbsoluteOwnership]
        C2 -->|Enable Monetization| C3[NFT Locked]
        C3 -->|Commitment Period| C4[Can Unlock]
        C4 -->|Complete Unlock| C5[Can Transfer/Sell]
    end
```

## Security Model

### 1. Authorization Hierarchy

```mermaid
graph TD
    MA[MasterAccessControl] --> |Controls| ALL[All Contracts]
    
    subgraph "Permission Types"
        SA[Self Access<br/>Contract → Deployer]
        CA[Cross Access<br/>Contract → Contract]
        UA[User Access<br/>NFT → User]
    end
    
    MA --> SA
    MA --> CA
    NAC[NFTAccessControl] --> UA
```

### 2. Sales Protection Mechanism

```mermaid
flowchart LR
    subgraph "Protection Flow"
        A[User Buys Access] --> B[Sale Recorded in ASAM]
        B --> C{Revoke Attempt}
        C -->|Check ASAM| D{Has Active Access?}
        D -->|Yes| E[Revoke Blocked]
        D -->|No| F[Revoke Allowed]
    end
    
    style E fill:#f99
    style F fill:#9f9
```

### 3. Lock Protection States

```mermaid
graph TD
    subgraph "Allowed When Locked"
        A1[Enable/Disable Monetization]
        A2[Process Purchases]
        A3[Grant Access via Sales]
    end
    
    subgraph "Blocked When Locked"
        B1[Transfer NFT]
        B2[Burn NFT]
        B3[Change Commitment Time]
        B4[Change Notice Period]
        B5[Buy Ownership]
    end
    
    style B1 fill:#faa
    style B2 fill:#faa
    style B3 fill:#faa
    style B4 fill:#faa
    style B5 fill:#faa
```

## Integration Guide

### 1. Basic NFT Creation

```javascript
// 1. Create NFT
const tx1 = await nftContract.createNFT("AI Model v1", 6);
const tokenId = tx1.logs[0].args.tokenId;

// 2. Add metadata
const metadata = {
    image: "ipfs://Qm...",
    intellectual_property_type: "model",
    encrypted: false,
    encryption_id: "",
    intellectual_property_id: "model-001",
    intellectual_property_storage: "neuralabs",
    md5: "d41d8cd98f00b204e9800998ecf8427e",
    version: "1.0.0"
};
await nftMetadata.createMetadata(tokenId, metadata);
```

### 2. Enable Monetization

```javascript
// Set commitment (required for most options)
const futureDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year
await monetization.setCommitmentTime(tokenId, futureDate);
await monetization.setNoticeBeforeUnlockCommitment(tokenId, 7 * 24 * 60 * 60); // 7 days

// Enable options
await monetization.enablePayPerUse(tokenId, 
    ethers.utils.parseUnits("10", 6), // $10 USDC
    owner.address // owner pays platform fees
);

await monetization.enableBuyOwnership(tokenId,
    ethers.utils.parseEther("1"), // 1 ETH
    6 // Full ownership level
);
```

### 3. Purchase Flow

```javascript
// Buy access
await monetization.buyAccess(tokenId, {
    value: ethers.utils.parseEther("0.1")
});

// Buy ownership (only if unlocked)
await monetization.buyOwnership(tokenId, {
    value: ethers.utils.parseEther("1")
});
```

### 4. Unlock Process

```javascript
// Start unlock
await monetization.startUnlockProcess(tokenId);

// Wait for notice period...

// Complete unlock
await monetization.completeUnlock(tokenId);
```

## Best Practices

1. **Always Set Commitment Before Monetization**: For pay-per-use, subscription, and buy-access
2. **Check IP Type**: Data type only supports buy-ownership
3. **Monitor Lock Status**: Cannot sell ownership of locked NFTs
4. **Track Active Sales**: Use AIServiceAgreementManagement to monitor active users
5. **Plan Unlock Strategy**: Consider notice period for user communication

## Error Messages

Common revert messages and their meanings:

- `"Data type only supports buy-ownership"`: Trying to enable restricted option on data IP
- `"Cannot sell locked NFT - commitment active"`: Attempting buy-ownership on locked NFT
- `"Cannot revoke paid access"`: Trying to revoke access from user with active purchase
- `"Commitment time not set"`: Enabling option without setting commitment
- `"Cannot change commitment while locked"`: Attempting to modify commitment on locked NFT
- `"Access time exceeds commitment"`: Buy-access duration extends beyond commitment period

## Gas Optimization Tips

1. Use `setAllMonetizationOptions()` for batch configuration
2. Minimize storage writes by planning monetization setup
3. Use `batchReevaluate()` for cleaning up multiple expired accesses
4. Consider commitment periods to reduce lock/unlock transactions

## Future Enhancements

1. **Dynamic Pricing**: Implement price curves based on demand
2. **Revenue Sharing**: Multi-party revenue distribution
3. **Subscription Tiers**: Multiple subscription levels with different benefits
4. **Access Delegation**: Allow access holders to delegate temporarily
5. **Batch Operations**: More batch functions for gas efficiency

## Viewing Diagrams

### Mermaid Diagrams
The Mermaid diagrams in this documentation can be viewed using:
- GitHub/GitLab (automatically renders in markdown)
- Mermaid Live Editor: https://mermaid.live/
- VS Code with Mermaid extension
- Any markdown viewer with Mermaid support

### Graphviz Diagram
To generate the comprehensive system diagram from `contracts-diagram.dot`:

```bash
# Generate PNG
dot -Tpng contracts-diagram.dot -o contracts-diagram.png

# Generate SVG (scalable)
dot -Tsvg contracts-diagram.dot -o contracts-diagram.svg

# Generate PDF
dot -Tpdf contracts-diagram.dot -o contracts-diagram.pdf
```

Online viewer: https://dreampuf.github.io/GraphvizOnline/

The Graphviz diagram shows:
- All contracts with their state variables, functions, and events
- All structs and enums with their fields
- Contract-to-contract references (blue arrows)
- Function calls between contracts (green arrows)
- Authorization relationships (red dashed arrows)
- Data storage relationships (dotted arrows)