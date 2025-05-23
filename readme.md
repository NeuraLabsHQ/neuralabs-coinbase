# NeuraLabs - Autonomous AI Agent Orchestration Platform

- [NeuraLabs - Autonomous AI Agent Orchestration Platform](#neuralabs---autonomous-ai-agent-orchestration-platform)
  - [Overview](#overview)
    - [Core Vision: Democratizing AI Ownership](#core-vision-democratizing-ai-ownership)
    - [Technical Architecture](#technical-architecture)
      - [🧠 Autonomous Agent Protocol](#-autonomous-agent-protocol)
      - [🔐 Cryptographic Infrastructure](#-cryptographic-infrastructure)
      - [🔄 Execution Infrastructure](#-execution-infrastructure)
    - [Current Technical Implementations](#current-technical-implementations)
      - [Smart Contract Layer](#smart-contract-layer)
      - [Backend Infrastructure](#backend-infrastructure)
      - [Cryptographic Components](#cryptographic-components)
    - [The Path to Full Autonomy](#the-path-to-full-autonomy)
      - [Phase 1: Foundation (Current)](#phase-1-foundation-current)
      - [Phase 2: Semi-Autonomous (Q2 2025)](#phase-2-semi-autonomous-q2-2025)
      - [Phase 3: Full Autonomy (Q4 2025)](#phase-3-full-autonomy-q4-2025)
      - [Phase 4: The Singularity (2026+)](#phase-4-the-singularity-2026)
    - [Use Case Example: Autonomous Medical Research](#use-case-example-autonomous-medical-research)
    - [Technical Challenges We're Solving](#technical-challenges-were-solving)
    - [Our Philosophy](#our-philosophy)
- [How to get started](#how-to-get-started)
- [Components that we have used for cryptography](#components-that-we-have-used-for-cryptography)
  - [Setting up Salt serve](#setting-up-salt-serve)
  - [Setting up Prover service](#setting-up-prover-service)


## Overview

NeuraLabs is building the future of autonomous AI - a decentralized platform where AI agents can self-organize, discover capabilities, and collaboratively solve complex problems without human intervention. By leveraging SUI blockchain's infrastructure, we enable users to create, own, and monetize AI agents that can autonomously compose workflows, negotiate payments, and execute tasks in a trustless, privacy-preserving environment. Our deep integration with SUI's cryptographic primitives - including Seal for threshold encryption, Walrus for decentralized storage, and zkLogin for seamless authentication - ensures that every interaction remains secure and truly decentralized.

### Core Vision: Democratizing AI Ownership

Our mission is to empower anyone to create, own, and monetize AI agents in a truly decentralized manner, free from central control. We envision:

- **Universal AI Creation**: Anyone, regardless of technical expertise, can create and deploy AI agents
- **True Ownership**: Creators maintain complete sovereignty over their AI agents, models, and data
- **Fair Compensation**: When AI agents use sub-agents created by others, creators are automatically and fairly compensated according to their pricing
- **Autonomous Workflow Composition**: AI agents can discover and integrate capabilities from other agents to solve complex problems
- **Privacy-Preserving Collaboration**: Enable federated learning and data sharing without revealing underlying data through zero-knowledge techniques

### Technical Architecture

#### 🧠 Autonomous Agent Protocol
- **Capability Discovery Protocol**: AI agents advertise their capabilities on-chain through structured metadata
- **Workflow Composition Engine**: Uses graph-based algorithms to automatically compose optimal workflows from available sub-agents
- **Cost Optimization**: AI agents negotiate and select sub-workflows based on performance metrics and cost
- **Recursive Composition**: Agents can create hierarchical workflows of arbitrary complexity

#### 🔐 Cryptographic Infrastructure
- **SUI Seal Integration**: 
  - Threshold encryption for multi-party computation
  - Distributed key generation (DKG) for trustless key management
  - Encrypted state sharing between agents
- **Walrus Decentralized Storage**:
  - Content-addressed storage for workflow definitions
  - Encrypted data blobs with capability-based access control
  - Merkle proofs for data integrity verification
- **Zero-Knowledge Proofs**:
  - Custom prover service running Groth16 proving system
  - zkLogin for Web2-friendly authentication
  - Private workflow execution verification
- **Verifiable Random Function (VRF)**:
  - On-chain randomness for gaming and prediction markets
  - Provably fair agent selection for load balancing
  - Verifiable shuffling for privacy-preserving data aggregation


#### 🔄 Execution Infrastructure
- **Distributed Execution Nodes**: 
  - Docker-containerized workers for isolated execution
  - Resource metering and billing per computation unit
  - Automatic scaling based on workflow demands
- **Streaming Protocol**:
  - Server-Sent Events (SSE) for real-time responses
  - Chunked processing for large language models
  - Backpressure handling for network optimization

### Current Technical Implementations

#### Smart Contract Layer
- **NFT-Based Access Control**: ERC-721 compatible tokens representing agent capabilities and access rights
- **Micropayment Channels**: Off-chain payment aggregation with on-chain settlement
- **Workflow Registry**: On-chain catalog of available agent capabilities with semantic search

#### Backend Infrastructure
- **FastAPI-based Orchestration Service**: 
  - JWT authentication with Redis session management
  - PostgreSQL for workflow metadata and execution history
  - Async execution with Celery for long-running tasks
- **Execution Engine**:
  - Sandboxed Python/JavaScript execution environments
  - Multi-provider AI model support (Anthropic, DeepSeek, Bedrock)
  - Custom DSL for workflow definition (YAML-based)

#### Cryptographic Components
- **zkLogin Implementation**:
  - OAuth integration with major providers
  - Ephemeral key generation with deterministic derivation
  - Proof generation with custom prover service
- **VRF Integration**:
  - Commit-reveal scheme for unbiasable randomness
  - Integration with SUI's native VRF when available
  - Fallback to threshold signatures for randomness
- **Threshold Cryptography using Seal**:
  - Distributed key generation for trustless operations
  - Multi-party computation without revealing individual inputs
  - Secure secret sharing among network participants
- **Decentralized Storage using Walrus**:
  - Content-addressed storage with built-in redundancy
  - Encrypted blob storage with access control
  - Immutable data references for workflow definitions
- **Data Encryption**:
  - AES (Advanced Encryption Standard) for data at rest
  - End-to-end encryption for workflow execution
  - Homomorphic encryption for privacy-preserving computations (planned)

### The Path to Full Autonomy

#### Phase 1: Foundation (Current)
- ✅ Basic workflow composition and execution
- ✅ NFT-based access control
- ✅ Cryptographic primitives (zkLogin, Seal, Walrus)
- ✅ Manual workflow creation and sharing
- ✅ VRF for verifiable randomness

#### Phase 2: Semi-Autonomous (Q2 2025)
- 🔄 Agent capability advertisement protocol
- 🔄 Automatic sub-workflow discovery
- 🔄 Cost-based workflow optimization
- 🔄 Basic federated learning support

#### Phase 3: Full Autonomy (Q4 2025)
- 🎯 Self-improving agents through reinforcement learning
- 🎯 Emergent workflow composition for novel problems
- 🎯 Cross-chain agent communication
- 🎯 Fully decentralized execution network

#### Phase 4: The Singularity (2026+)
- 🚀 Agents creating new agents autonomously
- 🚀 Self-organizing agent swarms for massive parallelization
- 🚀 Human-AI collaborative problem solving at scale
- 🚀 AGI-level task decomposition and execution

### Use Case Example: Autonomous Medical Research

Imagine a researcher asks: "What are the latest treatments for rare genetic disorders in children?"

1. **Master Agent** receives the query and decomposes it into sub-tasks
2. **Discovery Phase**: Master agent searches the workflow registry for:
   - Medical literature analysis agents
   - Clinical trial data aggregators
   - Genetic sequence analyzers
   - Pediatric specialty agents
3. **Negotiation**: Agents bid for subtasks based on their capabilities and costs
4. **Execution**: Selected agents work in parallel:
   - Literature agent scans recent publications
   - Clinical agent queries trial databases
   - Genetic agent analyzes relevant mutations
5. **Payment**: Master agent automatically pays sub-agents via micropayment channels
6. **Synthesis**: Results are aggregated and presented to the user
7. **Learning**: Performance metrics update agent rankings for future queries

All of this happens without human intervention beyond the initial query.

### Technical Challenges We're Solving

1. **Semantic Capability Matching**: Using embedding models to match agent capabilities with task requirements
2. **Byzantine Fault Tolerance**: Ensuring reliable execution even with malicious agents
3. **Economic Incentive Alignment**: Designing tokenomics that encourage quality over quantity
4. **Privacy-Preserving Computation**: Enabling agents to work with sensitive data without exposure
5. **Scalable Consensus**: Efficient agreement protocols for multi-agent workflows

### Our Philosophy

> **"We are not enabling blockchain, but blockchain is enabling us"**

Blockchain provides the trustless infrastructure necessary for autonomous AI agents to transact, collaborate, and evolve without centralized control. It's not about putting AI on blockchain - it's about using blockchain to unleash AI's full potential.

---

# How to get started 


- Docker Compose Codes
- Backend 1
- Backend 2
- Frontend
- Prover Service
- Database
- Smart Contracts
- Walrus
- Seal


# Components that we have used for cryptography

- Zk login
  - Salt servers
  - Prover service
- Walrus
- Seal 
  - decentralized thresholding
  - distributed key generation





## Setting up Salt serve


## Setting up Prover service

> Why did we setup our own prover service?

> We need to be able to run our own prover service as there was no prover service available for testnet.

> URL for the prover service is `<>`



1. Install [Git Large File Storage](https://git-lfs.com/) (an open-source Git extension for large file versioning) before downloading the zkey.
   [Linux Version](https://github.com/git-lfs/git-lfs/blob/main/INSTALLING.md)
   ```bash

    curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
    sudo apt-get install git-lfs

    cd prover-service

   ```


2. Download the [Groth16 proving key zkey file](https://docs.circom.io/getting-started/proving-circuits/). There are zkeys available for all Sui networks. See [the Ceremony section](#ceremony) for more details on how the main proving key is generated.

   - Main zkey (for Mainnet and Testnet)
     ```sh
     $ wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-main-zkey.sh | bash
     ```
   - Test zkey (for Devnet)

     ```sh
     $ wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-test-zkey.sh | bash
     ```

   - To verify the download contains the correct zkey file, you can run the following command to check the Blake2b hash: `b2sum ${file_name}.zkey`.

     | Network          | zkey file name      | Hash                                                                                                                               |
     | ---------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
     | Mainnet, Testnet | `zkLogin-main.zkey` | `060beb961802568ac9ac7f14de0fbcd55e373e8f5ec7cc32189e26fb65700aa4e36f5604f868022c765e634d14ea1cd58bd4d79cef8f3cf9693510696bcbcbce` |
     | Devnet           | `zkLogin-test.zkey` | `686e2f5fd969897b1c034d7654799ee2c3952489814e4eaaf3d7e1bb539841047ae8ee5fdcdaca5f4ddd76abb5a8e8eb77b44b693a2ba9d4be57e94292b26ce2` |

3. For the next step, you need two Docker images from the [mysten/zklogin repository](https://hub.docker.com/repository/docker/mysten/zklogin/general) (tagged as `prover` and `prover-fe`). To simplify, a docker compose file is available that automates this process. Run `docker compose` with the downloaded zkey from the same directory as the YAML file.

```yaml
services:
  backend:
    image: mysten/zklogin:prover-stable
    volumes:
      # The ZKEY environment variable must be set to the path of the zkey file.
      - ${ZKEY}:/app/binaries/zkLogin.zkey
    environment:
      - ZKEY=/app/binaries/zkLogin.zkey
      - WITNESS_BINARIES=/app/binaries

  frontend:
    image: mysten/zklogin:prover-fe-stable
    command: '8080'
    ports:
      # The PROVER_PORT environment variable must be set to the desired port.
      - '${PROVER_PORT}:8080'
    environment:
      - PROVER_URI=http://backend:8080/input
      - NODE_ENV=production
      - DEBUG=zkLogin:info,jwks
      # The default timeout is 15 seconds. Uncomment the following line to change it.
      # - PROVER_TIMEOUT=30
```

```
ZKEY=<path_to_zkLogin.zkey> PROVER_PORT=<PROVER_PORT> docker compose up
```

1. To call the service, the following two endpoints are supported:
   - `/ping`: To test if the service is up. Running `curl http://localhost:PROVER_PORT/ping` should return `pong`.
   - `/v1`: The request and response are the same as the Mysten Labs maintained service.

A few important things to note:

- The backend service (mysten/zklogin:prover-stable) is compute-heavy. Use at least the minimum recommended 16 cores and 16GB RAM. Using weaker instances can lead to timeout errors with the message "Call to rapidsnark service took longer than 15s". You can adjust the environment variable `PROVER_TIMEOUT` to set a different timeout value, for example, `PROVER_TIMEOUT=30` for a timeout of 30 seconds.

- If you want to compile the prover from scratch (for performance reasons), please see our fork of [rapidsnark](https://github.com/MystenLabs/rapidsnark#compile-prover-in-server-mode). You'd need to compile and launch the prover in server mode.

- Setting `DEBUG=*` turns on all logs in the prover-fe service some of which may contain PII. Consider using DEBUG=zkLogin:info,jwks in production environments.