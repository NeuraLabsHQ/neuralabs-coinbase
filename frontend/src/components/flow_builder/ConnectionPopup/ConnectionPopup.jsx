import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Box,
  Text,
  HStack,
  IconButton,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { FiPlus, FiX, FiMoreHorizontal } from 'react-icons/fi';

const ConnectionPopup = ({
  isOpen,
  onClose,
  sourceNode,
  targetNode,
  onSave,
  existingMappings = [],
  allEdges = []
}) => {
  const [mappings, setMappings] = useState([]);
  const [isValid, setIsValid] = useState(false);
  
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const headerBg = useColorModeValue('gray.800', 'gray.800');
  const inputBg = useColorModeValue('gray.800', 'gray.800');
  const textColor = useColorModeValue('white', 'white');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');
  const validBorderColor = useColorModeValue('cyan.400', 'cyan.400');
  const errorBorderColor = useColorModeValue('red.500', 'red.500');

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
    const hasValidMappings = mappings.some(m => {
      const validation = getValidationStatus(m, mappings.indexOf(m));
      return validation.status === 'valid' && m.fromOutput && m.toInput;
    });
    
    const hasErrors = mappings.some(m => {
      const validation = getValidationStatus(m, mappings.indexOf(m));
      return validation.status === 'error' && (m.fromOutput || m.toInput);
    });
    
    setIsValid(hasValidMappings && !hasErrors);
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
    // Filter out empty mappings
    const validMappings = mappings.filter(m => m.fromOutput && m.toInput);
    onSave(validMappings);
    onClose();
  };

  const getRowColor = (validation) => {
    switch (validation.status) {
      case 'valid':
        return 'cyan.900';
      case 'error':
        return 'red.900';
      default:
        return 'transparent';
    }
  };

  const getMessageColor = (validation) => {
    switch (validation.status) {
      case 'valid':
        return 'cyan.400';
      case 'error':
        if (validation.message === 'Type mismatch') return 'red.400';
        if (validation.message.includes('already assigned')) return 'orange.400';
        return 'yellow.400';
      default:
        return 'gray.400';
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
              <IconButton
                icon={<FiPlus />}
                size="sm"
                variant="ghost"
                aria-label="Add row"
                isDisabled
              />
              <IconButton
                icon={<FiMoreHorizontal />}
                size="sm"
                variant="ghost"
                aria-label="More options"
                isDisabled
              />
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
                      <Box w="3" h="3" borderRadius="full" bg="gray.600" />
                      <Text>FROM OUTPUT</Text>
                    </HStack>
                  </Th>
                  <Th color={mutedTextColor} width="35%" fontSize="xs" textTransform="uppercase">
                    <HStack spacing={1}>
                      <Box w="3" h="3" borderRadius="full" bg="gray.600" />
                      <Text>TO INPUT</Text>
                    </HStack>
                  </Th>
                  <Th color={mutedTextColor} width="25%" fontSize="xs" textTransform="uppercase">
                    <HStack spacing={1}>
                      <Box w="3" h="3" borderRadius="full" bg="gray.600" />
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
                          _hover={{ borderColor: 'gray.600' }}
                          _focus={{ borderColor: 'cyan.500', boxShadow: 'none' }}
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
                          _hover={{ borderColor: 'gray.600' }}
                          _focus={{ borderColor: 'cyan.500', boxShadow: 'none' }}
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
            colorScheme="cyan" 
            onClick={handleSave}
            isDisabled={!isValid}
          >
            Save Connection
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConnectionPopup;