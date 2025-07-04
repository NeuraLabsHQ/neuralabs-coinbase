import {
    Badge,
    Box,
    Button,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
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
import { FiPlus, FiTrash2, FiMaximize2 } from 'react-icons/fi';
import ExpandedValueEditor from './ExpandedValueEditor';

const SchemaPopup = ({ 
  isOpen, 
  onClose, 
  title, 
  schema = [], 
  isEditable = false,
  isCustomBlock = false,
  onSave,
  nodeType,
  fieldAccess = {}
}) => {
  const [localSchema, setLocalSchema] = useState(schema);
  const [expandedEditor, setExpandedEditor] = useState({ isOpen: false, index: null });
  
  // Update local schema when prop changes
  useEffect(() => {
    setLocalSchema(schema);
  }, [schema]);
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const buttonBg = useColorModeValue('blue.500', 'gray.600');
  const buttonHoverBg = useColorModeValue('blue.600', 'gray.500');

  const handleValueChange = (index, value) => {
    const updated = [...localSchema];
    if (title === "Parameters") {
      // For parameters, update the 'value' field
      updated[index] = { ...updated[index], value: value };
    } else {
      // For other schemas, update the 'default' field
      updated[index] = { ...updated[index], default: value };
    }
    setLocalSchema(updated);
  };

  const handleAddRow = () => {
    const newRow = {
      name: '',
      type: 'string',
      default: '',
      value: title === "Parameters" ? '' : undefined,
      required: false,
      description: '',
      editable: title === "Parameters" ? true : false
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

  const handleOpenExpandedEditor = (index) => {
    setExpandedEditor({ isOpen: true, index });
  };

  const handleSaveExpandedValue = (value) => {
    if (expandedEditor.index !== null) {
      handleValueChange(expandedEditor.index, value);
    }
    setExpandedEditor({ isOpen: false, index: null });
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
        <ModalContent bg={bgColor} maxW="50%">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} color={textColor}>
          <HStack justify="space-between">
            <Text>{title}</Text>
            {nodeType && <Badge colorScheme="cyan">{nodeType}</Badge>}
          </HStack>
        </ModalHeader>
        {/* <ModalCloseButton /> */}
        
        <ModalBody py={6}>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead bg={headerBg}>
                <Tr>
                  <Th color={mutedTextColor} width="25%" fontSize="xs" textTransform="uppercase">Name</Th>
                  <Th color={mutedTextColor} width="15%" fontSize="xs" textTransform="uppercase">Type</Th>
                  <Th color={mutedTextColor} width="35%" fontSize="xs" textTransform="uppercase">{title === "Parameters" ? 'Value' : ((isEditable || isCustomBlock) ? 'Default Value' : 'Value')}</Th>
                  {(isEditable || isCustomBlock) && <Th color={mutedTextColor} width="20%" fontSize="xs" textTransform="uppercase">Description</Th>}
                  {(isEditable || isCustomBlock) && <Th color={mutedTextColor} width="5%"></Th>}
                </Tr>
              </Thead>
              <Tbody>
                {localSchema.map((field, index) => (
                  <Tr key={index}>
                    <Td>
                      {(isEditable || isCustomBlock) ? (
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
                      {(isEditable || isCustomBlock) ? (
                        <Select
                          value={field.type}
                          onChange={(e) => handleUpdateRow(index, 'type', e.target.value)}
                          size="sm"
                          width={"100px"}
                          bg={inputBg}
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                          <option value="json">JSON</option>
                          <option value="any">Any</option>
                        </Select>
                      ) : (
                        <Badge colorScheme={getTypeColor(field.type)} variant="subtle">
                          {field.type}
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      {(isEditable || isCustomBlock) ? (
                        <InputGroup size="sm">
                          <Input
                            value={title === "Parameters" ? (field.value || field.default || '') : (field.default || '')}
                            onChange={(e) => handleValueChange(index, e.target.value)}
                            bg={inputBg}
                            placeholder={title === "Parameters" ? "Value" : "Default Value"}
                            pr="2.5rem"
                          />
                          <InputRightElement width="2.5rem">
                            <IconButton
                              icon={<FiMaximize2 />}
                              size="xs"
                              variant="ghost"
                              onClick={() => handleOpenExpandedEditor(index)}
                              aria-label="Expand editor"
                              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                            />
                          </InputRightElement>
                        </InputGroup>
                      ) : (
                        <HStack spacing={2}>
                          <Text fontSize="sm" color={(field.value || field.default) ? textColor : mutedTextColor}>
                            {title === "Parameters" ? (field.value || field.default || 'No value') : (field.default || 'No default')}
                          </Text>
                          {(field.value || field.default) && (
                            <IconButton
                              icon={<FiMaximize2 />}
                              size="xs"
                              variant="ghost"
                              onClick={() => handleOpenExpandedEditor(index)}
                              aria-label="View full value"
                              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                            />
                          )}
                        </HStack>
                      )}
                    </Td>
                    {(isEditable || isCustomBlock) && (
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
                    {(isEditable || isCustomBlock) && (
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
          
          {(isEditable || isCustomBlock) && (
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
                {(isEditable || isCustomBlock) ? 'No properties defined. Click "Add New Property" to start.' : 'No schema defined.'}
              </Text>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          {(isEditable || isCustomBlock) && (
            <Button bg={buttonBg} _hover={{ bg: buttonHoverBg }} color="white" onClick={handleSave}>
              Save Changes
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>

    {expandedEditor.isOpen && expandedEditor.index !== null && (
      <ExpandedValueEditor
        isOpen={expandedEditor.isOpen}
        onClose={() => setExpandedEditor({ isOpen: false, index: null })}
        value={title === "Parameters" 
          ? (localSchema[expandedEditor.index]?.value || localSchema[expandedEditor.index]?.default || '') 
          : (localSchema[expandedEditor.index]?.default || '')
        }
        onSave={handleSaveExpandedValue}
        fieldName={localSchema[expandedEditor.index]?.name || 'Field'}
        fieldType={localSchema[expandedEditor.index]?.type}
        title={`Edit ${localSchema[expandedEditor.index]?.name || 'Value'}`}
      />
    )}
    </>
  );
};

export default SchemaPopup;