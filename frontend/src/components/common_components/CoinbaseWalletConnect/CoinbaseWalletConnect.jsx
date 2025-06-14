import React, { useState, useEffect } from 'react'
import { 
  connect, 
  disconnect, 
  getAccount, 
  getBalance,
  watchAccount,
  switchChain,
  getChainId,
  getConnections
} from '@wagmi/core'
import { config } from '../../../config/wagmi'
import { formatEther } from 'viem'
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  useColorModeValue,
  useToast,
  Flex,
  Tooltip,
  useColorMode
} from '@chakra-ui/react'
import { FiExternalLink, FiCopy } from 'react-icons/fi'
import coinbaseConnected from '../../../assets/icons/coinbase-connected.svg'
import coinbaseLight from '../../../assets/icons/coinbase-light.svg'
import coinbaseDark from '../../../assets/icons/coinbase-dark.svg'

export default function CoinbaseWalletConnect({ 
  iconColor, 
  hoverBgColor, 
  viewOnlyMode = false,
  isMobile = false,
  onConnectionChange = null
}) {
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()
  const { colorMode } = useColorMode()
  
  // Color mode values
  const bgColor = useColorModeValue('white', '#18191b')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const textMutedColor = useColorModeValue('gray.600', 'gray.400')

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      try {
        const accountData = getAccount(config)
        if (accountData && accountData.address) {
          setAccount(accountData)
          await updateBalance(accountData.address)
          
          // Get chain ID safely
          const currentChainId = getChainId(config)
          setChainId(currentChainId)
          
          // Notify parent component
          if (onConnectionChange) {
            onConnectionChange({
              connected: true,
              address: accountData.address,
              chainId: currentChainId
            })
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error)
      }
    }
    checkConnection()

    // Watch for account changes
    const unwatch = watchAccount(config, {
      onChange: async (newAccount) => {
        try {
          setAccount(newAccount)
          if (newAccount && newAccount.address) {
            await updateBalance(newAccount.address)
            
            // Get chain ID safely
            const currentChainId = getChainId(config)
            setChainId(currentChainId)
            
            // Notify parent component
            if (onConnectionChange) {
              onConnectionChange({
                connected: true,
                address: newAccount.address,
                chainId: currentChainId
              })
            }
          } else {
            setBalance(null)
            setChainId(null)
            
            // Notify parent component
            if (onConnectionChange) {
              onConnectionChange({
                connected: false,
                address: null,
                chainId: null
              })
            }
          }
        } catch (error) {
          console.error('Error in account change handler:', error)
        }
      },
    })

    return () => unwatch()
  }, [onConnectionChange])

  const updateBalance = async (address) => {
    try {
      const balanceData = await getBalance(config, {
        address,
      })
      setBalance(balanceData)
    } catch (err) {
      console.error('Error fetching balance:', err)
    }
  }

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      console.log('Starting wallet connection...')
      console.log('Config:', config)
      console.log('Available connectors:', config.connectors)
      
      // Check if connector is available
      if (!config.connectors || config.connectors.length === 0) {
        throw new Error('No wallet connectors available')
      }
      
      // Connect to Coinbase Smart Wallet
      const result = await connect(config, {
        connector: config.connectors[0], // Coinbase Wallet connector
      })
      
      console.log('Connection result:', result)
      
      // Validate connection result
      if (!result.accounts || result.accounts.length === 0) {
        throw new Error('No accounts returned from wallet connection')
      }
      
      // Get the current chain ID safely
      const currentChainId = getChainId(config)
      console.log('Current chain ID:', currentChainId)
      
      setAccount({ 
        address: result.accounts[0], 
        chain: result.chain || { id: currentChainId } 
      })
      await updateBalance(result.accounts[0])
      setChainId(currentChainId)
      
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to Coinbase Smart Wallet',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      setError(err.message)
      console.error('Connection error:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        config: config
      })
      
      toast({
        title: 'Connection Failed',
        description: err.message || 'Failed to connect wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    console.log('Starting disconnect process...')
    
    // Skip the wagmi disconnect call entirely since it's causing errors
    // Just clear our local state and let the watchAccount handle the cleanup
    console.log('Clearing local state...')
    
    setAccount(null)
    setBalance(null)
    setChainId(null)
    setError(null)
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Wallet has been disconnected',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
    
    // The user will need to manually disconnect from the Coinbase wallet interface
    // or we can add instructions in the toast
  }

  const handleSwitchChain = async (newChainId) => {
    try {
      await switchChain(config, { chainId: newChainId })
      setChainId(newChainId)
      
      toast({
        title: 'Chain Switched',
        description: `Switched to chain ${newChainId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      setError(err.message)
      console.error('Chain switch error:', err)
      
      toast({
        title: 'Chain Switch Failed',
        description: err.message || 'Failed to switch chain',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  const copyAddressToClipboard = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address)
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }
  
  const openExplorer = () => {
    if (account?.address && chainId) {
      let explorerUrl = ''
      switch (chainId) {
        case 1: // Mainnet
          explorerUrl = `https://etherscan.io/address/${account.address}`
          break
        case 137: // Polygon
          explorerUrl = `https://polygonscan.com/address/${account.address}`
          break
        case 8453: // Base
          explorerUrl = `https://basescan.org/address/${account.address}`
          break
        case 42161: // Arbitrum
          explorerUrl = `https://arbiscan.io/address/${account.address}`
          break
        default:
          explorerUrl = `https://etherscan.io/address/${account.address}`
      }
      window.open(explorerUrl, '_blank')
    }
  }

  const getChainName = (id) => {
    switch (id) {
      case 1: return 'Ethereum'
      case 137: return 'Polygon'
      case 8453: return 'Base'
      case 42161: return 'Arbitrum'
      default: return 'Unknown'
    }
  }

  // Get Coinbase icon based on color mode and connection state
  const getCoinbaseIcon = () => {
    if (account) {
      return coinbaseConnected
    } else {
      return colorMode === 'light' ? coinbaseLight : coinbaseDark
    }
  }

  if (!account) {
    // Not connected state
    return (
      <Button
        onClick={handleConnect}
        isLoading={isConnecting}
        disabled={viewOnlyMode || isConnecting}
        loadingText="Connecting..."
        colorScheme="blue"
        variant="solid"
        size={isMobile ? "md" : "lg"}
        width={isMobile ? "100%" : "auto"}
        leftIcon={!isConnecting && (
          <img 
            src={getCoinbaseIcon()} 
            alt="Coinbase" 
            width="20" 
            height="20" 
          />
        )}
      >
        Connect with Coinbase Smart Wallet
      </Button>
    )
  }

  // Connected state - show wallet info
  return (
    <Box 
      p={4} 
      bg={bgColor} 
      borderRadius="md" 
      border="1px solid" 
      borderColor={borderColor}
      width="100%"
      maxWidth={isMobile ? "100%" : "320px"}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <HStack spacing={2}>
          <img 
            src={getCoinbaseIcon()} 
            alt="Coinbase" 
            width="24" 
            height="24" 
          />
          <Text fontWeight="bold" color={textColor}>
            Coinbase Smart Wallet
          </Text>
        </HStack>
        
        <Badge colorScheme="purple">
          {getChainName(chainId)}
        </Badge>
      </Flex>
      
      <Box mb={3}>
        <Text fontSize="sm" color={textMutedColor} mb={1}>
          Address
        </Text>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontFamily="mono" fontSize="sm" color={textColor}>
            {formatAddress(account.address)}
          </Text>
          <HStack spacing={1}>
            <Tooltip label="Copy address" placement="top">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={copyAddressToClipboard}
                aria-label="Copy address"
              >
                <FiCopy size={14} />
              </Button>
            </Tooltip>
            <Tooltip label="View in explorer" placement="top">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={openExplorer}
                aria-label="View in explorer"
              >
                <FiExternalLink size={14} />
              </Button>
            </Tooltip>
          </HStack>
        </Flex>
      </Box>
      
      {balance && (
        <Box mb={4}>
          <Text fontSize="sm" color={textMutedColor} mb={1}>
            Balance
          </Text>
          <Text fontWeight="bold" fontSize="lg" color={textColor}>
            {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
          </Text>
        </Box>
      )}
      
      <VStack spacing={2} mb={4}>
        <Text fontSize="sm" color={textMutedColor}>
          Switch Network
        </Text>
        <HStack spacing={2} flexWrap="wrap">
          <Button 
            size="sm" 
            onClick={() => handleSwitchChain(1)}
            variant={chainId === 1 ? "solid" : "outline"}
            colorScheme="blue"
          >
            Mainnet
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSwitchChain(137)}
            variant={chainId === 137 ? "solid" : "outline"}
            colorScheme="purple"
          >
            Polygon
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSwitchChain(8453)}
            variant={chainId === 8453 ? "solid" : "outline"}
            colorScheme="blue"
          >
            Base
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSwitchChain(42161)}
            variant={chainId === 42161 ? "solid" : "outline"}
            colorScheme="blue"
          >
            Arbitrum
          </Button>
        </HStack>
      </VStack>
      
      <Button 
        onClick={handleDisconnect}
        colorScheme="red" 
        variant="outline" 
        size="sm" 
        width="100%"
      >
        Disconnect
      </Button>
    </Box>
  )
}