// src/components/access_management/pages/DownloadPage.jsx
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
  VStack,
  useBreakpointValue,
  Stack
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiCode, FiDownload, FiFileText, FiImage } from 'react-icons/fi';
import colors from '../../../color';
import { agentAPI } from '../../../utils/agent-api';
import { exportFlowAsPNG } from '../../../utils/flowExport';
import { exportFlowAsYAML } from '../../../utils/flowExportYaml';

const DownloadPage = ({ agentData }) => {
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBg = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.flowCard.border.light, colors.accessManagement.flowCard.border.dark);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const mutedColor = useColorModeValue(colors.gray[600], colors.gray[400]);
  
  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      // Fetch the agent data to get the workflow
      const agent = await agentAPI.getAgent(agentData.agent_id);
      
      if (!agent || !agent.workflow) {
        throw new Error('No workflow data found');
      }

      // Parse the workflow data to get nodes and edges
      const workflowData = typeof agent.workflow === 'string' 
        ? JSON.parse(agent.workflow) 
        : agent.workflow;

      const nodes = workflowData.nodes || [];
      const edges = workflowData.edges || [];

      // Export the flow as PNG using the same mechanism as flow builder
      const dataUrl = await exportFlowAsPNG(nodes, edges, null, colorMode);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${agentData.name || 'workflow'}-${agentData.agent_id}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: 'Export Successful',
        description: 'Flow diagram has been exported as a PNG image.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export flow as PNG',
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

  const handleExportYAML = async () => {
    setIsExporting(true);
    try {
      // Fetch the agent data to get the workflow
      const agent = await agentAPI.getAgent(agentData.agent_id);
      
      if (!agent || !agent.workflow) {
        throw new Error('No workflow data found');
      }

      // Parse the workflow data to get nodes and edges
      const workflowData = typeof agent.workflow === 'string' 
        ? JSON.parse(agent.workflow) 
        : agent.workflow;

      const nodes = workflowData.nodes || [];
      const edges = workflowData.edges || [];

      // Create metadata for YAML export
      const metadata = {
        flow_id: agentData.agent_id,
        name: agentData.name || 'Exported Flow',
        description: agentData.description || 'Flow exported from Neuralabs',
        version: agentData.version || '1.0.0',
        author: agentData.owner,
        tags: agentData.tags || [],
        license: agentData.license || 'MIT'
      };

      // Export the flow as YAML
      const { url, filename } = await exportFlowAsYAML(nodes, edges, metadata);
      
      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Flow exported as YAML format compatible with execution engine.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('YAML Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export flow as YAML',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box p={isMobile ? 3 : 6} bg={bgColor} h="100%" overflow="auto">
      <VStack align="stretch" spacing={isMobile ? 4 : 6}>
        <Heading size={isMobile ? "md" : "lg"} color={textColor}>
          Download & Export
        </Heading>
        
        <Text color={mutedColor} fontSize={isMobile ? "sm" : "md"}>
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
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={isMobile ? 3 : 4}
                align={isMobile ? "stretch" : "center"}
              >
                <Box 
                  p={isMobile ? 2 : 3} 
                  bg={useColorModeValue(colors.blue[300], colors.blue[700])}
                  borderRadius="md"
                  alignSelf={isMobile ? "center" : undefined}
                >
                  <Icon as={FiImage} boxSize={isMobile ? 5 : 6} color={colors.blue[500]} />
                </Box>
                <VStack align={isMobile ? "center" : "start"} flex={1} spacing={1}>
                  <Text fontWeight="bold" color={textColor} fontSize={isMobile ? "sm" : "md"} textAlign={isMobile ? "center" : "left"}>
                    Export as PNG Image
                  </Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color={mutedColor} textAlign={isMobile ? "center" : "left"}>
                    Download a visual representation of your workflow as a PNG image
                  </Text>
                </VStack>
                <Button
                  leftIcon={!isMobile && <FiDownload />}
                  colorScheme="blue"
                  size={isMobile ? "sm" : "sm"}
                  isLoading={isExporting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportPNG();
                  }}
                  width={isMobile ? "full" : "auto"}
                >
                  {isMobile ? "PNG" : "Export PNG"}
                </Button>
              </Stack>
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
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={isMobile ? 3 : 4}
                align={isMobile ? "stretch" : "center"}
              >
                <Box 
                  p={isMobile ? 2 : 3} 
                  bg={useColorModeValue(colors.green[300], colors.green[700])}
                  borderRadius="md"
                  alignSelf={isMobile ? "center" : undefined}
                >
                  <Icon as={FiFileText} boxSize={isMobile ? 5 : 6} color={colors.green[500]} />
                </Box>
                <VStack align={isMobile ? "center" : "start"} flex={1} spacing={1}>
                  <Text fontWeight="bold" color={textColor} fontSize={isMobile ? "sm" : "md"} textAlign={isMobile ? "center" : "left"}>
                    Export as JSON Data
                  </Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color={mutedColor} textAlign={isMobile ? "center" : "left"}>
                    Download workflow configuration and metadata as a JSON file
                  </Text>
                </VStack>
                <Button
                  leftIcon={!isMobile && <FiDownload />}
                  colorScheme="green"
                  size={isMobile ? "sm" : "sm"}
                  isLoading={isExporting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportJSON();
                  }}
                  width={isMobile ? "full" : "auto"}
                >
                  {isMobile ? "JSON" : "Export JSON"}
                </Button>
              </Stack>
            </CardBody>
          </Card>

          {/* YAML Export */}
          <Card 
            bg={cardBg} 
            border="1px" 
            borderColor={borderColor}
            cursor="pointer"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            transition="all 0.2s"
            onClick={handleExportYAML}
          >
            <CardBody>
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={isMobile ? 3 : 4}
                align={isMobile ? "stretch" : "center"}
              >
                <Box 
                  p={isMobile ? 2 : 3} 
                  bg={useColorModeValue(colors.yellow[300], colors.yellow[700])}
                  borderRadius="md"
                  alignSelf={isMobile ? "center" : undefined}
                >
                  <Icon as={FiCode} boxSize={isMobile ? 5 : 6} color={colors.yellow[500]} />
                </Box>
                <VStack align={isMobile ? "center" : "start"} flex={1} spacing={1}>
                  <Text fontWeight="bold" color={textColor} fontSize={isMobile ? "sm" : "md"} textAlign={isMobile ? "center" : "left"}>
                    Export as YAML Flow
                  </Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color={mutedColor} textAlign={isMobile ? "center" : "left"}>
                    Download execution-ready YAML format compatible with backend execution engine
                  </Text>
                </VStack>
                <Button
                  leftIcon={!isMobile && <FiDownload />}
                  colorScheme="yellow"
                  size={isMobile ? "sm" : "sm"}
                  isLoading={isExporting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportYAML();
                  }}
                  width={isMobile ? "full" : "auto"}
                >
                  {isMobile ? "YAML" : "Export YAML"}
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </VStack>
        
        {/* Additional Information */}
        <Box bg={cardBg} p={isMobile ? 3 : 4} borderRadius="md" border="1px" borderColor={borderColor}>
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" color={textColor} fontSize={isMobile ? "sm" : "md"}>
              Export Information
            </Text>
            <Text fontSize={isMobile ? "xs" : "sm"} color={mutedColor}>
              • PNG exports create a visual representation of your workflow
            </Text>
            <Text fontSize={isMobile ? "xs" : "sm"} color={mutedColor}>
              • JSON exports include all workflow data and metadata
            </Text>
            <Text fontSize={isMobile ? "xs" : "sm"} color={mutedColor}>
              • YAML exports are execution-ready and compatible with the backend engine
            </Text>
            <Text fontSize={isMobile ? "xs" : "sm"} color={mutedColor}>
              • Exported files can be used for backup, sharing, or execution purposes
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default DownloadPage;