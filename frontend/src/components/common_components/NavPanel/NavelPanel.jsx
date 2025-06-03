import  { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Button, 
  Flex, 
  useColorMode, 
  Tooltip, 
  useColorModeValue,
  Text,
  HStack,
  useToast
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiLayout, 
  FiSettings, 
  FiSun, 
  FiMoon,
  FiShoppingBag,
  FiMessageSquare,
  FiKey
} from 'react-icons/fi';

import CustomConnectButton from '../CustomConnectButton/CustomConnectButton';

import neura_icon_white from '../../../assets/icons/neura-black.svg';
import neura_icon_dark from '../../../assets/icons/neura-white.svg';
import colors from '../../../color';

const NavPanel = ({ 
  onNavigate,
  currentPath,
  viewOnlyMode = false,
  isMobile = false,
  onClose // eslint-disable-line
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  
  const bgColor = useColorModeValue('navbar.body.light', 'navbar.body.dark');
  const borderColor = useColorModeValue('navbar.border.light', 'navbar.border.dark');
  const iconColor = useColorModeValue('navbar.icon.light', 'navbar.icon.dark');
  const hoverBgColor = useColorModeValue('navbar.hover.light', 'navbar.hover.dark');
  const disabledColor = useColorModeValue('gray.500', 'gray.600');

  // Add state to track the active button
  const [activeButton, setActiveButton] = useState(null);
  
  // Update active button based on current path
  useEffect(() => {
    if (currentPath === '/dashboard') {
      setActiveButton('home');
    } else if (currentPath === '/flow-builder') {
      setActiveButton('flow-builder');
    } else if (currentPath === '/marketplace') {
      setActiveButton('marketplace');
    } else if (currentPath === '/settings') {
      setActiveButton('settings');
    } else if (currentPath === '/chat') {
      setActiveButton('chat');
    } else if (currentPath === '/access-management') {
      setActiveButton('access-management');
    } else {
      setActiveButton(null);
    }
  }, [currentPath]);

  // Handle button clicks
  const handleButtonClick = (buttonName, action, route) => {
    // For view-only mode, only allow theme button
    if (viewOnlyMode && buttonName !== 'theme') {
      return;
    }
    
    // Show mobile restriction message for flow-builder
    if (buttonName === 'flow-builder') {
      const isMobileCheck = window.innerWidth < 1024;
      if (isMobileCheck) {
        toast({
          title: "Desktop Only",
          description: "The Flow Builder requires a desktop or laptop computer for the best experience. Please access this page from a larger screen.",
          status: "info",
          duration: 4000,
          isClosable: true,
          position: "top"
        });
        return;
      }
    }
    
    // Disable marketplace - show coming soon message
    if (buttonName === 'marketplace') {
      toast({
        title: "Coming Soon",
        description: "The Marketplace feature is currently under development and will be available soon.",
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      return;
    }
    
    // Navigate if route is provided
    if (route && onNavigate) {
      onNavigate(route);
    }
    
    // Execute action if provided
    if (action) action();
  };

  const isActive = (buttonName) => activeButton === buttonName;

  const getButtonStyles = (buttonName) => {
    const isButtonActive = isActive(buttonName);
    const isMobileCheck = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const isDisabled = (viewOnlyMode && buttonName !== 'theme') || 
                      (isMobileCheck && buttonName === 'flow-builder') ||
                      (buttonName === 'marketplace');
    
    return {
      w: "100%",
      h: isMobile ? "48px" : "56px",
      justifyContent: isMobile ? "flex-start" : "center",
      px: isMobile ? 4 : 0,
      borderRadius: isMobile ? "md" : 0,
      bg: isButtonActive ? (colorMode === 'dark' ? hoverBgColor : hoverBgColor) : "transparent", 
      color: isDisabled ? disabledColor : (isButtonActive ? iconColor : iconColor),
      borderLeft: isButtonActive && !isMobile ? "none" : "none",
      borderColor: isButtonActive ? hoverBgColor : "transparent",
      opacity: isDisabled ? 0.5 : 1,
      _hover: { 
        bg: isDisabled ? "transparent" : (isButtonActive ? (colorMode === 'dark' ? hoverBgColor : hoverBgColor) : hoverBgColor),
        cursor: isDisabled ? "not-allowed" : "pointer"
      }
    };
  };
  
  // Navigation items configuration
  const navItems = [
    { name: 'home', label: 'Dashboard', icon: FiHome, route: '/dashboard' },
    { name: 'chat', label: 'Chat', icon: FiMessageSquare, route: '/chat' },
    { name: 'access-management', label: 'Access Management', icon: FiKey, route: '/access-management' },
    { name: 'flow-builder', label: 'Flow Builder', icon: FiLayout, route: '/flow-builder' },
    { name: 'marketplace', label: 'Marketplace', icon: FiShoppingBag, route: '/marketplace' },
  ];

  return (
    <>
      <Box 
        as="nav" 
        position="relative"
        w={isMobile ? "100%" : "80px"} 
        h="100%" 
        bg={bgColor} 
        borderRight={!isMobile ? "1px solid" : "none"} 
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
        zIndex={2}
      >
        <VStack 
          as="ul" 
          listStyleType="none" 
          m={0} 
          p={0}
          py={isMobile ? 5 : 15} 
          px={isMobile ? 3 : 0}
          h="100%" 
          spacing={isMobile ? 2 : 0}
        >
          <Box as="li" position="relative" w="100%" display="flex" justifyContent={isMobile ? "flex-start" : "center"} py={3} marginBottom={"15px"} px={isMobile ? 4 : 0}>
            <HStack spacing={3}>
              <Flex 
              w="32px" 
              h="32px" 
              bg={colors.gray[500]}
              color="white"
              alignItems="center" 
              justifyContent="center"
              fontSize="24px" 
              fontWeight="bold"
              borderRadius="8px"
            >
              {
                colorMode === 'light' ? (
                  <img src={neura_icon_white} alt="Neura Icon" />
                ) : (
                  <img src={neura_icon_dark} alt="Neura Icon" />
                )
              }
              </Flex>
              {/* {isMobile && (
                <Text fontSize="lg" fontWeight="bold" color={iconColor}>
                  NeuraLabs
                </Text>
              )} */}
            </HStack>
          </Box>
          
          {/* Navigation Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = viewOnlyMode || 
                              (isMobile && item.name === 'flow-builder') ||
                              (item.name === 'marketplace');
            const tooltipLabel = item.name === 'marketplace' ? 'Marketplace - Coming Soon' : item.label;
            
            return (
              <Box key={item.name} as="li" position="relative" w="100%">
                {isMobile ? (
                  <Button 
                    {...getButtonStyles(item.name)}
                    onClick={() => handleButtonClick(item.name, null, item.route)}
                    aria-label={item.label}
                    disabled={isDisabled}
                  >
                    <HStack spacing={3} w="100%">
                      <Icon size={20} />
                      <Text fontSize="md">{item.label}</Text>
                    </HStack>
                  </Button>
                ) : (
                  <Tooltip 
                    label={tooltipLabel} 
                    placement="right" 
                    bg={colors.gray[900]} 
                    hasArrow
                  >
                    <Button 
                      {...getButtonStyles(item.name)}
                      onClick={() => handleButtonClick(item.name, null, item.route)}
                      aria-label={item.label}
                      disabled={isDisabled}
                    >
                      <Icon size={24} />
                    </Button>
                  </Tooltip>
                )}
              </Box>
            );
          })}
          
          <Box as="li" position="relative" w="100%" mt="auto">
            {isMobile ? (
              <Button 
                {...getButtonStyles('theme')}
                onClick={() => handleButtonClick('theme', toggleColorMode)}
                aria-label="Toggle Theme"
              >
                <HStack spacing={3} w="100%">
                  {colorMode === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                  <Text fontSize="md">Theme</Text>
                </HStack>
              </Button>
            ) : (
              <Tooltip label="Toggle Theme" placement="right" bg={colors.gray[900]} hasArrow>
                <Button 
                  {...getButtonStyles('theme')}
                  onClick={() => handleButtonClick('theme', toggleColorMode)}
                  aria-label="Toggle Theme"
                >
                  {colorMode === 'light' ? <FiMoon size={24} /> : <FiSun size={24} />}
                </Button>
              </Tooltip>
            )}
          </Box>
          
          {/* Wallet Button - Using our custom component */}
          <Box as="li" position="relative" w="100%" mb={3}>
            <CustomConnectButton 
              iconColor={iconColor} 
              hoverBgColor={hoverBgColor}
              viewOnlyMode={viewOnlyMode}
              isMobile={isMobile}
            />
          </Box>
          
          <Box as="li" position="relative" w="100%" mb={3}>
            {isMobile ? (
              <Button 
                {...getButtonStyles('settings')}
                onClick={() => handleButtonClick('settings', null, '/settings')}
                aria-label="Settings"
                disabled={viewOnlyMode}
              >
                <HStack spacing={3} w="100%">
                  <FiSettings size={20} />
                  <Text fontSize="md">Settings</Text>
                </HStack>
              </Button>
            ) : (
              <Tooltip 
                label={"Settings"} 
                placement="right" 
                bg={colors.gray[900]} 
                hasArrow
              >
                <Button 
                  {...getButtonStyles('settings')}
                  onClick={() => handleButtonClick('settings', null, '/settings')}
                  aria-label="Settings"
                  disabled={viewOnlyMode}
                >
                  <FiSettings size={24} />
                </Button>
              </Tooltip>
            )}
          </Box>
        </VStack>
      </Box>
    </>
  );
};

export default NavPanel;

// Add this animation to your globals.css or another suitable place
const spinAnimation = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export { spinAnimation };