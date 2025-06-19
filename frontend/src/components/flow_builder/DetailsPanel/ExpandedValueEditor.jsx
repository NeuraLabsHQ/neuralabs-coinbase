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
  HStack,
  Box,
  IconButton,
  useToast
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiCode } from 'react-icons/fi';

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
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [jsonError, setJsonError] = useState('');
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const buttonBg = useColorModeValue('blue.500', 'gray.600');
  const buttonHoverBg = useColorModeValue('blue.600', 'gray.500');
  const textareaBg = useColorModeValue('gray.50', 'gray.800');
  const errorBorderColor = useColorModeValue('red.500', 'red.300');
  const successBorderColor = useColorModeValue('green.500', 'green.300');

  // Initialize formatted value for JSON types
  useEffect(() => {
    if (isJsonType() && value) {
      try {
        const parsed = JSON.parse(value);
        setLocalValue(JSON.stringify(parsed, null, 2));
      } catch {
        setLocalValue(value);
      }
    }
  }, [value]);

  const isJsonType = () => {
    return ['json', 'object', 'array'].includes(fieldType?.toLowerCase());
  };

  const validateJson = (jsonString) => {
    if (!jsonString.trim()) {
      setIsJsonValid(true);
      setJsonError('');
      return true;
    }
    
    try {
      JSON.parse(jsonString);
      setIsJsonValid(true);
      setJsonError('');
      return true;
    } catch (error) {
      setIsJsonValid(false);
      setJsonError(error.message);
      return false;
    }
  };

  const formatJson = () => {
    if (!localValue.trim()) return;
    
    try {
      const parsed = JSON.parse(localValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setLocalValue(formatted);
      setIsJsonValid(true);
      setJsonError('');
      toast({
        title: 'JSON formatted successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleValueChange = (newValue) => {
    setLocalValue(newValue);
    if (isJsonType()) {
      validateJson(newValue);
    }
  };

  const handleSave = () => {
    if (isJsonType() && !validateJson(localValue)) {
      toast({
        title: 'Invalid JSON',
        description: 'Please fix the JSON errors before saving',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // For JSON types, save the minified version
    if (isJsonType() && localValue.trim()) {
      try {
        const parsed = JSON.parse(localValue);
        onSave(JSON.stringify(parsed));
      } catch {
        onSave(localValue);
      }
    } else {
      onSave(localValue);
    }
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
      size={isJsonType() ? "2xl" : "xl"}
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
            {isJsonType() && (
              <HStack justify="space-between">
                <Text fontSize="sm" color={mutedTextColor}>
                  {isJsonValid ? 'Valid JSON' : 'Invalid JSON'}
                </Text>
                <IconButton
                  icon={<FiCode />}
                  size="sm"
                  variant="outline"
                  onClick={formatJson}
                  aria-label="Format JSON"
                  title="Format JSON"
                />
              </HStack>
            )}
            
            <Box position="relative">
              <Textarea
                value={localValue}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={isJsonType() 
                  ? `Enter valid JSON...\n\nExample:\n${fieldType === 'array' ? '[\n  "item1",\n  "item2"\n]' : '{\n  "key": "value"\n}'}`
                  : `Enter ${fieldName} value...`
                }
                minH={isJsonType() ? "300px" : "200px"}
                resize="vertical"
                bg={textareaBg}
                borderColor={isJsonType() ? (localValue && !isJsonValid ? errorBorderColor : isJsonValid && localValue ? successBorderColor : borderColor) : borderColor}
                borderWidth={isJsonType() && localValue ? "2px" : "1px"}
                fontFamily={isJsonType() ? "monospace" : "inherit"}
                fontSize={isJsonType() ? "sm" : "md"}
                _focus={{
                  borderColor: isJsonType() && !isJsonValid ? errorBorderColor : buttonBg,
                  boxShadow: isJsonType() && !isJsonValid ? `0 0 0 1px ${errorBorderColor}` : `0 0 0 1px ${buttonBg}`,
                  borderWidth: "2px"
                }}
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: useColorModeValue('gray.100', 'gray.700'),
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: useColorModeValue('gray.400', 'gray.500'),
                    borderRadius: '4px',
                  },
                }}
              />
            </Box>

            {!isJsonValid && jsonError && (
              <Box bg={useColorModeValue('red.50', 'red.900')} p={3} borderRadius="md" borderWidth="1px" borderColor={errorBorderColor}>
                <Text fontSize="sm" color={errorBorderColor}>
                  <strong>JSON Error:</strong> {jsonError}
                </Text>
              </Box>
            )}

            {fieldType === 'json' && (
              <Text fontSize="xs" color={mutedTextColor}>
                Enter valid JSON format. Use the format button to auto-indent.
              </Text>
            )}
            {fieldType === 'array' && (
              <Text fontSize="xs" color={mutedTextColor}>
                Enter an array in JSON format (e.g., ["item1", "item2"]) or as comma-separated values (e.g., item1, item2, item3)
              </Text>
            )}
            {fieldType === 'object' && (
              <Text fontSize="xs" color={mutedTextColor}>
                Enter a JSON object format, e.g., {"{"}"key1": "value1", "key2": "value2"{"}"}
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