import React, { useState } from 'react';
import {
  Button,
  Box,
  Text,
  VStack,
  HStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Code,
  Badge,
  Spinner,
  Icon,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FiSend, FiCheck, FiAlertCircle, FiCopy } from 'react-icons/fi';
import { useWallet } from '../../contexts/WalletContextProvider';
import { executeCoinbaseTransaction, formatTransactionDisplay, getTransactionType } from '../../services/coinbaseTransaction';
import useUiColors from '../../utils/uiColors';

// Helper function to get explorer URL
const getExplorerUrl = (txHash, chainId) => {
  const explorers = {
    1: `https://etherscan.io/tx/${txHash}`,
    11155111: `https://sepolia.etherscan.io/tx/${txHash}`,
    8453: `https://basescan.org/tx/${txHash}`,
    84532: `https://sepolia.basescan.org/tx/${txHash}`,
  };
  
  return explorers[chainId] || `https://etherscan.io/tx/${txHash}`;
};

const TransactionButton = ({ transaction, onSuccess, onError }) => {
  const colors = useUiColors();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { connect, address } = useWallet();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  
  // Don't render if no transaction
  if (!transaction || (transaction && Object.keys(transaction).length === 0)) {
    return null;
  }

  // Check if transaction has an error
  if (transaction.error) {
    return (
      <Box
        p={4}
        borderRadius="md"
        bg="red.50"
        borderWidth="1px"
        borderColor="red.200"
      >
        <HStack>
          <Icon as={FiAlertCircle} color="red.600" />
          <Text color="red.600">
            Transaction Error: {transaction.error}
          </Text>
        </HStack>
      </Box>
    );
  }

  const handleExecuteTransaction = async () => {
    setIsExecuting(true);
    setTransactionResult(null);

    try {
      const result = await executeCoinbaseTransaction(transaction, {
        onConnect: connect,
        onStatus: (status) => {
          console.log('Transaction status:', status);
          
          // Show toast for status updates
          if (status.type === 'pending') {
            toast({
              title: 'Transaction Pending',
              description: 'Please confirm in your wallet',
              status: 'info',
              duration: null,
              isClosable: true,
            });
          } else if (status.type === 'mining') {
            toast.closeAll();
            toast({
              title: 'Transaction Submitted',
              description: `Mining transaction: ${status.hash}`,
              status: 'loading',
              duration: null,
              isClosable: true,
            });
          }
        },
        waitForConfirmation: true
      });

      if (result.success) {
        setTransactionResult(result);
        toast.closeAll();
        toast({
          title: 'Transaction Successful!',
          description: `Transaction hash: ${result.hash}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.closeAll();
      toast({
        title: 'Transaction Failed',
        description: error.message || 'An error occurred while executing the transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const txType = getTransactionType(transaction);
  const displayInfo = formatTransactionDisplay(transaction);

  return (
    <>
      <Button
        leftIcon={<FiSend />}
        colorScheme="blue"
        size="md"
        onClick={onOpen}
        isLoading={isExecuting}
        loadingText="Executing..."
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        }}
        transition="all 0.2s"
      >
        Execute Transaction
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={colors.bgSecondary} borderColor={colors.borderColor} borderWidth="1px">
          <ModalHeader>
            <HStack justify="space-between">
              <Text color={colors.textPrimary}>Confirm Transaction</Text>
              <Badge colorScheme={txType === 'transfer' ? 'green' : 'purple'}>
                {txType}
              </Badge>
            </HStack>
          </ModalHeader>
          {/* <ModalCloseButton /> */}
          
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              {/* Transaction Summary */}
              <Box>
                <Text fontWeight="bold" mb={2} color={colors.textPrimary}>Transaction Details:</Text>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text color={colors.textSecondary}>From:</Text>
                    <Code fontSize="sm" colorScheme="blue" bg={colors.bgSource}>{transaction.from || address || 'Your Wallet'}</Code>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={colors.textSecondary}>To:</Text>
                    <Code fontSize="sm" colorScheme="orange" bg={colors.bgSource}>{transaction.to}</Code>
                  </HStack>
                  {displayInfo.value && (
                    <HStack justify="space-between">
                      <Text color={colors.textSecondary}>Value:</Text>
                      <Text fontWeight="medium" color="green.500">{displayInfo.value}</Text>
                    </HStack>
                  )}
                  <HStack justify="space-between">
                    <Text color={colors.textSecondary}>Network:</Text>
                    <Badge colorScheme="purple">{displayInfo.network}</Badge>
                  </HStack>
                </VStack>
              </Box>

              {/* Function Call Info */}
              {displayInfo.functionName && (
                <Box>
                  <Text fontWeight="bold" mb={2} color={colors.textPrimary}>Function Call:</Text>
                  <Code p={2} borderRadius="md" fontSize="sm" display="block" bg={colors.bgSource} color={colors.textPrimary}>
                    {displayInfo.functionName}
                  </Code>
                </Box>
              )}

              {/* Raw Transaction Data (collapsible) */}
              <Box>
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: colors.textSecondary }}>
                    Raw Transaction Data
                  </summary>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    fontSize="xs"
                    p={2}
                    mt={2}
                    borderRadius="md"
                    overflowX="auto"
                    bg={colors.bgSource}
                    color={colors.textPrimary}
                  >
                    {JSON.stringify(transaction, null, 2)}
                  </Code>
                </details>
              </Box>

              {/* Transaction Result */}
              {transactionResult && (
                <Box
                  p={4}
                  borderRadius="md"
                  bg={colors.bgSource}
                  borderWidth="2px"
                  borderColor="green.400"
                >
                  <HStack mb={3}>
                    <Icon as={FiCheck} color="green.500" boxSize={5} />
                    <Text fontWeight="bold" color="green.500" fontSize="lg">
                      Transaction Successful!
                    </Text>
                  </HStack>
                  <Box 
                    bg={colors.bgPrimary} 
                    borderRadius="md"
                    p={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Code 
                      fontSize="sm" 
                      bg="transparent"
                      color={colors.textPrimary}
                      p={0}
                    >
                      {transactionResult.hash.substring(0, 10)}...{transactionResult.hash.substring(transactionResult.hash.length - 8)}
                    </Code>
                    {/* <Tooltip label="Copy transaction hash" placement="top"> */}
                      <IconButton
                        icon={<FiCopy />}
                        size="xs"
                        variant="ghost"
                        aria-label="Copy transaction hash"
                        ml={2}
                        _hover={{ bg: colors.bgHover }}
                        onClick={() => {
                          navigator.clipboard.writeText(transactionResult.hash);
                          toast({
                            title: "Copied!",
                            description: "Transaction hash copied to clipboard",
                            status: "success",
                            duration: 2000,
                            isClosable: true,
                          });
                        }}
                      />
                    {/* </Tooltip> */}
                  </Box>
                  {transactionResult.receipt && (
                    <HStack mt={2} fontSize="sm">
                      <Text color={colors.textSecondary}>Block:</Text>
                      <Badge colorScheme="gray">{transactionResult.receipt.blockNumber.toString()}</Badge>
                    </HStack>
                  )}
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            {transactionResult && transactionResult.success ? (
              <>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Done
                </Button>
                <Button
                  colorScheme="green"
                  onClick={() => {
                    const explorerUrl = getExplorerUrl(transactionResult.hash, transaction.chainId);
                    window.open(explorerUrl, '_blank');
                  }}
                  leftIcon={<FiCheck />}
                >
                  View in Explorer
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isExecuting}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleExecuteTransaction}
                  isLoading={isExecuting}
                  loadingText="Processing..."
                  leftIcon={isExecuting ? <Spinner size="sm" /> : <FiSend />}
                >
                  {isExecuting ? 'Processing...' : 'Confirm & Execute'}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TransactionButton;