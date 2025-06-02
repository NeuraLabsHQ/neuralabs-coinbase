import { 
  Box, 
  Button, 
  Card, 
  CardBody, 
  CardHeader,
  Divider,
  Flex, 
  FormControl, 
  FormLabel, 
  HStack, 
  Input, 
  Text, 
  VStack,
  useColorModeValue,
  useToast,
  Icon,
  InputGroup,
  InputRightElement,
  Badge,
  Heading,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { FiRefreshCw, FiArrowDown, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { getSuiBalance, getWalBalance, formatBalance } from '../exchange';
import colors from '../../../color';
import { useZkLogin } from '../../../contexts/ZkLoginContext';
import ConversionConfirmationPopup from '../../../components/auth/ConversionConfirmationPopup';

/**
 * SUI to WAL Token Converter Component
 * Converts SUI tokens to Walrus (WAL) tokens using the exchange contract
 */
function SUIToWALConverter() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const toast = useToast();
  const { zkLoginAddress, signTransaction: zkSignTransaction } = useZkLogin();
  
  // Get the active address from either wallet connection or zkLogin
  const activeAddress = account?.address || zkLoginAddress;
  const isZkLogin = !account && zkLoginAddress;
  
  const [suiBalance, setSuiBalance] = useState('0');
  const [walBalance, setWalBalance] = useState('0');
  const [convertAmount, setConvertAmount] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [exchangeRate] = useState('1:1'); // Default rate
  const [showConversionPopup, setShowConversionPopup] = useState(false);

  // Exchange contract configuration
  const EXCHANGE_CONFIG = {
    PACKAGE_ID: '0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f',
    SHARED_OBJECT_ID: '0x8d63209cf8589ce7aef8f262437163c67577ed09f3e636a9d8e0813843fb8bf1',
    INITIAL_SHARED_VERSION: '400185628'
  };

  // WAL Token configuration  
  const WAL_TOKEN_TYPE = '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';

  // Colors
  const bgColor = useColorModeValue('white', colors.gray[800]);
  const borderColor = useColorModeValue(colors.gray[200], colors.gray[700]);
  const inputBg = useColorModeValue(colors.gray[50], colors.gray[900]);
  const textColor = useColorModeValue(colors.gray[700], colors.gray[200]);
  const mutedColor = useColorModeValue(colors.gray[500], colors.gray[400]);

  // Load balances
  const loadBalances = async () => {
    if (!activeAddress || !client) return;

    setLoadingBalances(true);
    try {
      // Get SUI balance
      const suiBalanceData = await getSuiBalance(client, activeAddress);
      setSuiBalance(formatBalance(suiBalanceData.totalBalance, 9));

      // Get WAL balance
      const walBalanceData = await getWalBalance(client, activeAddress, WAL_TOKEN_TYPE);
      setWalBalance(formatBalance(walBalanceData.totalBalance, 9));
    } catch (error) {
      console.error('Error loading balances:', error);
      toast({
        title: 'Failed to load balances',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingBalances(false);
    }
  };

  // Convert SUI to WAL
  const handleConvertSUIToWAL = async () => {
    if (!activeAddress || !convertAmount) {
      toast({
        title: 'Please enter an amount to convert',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const amount = parseFloat(convertAmount);
    if (amount <= 0 || amount > parseFloat(suiBalance)) {
      toast({
        title: 'Invalid amount',
        description: 'Amount must be greater than 0 and less than your SUI balance',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // For zkLogin users, show confirmation popup
    if (isZkLogin) {
      setShowConversionPopup(true);
      return;
    }

    // For regular wallet users, proceed directly
    performConversion();
  };

  // Actual conversion logic
  const performConversion = async () => {
    setIsConverting(true);
    setShowConversionPopup(false);
    
    const amount = parseFloat(convertAmount);
    
    try {
      // Use the blockchain utility function directly
      const { convertSUIToWAL } = await import('../../../utils/blockchain');
      
      // For zkLogin, we need to handle the transaction differently
      let signAndExecuteFunc;
      let currentAccountObj;
      
      if (isZkLogin) {
        // For zkLogin, we need to create a wrapper for the sign function
        signAndExecuteFunc = async ({ transaction }) => {
          // The zkLogin signTransaction returns { transactionBytes, signature }
          const { transactionBytes, signature } = await zkSignTransaction(transaction);
          
          // Execute the transaction
          const result = await client.executeTransactionBlock({
            transactionBlock: transactionBytes,
            signature: signature,
            options: {
              showEffects: true,
              showObjectChanges: true,
            }
          });
          
          return result;
        };
        currentAccountObj = { address: zkLoginAddress };
      } else {
        signAndExecuteFunc = signAndExecuteTransaction;
        currentAccountObj = account;
      }
      
      const result = await convertSUIToWAL({
        amount,
        senderAddress: activeAddress,
        exchangeConfig: EXCHANGE_CONFIG,
        client,
        signAndExecute: signAndExecuteFunc,
        currentAccount: currentAccountObj
      });

      toast({
        title: 'Success!',
        description: `Successfully converted ${amount} SUI to WAL`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reload balances
      setTimeout(() => {
        loadBalances();
      }, 2000);
      
      // Reset form
      setConvertAmount('');
    } catch (error) {
      console.error('Error converting SUI to WAL:', error);
      toast({
        title: 'Conversion failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Load balances on mount and when account changes
  useEffect(() => {
    if (activeAddress && client) {
      loadBalances();
      // Refresh balances every 30 seconds
      const interval = setInterval(loadBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [activeAddress, client]);

  const handleMaxClick = () => {
    setConvertAmount(suiBalance);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg" mb={2}>SUI to WAL Token Converter</Heading>
        <Text color={mutedColor}>
          Convert your SUI tokens to Walrus (WAL) tokens to pay for Walrus storage fees.
        </Text>
      </Box>

      {/* Balance Display */}
      <Card variant="outline">
        <CardHeader>
          <HStack justify="space-between">
            <Text fontWeight="semibold">Your Balances</Text>
            <Icon
              as={FiRefreshCw}
              cursor="pointer"
              onClick={loadBalances}
              className={loadingBalances ? 'animate-spin' : ''}
              _hover={{ color: colors.blue[500] }}
            />
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <HStack>
                <Badge colorScheme="blue">SUI</Badge>
                <Text fontSize="sm" color={mutedColor}>Sui Network Token</Text>
              </HStack>
              <Text fontWeight="bold" fontSize="lg">
                {loadingBalances ? '...' : suiBalance}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <HStack>
                <Badge colorScheme="green">WAL</Badge>
                <Text fontSize="sm" color={mutedColor}>Walrus Token</Text>
              </HStack>
              <Text fontWeight="bold" fontSize="lg">
                {loadingBalances ? '...' : walBalance}
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Conversion Form */}
      <Card variant="outline">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Amount to Convert</FormLabel>
              <InputGroup>
                <Input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="0.0"
                  bg={inputBg}
                  _focus={{ borderColor: colors.blue[400] }}
                />
                <InputRightElement width="4.5rem">
                  <Button 
                    h="1.75rem" 
                    size="sm" 
                    onClick={handleMaxClick}
                    variant="ghost"
                    colorScheme="blue"
                  >
                    MAX
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Text fontSize="xs" color={mutedColor} mt={1}>
                Available: {suiBalance} SUI
              </Text>
            </FormControl>

            <Flex justify="center">
              <Icon as={FiArrowDown} fontSize="xl" color={mutedColor} />
            </Flex>

            <Box p={3} bg={inputBg} borderRadius="md">
              <Text fontSize="sm" color={mutedColor}>You will receive</Text>
              <Text fontSize="lg" fontWeight="bold">
                {convertAmount || '0'} WAL
              </Text>
              <Text fontSize="xs" color={mutedColor}>
                Exchange Rate: {exchangeRate}
              </Text>
            </Box>

            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleConvertSUIToWAL}
              isLoading={isConverting}
              loadingText="Converting..."
              isDisabled={!activeAddress || !convertAmount || parseFloat(convertAmount) <= 0}
            >
              Convert SUI to WAL
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Transaction Details */}
      <Card variant="outline">
        <CardHeader>
          <HStack>
            <Icon as={FiInfo} />
            <Text fontWeight="semibold">Transaction Details</Text>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={2} fontSize="sm">
            <HStack justify="space-between">
              <Text color={mutedColor}>Package ID:</Text>
              <Text fontFamily="mono" fontSize="xs" noOfLines={1}>
                {EXCHANGE_CONFIG.PACKAGE_ID.slice(0, 16)}...
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor}>Exchange Object:</Text>
              <Text fontFamily="mono" fontSize="xs" noOfLines={1}>
                {EXCHANGE_CONFIG.SHARED_OBJECT_ID.slice(0, 16)}...
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={mutedColor}>WAL Token Type:</Text>
              <Text fontFamily="mono" fontSize="xs" noOfLines={1}>
                {WAL_TOKEN_TYPE.slice(0, 24)}...
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* How it Works */}
      <Card variant="outline">
        <CardHeader>
          <Text fontWeight="semibold">How it Works</Text>
        </CardHeader>
        <CardBody>
          <List spacing={2}>
            <ListItem>
              <HStack align="start">
                <ListIcon as={FiCheckCircle} color="green.500" mt={1} />
                <Text fontSize="sm">Connect your SUI wallet to access the converter</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack align="start">
                <ListIcon as={FiCheckCircle} color="green.500" mt={1} />
                <Text fontSize="sm">Enter the amount of SUI you want to convert</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack align="start">
                <ListIcon as={FiCheckCircle} color="green.500" mt={1} />
                <Text fontSize="sm">Review the exchange rate (currently 1:1)</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack align="start">
                <ListIcon as={FiCheckCircle} color="green.500" mt={1} />
                <Text fontSize="sm">Confirm the transaction in your wallet</Text>
              </HStack>
            </ListItem>
            <ListItem>
              <HStack align="start">
                <ListIcon as={FiCheckCircle} color="green.500" mt={1} />
                <Text fontSize="sm">Receive WAL tokens instantly in your wallet</Text>
              </HStack>
            </ListItem>
          </List>
        </CardBody>
      </Card>

      {/* Important Notes */}
      <Card variant="outline" borderColor="orange.300">
        <CardHeader>
          <Text fontWeight="semibold" color="orange.600">Important Notes</Text>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm">• This is a testnet implementation for demonstration purposes</Text>
            <Text fontSize="sm">• Exchange rate is fixed at 1:1 (1 SUI = 1 WAL)</Text>
            <Text fontSize="sm">• WAL tokens are used exclusively for Walrus storage fees</Text>
            <Text fontSize="sm">• Ensure you have sufficient SUI for gas fees</Text>
            <Text fontSize="sm">• Transactions are irreversible once confirmed</Text>
            <Text fontSize="sm">• If this doesn't work, you can visit{" "}
              <a 
                href="https://stake-wal.wal.app/?network=testnet" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#3182ce', textDecoration: 'underline' }}
              >
                stake-wal.wal.app
              </a>{" "}
              to exchange SUI to WAL
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Conversion Confirmation Popup for zkLogin users */}
      <ConversionConfirmationPopup
        isOpen={showConversionPopup}
        onClose={() => setShowConversionPopup(false)}
        onConfirm={performConversion}
        suiAmount={convertAmount}
        walAmount={convertAmount} // 1:1 conversion rate
        isConverting={isConverting}
      />
    </VStack>
  );
}

export default SUIToWALConverter;