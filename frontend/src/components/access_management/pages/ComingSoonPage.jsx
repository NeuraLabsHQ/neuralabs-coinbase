// src/components/access_management/pages/ComingSoonPage.jsx
import React from 'react';
import { 
  Box, 
  Center, 
  VStack, 
  Text, 
  Icon,
  useColorModeValue 
} from '@chakra-ui/react';
import { FiClock } from 'react-icons/fi';
import colors from '../../../color';

const ComingSoonPage = ({ title }) => {
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const mutedColor = useColorModeValue(colors.gray[600], colors.gray[400]);
  
  return (
    <Box bg={bgColor} h="100%">
      <Center h="100%">
        <VStack spacing={4}>
          <Icon 
            as={FiClock} 
            boxSize={16} 
            color={mutedColor}
          />
          <Text 
            fontSize="2xl" 
            fontWeight="bold" 
            color={textColor}
          >
            {title}
          </Text>
          <Text 
            fontSize="lg" 
            color={mutedColor}
          >
            Coming Soon
          </Text>
          <Text 
            fontSize="sm" 
            color={mutedColor}
            textAlign="center"
            maxW="400px"
          >
            This feature is currently under development and will be available in a future update.
          </Text>
        </VStack>
      </Center>
    </Box>
  );
};

export default ComingSoonPage;