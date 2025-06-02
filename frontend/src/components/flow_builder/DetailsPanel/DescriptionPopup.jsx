import {
    Box,
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const DescriptionPopup = ({ 
  isOpen, 
  onClose, 
  description = '', 
  isEditable = false,
  onSave,
  title = 'Description'
}) => {
  const [localDescription, setLocalDescription] = useState(description);
  
  // Update local description when prop changes
  useEffect(() => {
    setLocalDescription(description);
  }, [description]);
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textareaBg = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const hoverBorderColor = useColorModeValue('gray.300', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.400', 'gray.500');
  const buttonBg = useColorModeValue('blue.500', 'gray.600');
  const buttonHoverBg = useColorModeValue('blue.600', 'gray.500');

  const handleSave = () => {
    if (onSave) {
      onSave(localDescription);
    }
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl"
      blockScrollOnMount={false}
      preserveScrollBarGap={true}
      returnFocusOnClose={false}
      isCentered
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg={bgColor}>
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} color={textColor}>
          {title}
        </ModalHeader>
        {/* <ModalCloseButton /> */}
        
        <ModalBody py={6}>
          {isEditable ? (
            <Textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              placeholder="Enter description..."
              size="sm"
              minH="150px"
              bg={textareaBg}
              color={textColor}
              border="1px solid"
              borderColor={borderColor}
              _hover={{ borderColor: hoverBorderColor }}
              _focus={{ borderColor: focusBorderColor, boxShadow: 'none' }}
            />
          ) : (
            <Box p={4} bg={textareaBg} borderRadius="md" minH="150px" border="1px solid" borderColor={borderColor}>
              <Text color={textColor}>
                {description || 'No description available.'}
              </Text>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose} color={textColor}>
            {isEditable ? 'Cancel' : 'Close'}
          </Button>
          {isEditable && (
            <Button bg={buttonBg} _hover={{ bg: buttonHoverBg }} color="white" onClick={handleSave}>
              Save
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DescriptionPopup;