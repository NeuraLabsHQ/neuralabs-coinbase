// src/components/access_management/FlowCard.jsx - Fixed version
import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Center, 
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Tooltip
} from '@chakra-ui/react';

const FlowCard = ({ flow, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const bgColor = useColorModeValue('white', '#1f1f1f');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.400');
  const iconBgColor = useColorModeValue('blue.500', 'blue.600');
  const iconTextColor = useColorModeValue('white', 'white');
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.500');
  
  // Handle case where flow might be undefined or missing properties
  if (!flow) {
    return null;
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'green';
      case 'not published':
        return 'orange';
      default:
        return 'gray';
    }
  };
  
  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={isHovering ? hoverBorderColor : borderColor}
      overflow="hidden"
      boxShadow="sm"
      transition="all 0.2s ease"
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: 'lg',
        borderColor: hoverBorderColor
      }}
      onClick={onClick}
      cursor="pointer"
      position="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Icon Section */}
      <Center
        bg={iconBgColor}
        h="100px"
        position="relative"
      >
        <Text fontSize="4xl" fontWeight="bold" color={iconTextColor}>
          {flow.icon || flow.name?.charAt(0)?.toUpperCase() || 'F'}
        </Text>
        
        {/* Status Badge */}
        {flow.status && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            colorScheme={getStatusColor(flow.status)}
            size="sm"
            borderRadius="full"
          >
            {flow.status === 'Active' ? 'Published' : flow.status}
          </Badge>
        )}
      </Center>
      
      {/* Content Section */}
      <VStack p={4} align="stretch" spacing={3}>
        {/* Title */}
        <Tooltip label={flow.name} placement="top" hasArrow>
          <Text 
            fontWeight="bold" 
            fontSize="lg" 
            color={textColor}
            noOfLines={1}
          >
            {flow.name || 'Unnamed Flow'}
          </Text>
        </Tooltip>
        
        {/* Description */}
        <Text 
          fontSize="sm" 
          color={subtextColor} 
          minH="40px"
          noOfLines={2}
        >
          {flow.description || 'No description available'}
        </Text>
        
        {/* Metadata */}
        <VStack spacing={2} align="stretch">
          {/* Access Level */}
          {flow.accessLevelName && (
            <HStack justify="space-between">
              <Text fontSize="xs" color={subtextColor}>Access:</Text>
              <Badge size="sm" colorScheme="blue">
                {flow.accessLevelName}
              </Badge>
            </HStack>
          )}
          
          {/* Last Edited Date */}
          {(flow.lastEditedTime || flow.creationDate) && (
            <HStack justify="space-between">
              <Text fontSize="xs" color={subtextColor}>
                {flow.lastEditedTime ? 'Modified:' : 'Created:'}
              </Text>
              <Text fontSize="xs" color={subtextColor}>
                {formatDate(flow.lastEditedTime || flow.creationDate)}
              </Text>
            </HStack>
          )}
        </VStack>
        
        {/* Action Button */}
        <Button 
          size="sm" 
          colorScheme="blue"
          variant={isHovering ? "solid" : "outline"}
          w="100%"
          mt={2}
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick();
          }}
        >
          {isHovering ? 'View Details' : 'Manage'}
        </Button>
      </VStack>
    </Box>
  );
};

export default FlowCard;