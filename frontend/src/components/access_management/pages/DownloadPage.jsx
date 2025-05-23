// src/components/access_management/pages/DownloadPage.jsx
import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  HStack,
  Text, 
  Button,
  Heading,
  useColorModeValue,
  useToast,
  Icon,
  Card,
  CardBody
} from '@chakra-ui/react';
import { FiDownload, FiImage, FiFileText } from 'react-icons/fi';
import colors from '../../../color';
import { exportFlowAsImage, exportFlowAsJSON } from '../../../utils/flowExport';

const DownloadPage = ({ agentData }) => {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBg = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.flowCard.border.light, colors.accessManagement.flowCard.border.dark);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const mutedColor = useColorModeValue(colors.gray[600], colors.gray[400]);
  
  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      // For PNG export, we need to redirect to flow builder to capture the canvas
      const flowBuilderUrl = `/flow-builder/${agentData.agent_id}?export=png`;
      window.open(flowBuilderUrl, '_blank');
      
      toast({
        title: 'Export Started',
        description: 'Opening flow builder to export as PNG...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export flow as PNG',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      // Export workflow data as JSON
      const flowData = {
        agent_id: agentData.agent_id,
        name: agentData.name,
        description: agentData.description,
        version: agentData.version || '1.0.0',
        workflow: agentData.workflow || {},
        metadata: {
          created_at: agentData.creation_date,
          last_modified: agentData.last_modified,
          author: agentData.owner,
          tags: agentData.tags || [],
          license: agentData.license || 'MIT'
        }
      };
      
      const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agentData.name || 'workflow'}-${agentData.agent_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Workflow exported as JSON',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export workflow as JSON',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box p={6} bg={bgColor} h="100%" overflow="auto">
      <VStack align="stretch" spacing={6}>
        <Heading size="lg" color={textColor}>
          Download & Export
        </Heading>
        
        <Text color={mutedColor}>
          Export your workflow for backup, sharing, or offline viewing.
        </Text>
        
        {/* Export Options */}
        <VStack spacing={4} align="stretch">
          {/* PNG Export */}
          <Card 
            bg={cardBg} 
            border="1px" 
            borderColor={borderColor}
            cursor="pointer"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            transition="all 0.2s"
            onClick={handleExportPNG}
          >
            <CardBody>
              <HStack spacing={4}>
                <Box 
                  p={3} 
                  bg={useColorModeValue(colors.blue[100], colors.blue[900])}
                  borderRadius="md"
                >
                  <Icon as={FiImage} boxSize={6} color={colors.blue[500]} />
                </Box>
                <VStack align="start" flex={1} spacing={1}>
                  <Text fontWeight="bold" color={textColor}>Export as PNG Image</Text>
                  <Text fontSize="sm" color={mutedColor}>
                    Download a visual representation of your workflow as a PNG image
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="blue"
                  size="sm"
                  isLoading={isExporting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportPNG();
                  }}
                >
                  Export PNG
                </Button>
              </HStack>
            </CardBody>
          </Card>
          
          {/* JSON Export */}
          <Card 
            bg={cardBg} 
            border="1px" 
            borderColor={borderColor}
            cursor="pointer"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            transition="all 0.2s"
            onClick={handleExportJSON}
          >
            <CardBody>
              <HStack spacing={4}>
                <Box 
                  p={3} 
                  bg={useColorModeValue(colors.green[100], colors.green[900])}
                  borderRadius="md"
                >
                  <Icon as={FiFileText} boxSize={6} color={colors.green[500]} />
                </Box>
                <VStack align="start" flex={1} spacing={1}>
                  <Text fontWeight="bold" color={textColor}>Export as JSON Data</Text>
                  <Text fontSize="sm" color={mutedColor}>
                    Download workflow configuration and metadata as a JSON file
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="green"
                  size="sm"
                  isLoading={isExporting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportJSON();
                  }}
                >
                  Export JSON
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </VStack>
        
        {/* Additional Information */}
        <Box bg={cardBg} p={4} borderRadius="md" border="1px" borderColor={borderColor}>
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" color={textColor}>Export Information</Text>
            <Text fontSize="sm" color={mutedColor}>
              • PNG exports open the flow builder to capture the visual layout
            </Text>
            <Text fontSize="sm" color={mutedColor}>
              • JSON exports include all workflow data and metadata
            </Text>
            <Text fontSize="sm" color={mutedColor}>
              • Exported files can be used for backup or sharing purposes
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default DownloadPage;