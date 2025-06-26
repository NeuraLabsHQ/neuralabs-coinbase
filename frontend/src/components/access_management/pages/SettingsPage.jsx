// src/components/access_management/pages/SettingsPage.jsx
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputLeftAddon,
    Select,
    Tag,
    TagCloseButton,
    TagLabel,
    Textarea,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiGithub, FiGlobe, FiLinkedin, FiSave, FiTwitter } from 'react-icons/fi';
import colors from '../../../color';
import { agentAPI } from '../../../utils/agent-api';

const SettingsPage = ({ agentData, onUpdate }) => {
  // Helper function to convert tags object to array
  const tagsToArray = (tags) => {
    if (Array.isArray(tags)) {
      return tags;
    } else if (tags && typeof tags === 'object') {
      // Convert object to array, sorting by keys
      return Object.keys(tags).sort((a, b) => parseInt(a) - parseInt(b)).map(key => tags[key]);
    }
    return [];
  };

  const [formData, setFormData] = useState({
    name: agentData.name || '',
    description: agentData.description || '',
    license: agentData.license || 'MIT',
    tags: tagsToArray(agentData.tags),
    socials: {
      twitter: agentData.socials?.twitter || '',
      github: agentData.socials?.github || '',
      linkedin: agentData.socials?.linkedin || '',
      website: agentData.socials?.website || '',
      discord: agentData.socials?.discord || '',
      telegram: agentData.socials?.telegram || ''

    }
  });
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();
  
  const bgColor = useColorModeValue(colors.accessManagement.mainContent.bg.light, colors.accessManagement.mainContent.bg.dark);
  const cardBg = useColorModeValue(colors.accessManagement.flowCard.bg.light, colors.accessManagement.flowCard.bg.dark);
  const borderColor = useColorModeValue(colors.accessManagement.flowCard.border.light, colors.accessManagement.flowCard.border.dark);
  const textColor = useColorModeValue(colors.gray[800], colors.gray[100]);
  const inputBg = useColorModeValue(colors.gray[50], colors.gray[800]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSocialChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [platform]: value
      }
    }));
  };
  
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!formData.tags.includes(newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
        }));
      }
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Convert tags array to object format expected by backend
      const tagsObject = formData.tags.reduce((acc, tag, index) => {
        acc[index.toString()] = tag;
        return acc;
      }, {});
      
      // Prepare data for API call
      const updateData = {
        ...formData,
        tags: tagsObject,
        chain_id: agentData.chain_id ||  84532 // Include chain_id from agentData
      };
      
      // Call the API to update agent settings
      await agentAPI.updateAgent(agentData.agent_id, updateData);
      
      // Update parent component with the new data
      onUpdate({
        ...agentData,
        ...formData
      });
      
      toast({
        title: 'Settings Updated',
        description: 'Your agent settings have been saved successfully.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={6} bg={bgColor} h="100%" overflow="auto">
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Heading size="lg" color={textColor}>
            Agent Settings
          </Heading>
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            size="sm"
            onClick={handleSave}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </HStack>
        
        {/* Basic Information */}
        <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
          <Heading size="md" mb={4} color={textColor}>
            Basic Information
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Agent Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter agent name"
                bg={inputBg}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter agent description"
                rows={4}
                bg={inputBg}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>License</FormLabel>
              <Select
                value={formData.license}
                onChange={(e) => handleInputChange('license', e.target.value)}
                bg={inputBg}
              >
                <option value="MIT">MIT License</option>
                <option value="Apache-2.0">Apache License 2.0</option>
                <option value="GPL-3.0">GPL v3.0</option>
                <option value="BSD-3-Clause">BSD 3-Clause</option>
                <option value="Proprietary">Proprietary</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Tags</FormLabel>
              <VStack align="stretch">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleAddTag}
                  placeholder="Add a tag and press Enter"
                  bg={inputBg}
                />
                <HStack wrap="wrap" spacing={2}>
                  {formData.tags.map((tag, index) => (
                    <Tag
                      key={index}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme="blue"
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                    </Tag>
                  ))}
                </HStack>
              </VStack>
            </FormControl>
          </VStack>
        </Box>
        
        {/* Social Links */}
        <Box bg={cardBg} p={6} borderRadius="md" border="1px" borderColor={borderColor}>
          <Heading size="md" mb={4} color={textColor}>
            Social Links
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Twitter</FormLabel>
              <InputGroup>
                <InputLeftAddon>
                  <FiTwitter />
                </InputLeftAddon>
                <Input
                  value={formData.socials.twitter}
                  onChange={(e) => handleSocialChange('twitter', e.target.value)}
                  placeholder="@username"
                  bg={inputBg}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>GitHub</FormLabel>
              <InputGroup>
                <InputLeftAddon>
                  <FiGithub />
                </InputLeftAddon>
                <Input
                  value={formData.socials.github}
                  onChange={(e) => handleSocialChange('github', e.target.value)}
                  placeholder="username"
                  bg={inputBg}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>LinkedIn</FormLabel>
              <InputGroup>
                <InputLeftAddon>
                  <FiLinkedin />
                </InputLeftAddon>
                <Input
                  value={formData.socials.linkedin}
                  onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  bg={inputBg}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>Website</FormLabel>
              <InputGroup>
                <InputLeftAddon>
                  <FiGlobe />
                </InputLeftAddon>
                <Input
                  value={formData.socials.website}
                  onChange={(e) => handleSocialChange('website', e.target.value)}
                  placeholder="https://example.com"
                  bg={inputBg}
                />
              </InputGroup>
            </FormControl>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SettingsPage;