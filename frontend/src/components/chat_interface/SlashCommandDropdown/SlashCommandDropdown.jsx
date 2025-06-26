import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { 
  FiUser, 
  FiTrash2, 
  FiHelpCircle, 
  FiSettings, 
  FiDownload 
} from "react-icons/fi";
import { useColorModeValue } from "@chakra-ui/react";
import colors from "../../../color";

const SLASH_COMMANDS = [
  {
    id: 'agent',
    name: '/agent',
    description: 'Select an AI agent to chat with',
    icon: FiUser,
    action: 'select-agent'
  },
  {
    id: 'clear',
    name: '/clear',
    description: 'Clear the current conversation',
    icon: FiTrash2,
    action: 'clear-chat'
  },
  {
    id: 'help',
    name: '/help',
    description: 'Show available commands',
    icon: FiHelpCircle,
    action: 'show-help'
  },
  {
    id: 'settings',
    name: '/settings',
    description: 'Open chat settings',
    icon: FiSettings,
    action: 'open-settings'
  },
  {
    id: 'export',
    name: '/export',
    description: 'Export conversation history',
    icon: FiDownload,
    action: 'export-chat'
  }
];

const SlashCommandDropdown = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  position = 'above',
  width,
  searchTerm = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);

  // Colors
  const bgPrimary = useColorModeValue(colors.chat.bgPrimary.light, colors.chat.bgPrimary.dark);
  const bgSecondary = useColorModeValue(colors.chat.bgSecondary.light, colors.chat.bgSecondary.dark);
  const bgHover = useColorModeValue(colors.chat.bgHover.light, colors.chat.bgHover.dark);
  const textPrimary = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const textSecondary = useColorModeValue(colors.chat.textSecondary.light, colors.chat.textSecondary.dark);
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);

  // Filter commands based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = SLASH_COMMANDS.filter(cmd => 
        cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCommands(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredCommands(SLASH_COMMANDS);
      setSelectedIndex(0);
    }
  }, [searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <Box
      position="absolute"
      left={0}
      right={0}
      width={width || "100%"}
      bg={bgSecondary}
      borderRadius="md"
      boxShadow="lg"
      border="1px solid"
      borderColor={borderColor}
      zIndex={1000}
      maxH="300px"
      overflowY="auto"
      {...(position === 'above' ? {
        bottom: "100%",
        mb: 2
      } : {
        top: "100%",
        mt: 2
      })}
    >
      <VStack align="stretch" spacing={0} p={2}>
        {filteredCommands.map((command, index) => {
          const Icon = command.icon;
          const isSelected = index === selectedIndex;
          
          return (
            <Flex
              key={command.id}
              align="center"
              justify="space-between"
              p={3}
              borderRadius="md"
              cursor="pointer"
              bg={isSelected ? bgHover : "transparent"}
              _hover={{ bg: bgHover }}
              onClick={() => onSelect(command)}
              transition="all 0.2s"
            >
              <Flex align="center" gap={3}>
                <Icon size={18} color={textSecondary} />
                <Text
                  fontWeight="medium"
                  color={textPrimary}
                  fontSize="sm"
                >
                  {command.name}
                </Text>
              </Flex>
              <Text
                color={textSecondary}
                fontSize="sm"
                ml={4}
                textAlign="right"
                maxW="60%"
                noOfLines={1}
              >
                {command.description}
              </Text>
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
};

export default SlashCommandDropdown;