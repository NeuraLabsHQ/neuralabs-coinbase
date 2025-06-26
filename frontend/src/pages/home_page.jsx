import { Box, Heading, Text, VStack, Button, Image, useColorModeValue, Flex, useBreakpointValue, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import homepageBackground from '../assets/homepage.png';
import productLight from '../assets/product.jpg';
import productDark from '../assets/product_dark.jpg';
import ParticlesBackground from '../components/common_components/ParticlesBackground';

const HomePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const productImage = useColorModeValue(productLight, productDark);
  const imageFilter = useColorModeValue('none', 'brightness(0.6)');
  const vignetteOpacity = useColorModeValue('0', '0.6');
  
  // Button colors
  const primaryButtonBg = useColorModeValue('black', 'white');
  const primaryButtonText = useColorModeValue('white', 'black');
  const secondaryButtonBorder = useColorModeValue('blue.500', 'blue.300');
  const secondaryButtonText = useColorModeValue('blue.500', 'blue.300');
  const bgColor = useColorModeValue('white', 'black');

  return (
    <Box 
      p={10} 
      h="100%" 
      w="100%" 
      position="relative"
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        // backgroundImage: `url(${homepageBackground})`,
        // backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.6,
        zIndex: -2,
      }}
      _after={{
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: bgColor,
        zIndex: -1,
      }}
    >
      {/* Particles background */}
      <ParticlesBackground />
      
      <Box
        position="absolute"
        top="0"
        right="0"
        bottom="0"
        left="0"
        background="radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.8) 100%)"
        zIndex="-2"
        pointerEvents="none"
      />

      {/* Apply 90% scaling to the entire content */}
      <VStack 
        spacing={7} // Reduced from 8
        maxW="900px" // Reduced from 1000px
        textAlign="center"
        p={9} // Reduced from 10
        borderRadius="xl"
        // boxShadow="xl"
        transform="scale(0.9)"
        transformOrigin="center"
        zIndex={10}
        position="relative"
      >
        <Heading as="h1" size="2xl" color={textColor}>Welcome to Neuralabs</Heading>
        <Text fontSize="lg" color={textColor}> {/* Reduced from xl */}
          Build and manage your workflows, explore marketplace resources, and collaborate with your team through our integrated platform.
        </Text>
        
        <Flex gap={4} justifyContent="center" wrap="wrap">
          <Button 
            size="lg" 
            onClick={() => {
              if (isMobile) {
                toast({
                  title: "Desktop Required",
                  description: "Flow Builder requires a desktop or laptop computer for the best experience.",
                  status: "info",
                  duration: 5000,
                  isClosable: true,
                });
              } else {
                navigate('/flow-builder');
              }
            }}
            bg={primaryButtonBg}
            color={primaryButtonText}
            _hover={{ bg: useColorModeValue('blue.600', 'blue.700') }}
          >
            Start Building
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "The Marketplace feature is currently under development and will be available soon.",
                status: "info",
                duration: 3000,
                isClosable: true,
              });
            }}
            borderColor={secondaryButtonBorder}
            color={secondaryButtonText}
            opacity={0.5}
            cursor="not-allowed"
            _hover={{ 
              opacity: 0.5,
              borderColor: secondaryButtonBorder,
              color: secondaryButtonText
            }}
          >
            Explore Marketplace
          </Button>
        </Flex>
        
        {/* Image with glow effect behind */}
        <Box 
          position="relative" 
          width="100%" 
          mt={3.6} // Reduced from 4
        >
          <Box
            position="absolute"
            top="-5px"
            bottom="-5px"
            left="5"
            right="5"
            boxShadow="0 0 180px 1px rgba(255, 255, 255, 0.2)"
            filter="blur(8px)"
            zIndex="1"
            pointerEvents="none"
          />

          {/* Image container */}
          <Box 
            position="relative"
            borderRadius="md" 
            overflow="hidden"
            boxShadow="lg"
            zIndex="2"
          >
            <Image 
              src={productImage} 
              alt="Product visualization" 
              width="100%" 
              objectFit="contain"
              filter={imageFilter}
            />

            {/* Existing vignette effect */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              boxShadow={`inset 0 0 45px 9px rgba(0,0,0,${vignetteOpacity})`}
              zIndex="3"
              pointerEvents="none"
            />
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default HomePage;