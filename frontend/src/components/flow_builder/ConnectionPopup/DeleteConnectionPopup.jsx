import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  HStack,
  VStack,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';

const DeleteConnectionPopup = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  sourceNode,
  targetNode
}) => {
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const dangerBg = useColorModeValue('red.500', 'red.600');
  const dangerHoverBg = useColorModeValue('red.600', 'red.700');
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="md"
      blockScrollOnMount={false}
      preserveScrollBarGap={true}
      returnFocusOnClose={false}
      isCentered
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg={bgColor}>
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} color={textColor}>
          <HStack spacing={3}>
            <Icon as={FiAlertTriangle} color="red.400" boxSize={5} />
            <Text>Delete Connection</Text>
          </HStack>
        </ModalHeader>
        
        <ModalBody py={6}>
          <VStack spacing={4} align="start">
            <Text color={textColor} fontSize="md">
              Are you sure you want to delete this connection?
            </Text>
            
            {sourceNode && targetNode && (
              <VStack spacing={2} align="start" w="full">
                <Text color={mutedTextColor} fontSize="sm" fontWeight="medium">
                  Connection Details:
                </Text>
                <HStack 
                  spacing={3} 
                  p={3} 
                  bg={headerBg} 
                  borderRadius="md" 
                  w="full"
                >
                  <VStack spacing={1} align="start" flex="1">
                    <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase">
                      From
                    </Text>
                    <Text fontSize="sm" color={textColor} fontWeight="medium">
                      {sourceNode.name}
                    </Text>
                  </VStack>
                  
                  {/* <Text color={mutedTextColor}>→</Text> */}
                  
                  <VStack spacing={1} align="start" flex="1">
                    <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase">
                      To
                    </Text>
                    <Text fontSize="sm" color={textColor} fontWeight="medium">
                      {targetNode.name}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            )}
            
            <Text color={mutedTextColor} fontSize="sm">
              This action cannot be undone. All input/output mappings for this connection will be lost.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose} color={textColor}>
            Cancel
          </Button>
          <Button 
            bg={dangerBg}
            _hover={{ bg: dangerHoverBg }}
            color="white"
            leftIcon={<FiTrash2 />}
            onClick={handleConfirm}
          >
            Delete Connection
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteConnectionPopup;