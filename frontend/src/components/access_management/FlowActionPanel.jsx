// src/components/access_management/FlowActionPanel.jsx
import {
    Box,
    Button,
    Flex,
    Tooltip,
    useColorModeValue,
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
} from "react-icons/fi";
import colors from '../../color';
import flowIcons from "../../utils/my-flow-icons.json";
// Removed PublishModal import - will use InteractivePublish page instead

const FlowActionPanel = ({ toggleSidebar, sidebarOpen, currentPage, onPageChange }) => {
  const [activeAction, setActiveAction] = useState('Summary');
  const { currentWallet } = useCurrentWallet();
  const toast = useToast();
  
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


  const bgColor = useColorModeValue(colors.accessManagement.sidebar.bg.light, colors.accessManagement.sidebar.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.sidebar.border.light, colors.accessManagement.sidebar.border.dark);
  const iconColor = useColorModeValue(colors.gray[900], colors.gray[400]);
  const hoverBgColor = useColorModeValue(colors.accessManagement.sidebar.itemHover.light, colors.accessManagement.sidebar.itemHover.dark);
  const activeColor = useColorModeValue(colors.blue[700], colors.blue[300]);

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

  const getButtonStyle = (actionName = null) => ({
    w: "100%",
    h: "50px",
    justifyContent: "center",
    borderRadius: 0,
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


  return (
    <Box
      w="56px"
      h="100%"
      bg={bgColor}
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