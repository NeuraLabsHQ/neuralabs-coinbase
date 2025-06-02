import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  VStack,
  Box,
  Icon,
  useColorModeValue,
  HStack,
  Divider,
  Flex,
  Badge
} from '@chakra-ui/react';
import { FiArrowDown, FiAlertCircle } from 'react-icons/fi';
import { RiExchangeLine } from 'react-icons/ri';

const ConversionConfirmationPopup = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  suiAmount, 
  walAmount,
  isConverting = false 
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const suiBgColor = useColorModeValue('blue.50', 'blue.900');
  const walBgColor = useColorModeValue('green.50', 'green.900');
  const arrowBgColor = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent 
        bg={bgColor} 
        borderRadius="xl" 
        borderWidth="1px" 
        borderColor={borderColor}
        maxW="md"
      >
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={RiExchangeLine} boxSize={6} color={iconColor} />
            <Text>Confirm Token Conversion</Text>
          </HStack>
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Conversion Summary */}
            <VStack spacing={3} align="stretch">
              {/* From SUI */}
              <Box 
                p={4} 
                bg={suiBgColor} 
                borderRadius="lg"
                borderWidth="1px"
                borderColor={useColorModeValue('blue.200', 'blue.700')}
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color={textColor} opacity={0.8}>
                      You Pay
                    </Text>
                    <HStack>
                      <Badge colorScheme="blue" fontSize="xs">SUI</Badge>
                      <Text fontWeight="medium" color={textColor}>
                        Sui Network Token
                      </Text>
                    </HStack>
                  </VStack>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {suiAmount}
                  </Text>
                </HStack>
              </Box>

              {/* Arrow */}
              <Flex justify="center">
                <Box 
                  p={2} 
                  bg={arrowBgColor} 
                  borderRadius="full"
                  width="36px"
                  height="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiArrowDown} boxSize={4} color={iconColor} />
                </Box>
              </Flex>

              {/* To WAL */}
              <Box 
                p={4} 
                bg={walBgColor} 
                borderRadius="lg"
                borderWidth="1px"
                borderColor={useColorModeValue('green.200', 'green.700')}
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color={textColor} opacity={0.8}>
                      You Receive
                    </Text>
                    <HStack>
                      <Badge colorScheme="green" fontSize="xs">WAL</Badge>
                      <Text fontWeight="medium" color={textColor}>
                        Walrus Token
                      </Text>
                    </HStack>
                  </VStack>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {walAmount}
                  </Text>
                </HStack>
              </Box>
            </VStack>
            
            {/* Exchange Rate */}
            <Box 
              p={3} 
              bg={useColorModeValue('gray.50', 'gray.700')} 
              borderRadius="md"
            >
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>
                  Exchange Rate:
                </Text>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  1 SUI = 1 WAL
                </Text>
              </HStack>
            </Box>
            
            <Divider />
            
            {/* zkLogin Notice */}
            <Box 
              p={3} 
              bg={useColorModeValue('orange.50', 'orange.900')} 
              borderRadius="md"
              borderWidth="1px"
              borderColor={useColorModeValue('orange.200', 'orange.700')}
            >
              <HStack spacing={2} align="start">
                <Icon as={FiAlertCircle} color="orange.500" mt={0.5} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>
                    zkLogin Transaction
                  </Text>
                  <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                    This transaction will be signed using your zkLogin credentials. 
                    The conversion will happen on-chain and WAL tokens will be sent to your zkLogin address.
                  </Text>
                </VStack>
              </HStack>
            </Box>
            
            {/* Transaction Details */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={textColor}>
                Transaction Details:
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                  • Network fees will apply (paid in SUI)
                </Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                  • Transaction is irreversible once confirmed
                </Text>
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')}>
                  • WAL tokens will be available immediately after confirmation
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={onClose}
              isDisabled={isConverting}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={onConfirm}
              isLoading={isConverting}
              loadingText="Converting..."
              leftIcon={<RiExchangeLine />}
            >
              Confirm Conversion
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConversionConfirmationPopup;