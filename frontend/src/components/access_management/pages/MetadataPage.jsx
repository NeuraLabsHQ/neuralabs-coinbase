// src/components/access_management/pages/MetadataPage.jsx
import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  HStack,
  Text, 
  Button,
  Textarea,
  useColorModeValue,
  useToast,
  Heading,
  Flex
} from '@chakra-ui/react';
import { FiSave, FiEye, FiEdit } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import colors from '../../../color';
import { agentAPI } from '../../../utils/agent-api';

const MetadataPage = ({ agentData, onUpdate }) => {
    const [markdown, setMarkdown] = useState(agentData.markdown_object?.content || `# ${agentData.name || 'Agent Documentation'}

## Overview
${agentData.description || 'Add your agent description here...'}

## Usage Instructions

### Prerequisites
- List any requirements here

### Installation
\`\`\`bash
# Add installation commands
\`\`\`

### Configuration
Describe configuration options...

### Examples
\`\`\`javascript
// Add code examples
\`\`\`

## API Reference
Document your agent's API...

## Contributing
Add contribution guidelines...

## License
${agentData.license || 'MIT'} License
`);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
  
  const toast = useToast();
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBg = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.flowCard.border.light, colors.accessManagement.flowCard.border.dark);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const editorBg = useColorModeValue(colors.gray[50], colors.gray[800]);
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Create a markdown object with the content and metadata
      const markdownObject = {
        content: markdown,
        last_updated: new Date().toISOString(),
        version: '1.0.0'
      };
      
      // Call the API to save metadata
      await agentAPI.saveMetadata(agentData.agent_id, markdownObject);
      
      // Update parent component
      onUpdate({
        ...agentData,
        metadata: markdown
      });
      
      toast({
        title: 'Metadata Saved',
        description: 'Your documentation has been saved successfully.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save metadata',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} bg={bgColor} h="100%" overflow="hidden" display="flex" flexDirection="column">
      <VStack align="stretch" spacing={4} flex="1" minH={0}>
        <HStack justify="space-between">
          <Heading size="lg" color={textColor}>
            Agent Documentation
          </Heading>
          <HStack>
            <Button
              size="sm"
              variant={viewMode === 'edit' ? 'solid' : 'outline'}
              onClick={() => setViewMode('edit')}
              leftIcon={<FiEdit />}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'split' ? 'solid' : 'outline'}
              onClick={() => setViewMode('split')}
            >
              Split
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'solid' : 'outline'}
              onClick={() => setViewMode('preview')}
              leftIcon={<FiEye />}
            >
              Preview
            </Button>
            <Button
              leftIcon={<FiSave />}
              colorScheme="blue"
              size="sm"
              onClick={handleSave}
              isLoading={isLoading}
            >
              Save Changes
            </Button>
          </HStack>
        </HStack>
        
        <Flex flex="1" gap={4} minH={0}>
          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <Box 
              flex={viewMode === 'split' ? 1 : undefined} 
              w={viewMode === 'edit' ? '100%' : undefined}
              bg={cardBg} 
              borderRadius="md" 
              border="1px" 
              borderColor={borderColor}
              p={4}
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              <Text fontWeight="bold" mb={2} color={textColor}>Markdown Editor</Text>
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your documentation in Markdown..."
                bg={editorBg}
                fontFamily="monospace"
                flex="1"
                resize="none"
                sx={{
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              />
            </Box>
          )}
          
          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <Box 
              flex={viewMode === 'split' ? 1 : undefined}
              w={viewMode === 'preview' ? '100%' : undefined}
              bg={cardBg} 
              borderRadius="md" 
              border="1px" 
              borderColor={borderColor}
              p={4}
              overflow="auto"
              sx={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <Text fontWeight="bold" mb={2} color={textColor}>Preview</Text>
              <Box className="markdown-preview">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <Heading as="h1" size="xl" mt={4} mb={2} {...props} />,
                    h2: ({node, ...props}) => <Heading as="h2" size="lg" mt={3} mb={2} {...props} />,
                    h3: ({node, ...props}) => <Heading as="h3" size="md" mt={2} mb={1} {...props} />,
                    p: ({node, ...props}) => <Text mb={2} {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? (
                        <Text as="code" bg={editorBg} px={1} borderRadius="sm" fontSize="sm" {...props} />
                      ) : (
                        <Box as="pre" bg={editorBg} p={3} borderRadius="md" overflow="auto" mb={2}>
                          <Text as="code" fontSize="sm" {...props} />
                        </Box>
                      ),
                    ul: ({node, ...props}) => <Box as="ul" pl={5} mb={2} {...props} />,
                    ol: ({node, ...props}) => <Box as="ol" pl={5} mb={2} {...props} />,
                    li: ({node, ...props}) => <Box as="li" mb={1} {...props} />,
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </Box>
            </Box>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

export default MetadataPage;