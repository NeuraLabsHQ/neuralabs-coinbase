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
  Code,
  Divider
} from '@chakra-ui/react';
import { FiShield, FiKey } from 'react-icons/fi';

const MessageSigningPopup = ({ isOpen, onClose, onSign, email, timestamp }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const codeColor = useColorModeValue('gray.100', 'gray.700');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  
  const authMessage = `Authenticate with zkLogin for ${email} at ${timestamp}`;
  
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
            <Icon as={FiKey} boxSize={6} color={iconColor} />
            <Text>Message Signing Request</Text>
          </HStack>
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box 
              p={4} 
              bg={useColorModeValue('blue.50', 'blue.900')} 
              borderRadius="md"
              borderWidth="1px"
              borderColor={useColorModeValue('blue.200', 'blue.700')}
            >
              <HStack spacing={3} mb={2}>
                <Icon as={FiShield} color={iconColor} />
                <Text fontWeight="semibold" color={textColor}>
                  zkLogin Authentication
                </Text>
              </HStack>
              <Text fontSize="sm" color={textColor}>
                To complete your authentication, we need you to sign a message. 
                This signature proves you control this account without revealing your private keys.
              </Text>
            </Box>
            
            <Box>
              <Text fontWeight="medium" mb={2} color={textColor}>
                Message to sign:
              </Text>
              <Code 
                p={3} 
                borderRadius="md" 
                bg={codeColor}
                display="block"
                fontSize="sm"
                wordBreak="break-all"
              >
                {authMessage}
              </Code>
            </Box>
            
            <Divider />
            
            <Box>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                <strong>What happens when you sign:</strong>
              </Text>
              <VStack align="start" spacing={1} mt={2}>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  • Your signature will be used to authenticate you
                </Text>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  • A secure session will be created
                </Text>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                  • Your private keys remain safe and never leave your device
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
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            >
              Reject
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={onSign}
              leftIcon={<FiKey />}
            >
              Sign Message
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MessageSigningPopup;