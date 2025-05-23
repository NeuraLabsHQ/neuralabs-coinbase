import { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  VStack, 
  Heading, 
  Button, 
  IconButton, 
  Text, 
  Input, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  FormControl, 
  FormLabel, 
  HStack, 
  Tag, 
  TagLabel, 
  TagCloseButton,
  Code,
  Alert,
  AlertIcon,
  Select,
  useColorModeValue,
  useDisclosure,
  Divider,
} from '@chakra-ui/react';
import { 
  FiX, 
  FiDatabase, 
  FiActivity, 
  FiSliders, 
  FiCode, 
  FiLayers,
  FiEdit2,
  FiMessageSquare,
  FiList,
  FiGrid,
  FiSettings,
} from 'react-icons/fi';
import SchemaPopup from './SchemaPopup';
import DescriptionPopup from './DescriptionPopup';

const DetailsPanel = ({ 
  selectedNode, 
  onClose, 
  onUpdateNode, 
  onDeleteNode, 
  onToggleCode, 
  codeOpen,
  viewOnlyMode = false,
  availableLayers = []
}) => {
  const [tabIndex, setTabIndex] = useState(viewOnlyMode ? 1 : 0);
  const [layer, setLayer] = useState(selectedNode?.layer || 0);
  const [newTag, setNewTag] = useState("");
  const [nodeData, setNodeData] = useState(null);
  
  // Popup controls
  const { isOpen: isDescOpen, onOpen: onDescOpen, onClose: onDescClose } = useDisclosure();
  const { isOpen: isProcessingMsgOpen, onOpen: onProcessingMsgOpen, onClose: onProcessingMsgClose } = useDisclosure();
  const { isOpen: isInputOpen, onOpen: onInputOpen, onClose: onInputClose } = useDisclosure();
  const { isOpen: isOutputOpen, onOpen: onOutputOpen, onClose: onOutputClose } = useDisclosure();
  const { isOpen: isParamsOpen, onOpen: onParamsOpen, onClose: onParamsClose } = useDisclosure();

  // Update tab index when view mode changes
  useEffect(() => {
    if (viewOnlyMode) {
      setTabIndex(1);
    }
  }, [viewOnlyMode]);

  useEffect(() => {
    
    if (selectedNode) {
      setLayer(selectedNode.layer || 0);

      console.log("Selected Node:", selectedNode);
      console.log("Node Data:", nodeData);
      // Initialize node data from selected node
      setNodeData({
        type: selectedNode.type || '',
        element_id: selectedNode.id || '',
        name: selectedNode.name || '',
        description: selectedNode.description || '',
        input_schema: selectedNode.inputs || [],
        output_schema: selectedNode.outputs || [],
        hyperparameters: selectedNode.hyperparameters || [],
        processing_message: selectedNode.processing_message || 'Processing...',
        tags: selectedNode.tags || [],
        layer: selectedNode.layer || 0,
        isCustom: selectedNode.type === 'custom-script'
      });
    }
  }, [selectedNode]);

  const panelBgColor = useColorModeValue('detailpanel.body.light', 'detailpanel.body.dark');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBgColor = useColorModeValue('gray.50', 'gray.600');
  const formBgColor = useColorModeValue('detailpanel.inputbg.light', 'detailpanel.inputbg.dark');
  const clickableBg = useColorModeValue('gray.100', 'gray.700');
  const clickableHoverBg = useColorModeValue('gray.200', 'gray.600');
  
  const getNodeTypeColor = (type) => {
    switch (type) {
      case 'data':
        return 'blue';
      case 'task':
        return 'green';
      case 'parameters':
        return 'purple';
      default:
        return 'gray';
    }
  };
  
  const handleLayerChange = (event) => {
    const newLayer = parseInt(event.target.value, 10);
    setLayer(newLayer);
    
    if (!viewOnlyMode) {
      onUpdateNode(selectedNode.id, { layer: newLayer });
    }
  };

  const handleNameChange = (e) => {
    if (onUpdateNode && !viewOnlyMode) {
      onUpdateNode(selectedNode.id, { name: e.target.value });
      setNodeData(prev => ({ ...prev, name: e.target.value }));
    }
  };
  
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim() && !viewOnlyMode) {
      const tags = nodeData.tags || [];
      if (!tags.includes(newTag.trim())) {
        const updatedTags = [...tags, newTag.trim()];
        onUpdateNode(selectedNode.id, { tags: updatedTags });
        setNodeData(prev => ({ ...prev, tags: updatedTags }));
      }
      setNewTag("");
    }
  };
  
  const handleRemoveTag = (tag) => {
    if (!viewOnlyMode) {
      const updatedTags = (nodeData.tags || []).filter(t => t !== tag);
      onUpdateNode(selectedNode.id, { tags: updatedTags });
      setNodeData(prev => ({ ...prev, tags: updatedTags }));
    }
  };
  
  const handleDeleteNode = () => {
    if (onDeleteNode && !viewOnlyMode) {
      onDeleteNode(selectedNode.id);
      onClose();
    }
  };

  const handleSaveDescription = (newDescription) => {
    onUpdateNode(selectedNode.id, { description: newDescription });
    setNodeData(prev => ({ ...prev, description: newDescription }));
  };

  const handleSaveProcessingMessage = (newMessage) => {
    onUpdateNode(selectedNode.id, { processing_message: newMessage });
    setNodeData(prev => ({ ...prev, processing_message: newMessage }));
  };

  const handleSaveInputSchema = (newSchema) => {
    onUpdateNode(selectedNode.id, { inputs: newSchema });
    setNodeData(prev => ({ ...prev, input_schema: newSchema }));
  };

  const handleSaveOutputSchema = (newSchema) => {
    onUpdateNode(selectedNode.id, { outputs: newSchema });
    setNodeData(prev => ({ ...prev, output_schema: newSchema }));
  };

  const handleSaveHyperparameters = (newParams) => {
    onUpdateNode(selectedNode.id, { hyperparameters: newParams });
    setNodeData(prev => ({ ...prev, hyperparameters: newParams }));
  };
  
  const getTypeColor = () => {
    switch (selectedNode.type) {
      case 'data': return 'blue.500';
      case 'task': return 'green.500';
      case 'parameters': return 'purple.500';
      default: return 'gray.500';
    }
  };
  
  const getNodeIcon = () => {
    switch (selectedNode.type) {
      case 'data':
        return <FiDatabase color="currentColor" />;
      case 'task':
        return <FiActivity color="currentColor" />;
      case 'parameters':
        return <FiSliders color="currentColor" />;
      default:
        return null;
    }
  };
  
  if (!selectedNode || !nodeData) {
    return (
      <Box 
        w="384px"
        h="100%"
        bg={panelBgColor}
        borderLeft="1px solid"
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
      >
        <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor={borderColor}>
          <Heading as="h2" size="md" color={textColor}>Details</Heading>
          <IconButton icon={<FiX />} variant="ghost" onClick={onClose} aria-label="Close" />
        </Flex>
        <Flex flex="1" align="center" justify="center" p={6} textAlign="center" color="gray.500">
          Select a node to view and edit its properties
        </Flex>
      </Box>
    );
  }

  const maxLayer = Math.max(...availableLayers, layer, 0);
  const layerOptions = Array.from({ length: maxLayer + 2 }, (_, i) => i);

  return (
    <>
      <Box 
        w="384px"
        h="100%"
        bg={panelBgColor}
        borderLeft="1px solid"
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
      >
        <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor={borderColor}>
          <Flex align="center" gap={2}>
            <Flex 
              p={1} 
              borderRadius="md" 
              border="1px solid" 
              borderColor={getTypeColor()}
              color={getTypeColor()}
            >
              {getNodeIcon()}
            </Flex>
            <Box>
              <Heading as="h2" size="md" color={textColor}>{nodeData.name}</Heading>
            </Box>
          </Flex>
          <Flex align="center" gap={3}>
            {!viewOnlyMode && (
              <Button 
                leftIcon={<FiCode />} 
                size="sm"
                variant={codeOpen ? "solid" : "outline"}
                onClick={onToggleCode}
              >
                Code
              </Button>
            )}
            <IconButton 
              icon={<FiX />} 
              variant="ghost" 
              onClick={onClose} 
              aria-label="Close" 
            />
          </Flex>
        </Flex>
        
        {viewOnlyMode && (
          <Alert status="info" borderRadius="0">
            <AlertIcon />
            <Text fontSize="sm">View-only mode - Editing disabled</Text>
          </Alert>
        )}
        
        <Tabs 
          flex="1" 
          display="flex" 
          flexDirection="column"
          index={tabIndex}
          onChange={(index) => !viewOnlyMode && setTabIndex(index)}
          isLazy
        >
          <TabList mx={4} mt={2}>
            <Tab isDisabled={viewOnlyMode}>Properties</Tab>
            <Tab>Preview</Tab>
          </TabList>
          
          <TabPanels flex="1" overflowY="hidden">
            {/* Properties Tab */}
            <TabPanel 
              p={0} 
              h="100%" 
              display="flex" 
              flexDirection="column"
            >
              <Box 
                flex="1" 
                overflowY="auto" 
                overflowX="hidden" 
                p={4}
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'gray.400',
                    borderRadius: '2px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: 'gray.500',
                  },
                }}
              >
                <VStack spacing={4} align="stretch">
                {/* Type Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Type</FormLabel>
                  <Box py={2} px={3} bg={formBgColor} borderRadius="md" fontSize="sm" color={textColor}>
                    {nodeData.type}
                  </Box>
                </FormControl>
                
                {/* Element ID Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Element ID</FormLabel>
                  <Box py={2} px={3} bg={formBgColor} borderRadius="md" fontSize="sm" color={textColor}>
                    <Code fontSize="xs">{nodeData.element_id}</Code>
                  </Box>
                </FormControl>
                
                {/* Name Field */}
                <FormControl>
                  <FormLabel htmlFor="node-name" fontSize="sm" fontWeight="medium" color={textColor}>Name</FormLabel>
                  <Input 
                    id="node-name"
                    value={nodeData.name} 
                    onChange={handleNameChange}
                    bg={formBgColor}
                    border={borderColor}
                    isDisabled={viewOnlyMode}
                  />
                </FormControl>
                
                {/* Description Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Description</FormLabel>
                  <Box
                    py={2}
                    px={3}
                    bg={clickableBg}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={onDescOpen}
                    _hover={{ bg: clickableHoverBg }}
                    transition="background 0.2s"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" noOfLines={1} color={textColor}>
                        {nodeData.description || 'Click to view description'}
                      </Text>
                      <FiEdit2 size={14} color={mutedTextColor} />
                    </HStack>
                  </Box>
                </FormControl>

                <Divider />
                
                {/* Input Schema Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor} display="flex" alignItems="center">
                    <FiList style={{ marginRight: '8px' }} /> Input Schema
                  </FormLabel>
                  <Box
                    py={3}
                    px={4}
                    bg={clickableBg}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={onInputOpen}
                    _hover={{ bg: clickableHoverBg }}
                    transition="background 0.2s"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>
                        {nodeData.input_schema.length} input{nodeData.input_schema.length !== 1 ? 's' : ''} defined
                      </Text>
                      <FiGrid size={16} color={mutedTextColor} />
                    </HStack>
                  </Box>
                </FormControl>
                
                {/* Output Schema Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor} display="flex" alignItems="center">
                    <FiList style={{ marginRight: '8px' }} /> Output Schema
                  </FormLabel>
                  <Box
                    py={3}
                    px={4}
                    bg={clickableBg}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={onOutputOpen}
                    _hover={{ bg: clickableHoverBg }}
                    transition="background 0.2s"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>
                        {nodeData.output_schema.length} output{nodeData.output_schema.length !== 1 ? 's' : ''} defined
                      </Text>
                      <FiGrid size={16} color={mutedTextColor} />
                    </HStack>
                  </Box>
                </FormControl>
                
                {/* Hyperparameters Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor} display="flex" alignItems="center">
                    <FiSettings style={{ marginRight: '8px' }} /> Hyperparameters
                  </FormLabel>
                  <Box
                    py={3}
                    px={4}
                    bg={clickableBg}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={onParamsOpen}
                    _hover={{ bg: clickableHoverBg }}
                    transition="background 0.2s"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>
                        {nodeData.hyperparameters.length} parameter{nodeData.hyperparameters.length !== 1 ? 's' : ''} defined
                      </Text>
                      <FiSettings size={16} color={mutedTextColor} />
                    </HStack>
                  </Box>
                </FormControl>

                <Divider />
                
                {/* Processing Message Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor} display="flex" alignItems="center">
                    <FiMessageSquare style={{ marginRight: '8px' }} /> Processing Message
                  </FormLabel>
                  <Box
                    py={2}
                    px={3}
                    bg={clickableBg}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={onProcessingMsgOpen}
                    _hover={{ bg: clickableHoverBg }}
                    transition="background 0.2s"
                  >
                    <HStack justify="space-between">
                      <Text fontSize="sm" noOfLines={1} color={textColor}>
                        {nodeData.processing_message || 'Processing...'}
                      </Text>
                      <FiEdit2 size={14} color={mutedTextColor} />
                    </HStack>
                  </Box>
                </FormControl>
                
                {/* Tags Field */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Tags</FormLabel>
                  <Input 
                    placeholder="Add tags and press Enter..." 
                    mb={2} 
                    bg={formBgColor}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    border={borderColor}
                    isDisabled={viewOnlyMode}
                  />
                  <Flex wrap="wrap" gap={2}>
                    {(nodeData.tags || []).map((tag, index) => (
                      <Tag key={index} size="sm" borderRadius="md" variant="subtle" colorScheme="gray">
                        <TagLabel>{tag}</TagLabel>
                        {!viewOnlyMode && (
                          <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                        )}
                      </Tag>
                    ))}
                  </Flex>
                </FormControl>
                
                {/* Layer Field */}
                <FormControl>
                  <FormLabel htmlFor="node-layer" fontSize="sm" fontWeight="medium" color={textColor} display="flex" alignItems="center">
                    <FiLayers style={{ marginRight: '8px' }} /> Layer
                  </FormLabel>
                  <Select
                    id="node-layer"
                    value={layer}
                    onChange={handleLayerChange}
                    bg={formBgColor}
                    isDisabled={viewOnlyMode}
                    border={borderColor}
                  >
                    {layerOptions.map(l => (
                      <option key={l} value={l}>Layer {l}</option>
                    ))}
                  </Select>
                </FormControl>
                </VStack>
              </Box>
            </TabPanel>
            
            {/* Preview Tab */}
            <TabPanel 
              p={0} 
              h="100%" 
              display="flex" 
              flexDirection="column"
            >
              <Box 
                flex="1" 
                overflowY="auto" 
                overflowX="hidden" 
                p={4}
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'gray.400',
                    borderRadius: '2px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: 'gray.500',
                  },
                }}
              >
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={1}>Node Type</Text>
                  <Box py={2} px={3} bg={sectionBgColor} borderRadius="md" bgColor={formBgColor}>
                    <Text fontSize="sm" fontFamily="monospace">{nodeData.type}</Text>
                  </Box>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={1}>Node Name</Text>
                  <Box py={2} px={3} bg={sectionBgColor} borderRadius="md" bgColor={formBgColor}>
                    <Text fontSize="sm" fontFamily="monospace">{nodeData.name}</Text>
                  </Box>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={1}>Node Layer</Text>
                  <Box py={2} px={3} bg={sectionBgColor} borderRadius="md" bgColor={formBgColor}>
                    <Text fontSize="sm" fontFamily="monospace">Layer {nodeData.layer || 0}</Text>
                  </Box>
                </Box>
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={1}>Node ID</Text>
                  <Box py={2} px={3} bg={sectionBgColor} borderRadius="md" bgColor={formBgColor}>
                    <Text fontSize="sm" fontFamily="monospace">{nodeData.element_id}</Text>
                  </Box>
                </Box>
                
                {/* Node description */}
                {nodeData.description && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={1}>Description</Text>
                    <Box py={2} px={3} bg={sectionBgColor} borderRadius="md">
                      <Text fontSize="sm">{nodeData.description}</Text>
                    </Box>
                  </Box>
                )}
                
                {/* Input Schema Preview */}
                {nodeData.input_schema && nodeData.input_schema.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={2}>Input Schema</Text>
                    <VStack spacing={2} align="stretch">
                      {nodeData.input_schema.map((input, index) => (
                        <Box key={index} p={2} bg={formBgColor} borderRadius="md">
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="medium">{input.name}</Text>
                            <Code fontSize="xs" colorScheme="blue">{input.type}</Code>
                          </HStack>
                          {input.description && (
                            <Text fontSize="xs" color={mutedTextColor} mt={1}>{input.description}</Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Output Schema Preview */}
                {nodeData.output_schema && nodeData.output_schema.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={2}>Output Schema</Text>
                    <VStack spacing={2} align="stretch">
                      {nodeData.output_schema.map((output, index) => (
                        <Box key={index} p={2} bg={formBgColor} borderRadius="md">
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="medium">{output.name}</Text>
                            <Code fontSize="xs" colorScheme="green">{output.type}</Code>
                          </HStack>
                          {output.description && (
                            <Text fontSize="xs" color={mutedTextColor} mt={1}>{output.description}</Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Hyperparameters Preview */}
                {nodeData.hyperparameters && nodeData.hyperparameters.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={2}>Hyperparameters</Text>
                    <VStack spacing={2} align="stretch">
                      {nodeData.hyperparameters.map((param, index) => (
                        <Box key={index} p={2} bg={formBgColor} borderRadius="md">
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="medium">{param.name}</Text>
                            <Code fontSize="xs" colorScheme="purple">{param.type}</Code>
                          </HStack>
                          {param.description && (
                            <Text fontSize="xs" color={mutedTextColor} mt={1}>{param.description}</Text>
                          )}
                          {param.default !== undefined && (
                            <Text fontSize="xs" color={mutedTextColor}>Default: {String(param.default)}</Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
                
                {/* Tags section */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={mutedTextColor} mb={2}>Tags</Text>
                  <Flex wrap="wrap" gap={2}>
                    <Tag size="sm" borderRadius="md" variant="subtle" colorScheme={getNodeTypeColor(nodeData.type)}>
                      {nodeData.type}
                    </Tag>
                    {nodeData.tags && nodeData.tags.map((tag, index) => (
                      <Tag key={index} size="sm" borderRadius="md" variant="subtle" colorScheme="gray">
                        {tag}
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              </VStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {!viewOnlyMode && (
          <Flex justify="flex-end" gap={3} p={4} borderTop="1px solid" borderColor={borderColor}>
            <Button colorScheme="red" onClick={handleDeleteNode} variant="outline">Delete</Button>
          </Flex>
        )}
      </Box>

      {/* Popup Modals */}
      <DescriptionPopup
        isOpen={isDescOpen}
        onClose={onDescClose}
        description={nodeData.description}
        isEditable={nodeData.isCustom}
        onSave={handleSaveDescription}
        title="Block Description"
      />

      <DescriptionPopup
        isOpen={isProcessingMsgOpen}
        onClose={onProcessingMsgClose}
        description={nodeData.processing_message}
        isEditable={true}
        onSave={handleSaveProcessingMessage}
        title="Processing Message"
      />

      <SchemaPopup
        isOpen={isInputOpen}
        onClose={onInputClose}
        title="Input Schema"
        schema={nodeData.input_schema}
        isEditable={false}
        isCustomBlock={nodeData.isCustom}
        onSave={handleSaveInputSchema}
        nodeType={nodeData.type}
      />

      <SchemaPopup
        isOpen={isOutputOpen}
        onClose={onOutputClose}
        title="Output Schema"
        schema={nodeData.output_schema}
        isEditable={false}
        isCustomBlock={nodeData.isCustom}
        onSave={handleSaveOutputSchema}
        nodeType={nodeData.type}
      />

      <SchemaPopup
        isOpen={isParamsOpen}
        onClose={onParamsClose}
        title="Hyperparameters"
        schema={nodeData.hyperparameters}
        isEditable={true}
        isCustomBlock={nodeData.isCustom}
        onSave={handleSaveHyperparameters}
        nodeType={nodeData.type}
      />
    </>
  );
};

export default DetailsPanel;
