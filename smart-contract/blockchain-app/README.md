# Blockchain Contract Manager

A modern web application for interacting with NFT monetization smart contracts. Built with React, Vite, and Bootstrap.

## Features

- 🌓 **Dark/Light Theme**: Monochrome design with smooth transitions
- 🔗 **Wallet Integration**: Connect with MetaMask and other Web3 wallets
- 📊 **Dashboard**: Real-time contract status and statistics
- 🎨 **NFT Management**: Create, transfer, and manage NFTs
- 🔐 **Access Control**: Fine-grained permission management
- 💰 **Monetization**: Configure multiple revenue models
- 👥 **Agent Wallets**: Manage wallet associations
- 📑 **Agreements**: Monitor service agreements and subscriptions

## Prerequisites

- Node.js 16+ and npm
- MetaMask or another Web3 wallet
- Smart contracts deployed (see parent directory)
- Generated blockchain configuration

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - Set RPC URLs for your networks
   - Configure default network
   - Add API keys if needed

3. **Generate Blockchain Config**
   ```bash
   cd ../contract
   npm run generate-config
   cd ../blockchain-app
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_DEFAULT_NETWORK` | Default network to connect | `local`, `sepolia`, `mainnet` |
| `VITE_LOCAL_RPC_URL` | Local development RPC | `http://localhost:8545` |
| `VITE_SEPOLIA_RPC_URL` | Sepolia testnet RPC | `https://sepolia.infura.io/v3/YOUR-ID` |
| `VITE_MAINNET_RPC_URL` | Ethereum mainnet RPC | `https://mainnet.infura.io/v3/YOUR-ID` |

## Project Structure

```
src/
├── blockchain/           # Blockchain interaction layer
│   ├── config/          # Network and contract configuration
│   └── modules/         # Contract interaction modules
│       ├── core/        # Generic read/execute functions
│       └── contracts/   # Contract-specific interfaces
├── components/          # Reusable UI components
│   ├── layout/         # Header, Sidebar, Theme toggle
│   ├── wallet/         # Wallet connection components
│   └── common/         # Shared components
├── contexts/           # React contexts
│   └── WalletContext   # Wallet state management
├── pages/              # Application pages
│   ├── Dashboard       # Overview and stats
│   ├── NFTManagement   # NFT operations
│   ├── AccessManagement # Permission control
│   └── ...            # Other feature pages
└── styles/            # CSS and themes
    └── themes/        # Dark and light themes
```

## Blockchain Module Usage

### Reading Contract Data
```javascript
import { nftContract } from './blockchain/modules';

const nftInfo = await nftContract.getNFTInfo({ 
  tokenId: 1, 
  provider 
});
```

### Executing Transactions
```javascript
const result = await nftContract.createNFT({ 
  name: "My NFT", 
  levelOfOwnership: 6, 
  signer 
});
```

### Generic Functions
```javascript
import { read, execute } from './blockchain/modules';

// Read any contract method
const data = await read({
  contractAddress: '0x...',
  abi: contractABI,
  methodName: 'myMethod',
  args: [arg1, arg2],
  provider
});

// Execute any transaction
const tx = await execute({
  contractAddress: '0x...',
  abi: contractABI,
  methodName: 'myMethod',
  args: [arg1, arg2],
  signer,
  options: { value: '0.1' } // ETH value if needed
});
```

## Theme Customization

The application uses CSS variables for theming. Customize in:
- `src/styles/themes/dark.css`
- `src/styles/themes/light.css`

Key variables:
```css
--bg-primary: Background color
--text-primary: Main text color
--accent-primary: Accent color
--border-primary: Border color
```

## Build for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment

### Static Hosting (Vercel, Netlify, etc.)
1. Build the project
2. Deploy the `dist` directory
3. Set environment variables in hosting platform

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
```

## Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask is installed and unlocked
- Check you're on the correct network
- Verify RPC URLs in `.env`

### Contract Interaction Errors
- Regenerate blockchain config after new deployments
- Check contract addresses in generated config
- Ensure wallet has sufficient balance for gas

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is 16+
- Check for missing environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
