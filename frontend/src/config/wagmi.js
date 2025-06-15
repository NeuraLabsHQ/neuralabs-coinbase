import { createConfig, http } from '@wagmi/core'
import { sepolia } from '@wagmi/core/chains'
import { coinbaseWallet } from '@wagmi/connectors'

// Create wagmi config with only Coinbase Wallet on Sepolia
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    coinbaseWallet({
      appName: 'NeuraLabs',
      preference: 'smartWalletOnly', // This ensures only Smart Wallet is used
    })
  ],
  transports: {
    [sepolia.id]: http(),
  },
})

// Export for debugging
if (typeof window !== 'undefined') {
  window.wagmiConfig = config
  console.log('Wagmi config initialized for Sepolia:', config)
}