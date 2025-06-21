

import ICON_MAP from '../Common/IconMap';

import { useEffect, useState } from 'react';
import colors from '../../../color';

import {
    Badge,
    Box,
    Collapse,
    Flex,
    Heading,
    HStack,
    Icon,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    SimpleGrid,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Tooltip,
    useColorModeValue,
    useDisclosure,
    VStack
} from '@chakra-ui/react';

import {
    FiActivity,
    FiChevronDown,
    FiChevronRight,
    FiEdit2,
    FiInfo,
    FiLayers,
    FiMaximize2,
    FiX
} from 'react-icons/fi';

  

const BlocksPanel = ({ 
  onAddNode, 
  onOpenTemplate, 
  customTemplates = [], 
  onEditTemplate,
  layerMap = {},
  beautifyMode = false,
  onNodeClick,
  nodeTypes = {},
  nodeCategories = [],
  agentData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();
  
  // Initialize all categories as expanded
  useEffect(() => {
    if (nodeCategories && nodeCategories.length > 0) {
      const initialExpanded = {};
      nodeCategories.forEach(category => {
        initialExpanded[category.id] = false;
      });
      setExpandedCategories(initialExpanded);
    }
  }, [nodeCategories]);

  useEffect(() => {
    console.log('BlocksPanel nodeTypes:', nodeTypes);
    console.log('BlocksPanel nodeCategories:', nodeCategories);
    
    // Check if nodeCategories have the right structure
    if (nodeCategories && nodeCategories.length > 0) {
      console.log('First category nodes:', nodeCategories[0].nodes);
      
      // Check if the node keys in the category exist in nodeTypes
      const firstCategoryNodes = nodeCategories[0].nodes;
      if (firstCategoryNodes && firstCategoryNodes.length > 0) {
        console.log('First node exists in nodeTypes:', !!nodeTypes[firstCategoryNodes[0]]);
      }
    }
  }, [nodeTypes, nodeCategories]);

  useEffect(() => {
    if (Object.keys(nodeTypes).length > 0) {
      console.log('BlocksPanel received nodeTypes:', nodeTypes);
    }
  }, [nodeTypes]);
  
  const bgColor = useColorModeValue(colors.sidepanel.body.light, colors.sidepanel.body.dark);
  const borderColor = useColorModeValue(colors.gray[200], colors.gray[700]);
  const headingColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const accordionBgColor = useColorModeValue(colors.gray[50], colors.gray[600]);
  const layerHeaderBg = useColorModeValue(colors.blockpanel.listhoverBg.light, colors.blockpanel.listhoverBg.dark);
  const layerHeaderColor = useColorModeValue(colors.blue[700], colors.blue[300]);
  const iconColor = useColorModeValue(colors.blockpanel.icon.light, colors.blockpanel.icon.dark);
  const itemBgColor = useColorModeValue(colors.blockpanel.itemBg.light, colors.blockpanel.itemBg.dark);
  const hoverBgColor = useColorModeValue(colors.gray[100], colors.gray[600]);
  const emptyStateIconColor = useColorModeValue(colors.gray[300], colors.gray[600]);
  const errorColor = useColorModeValue(colors.red[500], colors.red[300]);
  const categoryColor = useColorModeValue(colors.gray[700], colors.gray[300]);
  const listhoverBgColor = useColorModeValue(colors.blockpanel.listhoverBg.light, colors.blockpanel.listhoverBg.dark);
  const mutedTextColor = useColorModeValue(colors.gray[600], colors.gray[400]);
  const badgeBg = useColorModeValue(colors.gray[100], colors.gray[700]);
  const badgeColor = useColorModeValue(colors.gray[600], colors.gray[300]);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  
  // Define message based on beautify mode
  const emptyStateMessage = beautifyMode 
    ? "Your flow has no nodes yet. Add some nodes from the Blocks tab."
    : "Enable Beautify mode in the Visualize panel to organize your flow into layers.";
  
  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Filter node types based on search term
  const getFilteredNodeTypes = () => {
    if (!searchTerm) return nodeTypes;
    
    return Object.entries(nodeTypes)
      .filter(([key, nodeType]) => 
        nodeType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nodeType.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  };
  
  const filteredCustomTemplates = customTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTemplateClick = (templateId) => {
    if (onEditTemplate) {
      onEditTemplate(templateId);
    }
  };
  
  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Get the appropriate icon component for a node type
  const getIconComponent = (iconName) => {
    
    console.log("icon name ", iconName);
    
    if (typeof iconName === 'function') {
      return iconName; // Already a component
    }

    
    return ICON_MAP[iconName] || FiActivity; // Default to FiActivity if icon not found
  };

  // Render node block item
  const renderNodeBlock = (nodeKey, nodeType) => {
    const IconComponent = getIconComponent(nodeType.icon);
    
    return (
      <Box
        key={nodeKey}
        display="flex"
        flexDirection="column"
        alignItems="center"
        p={4}
        bg={itemBgColor}
        borderRadius="lg"
        cursor="grab"
        draggable
        onDragStart={(e) => handleDragStart(e, nodeKey)}
        transition="all 0.2s"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'md',
        }}
        // mb={3}
      >
        <Flex
          w="48px"
          h="48px"
          bg="transparent"
          borderRadius="lg"
          alignItems="center"
          justifyContent="center"
          mb={2}
        >
          <IconComponent color={iconColor} size={36} />
        </Flex>
        <Text fontWeight="medium" fontSize="sm" textAlign="center">{nodeType.name}</Text>
      </Box>
    );
  };

  return (
    <Box
      w="320px"
      h="100%"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Box p={4} borderColor={borderColor}>
        <HStack justify="space-between" align="center">
          <Heading as="h1" size="md" color={headingColor}>
            {agentData?.name || 'Flow Designer'}
          </Heading>
          {agentData && (
            <Tooltip label="Agent Info" placement="right">
              <IconButton
                icon={<FiInfo />}
                size="sm"
                variant="ghost"
                onClick={onInfoOpen}
                aria-label="Agent Info"
              />
            </Tooltip>
          )}
        </HStack>
      </Box>

      <Tabs isFitted flex="1" minH="0" display="flex" flexDirection="column">
        <TabList>
          <Tab>Blocks</Tab>
          <Tab>Pipelines</Tab>
        </TabList>
        
        <TabPanels 
          flex="1" 
          overflow="hidden"
        >
          <TabPanel p={0} h="100%" display="flex" flexDirection="column">
            <Box 
              flex="1" 
              minH="0"
              overflowY="auto" 
              overflowX="hidden" 
              p={4}
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none',
              }}
            >
              <Flex position="relative">
              <Input
                placeholder="Search blocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                pr="36px"
                bg='transparent'
                mb={3}
                border="none"
                _focus={{ 
                  boxShadow: "none", 
                  outline: "none",
                  borderBottom: "1px solid",
                  borderColor: borderColor
                }}
                _hover={{ 
                  borderColor: borderColor 
                }}
                borderRadius="none"
                borderBottom="1px solid"
                borderColor={borderColor}
                pl={0}
              />
              {searchTerm && (
                <IconButton
                  icon={<FiX />}
                  size="sm"
                  aria-label="Clear search"
                  position="absolute"
                  right="2"
                  top="50%"
                  transform="translateY(-50%)"
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </Flex>
            
            {!searchTerm ? (
              // Display categorized blocks when not searching
              <Box mt={2}>
                {nodeCategories.map(category => {
                  const categoryNodes = category.nodes
                    .map(nodeKey => nodeTypes[nodeKey])
                    .filter(Boolean);
                  
                  if (categoryNodes.length === 0) return null;
                  
                  const isExpanded = expandedCategories[category.id];
                  
                  return (
                <Box key={category.id}>
                  <Flex 
                    alignItems="center" 
                    py={2} 
                    // px={3}  // Add consistent padding on both sides
                    bg={isExpanded ? layerHeaderBg : 'transparent'}
                    color={categoryColor}
                    // borderRadius="md"
                    cursor="pointer"
                    onClick={() => toggleCategory(category.id)}
                    fontWeight="600"
                    // width="100%"  // Ensure it spans the full width
                    position="relative"  // For pseudo element positioning
                    _hover={{
                      bg: listhoverBgColor

                    }}
                    transition="background-color 0.2s"  // Smooth transition for hover
                    mx={-4}  // Negative margin on both sides
                    // mr={10}
                    px={4} 
                    width="calc(100% + 32px)"  // Full width plus the negative margins
                  >
                    <Box mr={2}>
                      {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                    </Box>
                    <Text>{category.name}</Text>
                  </Flex>
                  
                  {isExpanded && (
                    <SimpleGrid columns={2} spacing={3} px={2} py={5}
                    >
                      {category.nodes.map(nodeKey => {
                        const nodeType = nodeTypes[nodeKey];
                        if (!nodeType) return null;
                        return renderNodeBlock(nodeKey, nodeType);
                      })}
                    </SimpleGrid>
                  )}
                </Box>
                  );
                })}
                
                {/* Custom templates section */}
                {customTemplates.length > 0 && (
                  <Box mb={4}>
                    <Flex 
                      alignItems="center" 
                      py={2} 
                      px={2}
                      bg={expandedCategories['templates'] ? layerHeaderBg : 'transparent'}
                      color={categoryColor}
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => toggleCategory('templates')}
                      fontWeight="600"
                    >
                      <Box mr={2}>
                        {expandedCategories['templates'] ? <FiChevronDown /> : <FiChevronRight />}
                      </Box>
                      <Text>Custom Templates</Text>
                    </Flex>
                    
                    {expandedCategories['templates'] && (
                      <SimpleGrid columns={2} spacing={3} mt={2} px={2}>
                        {customTemplates.map((template) => (
                          <Box
                            key={template.id}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            p={4}
                            bg={itemBgColor}
                            borderRadius="lg"
                            cursor="grab"
                            draggable
                            onDragStart={(e) => handleDragStart(e, template.type || 'custom')}
                            transition="all 0.2s"
                            position="relative"
                            _hover={{
                              transform: 'translateY(-2px)',
                              boxShadow: 'md',
                            }}
                            onClick={() => handleTemplateClick(template.id)}
                            // mb={3}
                          >
                            <Flex
                              w="48px"
                              h="48px"
                              bg="yellow.500"
                              borderRadius="lg"
                              alignItems="center"
                              justifyContent="center"
                              mb={2}
                            >
                              <FiActivity color="white" size={24} />
                            </Flex>
                            <Text fontWeight="medium" fontSize="sm">{template.name}</Text>
                            
                            <IconButton
                              icon={<FiEdit2 />}
                              size="xs"
                              position="absolute"
                              top="2"
                              right="2"
                              opacity="0.7"
                              aria-label="Edit template"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateClick(template.id);
                              }}
                            />
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              // Display search results
              <>
                <Heading as="h2" size="sm" color={headingColor} mb={3}>Search Results</Heading>
                <SimpleGrid columns={2} spacing={3}>
                  {Object.entries(getFilteredNodeTypes()).map(([nodeKey, nodeType]) => 
                    renderNodeBlock(nodeKey, nodeType)
                  )}
                  
                  {filteredCustomTemplates.map((template) => (
                    <Box
                      key={template.id}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={4}
                      bg={itemBgColor}
                      borderRadius="lg"
                      cursor="grab"
                      draggable
                      onDragStart={(e) => handleDragStart(e, template.type || 'custom')}
                      transition="all 0.2s"
                      position="relative"
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'md',
                      }}
                      onClick={() => handleTemplateClick(template.id)}
                    >
                      <Flex
                        w="48px"
                        h="48px"
                        bg="yellow.500"
                        borderRadius="lg"
                        alignItems="center"
                        justifyContent="center"
                        mb={2}
                      >
                        <FiActivity color="white" size={24} />
                      </Flex>
                      <Text fontWeight="medium" fontSize="sm">{template.name}</Text>
                      
                      <IconButton
                        icon={<FiEdit2 />}
                        size="xs"
                        position="absolute"
                        top="2"
                        right="2"
                        opacity="0.7"
                        aria-label="Edit template"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateClick(template.id);
                        }}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </>
            )}
            </Box>
          </TabPanel>
          
          <TabPanel p={0} h="100%" display="flex" flexDirection="column">
            <Box px={4} pt={4} pb={2}>
              <Flex align="center" justify="space-between">
                <Heading as="h2" size="sm" color={headingColor}>Flow Layers</Heading>
                {beautifyMode && (
                  <Badge colorScheme="blue" display="flex" alignItems="center" px={2} py={1}>
                    <FiMaximize2 style={{ marginRight: '4px' }} />
                    Beautified
                  </Badge>
                )}
              </Flex>
            </Box>
            
            <Box flex="1" overflowY="auto" overflowX="hidden">
              {Object.keys(layerMap).length > 0 ? (
                <VStack spacing={0} align="stretch">
                  {Object.keys(layerMap).map((layer) => {
                    const isLayerExpanded = expandedCategories[`layer-${layer}`] !== false;
                    return (
                      <Box key={layer}>
                        {/* Layer Header */}
                        <Flex
                          py={2}
                          px={4}
                          bg={bgColor}
                          align="center"
                          cursor="pointer"
                          transition="all 0.2s"
                          role="group"
                          _hover={{ bg: hoverBgColor }}
                          onClick={() => toggleCategory(`layer-${layer}`)}
                          userSelect="none"
                        >
                          <Icon 
                            as={isLayerExpanded ? FiChevronDown : FiChevronRight} 
                            mr={2} 
                            color={mutedTextColor}
                          />
                          <Icon 
                            as={FiLayers} 
                            mr={2} 
                            fontSize="sm"
                            color={mutedTextColor}
                          />
                          <Text 
                            color={textColor} 
                            fontWeight="semibold"
                            fontSize="sm"
                            flex="1"
                          >
                            Layer {layer}
                          </Text>
                          <Badge 
                            fontSize="xs" 
                            colorScheme="gray"
                            bg={badgeBg}
                            color={badgeColor}
                            borderRadius="full"
                            px={2}
                            ml={2}
                          >
                            {layerMap[layer].length}
                          </Badge>
                        </Flex>
                        
                        {/* Layer Nodes */}
                        <Collapse in={isLayerExpanded} animateOpacity>
                          <VStack spacing={0} align="stretch">
                            {layerMap[layer].map((node) => {
                              const NodeIcon = getIconComponent(nodeTypes[node.type]?.icon);
                              return (
                                <Flex
                                  key={node.id}
                                  py={2}
                                  px={4 + 10} // Indented by 16px (2 levels)
                                  bg={bgColor}
                                  align="center"
                                  cursor="pointer"
                                  transition="all 0.2s"
                                  role="group"
                                  _hover={{ bg: hoverBgColor }}
                                  onClick={() => onNodeClick && onNodeClick(node.id)}
                                  userSelect="none"
                                >
                                  <Icon 
                                    as={NodeIcon || FiActivity} 
                                    mr={2} 
                                    fontSize="sm"
                                    color={mutedTextColor}
                                    _groupHover={{ color: textColor }}
                                  />
                                  <Text 
                                    color={textColor} 
                                    fontSize="sm"
                                    flex="1"
                                  >
                                    {node.name}
                                  </Text>
                                  {/* <Badge 
                                    fontSize="xs" 
                                    colorScheme={nodeTypes[node.type]?.color?.replace('.500', '') || 'gray'}
                                    borderRadius="full"
                                    px={2}
                                    ml={2}
                                  >
                                    {node.type}
                                  </Badge> */}
                                </Flex>
                              );
                            })}
                          </VStack>
                        </Collapse>
                      </Box>
                    );
                  })}
                </VStack>
              ) : (
                <Flex 
                  direction="column" 
                  align="center" 
                  justify="center" 
                  p={6} 
                  mx={4}
                  bg={itemBgColor} 
                  borderRadius="md"
                  h="200px"
                >
                  <Box as={FiLayers} fontSize="40px" color={emptyStateIconColor} mb={4} />
                  <Text color="gray.500" textAlign="center">
                    {emptyStateMessage}
                  </Text>
                </Flex>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Agent Info Modal */}
      <Modal 
        isOpen={isInfoOpen} 
        onClose={onInfoClose} 
        size="xl"
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.300" />
        <ModalContent
          bg={useColorModeValue('white', 'gray.800')}
          borderRadius="2xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          overflow="hidden"
        >
          <Box
            bg={useColorModeValue('gray.50', 'gray.900')}
            px={8}
            py={6}
            borderBottom="1px solid"
            borderColor={borderColor}
          >
            <Flex align="center" justify="space-between">
              <HStack spacing={4}>
                <Box
                  w="50px"
                  h="50px"
                  borderRadius="xl"
                  bg={useColorModeValue('blue.500', 'blue.400')}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="lg"
                >
                  <FiActivity color="white" size={24} />
                </Box>
                <Box>
                  <Heading size="md" color={headingColor}>
                    {agentData?.name || 'Agent'}
                  </Heading>
                  <Text fontSize="sm" color={mutedTextColor}>
                    Agent Information
                  </Text>
                </Box>
              </HStack>
              <ModalCloseButton 
                position="relative"
                top="0"
                right="0"
                size="lg"
              />
            </Flex>
          </Box>
          
          <ModalBody px={8} py={6}>
            <VStack align="stretch" spacing={6}>
              <Box
                p={4}
                bg={useColorModeValue('gray.50', 'gray.900')}
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
              >
                <Text 
                  fontSize="xs" 
                  fontWeight="semibold" 
                  color={mutedTextColor}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={2}
                >
                  Description
                </Text>
                <Text color={textColor} lineHeight="tall">
                  {agentData?.description || 'No description available'}
                </Text>
              </Box>
              
              <SimpleGrid columns={2} spacing={4}>
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Text 
                    fontSize="xs" 
                    fontWeight="semibold" 
                    color={mutedTextColor}
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={2}
                  >
                    Owner
                  </Text>
                  <Text color={textColor} fontWeight="medium">
                    {agentData?.owner || 'Unknown'}
                  </Text>
                </Box>
                
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Text 
                    fontSize="xs" 
                    fontWeight="semibold" 
                    color={mutedTextColor}
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={2}
                  >
                    Status
                  </Text>
                  <HStack>
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg="green.400"
                      boxShadow="0 0 0 3px rgba(72, 187, 120, 0.2)"
                    />
                    <Text color={textColor} fontWeight="medium">
                      Active
                    </Text>
                  </HStack>
                </Box>
              </SimpleGrid>
              
              <SimpleGrid columns={2} spacing={4}>
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Text 
                    fontSize="xs" 
                    fontWeight="semibold" 
                    color={mutedTextColor}
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={2}
                  >
                    Created On
                  </Text>
                  <Text color={textColor} fontWeight="medium">
                    {agentData?.creation_date 
                      ? new Date(agentData.creation_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </Text>
                </Box>
                
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Text 
                    fontSize="xs" 
                    fontWeight="semibold" 
                    color={mutedTextColor}
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={2}
                  >
                    Last Modified
                  </Text>
                  <Text color={textColor} fontWeight="medium">
                    {agentData?.last_edited_time
                      ? new Date(agentData.last_edited_time).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </Text>
                </Box>
              </SimpleGrid>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BlocksPanel;