// src/components/access_management/FlowActionPanel.jsx
import {
    Box,
    Button,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    HStack,
    IconButton,
    Text,
    Tooltip,
    useBreakpointValue,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { useCurrentWallet } from "@mysten/dapp-kit";
import { useState,useEffect } from 'react';
import { FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";
import {
    FiBarChart2,
    FiClock,
    FiCreditCard,
    FiDollarSign,
    FiDownload,
    FiEdit,
    FiGitBranch,
    FiHome,
    FiKey,
    FiLayout,
    FiLink,
    FiMessageSquare,
    FiSend,
    FiSettings,
    FiTag,
    FiUpload,
    FiUsers,
    FiZap,
} from "react-icons/fi";
import colors from '../../color';
import flowIcons from "../../utils/my-flow-icons.json";
// Removed PublishModal import - will use InteractivePublish page instead

const FlowActionPanel = ({ toggleSidebar, sidebarOpen, currentPage, onPageChange }) => {
  const [activeAction, setActiveAction] = useState('Summary');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { currentWallet } = useCurrentWallet();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update active action based on current page
  useEffect(() => {
    const pageToAction = {
      'summary': 'Home',
      'chat': 'Chat',
      'access': 'Access',
      'edit-flow': 'Edit Flow',
      'flow-view': 'Flow View',
      'settings': 'Settings',
      'metadata': 'Metadata',
      'version': 'Versions',
      'blockchain': 'Blockchain',
      'download': 'Download',
      'analytics': 'Analytics',
      'cost-estimation': 'Cost',
      'monetization': 'Monetization',
      'dependencies': 'Dependencies',
      'collaborators': 'Collaborators'
    };
    
    if (currentPage && pageToAction[currentPage]) {
      setActiveAction(pageToAction[currentPage]);
    }
  }, [currentPage]);


  // Use NavPanel color scheme with custom desktop background
  const desktopBgColor = useColorModeValue('navbar.body.light', '#131417');
  const mobileBgColor = useColorModeValue('navbar.body.light', 'navbar.body.dark');
  const borderColor = useColorModeValue('navbar.border.light', 'navbar.border.dark');
  const iconColor = useColorModeValue('navbar.icon.light', 'navbar.icon.dark');
  const hoverBgColor = useColorModeValue('navbar.hover.light', 'navbar.hover.dark');
  const activeColor = iconColor;

  const iconMapping = {
    FiHome: FiHome,
    FiMessageSquare: FiMessageSquare,
    FiKey: FiKey,
    FiEdit: FiEdit,
    FiTag: FiTag,
    FiClock: FiClock,
    FiUpload: FiUpload,
    FiSettings: FiSettings,
    FiLayout: FiLayout,
    FiLink: FiLink,
    FiBarChart2: FiBarChart2,
    FiDownload: FiDownload,
    FiDollarSign: FiDollarSign,
    FiCreditCard: FiCreditCard,
    FiGitBranch: FiGitBranch,
    FiUsers: FiUsers,
    FiSend: FiSend,
  };

  const getButtonStyle = (actionName = null, isMobileButton = false) => ({
    w: "100%",
    h: isMobileButton ? "48px" : "50px",
    justifyContent: isMobileButton ? "flex-start" : "center",
    px: isMobileButton ? 4 : 0,
    borderRadius: isMobileButton ? "md" : 0,
    bg: actionName === activeAction ? hoverBgColor : "transparent",
    color: actionName === activeAction ? activeColor : iconColor,
    _hover: { bg: hoverBgColor },
  });

  const handleActionClick = (actionName) => {
    setActiveAction(actionName);
    console.log(`Action clicked: ${actionName}`);
    
    if (actionName === "Publish") {
      onPageChange('interactive-publish'); // Navigate to Interactive Publish page
    } else if (onPageChange) {
      // Map action names to page names
      const pageMapping = {
        'Home': 'summary',
        'Chat': 'chat',
        'Access': 'access',
        'Edit Flow': 'edit-flow',
        'Flow View': 'flow-view',
        'Settings': 'settings',
        'Metadata': 'metadata',
        'Blockchain': 'blockchain',
        'Download': 'download',
         'Versions': 'version',
        'Analytics': 'analytics',
        'Cost': 'cost-estimation',
        'Monetization': 'monetization',
        'Dependencies': 'dependencies',
        'Collaborators': 'collaborators'
      };
      
      const pageName = pageMapping[actionName];
      if (pageName) {
        onPageChange(pageName);
      }
    }
  };


  // Render mobile menu button
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button - positioned at top right */}
        <Box position="absolute" top={4} right={4} zIndex={15}>
          <IconButton
            icon={<FiZap />}
            onClick={onOpen}
            variant="ghost"
            color={iconColor}
            size="lg"
            aria-label="Open action menu"
            _hover={{ bg: hoverBgColor }}
          />
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent bg={mobileBgColor}>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
              Flow Actions
            </DrawerHeader>
            <DrawerBody p={3} overflowY="auto">
              <VStack spacing={2} align="stretch">
                {/* Toggle Sidebar Button */}
                <Button
                  {...getButtonStyle(null, true)}
                  onClick={() => {
                    toggleSidebar();
                    onClose();
                  }}
                  leftIcon={sidebarOpen ? <FaAngleDoubleLeft /> : <FaAngleDoubleRight />}
                >
                  <HStack spacing={3} w="100%">
                    <Text fontSize="md">{sidebarOpen ? "Close Flow Panel" : "Open Flow Panel"}</Text>
                  </HStack>
                </Button>

                {/* Flow Action Items with Labels */}
                {flowIcons.sidebarOptions.map((option, index) => {
                  const IconComponent = iconMapping[option.icon];
                  return (
                    <Button
                      key={index}
                      {...getButtonStyle(option.newName, true)}
                      onClick={() => {
                        handleActionClick(option.newName);
                        onClose();
                      }}
                      leftIcon={IconComponent && <IconComponent />}
                    >
                      <HStack spacing={3} w="100%">
                        <Text fontSize="md">{option.newName}</Text>
                      </HStack>
                    </Button>
                  );
                })}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop version (original layout)
  return (
    <Box
      w="56px"
      h="100%"
      bg={desktopBgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      alignItems="center"
      padding="0"
      zIndex={2}
    >
      <VStack spacing={0} align="center" w="100%" h="100%" justify="flex-start">
        {/* Toggle Sidebar Button */}
        <Box w="100%">
          <Tooltip
            label={sidebarOpen ? "Close Flow Panel" : "Open Flow Panel"}
            placement="left"
            bg={"gray.900"}
            hasArrow
          >
            <Button
              {...getButtonStyle()}
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Close Flow Panel" : "Open Flow Panel"}
            >
              {sidebarOpen ? (
                <Flex alignItems="center" justifyContent="center">
                  <Box as={FaAngleDoubleLeft} size="24px" ml="-7px" />
                </Flex>
              ) : (
                <Flex alignItems="center" justifyContent="center">
                  <Box as={FaAngleDoubleRight} size="24px" ml="-7px" />
                </Flex>
              )}
            </Button>
          </Tooltip>
        </Box>

        {/* Flow Action Icons */}
        {flowIcons.sidebarOptions.map((option, index) => (
          <Box w="100%" key={index}>
            <Tooltip
              label={option.newName}
              placement="right"
              bg={colors.gray[900]}
              hasArrow
            >
              <Button
                {...getButtonStyle(option.newName)}
                onClick={() => handleActionClick(option.newName)}
                aria-label={option.newName}
              >
                {iconMapping[option.icon] && (
                  <Box as={iconMapping[option.icon]} size="24px" />
                )}
              </Button>
            </Tooltip>
          </Box>
        ))}
      </VStack>

    </Box>
  );
};

export default FlowActionPanel;