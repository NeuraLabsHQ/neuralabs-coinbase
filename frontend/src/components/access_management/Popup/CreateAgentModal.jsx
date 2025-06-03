// src/components/access_management/Popup/CreateAgentModal.jsx
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Tag,
    TagCloseButton,
    TagLabel,
    Text,
    Textarea,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { useState, useEffect } from 'react';
import { FiPlus, FiX } from "react-icons/fi";

const CreateAgentModal = ({ isOpen, onClose, onCreateAgent }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "development",
  });
  
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  
  const [socials, setSocials] = useState([{ platform: "", url: "" }]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Color mode values
  const bgColor = useColorModeValue('white', '#18191b');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.600');
  const readOnlyBgColor = useColorModeValue('gray.100', 'gray.700');
  const readOnlyBorderColor = useColorModeValue('gray.200', 'gray.500');
  const readOnlyTextColor = useColorModeValue('gray.500', 'gray.300');
  const sectionBgColor = useColorModeValue('white', '#18191b');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags(prev => [...prev, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addSocialField = () => {
    setSocials(prev => [...prev, { platform: "", url: "" }]);
  };

  const removeSocialField = (index) => {
    setSocials(prev => prev.filter((_, i) => i !== index));
  };

  const updateSocialField = (index, field, value) => {
    setSocials(prev => prev.map((social, i) => 
      i === index ? { ...social, [field]: value } : social
    ));
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      // Filter out empty socials and convert to object format
      const validSocials = socials
        .filter(social => social.platform && social.url)
        .reduce((acc, social) => {
          acc[social.platform] = social.url;
          return acc;
        }, {});

      // Convert tags array to object format (category, type format)
      const tagsObject = tags.reduce((acc, tag, index) => {
        if (index === 0) acc.category = tag;
        else if (index === 1) acc.type = tag;
        else acc[`tag${index + 1}`] = tag;
        return acc;
      }, {});

      const agentData = {
        name: formData.name,
        description: formData.description,
        tags: tagsObject,
        license: "MIT", // Fixed value
        socials: validSocials
      };

      await onCreateAgent(agentData);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to create agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "development",
    });
    setTags([]);
    setCurrentTag("");
    setSocials([{ platform: "", url: "" }]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isFormValid = formData.name.trim() && formData.description.trim();

  // State for mobile detection with resize listener
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const checkMobile = () => window.innerWidth < 768;
      setIsMobile(checkMobile());
      
      const handleResize = () => setIsMobile(checkMobile());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      isCentered={!isMobile}
      size={isMobile ? "full" : "lg"}
    >
      <ModalOverlay />
      <ModalContent 
        bg={bgColor} 
        color={textColor} 
        borderRadius={isMobile ? "none" : "md"} 
        maxW={isMobile ? "100%" : "600px"}
        h={isMobile ? "100vh" : "auto"}
        m={isMobile ? 0 : undefined}
      >
        <ModalHeader 
          fontSize="lg" 
          fontWeight="bold"
          p={isMobile ? 4 : 6}
        >
          Create New Agent
        </ModalHeader>
        <ModalBody 
          p={isMobile ? 4 : 6}
          overflowY={isMobile ? "auto" : "visible"}
          flex="1"
        >
          <VStack spacing={4} align="stretch">
            {/* Prerequisites Section */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={1} color={textColor}>
                Agent Details
              </Text>
              <Text fontSize="xs" color={mutedTextColor}>
                Create a new agent that will be deployed on the SUI network. 
                Fill in the required information to get started with your workflow.
              </Text>
            </Box>

            {/* Form Fields */}
            <Box>
              <FormControl mb={3} isRequired>
                <FormLabel fontSize="sm" color={textColor}>Agent Name</FormLabel>
                <Input
                  placeholder="Enter agent name"
                  size="sm"
                  bg={inputBgColor}
                  borderColor={inputBorderColor}
                  color={textColor}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  _placeholder={{ color: mutedTextColor }}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                />
              </FormControl>

              <FormControl mb={3} isRequired>
                <FormLabel fontSize="sm" color={textColor}>Description</FormLabel>
                <Textarea
                  placeholder="Enter agent description"
                  size="sm"
                  bg={inputBgColor}
                  borderColor={inputBorderColor}
                  color={textColor}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  _placeholder={{ color: mutedTextColor }}
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                />
              </FormControl>

              {/* Tags Section */}
              <FormControl mb={3}>
                <FormLabel fontSize="sm" color={textColor}>Tags</FormLabel>
                <Box>
                  <Input
                    placeholder="Type tag and press Enter"
                    size="sm"
                    bg={inputBgColor}
                    borderColor={inputBorderColor}
                    color={textColor}
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    mb={2}
                    _placeholder={{ color: mutedTextColor }}
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                  />
                  <Flex wrap="wrap" gap={2}>
                    {tags.map((tag, index) => (
                      <Tag key={index} size="sm" colorScheme="blue" variant="solid">
                        <TagLabel>{tag}</TagLabel>
                        <TagCloseButton onClick={() => removeTag(tag)} />
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              </FormControl>

              {/* Socials Section */}
              <FormControl mb={3}>
                <Flex justify="space-between" align="center" mb={2}>
                  <FormLabel fontSize="sm" mb={0} color={textColor}>Social Media</FormLabel>
                  <IconButton
                    icon={<FiPlus />}
                    size="xs"
                    colorScheme="blue"
                    onClick={addSocialField}
                    aria-label="Add social media"
                  />
                </Flex>
                <VStack spacing={2}>
                  {socials.map((social, index) => (
                    <HStack key={index} w="100%">
                      <Select
                        placeholder="Platform"
                        size="sm"
                        bg={inputBgColor}
                        borderColor={inputBorderColor}
                        color={textColor}
                        value={social.platform}
                        onChange={(e) => updateSocialField(index, 'platform', e.target.value)}
                        w="30%"
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                      >
                        <option value="twitter">Twitter</option>
                        <option value="github">GitHub</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="discord">Discord</option>
                        <option value="telegram">Telegram</option>
                      </Select>
                      <Input
                        placeholder="URL or handle"
                        size="sm"
                        bg={inputBgColor}
                        borderColor={inputBorderColor}
                        color={textColor}
                        value={social.url}
                        onChange={(e) => updateSocialField(index, 'url', e.target.value)}
                        flex="1"
                        _placeholder={{ color: mutedTextColor }}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                      />
                      {socials.length > 1 && (
                        <IconButton
                          icon={<FiX />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeSocialField(index)}
                          aria-label="Remove social media"
                        />
                      )}
                    </HStack>
                  ))}
                </VStack>
              </FormControl>

              {/* Read-only fields */}
              <VStack spacing={3} borderRadius="md" bg={sectionBgColor}>
                
                <FormControl>
                  <FormLabel fontSize="sm" color={textColor}>License</FormLabel>
                  <Input
                    value="MIT"
                    size="sm"
                    bg={readOnlyBgColor}
                    // borderColor={readOnlyBorderColor}
                    color={readOnlyTextColor}
                    isReadOnly
                    cursor="not-allowed"
                    _focus={{ borderColor: readOnlyBorderColor, boxShadow: "none" }}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm" color={textColor}>Fork</FormLabel>
                  <Input
                    value="Original"
                    size="sm"
                    bg={readOnlyBgColor}
                    // borderColor={readOnlyBorderColor}
                    color={readOnlyTextColor}
                    isReadOnly
                    cursor="not-allowed"
                    _focus={{ borderColor: readOnlyBorderColor, boxShadow: "none" }}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm" color={textColor}>Chain ID</FormLabel>
                  <Input
                    value="101"
                    size="sm"
                    bg={readOnlyBgColor}
                    // borderColor={readOnlyBorderColor}
                    color={readOnlyTextColor}
                    isReadOnly
                    cursor="not-allowed"
                    _focus={{ borderColor: readOnlyBorderColor, boxShadow: "none" }}
                  />
                </FormControl>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter 
          p={isMobile ? 4 : 6}
          flexDirection={isMobile ? "column" : "row"}
          gap={isMobile ? 3 : 0}
        >
          <Button
            variant="outline"
            colorScheme="gray"
            mr={isMobile ? 0 : 3}
            onClick={handleClose}
            size="sm"
            w={isMobile ? "100%" : "auto"}
            order={isMobile ? 2 : 1}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleCreate} 
            size="sm"
            isLoading={isLoading}
            loadingText="Creating..."
            isDisabled={!isFormValid}
            w={isMobile ? "100%" : "auto"}
            order={isMobile ? 1 : 2}
          >
            Create Agent
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateAgentModal;