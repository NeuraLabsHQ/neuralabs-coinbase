import React, { useState } from 'react';
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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textareaBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const handleSave = () => {
    if (onSave) {
      onSave(localDescription);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
          {title}
        </ModalHeader>
        <ModalCloseButton />
        
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
            />
          ) : (
            <Box p={4} bg={textareaBg} borderRadius="md" minH="150px">
              <Text color={textColor}>
                {description || 'No description available.'}
              </Text>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {isEditable ? 'Cancel' : 'Close'}
          </Button>
          {isEditable && (
            <Button colorScheme="blue" onClick={handleSave}>
              Save
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DescriptionPopup;