import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Textarea,
  Text,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';

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
  
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const textareaBg = useColorModeValue('gray.800', 'gray.800');
  const textColor = useColorModeValue('white', 'white');

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
              _hover={{ borderColor: 'gray.600' }}
              _focus={{ borderColor: 'gray.500', boxShadow: 'none' }}
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
            <Button bg="gray.600" _hover={{ bg: 'gray.500' }} color="white" onClick={handleSave}>
              Save
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DescriptionPopup;