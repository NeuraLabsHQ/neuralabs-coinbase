import { createConfig, http } from '@wagmi/core'
import { mainnet, polygon, arbitrum, base } from '@wagmi/core/chains'
import { coinbaseWallet } from '@wagmi/connectors'

// Define supported chains
const supportedChains = [mainnet, polygon, arbitrum, base]

// Create wagmi config with only Coinbase Wallet
export const config = createConfig({
  chains: supportedChains,
  connectors: [
    coinbaseWallet({
      appName: 'NeuraLabs',
      preference: 'smartWalletOnly', // This ensures only Smart Wallet is used
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
})

// Export for debugging
if (typeof window !== 'undefined') {
  window.wagmiConfig = config
  console.log('Wagmi config initialized:', config)
}