import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  Text,
  useColorModeValue,
  VStack,
  Badge,
  HStack
} from '@chakra-ui/react';
import { useState } from 'react';

const ExpandedValueEditor = ({ 
  isOpen, 
  onClose, 
  value, 
  onSave, 
  fieldName,
  fieldType,
  title = "Edit Value"
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const buttonBg = useColorModeValue('blue.500', 'gray.600');
  const buttonHoverBg = useColorModeValue('blue.600', 'gray.500');
  const textareaBg = useColorModeValue('gray.50', 'gray.800');

  const handleSave = () => {
    onSave(localValue);
    onClose();
  };

  const getTypeColor = (type) => {
    const colors = {
      'string': 'blue',
      'number': 'green',
      'boolean': 'purple',
      'object': 'orange',
      'array': 'teal',
      'json': 'cyan',
      'any': 'gray'
    };
    return colors[type] || 'gray';
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
          <VStack align="start" spacing={2}>
            <Text>{title}</Text>
            <HStack spacing={3}>
              <Text fontSize="sm" color={mutedTextColor}>Field: <strong>{fieldName}</strong></Text>
              {fieldType && (
                <Badge colorScheme={getTypeColor(fieldType)} variant="subtle" size="sm">
                  {fieldType}
                </Badge>
              )}
            </HStack>
          </VStack>
        </ModalHeader>
        
        <ModalBody py={6}>
          <VStack spacing={4} align="stretch">
            <Textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={`Enter ${fieldName} value...`}
              minH="200px"
              resize="vertical"
              bg={textareaBg}
              borderColor={borderColor}
              _focus={{
                borderColor: buttonBg,
                boxShadow: `0 0 0 1px ${buttonBg}`
              }}
            />
            {fieldType === 'json' && (
              <Text fontSize="xs" color={mutedTextColor}>
                Tip: Enter valid JSON format for this field
              </Text>
            )}
            {fieldType === 'array' && (
              <Text fontSize="xs" color={mutedTextColor}>
                Tip: Enter comma-separated values or JSON array format
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            bg={buttonBg} 
            _hover={{ bg: buttonHoverBg }} 
            color="white" 
            onClick={handleSave}
          >
            Save Value
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExpandedValueEditor;