import { Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, useBreakpointValue, Box, useColorModeValue } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import NavPanel from '../common_components/NavPanel/NavelPanel';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Responsive values
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const navWidth = useBreakpointValue({ base: '280px', lg: '80px' });
  
  // Background color for mobile header
  const mobileBg = useColorModeValue('transparent', '#0A0C0F');
  
  // Navigate to different sections of the app
  const handleNavigation = (route) => {
    if (route !== location.pathname) {
      navigate(route);
      // Close drawer on mobile after navigation
      if (isMobile) {
        onClose();
      }
    }
  };

  return (
    <Flex className="app" h="100vh" w="100vw" overflow="hidden">
      {/* Desktop Navigation Panel */}
      {!isMobile && (
        <NavPanel 
          onNavigate={handleNavigation}
          currentPath={location.pathname}
          isMobile={false}
        />
      )}
      
      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <Drawer
          isOpen={isOpen}
          placement="left"
          onClose={onClose}
          size="xs"
        >
          <DrawerOverlay />
          <DrawerContent maxW={navWidth}>
            <DrawerCloseButton />
            <NavPanel 
              onNavigate={handleNavigation}
              currentPath={location.pathname}
              isMobile={true}
              onClose={onClose}
            />
          </DrawerContent>
        </Drawer>
      )}
      
      {/* Main Content Area */}
      <Flex flex="1" overflow="auto" position="relative" direction="column">
        {/* Mobile Header with Menu Button */}
        {isMobile && (
          <Box 
            position="relative" 
            pt={4}
            pr={4}
            pl={4}
            // pb={0} 
            zIndex={10}
            bg={mobileBg}
          >
            <IconButton
              icon={<FiMenu size={24} />}
              onClick={onOpen}
              variant="ghost"
              aria-label="Open navigation menu"
              colorScheme="gray"
              size="lg"
            />
          </Box>
        )}
        
        {/* Page Content */}
        <Box flex="1" overflow="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;