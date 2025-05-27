import {
    Box,
    Button,
    HStack,
    IconButton,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import DeleteConnectionPopup from './DeleteConnectionPopup';

const ConnectionPopup = ({
  isOpen,
  onClose,
  sourceNode,
  targetNode,
  onSave,
  onDelete,
  existingMappings = [],
  allEdges = []
}) => {
  const [mappings, setMappings] = useState([]);
  const [isValid, setIsValid] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const validBorderColor = useColorModeValue('green.400', 'cyan.400');
  const errorBorderColor = useColorModeValue('red.500', 'red.500');
  
  // Additional color mode values for functions
  const validRowBg = useColorModeValue('green.50', 'cyan.900');
  const errorRowBg = useColorModeValue('red.50', 'red.900');
  const validTextColor = useColorModeValue('green.600', 'cyan.400');
  const errorTextColor = useColorModeValue('red.600', 'red.400');
  const warningTextColor = useColorModeValue('orange.600', 'orange.400');
  const yellowTextColor = useColorModeValue('yellow.600', 'yellow.400');
  const grayTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBorderColor = useColorModeValue('gray.300', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.400', 'cyan.500');
  const buttonBg = useColorModeValue('blue.500', 'cyan.600');
  const buttonHoverBg = useColorModeValue('blue.600', 'cyan.700');

  // Initialize mappings when modal opens
  useEffect(() => {
    if (isOpen && sourceNode && targetNode) {
      const sourceOutputs = sourceNode.outputs || [];
      const targetInputs = targetNode.inputs || [];
      const maxRows = Math.max(sourceOutputs.length, targetInputs.length);
      
      // Initialize mappings based on existing mappings or create new ones
      const initialMappings = [];
      for (let i = 0; i < maxRows; i++) {
        const existingMapping = existingMappings.find(m => m.index === i);
        initialMappings.push({
          index: i,
          fromOutput: existingMapping?.fromOutput || '',
          toInput: existingMapping?.toInput || '',
          fromType: '',
          toType: ''
        });
      }
      setMappings(initialMappings);
    }
  }, [isOpen, sourceNode, targetNode, existingMappings]);

  // Validate mappings whenever they change
  useEffect(() => {
    validateMappings();
  }, [mappings]);

  const getOutputType = (outputName) => {
    const output = sourceNode?.outputs?.find(o => o.name === outputName);
    return output?.type || '';
  };

  const getInputType = (inputName) => {
    const input = targetNode?.inputs?.find(i => i.name === inputName);
    return input?.type || '';
  };

  const isInputAlreadyAssigned = (inputName, currentIndex) => {
    // Check if this input is assigned in another mapping of this connection
    const assignedInCurrentConnection = mappings.some(
      (m, idx) => idx !== currentIndex && m.toInput === inputName && m.toInput !== ''
    );
    
    if (assignedInCurrentConnection) {
      return { assigned: true, source: 'current connection' };
    }
    
    // Check if this input is assigned in other edges
    const assignedInOtherEdge = allEdges.find(edge => 
      edge.target === targetNode.id && 
      edge.source !== sourceNode.id &&
      edge.mappings?.some(m => m.toInput === inputName)
    );
    
    if (assignedInOtherEdge) {
      const sourceNodeName = assignedInOtherEdge.sourceName || assignedInOtherEdge.source;
      return { assigned: true, source: sourceNodeName };
    }
    
    return { assigned: false };
  };

  const getValidationStatus = (mapping, index) => {
    const { fromOutput, toInput } = mapping;
    
    // Case 1: Both empty
    if (!fromOutput && !toInput) {
      return { status: 'empty', message: '' };
    }
    
    // Case 2: Input selected but no output
    if (!fromOutput && toInput) {
      return { status: 'error', message: 'Please select an output' };
    }
    
    // Case 3: Output selected but no input
    if (fromOutput && !toInput) {
      return { status: 'error', message: 'Please select an input' };
    }
    
    // Case 4: Check if input is already assigned
    const inputAssignment = isInputAlreadyAssigned(toInput, index);
    if (inputAssignment.assigned) {
      return { 
        status: 'error', 
        message: `Input already assigned (${inputAssignment.source})` 
      };
    }
    
    // Case 5: Check type compatibility
    const outputType = getOutputType(fromOutput);
    const inputType = getInputType(toInput);
    
    if (outputType && inputType) {
      // Allow 'any' type to match with anything
      if (outputType === 'any' || inputType === 'any') {
        return { status: 'valid', message: 'Valid' };
      }
      
      if (outputType !== inputType) {
        return { status: 'error', message: 'Type mismatch' };
      }
    }
    
    return { status: 'valid', message: 'Valid' };
  };

  const validateMappings = () => {
    // Allow saving even with no mappings
    const hasErrors = mappings.some(m => {
      const validation = getValidationStatus(m, mappings.indexOf(m));
      return validation.status === 'error' && (m.fromOutput || m.toInput);
    });
    
    // Connection is valid if there are no errors (including when all mappings are empty)
    setIsValid(!hasErrors);
  };

  const handleOutputChange = (index, value) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      fromOutput: value,
      fromType: getOutputType(value)
    };
    setMappings(newMappings);
  };

  const handleInputChange = (index, value) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      toInput: value,
      toType: getInputType(value)
    };
    setMappings(newMappings);
  };

  const handleSave = () => {
    // Filter out empty mappings - if all mappings are empty, pass an empty array
    const validMappings = mappings.filter(m => m.fromOutput && m.toInput);
    onSave(validMappings);
    onClose();
  };

  const getRowColor = (validation) => {
    switch (validation.status) {
      case 'valid':
        return validRowBg;
      case 'error':
        return errorRowBg;
      default:
        return 'transparent';
    }
  };

  const getMessageColor = (validation) => {
    switch (validation.status) {
      case 'valid':
        return validTextColor;
      case 'error':
        if (validation.message === 'Type mismatch') return errorTextColor;
        if (validation.message.includes('already assigned')) return warningTextColor;
        return yellowTextColor;
      default:
        return grayTextColor;
    }
  };

  const getBorderColor = () => {
    if (mappings.some(m => {
      const validation = getValidationStatus(m, mappings.indexOf(m));
      return validation.status === 'error' && validation.message === 'Type mismatch';
    })) {
      return errorBorderColor;
    }
    
    if (isValid) {
      return validBorderColor;
    }
    
    return borderColor;
  };

  if (!sourceNode || !targetNode) return null;

  const sourceOutputs = sourceNode.outputs || [];
  const targetInputs = targetNode.inputs || [];

  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="4xl"
      blockScrollOnMount={false}
      preserveScrollBarGap={true}
      returnFocusOnClose={false}
      isCentered
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent 
        bg={bgColor} 
        maxW="70%" 
        border="2px solid"
        borderColor={getBorderColor()}
        transition="border-color 0.2s"
      >
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} color={textColor}>
          <HStack justify="space-between">
            <Text>Connection: {sourceNode.name} → {targetNode.name}</Text>
            <HStack>
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => setIsDeletePopupOpen(true)}
                >
                  Delete Connection
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalHeader>

        <ModalBody py={6}>
          <TableContainer>
            <Table variant="unstyled" size="sm">
              <Thead>
                <Tr>
                  <Th color={mutedTextColor} width="35%" fontSize="xs" textTransform="uppercase">
                    <HStack spacing={1}>
                      <Box w="3" h="3" borderRadius="full" bg={mutedTextColor} />
                      <Text>FROM OUTPUT</Text>
                    </HStack>
                  </Th>
                  <Th color={mutedTextColor} width="35%" fontSize="xs" textTransform="uppercase">
                    <HStack spacing={1}>
                      <Box w="3" h="3" borderRadius="full" bg={mutedTextColor} />
                      <Text>TO INPUT</Text>
                    </HStack>
                  </Th>
                  <Th color={mutedTextColor} width="25%" fontSize="xs" textTransform="uppercase">
                    <HStack spacing={1}>
                      <Box w="3" h="3" borderRadius="full" bg={mutedTextColor} />
                      <Text>IS VALID</Text>
                    </HStack>
                  </Th>
                  <Th width="5%"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {mappings.map((mapping, index) => {
                  const validation = getValidationStatus(mapping, index);
                  return (
                    <Tr key={index}>
                      <Td py={2}>
                        <Select
                          value={mapping.fromOutput}
                          onChange={(e) => handleOutputChange(index, e.target.value)}
                          size="sm"
                          bg={getRowColor(validation)}
                          border="1px solid"
                          borderColor={borderColor}
                          color={textColor}
                          _hover={{ borderColor: hoverBorderColor }}
                          _focus={{ borderColor: focusBorderColor, boxShadow: 'none' }}
                        >
                          <option value="" style={{ backgroundColor: inputBg }}>Select output</option>
                          {sourceOutputs.map((output, idx) => (
                            <option 
                              key={idx} 
                              value={output.name}
                              style={{ backgroundColor: inputBg }}
                            >
                              {output.name} ({output.type})
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td py={2}>
                        <Select
                          value={mapping.toInput}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          size="sm"
                          bg={getRowColor(validation)}
                          border="1px solid"
                          borderColor={borderColor}
                          color={textColor}
                          _hover={{ borderColor: hoverBorderColor }}
                          _focus={{ borderColor: focusBorderColor, boxShadow: 'none' }}
                        >
                          <option value="" style={{ backgroundColor: inputBg }}>Select input</option>
                          {targetInputs.map((input, idx) => (
                            <option 
                              key={idx} 
                              value={input.name}
                              style={{ backgroundColor: inputBg }}
                              disabled={isInputAlreadyAssigned(input.name, index).assigned}
                            >
                              {input.name} ({input.type})
                              {isInputAlreadyAssigned(input.name, index).assigned && ' (assigned)'}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td py={2}>
                        <Box
                          px={3}
                          py={1}
                          bg={getRowColor(validation)}
                          borderRadius="md"
                          border="1px solid"
                          borderColor={
                            validation.status === 'valid' ? 'cyan.500' : 
                            validation.status === 'error' ? 'transparent' : 'transparent'
                          }
                        >
                          <Text 
                            fontSize="sm" 
                            color={getMessageColor(validation)}
                            fontWeight={validation.status === 'valid' ? 'medium' : 'normal'}
                          >
                            {validation.message}
                          </Text>
                        </Box>
                      </Td>
                      <Td py={2}>
                        <IconButton
                          icon={<FiX />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => {
                            const newMappings = [...mappings];
                            newMappings[index] = {
                              ...newMappings[index],
                              fromOutput: '',
                              toInput: '',
                              fromType: '',
                              toType: ''
                            };
                            setMappings(newMappings);
                          }}
                          aria-label="Clear row"
                          isDisabled={!mapping.fromOutput && !mapping.toInput}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose} color={textColor}>
            Cancel
          </Button>
          <Button 
            bg={buttonBg} 
            _hover={{ bg: buttonHoverBg }}
            color="white"
            onClick={handleSave}
            isDisabled={!isValid}
          >
            Save Connection
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    
    <DeleteConnectionPopup
      isOpen={isDeletePopupOpen}
      onClose={() => setIsDeletePopupOpen(false)}
      onConfirm={() => {
        onDelete();
        onClose();
      }}
      sourceNode={sourceNode}
      targetNode={targetNode}
    />
  </>
  );
};

export default ConnectionPopup;