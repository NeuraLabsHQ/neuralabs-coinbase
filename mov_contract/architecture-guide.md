# NeuraLabs Architecture Guide: Seal Integration for Encrypted AI Workflows

## Overview

This guide explains the architecture of the NeuraLabs system, focusing on how Seal threshold encryption integrates with NFT-based access control to secure AI workflows stored on Walrus.

## System Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[User Interface]
        WC[Wallet Connect]
        SC[Seal Client SDK]
    end
    
    subgraph "Blockchain Layer (Sui)"
        NFT[NFT Contract]
        AC[Access Control]
        SA[seal_approve Functions]
    end
    
    subgraph "Seal Infrastructure"
        KS1[Key Server 1<br/>Mysten Testnet]
        KS2[Key Server 2<br/>Mysten Testnet]
        TE[Threshold Encryption<br/>t-out-of-n]
    end
    
    subgraph "Storage Layer"
        W[Walrus<br/>Decentralized Storage]
        ED[Encrypted Data]
    end
    
    subgraph "Backend (Python)"
        API[FastAPI Server]
        WE[Workflow Executor]
        DB[(PostgreSQL)]
    end
    
    UI --> WC
    UI --> SC
    SC --> KS1
    SC --> KS2
    SC --> NFT
    NFT --> AC
    AC --> SA
    SA --> TE
    UI --> W
    W --> ED
    UI --> API
    API --> NFT
    API --> DB
    WE --> NFT
```

## Core Components

### 1. NFT-Based Access Control

The system uses NFTs to represent AI workflows with 6 levels of access:

```mermaid
graph LR
    L1[Level 1<br/>USE_MODEL]
    L2[Level 2<br/>RESALE]
    L3[Level 3<br/>CREATE_REPLICA]
    L4[Level 4<br/>VIEW_DOWNLOAD]
    L5[Level 5<br/>EDIT_DATA]
    L6[Level 6<br/>ABSOLUTE_OWNERSHIP]
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6
    
    style L4 fill:#90EE90
    style L5 fill:#90EE90
    style L6 fill:#90EE90
    
    L4 -.->|Minimum for<br/>Decryption| SEAL[Seal Access]
```

### 2. Seal Threshold Encryption Flow

#### Encryption Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant SealSDK
    participant KeyServer1
    participant KeyServer2
    participant Walrus
    participant NFTContract
    
    User->>Frontend: Upload AI Workflow
    Frontend->>SealSDK: Request Encryption
    
    SealSDK->>KeyServer1: Get Public Key
    SealSDK->>KeyServer2: Get Public Key
    
    SealSDK->>SealSDK: Generate Symmetric Key
    SealSDK->>SealSDK: Encrypt Data with Symmetric Key
    SealSDK->>SealSDK: Encrypt Symmetric Key with<br/>Threshold Encryption (1-of-2)
    
    Frontend->>Walrus: Store Encrypted Data
    Walrus-->>Frontend: Return Blob ID
    
    Frontend->>NFTContract: Store Metadata<br/>(Blob ID, Encrypted Key ID)
    NFTContract-->>Frontend: Confirm Storage
    
    Frontend-->>User: Workflow Secured
```

#### Decryption Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant SealSDK
    participant NFTContract
    participant KeyServer1
    participant KeyServer2
    participant Walrus
    
    User->>Frontend: Request File Access
    Frontend->>NFTContract: Check Access Level
    NFTContract-->>Frontend: Access Level (≥4 required)
    
    alt Access Level < 4
        Frontend-->>User: Access Denied
    else Access Level ≥ 4
        Frontend->>SealSDK: Create Session Key
        User->>Frontend: Sign Session Request
        
        Frontend->>SealSDK: Request Decryption Keys
        SealSDK->>NFTContract: Call seal_approve
        NFTContract->>NFTContract: Verify Access Rights
        
        SealSDK->>KeyServer1: Request Partial Key
        KeyServer1->>KeyServer1: Verify seal_approve
        KeyServer1-->>SealSDK: Return Partial Key
        
        Note over SealSDK: Only 1 key needed<br/>for 1-of-2 threshold
        
        SealSDK->>SealSDK: Reconstruct Symmetric Key
        
        Frontend->>Walrus: Fetch Encrypted Data
        Walrus-->>Frontend: Return Encrypted Data
        
        SealSDK->>SealSDK: Decrypt Data
        Frontend-->>User: Decrypted Workflow
    end
```

### 3. Access Grant Workflow

```mermaid
graph TB
    subgraph "NFT Owner Actions"
        O1[Create NFT<br/>Level 6 Access]
        O2[Grant Access<br/>to User B]
        O3[Set Access Level]
    end
    
    subgraph "Access Verification"
        V1{Check Caller<br/>Has Level 6?}
        V2{Valid Access<br/>Level 1-6?}
        V3[Update Access Table]
        V4[Emit Event]
    end
    
    subgraph "User B Capabilities"
        U1[Level 1-3:<br/>Use/Resale/Replica]
        U2[Level 4+:<br/>Decrypt Files]
        U3[Level 5:<br/>Edit Data]
        U4[Level 6:<br/>Grant Access]
    end
    
    O1 --> O2
    O2 --> V1
    V1 -->|Yes| V2
    V1 -->|No| E1[Error: Not Authorized]
    V2 -->|Yes| O3
    V2 -->|No| E2[Error: Invalid Level]
    O3 --> V3
    V3 --> V4
    V4 --> U1
    V4 --> U2
    V4 --> U3
    V4 --> U4
