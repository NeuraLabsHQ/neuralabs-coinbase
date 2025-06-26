import {
    Box,
    Button,
    ButtonGroup,
    Center,
    Flex,
    Heading,
    HStack,
    Icon,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    SimpleGrid,
    Table,
    Tbody,
    Td,
    Text,
    Tr,
    useColorModeValue,
    useToast,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useBreakpointValue,
    VStack
} from "@chakra-ui/react";
import { useEffect, useState } from 'react';
import {
    FiActivity,
    FiBarChart2,
    FiChevronLeft,
    FiChevronRight,
    FiGrid,
    FiList,
    FiPieChart,
    FiPlus,
    FiSearch,
    FiUpload,
    FiChevronDown
} from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import { accessManagementApi } from "../../utils/access-api";
import { agentAPI } from "../../utils/agent-api";
import colors from "../../color.js";
import CreateAgentModal from "./Popup/CreateAgentModal";

const TemplateCard = ({ title, hasButton = false, onClick }) => {
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const hoverBgColor = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBorderColor = useColorModeValue("blue.500", "blue.400");
  const iconBgColor = useColorModeValue("blue.50", "blue.900");
  const iconColor = useColorModeValue("blue.600", "blue.300");
  const overlayBg = useColorModeValue("rgba(59, 130, 246, 0.1)", "rgba(0,0,0,0.8)");
  const overlayTextColor = useColorModeValue("gray.700", "gray.100");

  return (
    <Box
      w="100%"
      h="160px"
      bg={bgColor}
      borderRadius="md"
      position="relative"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
      transition="all 0.2s ease"
      cursor="pointer"
      onClick={onClick}
      _hover={{
        bg: hoverBgColor,
        borderColor: hoverBorderColor,
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      }}
    >
      {hasButton ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="100%"
          p={4}
          color={textColor}
        >
          <Icon as={FiPlus} boxSize={10} mb={4} />
          <Text fontWeight="bold" fontSize="xl">
            Create New
          </Text>
        </Flex>
      ) : (
        <>
          <Flex
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="44px"
            align="center"
            justify="center"
            p={4}
          >
            <Box
              p={4}
              borderRadius="xl"
              bg={iconBgColor}
              color={iconColor}
            >
              <Icon 
                as={title?.includes("Balance") ? FiActivity : 
                    title?.includes("Contract") ? FiBarChart2 :
                    title?.includes("API") ? FiGrid :
                    title?.includes("ETL") ? FiUpload :
                    title?.includes("Analytics") ? FiPieChart :
                    FiActivity
                  } 
                boxSize={8} 
              />
            </Box>
          </Flex>
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            bg={overlayBg}
            p={3}
            backdropFilter="blur(8px)"
            WebkitBackdropFilter="blur(8px)"
          >
            <Text
              color={overlayTextColor}
              fontWeight="medium"
              fontSize="sm"
              textAlign="center"
              noOfLines={1}
            >
              {title || "Template"}
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};

const QuickAccessTab = ({ label, isActive, count, onClick }) => {
  const activeBg = useColorModeValue("blue.50", "gray.700");
  const inactiveBg = useColorModeValue("gray.100", "gray.800");
  const activeTextColor = useColorModeValue("blue.600", "white");
  const inactiveTextColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Button
      bg={isActive ? activeBg : inactiveBg}
      color={isActive ? activeTextColor : inactiveTextColor}
      borderRadius="full"
      size="sm"
      fontWeight={isActive ? "semibold" : "normal"}
      onClick={onClick}
      _hover={{ bg: activeBg }}
    >
      {label} {count > 0 && `(${count})`}
    </Button>
  );
};

const TablePagination = ({ currentPage, totalPages, onPageChange }) => {
  const buttonBg = useColorModeValue("gray.100", "gray.800");
  const activeBg = useColorModeValue("blue.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.400", "gray.400");

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Flex justify="space-between" align="center" w="100%" py={3} px={4}>
      <Button
        size="sm"
        leftIcon={<FiChevronLeft />}
        bg={buttonBg}
        color={currentPage === 1 ? mutedTextColor : textColor}
        onClick={handlePrevious}
        isDisabled={currentPage === 1}
        _hover={{ bg: activeBg }}
      >
        Previous
      </Button>

      <Button
        size="sm"
        rightIcon={<FiChevronRight />}
        bg={buttonBg}
        color={currentPage === totalPages ? mutedTextColor : textColor}
        onClick={handleNext}
        isDisabled={currentPage === totalPages}
        _hover={{ bg: activeBg }}
      >
        Next
      </Button>
    </Flex>
  );
};

