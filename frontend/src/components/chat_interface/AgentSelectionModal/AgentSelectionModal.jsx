import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Box,
  Text,
  Avatar,
  Flex,
  Spinner,
  useToast,
  Badge,
  SimpleGrid
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiUser } from "react-icons/fi";
import { useColorModeValue } from "@chakra-ui/react";
import colors from "../../../color";
import { agentAPI } from "../../../utils/agent-api";
import { accessManagementApi } from "../../../utils/access-api";

const AgentSelectionModal = ({ isOpen, onClose, onSelectAgent }) => {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const toast = useToast();

  // Colors
  const bgPrimary = useColorModeValue(colors.chat.bgPrimary.light, colors.chat.bgPrimary.dark);
  const bgSecondary = useColorModeValue(colors.chat.bgSecondary.light, colors.chat.bgSecondary.dark);
  const bgHover = useColorModeValue(colors.chat.bgHover.light, colors.chat.bgHover.dark);
  const textPrimary = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const textSecondary = useColorModeValue(colors.chat.textSecondary.light, colors.chat.textSecondary.dark);
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);
  const accentColor = useColorModeValue("blue.500", "blue.300");

  // Fetch agents when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      // Try to get agents from multiple sources
      const [agentsResponse, flowsResponse] = await Promise.allSettled([
        agentAPI.getAllAgents(),
        accessManagementApi.getAllFlowsData()
      ]);

      let allAgents = [];

      // Process agents from agentAPI
      if (agentsResponse.status === 'fulfilled' && agentsResponse.value) {
        const agentData = Array.isArray(agentsResponse.value) 
          ? agentsResponse.value 
          : agentsResponse.value.data || [];
        allAgents = [...allAgents, ...agentData];
      }

      // Process flows from accessManagementApi
      if (flowsResponse.status === 'fulfilled' && flowsResponse.value?.data) {
        const flowData = flowsResponse.value.data;
        
        // Add my_flows
        if (flowData.my_flows && Array.isArray(flowData.my_flows)) {
          const myFlows = flowData.my_flows.map(flow => ({
            ...flow,
            id: flow.agent_id || flow.id,
            name: flow.agent_name || flow.name || 'Unnamed Agent',
            description: flow.description || 'No description available',
            type: 'owned'
          }));
          allAgents = [...allAgents, ...myFlows];
        }

        // Add other flows (shared, published, etc.)
        if (flowData.other_flows) {
          Object.entries(flowData.other_flows).forEach(([category, flows]) => {
            if (Array.isArray(flows)) {
              const categoryFlows = flows.map(flow => ({
                ...flow,
                id: flow.agent_id || flow.id,
                name: flow.agent_name || flow.name || 'Unnamed Agent',
                description: flow.description || 'No description available',
                type: category
              }));
              allAgents = [...allAgents, ...categoryFlows];
            }
          });
        }
      }

      // Remove duplicates based on ID
      const uniqueAgents = Array.from(
        new Map(allAgents.map(agent => [agent.id, agent])).values()
      );

      setAgents(uniqueAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error fetching agents',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;

    const query = searchQuery.toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      (agent.description && agent.description.toLowerCase().includes(query))
    );
  }, [agents, searchQuery]);

  const handleSelectAgent = () => {
    if (selectedAgent) {
      onSelectAgent(selectedAgent);
      onClose();
      setSearchQuery("");
      setSelectedAgent(null);
    }
  };

  const getAgentTypeBadge = (type) => {
    const badgeProps = {
      owned: { colorScheme: "green", label: "Owned" },
      shared: { colorScheme: "blue", label: "Shared" },
      published: { colorScheme: "purple", label: "Published" },
      default: { colorScheme: "gray", label: "Agent" }
    };

    const props = badgeProps[type] || badgeProps.default;
    return <Badge {...props} size="sm">{props.label}</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent bg={bgPrimary} color={textPrimary}>
        <ModalHeader>Select an Agent</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Search Input */}
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color={textSecondary} />
              </InputLeftElement>
              <Input
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={bgSecondary}
                border="1px solid"
                borderColor={borderColor}
                _focus={{
                  borderColor: accentColor,
                  boxShadow: `0 0 0 1px ${accentColor}`
                }}
              />
            </InputGroup>

            {/* Agents Grid */}
            <Box
              maxH="500px"
              overflowY="auto"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              bg={bgSecondary}
              p={3}
            >
              {isLoading ? (
                <Flex justify="center" align="center" h="200px">
                  <Spinner size="lg" color={accentColor} />
                </Flex>
              ) : filteredAgents.length === 0 ? (
                <Flex justify="center" align="center" h="200px">
                  <Text color={textSecondary}>
                    {searchQuery ? 'No agents found matching your search' : 'No agents available'}
                  </Text>
                </Flex>
              ) : (
                <SimpleGrid columns={3} spacing={3}>
                  {filteredAgents.map((agent) => (
                    <Box
                      key={agent.id}
                      p={4}
                      borderRadius="lg"
                      cursor="pointer"
                      bg={selectedAgent?.id === agent.id ? bgHover : bgPrimary}
                      _hover={{ bg: bgHover, transform: "translateY(-2px)" }}
                      onClick={() => setSelectedAgent(agent)}
                      transition="all 0.2s"
                      border="2px solid"
                      borderColor={selectedAgent?.id === agent.id ? accentColor : borderColor}
                      boxShadow={selectedAgent?.id === agent.id ? "md" : "sm"}
                      position="relative"
                    >
                      {/* Type Badge in top right */}
                      {agent.type && (
                        <Box position="absolute" top={2} right={2}>
                          {getAgentTypeBadge(agent.type)}
                        </Box>
                      )}
                      
                      <VStack spacing={3} align="center">
                        <Avatar
                          size="lg"
                          icon={<FiUser />}
                          name={agent.name}
                          bg={accentColor}
                          color="white"
                        />
                        <VStack spacing={1} align="center" w="100%">
                          <Text 
                            fontWeight="semibold" 
                            fontSize="sm"
                            textAlign="center"
                            noOfLines={1}
                          >
                            {agent.name}
                          </Text>
                          <Text
                            fontSize="xs"
                            color={textSecondary}
                            noOfLines={2}
                            textAlign="center"
                            px={2}
                          >
                            {agent.description}
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSelectAgent}
            isDisabled={!selectedAgent}
          >
            Select Agent
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AgentSelectionModal;