```

### 4. Data Storage Architecture

```mermaid
graph TB
    subgraph "On-Chain (Sui)"
        NFT1[NFT Object]
        NFT2[Collection State]
        NFT3[Access Rights Table]
        NFT4[Encrypted Key References]
    end
    
    subgraph "Off-Chain (Walrus)"
        W1[Encrypted Workflow Data]
        W2[Encrypted Model Files]
        W3[Encrypted Configuration]
    end
    
    subgraph "Seal Key Servers"
        KS1[Master Key Pair 1]
        KS2[Master Key Pair 2]
        DK[Derived Keys<br/>Per Identity]
    end
    
    NFT1 --> NFT4
    NFT4 -.->|References| W1
    NFT4 -.->|References| W2
    NFT4 -.->|References| W3
    
    KS1 --> DK
    KS2 --> DK
    DK -.->|Decrypt| W1
    DK -.->|Decrypt| W2
    DK -.->|Decrypt| W3
```

## Security Model

### 1. Multi-Layer Security

```mermaid
graph LR
    subgraph "Layer 1: Blockchain"
        B1[NFT Ownership]
        B2[Access Control Lists]
        B3[Immutable Audit Trail]
    end
    
    subgraph "Layer 2: Encryption"
        E1[Threshold Encryption]
        E2[Symmetric Key Encryption]
        E3[Key Derivation]
    end
    
    subgraph "Layer 3: Storage"
        S1[Decentralized Storage]
        S2[Content Addressing]
        S3[Data Integrity]
    end
    
    B1 --> E1
    B2 --> E1
    E1 --> E2
    E2 --> S1
    E3 --> E2
    S1 --> S2
    S2 --> S3
```

### 2. Trust Model

```mermaid
graph TB
    subgraph "Trust Assumptions"
        T1[User trusts t-of-n<br/>key servers]
        T2[Key servers trust<br/>Sui blockchain]
        T3[Blockchain validates<br/>access rights]
    end
    
    subgraph "Security Guarantees"
        S1[No single point<br/>of failure]
        S2[Cryptographic<br/>access control]
        S3[Auditable<br/>access logs]
    end
    
    T1 --> S1
    T2 --> S2
    T3 --> S3
```

## Integration Points

### 1. Frontend Integration

```javascript
// Key integration points in React app
const integrationFlow = {
  wallet: "Sui Wallet / zkLogin",
  encryption: "@mysten/seal SDK",
  storage: "Walrus SDK",
  blockchain: "@mysten/sui.js"
};
```

### 2. Backend Integration

```python
# Key integration points in Python backend
integration_points = {
    "blockchain": "sui-py SDK",
    "database": "PostgreSQL + Redis",
    "ai_execution": "Custom Workflow Engine",
    "authentication": "JWT + zkLogin"
}
```

### 3. Smart Contract Hooks

```move
// Key functions for integration
module neuralnft::nft {
    // Seal integration point
    entry fun seal_approve(id: vector<u8>, collection: &NFTCollection, ctx: &TxContext)
    
    // Access control integration
    public fun grant_access(...)
    public fun can_decrypt_files(...)
    
    // Data storage integration
    public fun add_encrypted_data(...)
}
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        D1[Local Sui Node]
        D2[Test Key Servers]
        D3[Local Walrus]
    end
    
    subgraph "Testnet"
        T1[Sui Testnet]
        T2[Mysten Key Servers]
        T3[Walrus Testnet]
    end
    
    subgraph "Production"
        P1[Sui Mainnet]
        P2[Multiple Key Servers]
        P3[Walrus Mainnet]
    end
    
    D1 --> T1
    D2 --> T2
    D3 --> T3
    T1 --> P1
    T2 --> P2
    T3 --> P3
```

## Best Practices

### 1. Key Management
- Use 1-of-2 threshold for low latency testing
- Consider 2-of-3 or higher for production
- Rotate session keys regularly

### 2. Access Control
- Start with minimal access (Level 1)
- Grant higher access only when needed
- Audit access changes regularly

### 3. Data Storage
- Encrypt all sensitive data before storage
- Use content addressing for integrity
- Implement data retention policies

### 4. Performance Optimization
- Cache decryption keys in frontend
- Batch access requests when possible
- Use appropriate gas budgets

## Conclusion

The NeuraLabs architecture leverages Sui's programmability, Seal's threshold encryption, and Walrus's decentralized storage to create a secure, scalable platform for AI workflow management. The 6-level access control system ensures fine-grained permissions while maintaining the ability to share and monetize AI workflows securely.