const AccessHomePage = ({ onSelectFlow }) => {
  const [flows, setFlows] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recent");
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 5;

  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  
  // Add loading state to prevent layout flash
  const [isBreakpointReady, setIsBreakpointReady] = useState(false);
  
  useEffect(() => {
    // Set ready state once breakpoint value is determined
    if (isMobile !== undefined) {
      setIsBreakpointReady(true);
    }
  }, [isMobile]);

  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBgColor = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const textColor = useColorModeValue(colors.accessManagement.mainContent.heading.light, colors.accessManagement.mainContent.heading.dark);
  const mutedTextColor = useColorModeValue(colors.accessManagement.sidebar.icon.light, colors.accessManagement.sidebar.icon.dark);
  const borderColor = useColorModeValue(colors.accessManagement.detailPanel.border.light, colors.accessManagement.detailPanel.border.dark);
  const theadBgColor = useColorModeValue(colors.accessManagement.detailPanel.addressBg.light, colors.accessManagement.detailPanel.addressBg.dark);
  const inputBgColor = useColorModeValue(colors.accessManagement.detailPanel.bg.light, colors.accessManagement.detailPanel.bg.dark);
  const hoverBgColor = useColorModeValue(colors.accessManagement.sidebar.itemHover.light, colors.accessManagement.sidebar.itemHover.dark);
  const activeTabBg = useColorModeValue(colors.accessManagement.sidebar.selected.light, colors.accessManagement.sidebar.selected.dark);
  const inactiveTabBg = useColorModeValue(colors.accessManagement.detailPanel.addressBg.light, colors.accessManagement.detailPanel.addressBg.dark);
  const buttonBgColor = useColorModeValue(colors.accessManagement.detailPanel.addressBg.light, colors.accessManagement.detailPanel.addressBg.dark);
  const activeBgColor = useColorModeValue(colors.accessManagement.sidebar.selected.light, colors.accessManagement.sidebar.selected.dark);
  const listhoverBgColor = useColorModeValue(colors.accessManagement.sidebar.itemHover.light, colors.accessManagement.sidebar.itemHover.dark);
  const searchbarcolor = useColorModeValue(colors.accessManagement.detailPanel.bg.light, colors.accessManagement.detailPanel.bg.dark);
  const separatorBgColor = useColorModeValue(colors.accessManagement.detailPanel.border.light, colors.accessManagement.detailPanel.border.dark);
  const flowIconBgColor = useColorModeValue(colors.accessManagement.flowCard.iconBg.light, colors.accessManagement.flowCard.iconBg.dark);
  const flowIconTextColor = useColorModeValue(colors.accessManagement.flowCard.iconText.light, colors.accessManagement.flowCard.iconText.dark);



  // Reset to first page when search query or active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Add some dummy creation dates to flows
  const addCreationDates = (flowList) => {
    const currentDate = new Date();
    return flowList.map((flow, index) => {
      const daysAgo = 2 + ((index * 5) % 60);
      const date = new Date();
      date.setDate(currentDate.getDate() - daysAgo);
      return {
        ...flow,
        creationDate: date.toISOString().split("T")[0],
      };
    });
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [flowsResponse, levelsResponse] = await Promise.all([
          accessManagementApi.getAllFlows(),
          accessManagementApi.getAccessLevels(),
        ]);

        const flowsWithDates = addCreationDates(flowsResponse.data);
        setFlows(flowsWithDates);
        setAccessLevels(levelsResponse.data.levels);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle creating new agent
  const handleCreateAgent = async (agentData) => {
    try {
      const response = await agentAPI.createAgent(agentData);
      
      toast({
        title: "Agent Created Successfully",
        description: `Agent "${agentData.name}" has been created.`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      // Navigate to flow builder with the new agent ID (only on desktop)
      if (response.agent_id) {
        if (isMobile) {
          toast({
            title: "Desktop Required",
            description: "Flow Builder requires a desktop computer. The agent has been created successfully.",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
        } else {
          navigate(`/flow-builder/${response.agent_id}`);
        }
      } else {
        console.error("No agent_id returned from API");
        toast({
          title: "Warning",
          description: "Agent created but ID not returned. Please check manually.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
      toast({
        title: "Error Creating Agent",
        description: error.message || "Failed to create agent. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Filter flows based on search and active tab
  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "recent") {
      return matchesSearch;
    } else if (activeTab === "development") {
      return matchesSearch && flow.accessLevel === 0;
    } else if (activeTab === "published") {
      return matchesSearch && flow.accessLevel > 0;
    } else if (activeTab === "shared") {
      return matchesSearch && flow.accessLevel >= 4;
    }

    return matchesSearch;
  });

  // Get paginated data
  const paginatedFlows = filteredFlows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFlows.length / itemsPerPage)
  );

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Create template cards
  const templateCards = [
    <TemplateCard
      key={0}
      hasButton={true}
      onClick={() => setIsCreateModalOpen(true)}
    />,
    <TemplateCard
      key={1}
      title="Read Base Balance"
      onClick={() => console.log("Selected template 1")}
    />,
    <TemplateCard
      key={2}
      title="Read Smart Contract"
      onClick={() => console.log("Selected template 2")}
    />,
    <TemplateCard
      key={3}
      title="API Integration"
      onClick={() => console.log("Selected template 3")}
    />,
    <TemplateCard
      key={4}
      title="Database ETL"
      onClick={() => console.log("Selected template 4")}
    />,
    <TemplateCard
      key={5}
      title="Analytics Dashboard"
      onClick={() => console.log("Selected template 5")}
    />,
  ];

  const getFlowIcon = (accessLevel) => {
    switch (accessLevel % 3) {
      case 0:
        return FiBarChart2;
      case 1:
        return FiPieChart;
      case 2:
        return FiActivity;
      default:
        return FiBarChart2;
    }
  };

  // Add responsive values
  const searchBarMaxWidth = useBreakpointValue({ base: "90%", sm: "400px", md: "600px" });
  const headingSize = useBreakpointValue({ base: "md", md: "lg" });
  const containerPadding = useBreakpointValue({ base: 4, md: 6 });

  // Prevent render until breakpoint is determined to avoid layout flash
  if (!isBreakpointReady) {
    return (
      <Box 
        bg={bgColor} 
        h="100%" 
        width="100%" 
        overflowY="auto"
        overflowX="hidden"
      />
    );
  }

  return (
    <Box 
      bg={bgColor} 
      h="100%" 
      width="100%" 
      overflowY="auto"
      overflowX="hidden"
    >
        {/* Project title */}
        <Center pt={containerPadding} pb={containerPadding} marginTop={isMobile ? "20px" : "30px"}>
          <Heading size={headingSize} color={textColor}>
            Welcome to Neuralabs
          </Heading>
        </Center>

        {/* Search bar - responsive */}
        <Box 
          maxW={searchBarMaxWidth} 
          mx="auto" 
          mb={containerPadding}
          px={containerPadding}
        >
          <InputGroup size={isMobile ? "md" : "lg"}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Search Projects and Templates"
              bg={searchbarcolor}
              color={textColor}
              borderColor="gray.700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              _placeholder={{ color: "gray.500" }}
              _hover={{ borderColor: "gray.600" }}
              _focus={{ borderColor: "blue.500", boxShadow: "none" }}
            />
          </InputGroup>
        </Box>

        {/* Template section */}
        <Box px={containerPadding} mb={10}>
          <Text color={textColor} mb={5} fontSize={isMobile ? "lg" : "xl"} fontWeight="medium">
            Create new
          </Text>
          <SimpleGrid
            columns={{ base: 2, sm: 3, md: 4, lg: 6 }}
            spacing={isMobile ? 4 : 9}
          >
            {templateCards}
          </SimpleGrid>
        </Box>

        {/* Quick access section */}
        <Box px={containerPadding} mb={4}>
          <Flex 
            justify="space-between" 
            align="center" 
            mb={4}
            flexDirection={isMobile ? "row" : "row"}
          >
            <Text color={textColor} fontWeight="medium">
              Quick access
            </Text>
            {isMobile && (
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<FiChevronDown />}
                  size="sm"
                  variant="ghost"
                  color={textColor}
                >
                  {activeTab === "recent" && `Recently opened (${flows.length})`}
                  {activeTab === "development" && `Under Development (${flows.filter((f) => f.accessLevel === 0).length})`}
                  {activeTab === "published" && `Published (${flows.filter((f) => f.accessLevel > 0).length})`}
                  {activeTab === "shared" && `Shared (${flows.filter((f) => f.accessLevel >= 4).length})`}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setActiveTab("recent")}>
                    Recently opened ({flows.length})
                  </MenuItem>
                  <MenuItem onClick={() => setActiveTab("development")}>
                    Under Development ({flows.filter((f) => f.accessLevel === 0).length})
                  </MenuItem>
                  <MenuItem onClick={() => setActiveTab("published")}>
                    Published ({flows.filter((f) => f.accessLevel > 0).length})
                  </MenuItem>
                  <MenuItem onClick={() => setActiveTab("shared")}>
                    Shared ({flows.filter((f) => f.accessLevel >= 4).length})
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>

          <Flex 
            justify="space-between" 
            mb={4}
            flexDirection={isMobile ? "column" : "row"}
            gap={isMobile ? 3 : 0}
          >
            {!isMobile && (
              <HStack spacing={3} overflowX="auto" pb={2}>
                <QuickAccessTab
                  label="Recently opened"
                  isActive={activeTab === "recent"}
                  count={flows.length}
                  onClick={() => setActiveTab("recent")}
                />
                <QuickAccessTab
                  label="Under Development"
                  isActive={activeTab === "development"}
                  count={flows.filter((f) => f.accessLevel === 0).length}
                  onClick={() => setActiveTab("development")}
                />
                <QuickAccessTab
                  label="Published"
                  isActive={activeTab === "published"}
                  count={flows.filter((f) => f.accessLevel > 0).length}
                  onClick={() => setActiveTab("published")}
                />
                <QuickAccessTab
                  label="Shared"
                  isActive={activeTab === "shared"}
                  count={flows.filter((f) => f.accessLevel >= 4).length}
                  onClick={() => setActiveTab("shared")}
                />
              </HStack>
            )}
            <ButtonGroup size="sm" isAttached variant="outline" alignSelf={isMobile ? "flex-end" : "auto"}>
              <Button
                leftIcon={<FiUpload />}
                size="sm"
                colorScheme="gray"
                variant="ghost" 
                onClick={() => console.log("Upload clicked")}
                mr={2}
              >
                Upload
              </Button>
              <Box 
                height="24px" 
                width="1px" 
                bg={separatorBgColor} 
                mx={1}
                my={1} 
              />
              
              <IconButton
                aria-label="List view"
                icon={<FiList />}
                variant="ghost" 
                colorScheme={viewMode === "list" ? "blue" : "gray"}
                onClick={() => setViewMode("list")}
              />
              <IconButton
                aria-label="Grid view"
                icon={<FiGrid />}
                variant="ghost" 
                colorScheme={viewMode === "grid" ? "blue" : "gray"}
                onClick={() => setViewMode("grid")}
              />
            </ButtonGroup>
          </Flex>
        </Box>

        {/* Flow list */}
        <Box
          mx={containerPadding}
          mb={isMobile ? 20 : 6}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          overflow="hidden"
        >
        <Table variant="simple" size="sm">
          <Tbody>
            {paginatedFlows.map((flow) => (
              <Tr
                key={flow.id}
                _hover={{ bg: listhoverBgColor }}
                onClick={() => navigate(`/access-management/${flow.id || flow.agent_id}`)}
                cursor="pointer"
              >
                <Td width={"10px"}>
                  <Box
                    p={2}
                    borderRadius="md"
                    bg={flowIconBgColor}
                    color={flowIconTextColor}
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    maxWidth={"30px"}
                  >
                    <Icon 
                      as={getFlowIcon(flow.accessLevel)} 
                      boxSize={4} 
                      maxWidth={"30px"}
                    />
                  </Box>
                </Td>
                <Td color={textColor}>
                  <Text fontWeight="medium">{flow.name}</Text>
                </Td>
                <Td color={mutedTextColor} display={{ base: "none", md: "table-cell" }}>{flow.creationDate}</Td>
                <Td display={{ base: "none", sm: "table-cell" }}>Access {flow.accessLevel}</Td>
              </Tr>
            ))}
            {filteredFlows.length === 0 && (
              <Tr>
                <Td
                  colSpan={4}
                  textAlign="center"
                  py={4}
                  color={mutedTextColor}
                >
                  No flows found
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>

        {/* Only show pagination if needed */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Box>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAgent={handleCreateAgent}
      />
    </Box>
  );
};

export default AccessHomePage;