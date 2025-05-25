// src/components/flow_builder/VisualizePanel/ExportModal.jsx
import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiImage, FiFileText, FiCode } from "react-icons/fi";

const ExportModal = ({ isOpen, onClose, onExportFlow, onExportFlowJSON, onExportFlowYAML }) => {
  const bgColor = useColorModeValue("white", "#18191b");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const buttonBgColor = useColorModeValue("gray.700", "gray.700");
  const buttonHoverBgColor = useColorModeValue("gray.700", "gray.600");
  const linkColor = useColorModeValue("blue.500", "blue.400");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor} borderRadius="md">
        <ModalHeader fontSize="lg" fontWeight="bold">
          Export Flow
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Prerequisites Section */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={1}>
                Prerequisites
              </Text>
              <Text fontSize="xs" color={mutedTextColor}>
                Exporting your flow requires sufficient permissions and access to
                the project. Ensure you have the necessary rights to export data.
                More information can be found in the{" "}
                <Text as="span" color={linkColor} textDecor="underline">
                  documentation
                </Text>
                .
              </Text>
            </Box>

            {/* Disclaimer Section */}
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={1}>
                Disclaimer
              </Text>
              <Text fontSize="xs" color={mutedTextColor}>
                Exported flows may contain sensitive data. Ensure you handle the
                exported files securely and share them only with authorized
                parties.
              </Text>
            </Box>

            {/* Export Options */}
            <Box>
              <Text fontSize="xs" color={mutedTextColor} mb={2}>
                Select an export format below.
              </Text>
              <VStack spacing={2}>
                <Button
                  leftIcon={<FiImage />}
                  width="100%"
                  size="sm"
                  bg={buttonBgColor}
                  borderColor={buttonBgColor}
                  _hover={{ bg: buttonHoverBgColor }}
                  onClick={() => {
                    onExportFlow();
                    onClose();
                  }}
                >
                  Export as PNG
                </Button>
                <Button
                  leftIcon={<FiFileText />}
                  width="100%"
                  size="sm"
                  bg={buttonBgColor}
                  borderColor={buttonBgColor}
                  _hover={{ bg: buttonHoverBgColor }}
                  onClick={() => {
                    onExportFlowJSON();
                    onClose();
                  }}
                >
                  Export as JSON
                </Button>
                <Button
                  leftIcon={<FiCode />}
                  width="100%"
                  size="sm"
                  bg={buttonBgColor}
                  borderColor={buttonBgColor}
                  _hover={{ bg: buttonHoverBgColor }}
                  onClick={() => {
                    onExportFlowYAML();
                    onClose();
                  }}
                  mb={4}
                >
                  Export as YAML
                </Button>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        {/* <ModalFooter>
          <Button
            variant="outline"
            colorScheme="gray"
            mr={3}
            onClick={onClose}
            size="sm"
          >
            Cancel
          </Button>
        </ModalFooter> */}
      </ModalContent>
    </Modal>
  );
};

export default ExportModal;