import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import InteractivePublish from '../InteractivePublish';
import colors from '../../../color';

const InteractivePublishPage = ({ agentData, onComplete }) => {
  const bgColor = useColorModeValue(
    colors.accessManagement.mainContent.bg.light,
    colors.accessManagement.mainContent.bg.dark
  );

  const handleComplete = () => {
    // Navigate back to summary page after successful publish
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Box
      w="100%"
      h="100%"
      bg={bgColor}
      overflow="hidden"
      position="relative"
    >
      <InteractivePublish 
        agentData={agentData} 
        onComplete={handleComplete}
      />
    </Box>
  );
};

export default InteractivePublishPage;