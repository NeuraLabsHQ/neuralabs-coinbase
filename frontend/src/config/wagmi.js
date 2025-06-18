import { createConfig, http, createStorage } from '@wagmi/core'
import { baseSepolia } from '@wagmi/core/chains'
import { coinbaseWallet } from '@wagmi/connectors'

// Create wagmi config with only Coinbase Wallet on Base Sepolia
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'NeuraLabs',
      preference: 'smartWalletOnly', // This ensures only Smart Wallet is used
    })
  ],
  storage: createStorage({
    storage: window.sessionStorage,
    key: 'neuralabs-wallet',
  }),
  transports: {
    [baseSepolia.id]: http(),
  },
})

// Export for debugging
if (typeof window !== 'undefined') {
  window.wagmiConfig = config
  console.log('Wagmi config initialized for Base Sepolia:', config)
}