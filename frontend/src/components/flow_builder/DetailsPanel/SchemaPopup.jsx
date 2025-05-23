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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Select,
  IconButton,
  Box,
  Text,
  useColorModeValue,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const SchemaPopup = ({ 
  isOpen, 
  onClose, 
  title, 
  schema = [], 
  isEditable = false,
  isCustomBlock = false,
  onSave,
  nodeType
}) => {
  const [localSchema, setLocalSchema] = useState(schema);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  const handleValueChange = (index, value) => {
    const updated = [...localSchema];
    updated[index] = { ...updated[index], value };
    setLocalSchema(updated);
  };

  const handleAddRow = () => {
    const newRow = {
      name: '',
      type: 'string',
      value: '',
      required: false,
      description: ''
    };
    setLocalSchema([...localSchema, newRow]);
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...localSchema];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSchema(updated);
  };

  const handleDeleteRow = (index) => {
    const updated = localSchema.filter((_, i) => i !== index);
    setLocalSchema(updated);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localSchema);
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
      'any': 'gray'
    };
    return colors[type] || 'gray';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxW="80%">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor}>
          <HStack justify="space-between">
            <Text>{title}</Text>
            {nodeType && <Badge colorScheme="blue">{nodeType}</Badge>}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead bg={headerBg}>
                <Tr>
                  <Th color={mutedTextColor} width="25%">Name</Th>
                  <Th color={mutedTextColor} width="15%">Type</Th>
                  <Th color={mutedTextColor} width="35%">Value</Th>
                  {isCustomBlock && <Th color={mutedTextColor} width="20%">Description</Th>}
                  {isCustomBlock && <Th color={mutedTextColor} width="5%"></Th>}
                </Tr>
              </Thead>
              <Tbody>
                {localSchema.map((field, index) => (
                  <Tr key={index}>
                    <Td>
                      {isCustomBlock ? (
                        <Input
                          value={field.name}
                          onChange={(e) => handleUpdateRow(index, 'name', e.target.value)}
                          size="sm"
                          bg={inputBg}
                          placeholder="Property Name"
                        />
                      ) : (
                        <Text fontSize="sm" fontWeight="medium">{field.name}</Text>
                      )}
                    </Td>
                    <Td>
                      {isCustomBlock ? (
                        <Select
                          value={field.type}
                          onChange={(e) => handleUpdateRow(index, 'type', e.target.value)}
                          size="sm"
                          bg={inputBg}
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                          <option value="any">Any</option>
                        </Select>
                      ) : (
                        <Badge colorScheme={getTypeColor(field.type)} variant="subtle">
                          {field.type}
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Input
                        value={field.value || ''}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        size="sm"
                        bg={inputBg}
                        isReadOnly={!isEditable && !isCustomBlock}
                        placeholder="Value"
                      />
                    </Td>
                    {isCustomBlock && (
                      <Td>
                        <Input
                          value={field.description || ''}
                          onChange={(e) => handleUpdateRow(index, 'description', e.target.value)}
                          size="sm"
                          bg={inputBg}
                          placeholder="Description"
                        />
                      </Td>
                    )}
                    {isCustomBlock && (
                      <Td>
                        <IconButton
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteRow(index)}
                          aria-label="Delete row"
                        />
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          
          {isCustomBlock && (
            <Box mt={4}>
              <Button
                leftIcon={<FiPlus />}
                size="sm"
                variant="outline"
                onClick={handleAddRow}
                width="100%"
              >
                Add New Property
              </Button>
            </Box>
          )}
          
          {localSchema.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color={mutedTextColor}>
                {isCustomBlock ? 'No properties defined. Click "Add New Property" to start.' : 'No schema defined.'}
              </Text>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          {(isEditable || isCustomBlock) && (
            <Button colorScheme="blue" onClick={handleSave}>
              Save Changes
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SchemaPopup;