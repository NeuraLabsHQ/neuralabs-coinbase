# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NeuraLabs is a decentralized AI workflow platform built on SUI blockchain, featuring:
- AI workflow builder with visual flow editor
- NFT-based access control system
- Decentralized storage via Walrus
- Zero-knowledge authentication (zkLogin)
- Integration with SUI Seal for encrypted data management

## Development Commands

### Frontend (React/TypeScript)
```bash
cd frontend
npm install
npm start              # Development server on port 3000
npm run build         # Production build
npm test              # Run tests
```

### Backend Services
```bash
# Main backend API
cd neuralabs-backend
pip install -r requirements.txt
python run.py         # Runs on port 8000

# HPC Execution Node
cd hpc-execution-node-backend/code_executor
pip install -r requirements.txt
python app.py         # Runs on port 8001
```

### Smart Contract Development (SUI Move)
```bash
cd mov_contract
sui move build
sui move test
sui client publish --gas-budget 100000000

# For Seal integration
cd mov_contract/seal
sui move build -p move/seal
sui move test -p move/seal
```

### Docker Development
```bash
# Full stack deployment
docker-compose up -d

# Individual services
docker-compose up frontend
docker-compose up neuralabs-backend
docker-compose up code-executor
```

## Architecture Overview

### Smart Contracts (/mov_contract)
- `source/neuralabs.move`: Main NFT contract with access control
- `seal/`: Integration with SUI Seal for encrypted data management
- Python scripts for deployment and testing in `old_contracts_and_scripts/`

### Frontend (/frontend)
- React app with TypeScript
- Key components:
  - `flow_builder/`: Visual workflow editor using React Flow
  - `chat_interface/`: AI chat interface with streaming support
  - `access_management/`: NFT-based access control UI
  - `auth/`: zkLogin and wallet integration

### Backend Services
- `/neuralabs-backend`: Main API service (FastAPI)
  - JWT authentication with Redis
  - PostgreSQL for data persistence
  - Blockchain interaction modules
- `/hpc-execution-node-backend`: Workflow execution engine
  - Supports multiple AI providers (Anthropic, DeepSeek, AWS Bedrock)
  - Custom code execution blocks
  - Streaming response support

### Key Integration Points
1. **Blockchain**: All on-chain interactions use SUI TypeScript SDK
2. **Authentication**: zkLogin for passwordless auth, JWT for session management
3. **Storage**: Walrus for decentralized file storage
4. **AI Models**: Configurable providers with streaming support

## Testing

### Frontend Tests
```bash
cd frontend
npm test                    # Unit tests
npm run test:coverage      # Coverage report
```

### Backend Tests
```bash
cd neuralabs-backend
pytest                      # Run all tests
pytest -v -s               # Verbose output
```

### Smart Contract Tests
```bash
cd mov_contract
sui move test              # Run Move tests
python script/run_tests.py # Python integration tests
```

## Environment Configuration

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_EXECUTION_API_URL=http://localhost:8001
REACT_APP_SUI_NETWORK=testnet
```

### Backend Services
- `neuralabs-backend`: Uses environment variables for database and Redis connections
- `code_executor/config.py`: Model provider configurations
- Docker compose uses `.env` files for service configuration

## Key Development Notes

1. **SUI Seal Integration**: The project integrates with SUI Seal for decentralized encryption. Refer to `mov_contract/seal/UsingSeal.md` for implementation details.

2. **Workflow Execution**: Flows are defined as YAML and executed by the HPC backend. Each node type has specific input/output schemas defined in `code_executor/elements/`.

3. **NFT Access Control**: Users must hold specific NFTs to access flows. The contract at `neuralabs.move` manages minting and verification.

4. **Streaming Responses**: The execution engine supports SSE for real-time AI responses. Frontend components handle streaming via `services/streaming.py`.

5. **Multi-Model Support**: The platform supports multiple AI providers. Model selection logic is in `services/llm/` with provider-specific implementations.