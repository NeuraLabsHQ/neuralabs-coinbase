// src/components/access_management/pages/PublishPage.jsx
import React, { useState } from 'react';
import { 
  Box, 
  VStack,
  useColorModeValue,
  Center,
  Button
} from '@chakra-ui/react';
import { FiSend } from 'react-icons/fi';
import PublishModal from '../Popup/PublishModal';
import colors from '../../../color';

const PublishPage = ({ agentData, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  
  const handlePublish = async (publishData) => {
    // The publish logic is handled in FlowActionPanel
    // This is just a wrapper to show the modal
    console.log('Publishing with data:', publishData);
  };
  
  const handleClose = () => {
    setIsModalOpen(false);
    // Navigate back to summary
    window.history.back();
  };

  return (
    <Box p={6} bg={bgColor} h="100%">
      <Center h="100%">
        <VStack spacing={4}>
          <Button
            leftIcon={<FiSend />}
            colorScheme="blue"
            size="lg"
            onClick={() => setIsModalOpen(true)}
          >
            Open Publish Dialog
          </Button>
        </VStack>
      </Center>
      
      <PublishModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onPublish={handlePublish}
      />
    </Box>
  );
};

export default PublishPage;