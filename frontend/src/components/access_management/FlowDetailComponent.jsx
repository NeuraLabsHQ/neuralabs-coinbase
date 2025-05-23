// export default FlowDetailComponent;
// src/components/access_management/FlowDetailComponent.jsx
import React from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  VStack,
  Badge,
  Divider,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import { FaTwitter, FaGithub } from "react-icons/fa"; 
import colors from '../../color';

const FlowDetailComponent = ({ flowDetails, onHoverItem, onLeaveItem }) => {
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const bgColor = useColorModeValue("black", "black");
  const sectionTitleColor = useColorModeValue("black", "white");
  const rowBgColor = useColorModeValue("gray.50", "#1e1e1e");
  const tagBgColor = useColorModeValue("gray.600", "gray.600");

  const defaultFlowData = {
    name: "Portfolio Manager",
    description:
      "An AI Blockchain driven portfolio management system that optimizes asset allocation and risk management in Aptos.",
    tags: ["AI", "Blockchain", "Deep Learning"],
    creationDate: "8 day ago (March-16-2025 07:15:39 UTC)",
    owner: "0x22b7e94bb08eb07d59d1a56345e572a5b4409563bc0c0c8fd3eec0ec0bea8d46",
    lastEdited: "0 day ago (March-23-2025 08:42:29 UTC)",
    license: "MIT",
    fork: "Original",
    socials: "X: @harshp_16 | GitHub: harshpoddar03",
    actions: "Edit | Chat | Visualize | Duplicate",
    deploymentStatus: "Active",
    md5: "e67044f2cc088c8f5c359faf3c21e7e1",
    version: "v0.3",
    publishedDate: "0 day ago (March-23-2025 08:42:49 UTC)",
    publishHash:
      "0x1c66d49cc66cdc29d45d93b8388acdd62079cf18713de64a84c5260ed40ba0bb",
    chain: "APTOS Testnet",
    chainId: "0x1",
    chainStatus: "Active",
    chainExplorer: "explorer.aptoslabs.com/?network=testnet",
    contractName: "NeuraSynthesis",
    contractVersion: "v0.01",
    contractId:
      "0x48b3475fd2c5d2ae55b80154ea006e6ed6ffb78c8e7dbfd14288168d7da3f7e6",
    nftId: "NFT-001",
    nftMintHash:
      "0x20dd388a619f40aaabc36da3314278d0ad763ceb814d838e9853cbe944159af3",
    myAccess: "Level 6",
    noOfAccess: "2",
    monetization: "None",
  };

  // Define tooltips for each key (excluding name, description, tags)
  const tooltips = {
    creationDate: "Date when the workflow was first created",
    owner: "The blockchain address of the workflow owner",
    lastEdited: "Date when the workflow was last modified",
    license: "The licensing terms under which the workflow is distributed",
    fork: "Indicates if this is an original workflow or forked from another",
    socials: "Social media and GitHub handles of the creator",
    actions: "Available actions to interact with the workflow",
    deploymentStatus: "Current deployment status of the workflow",
    md5: "MD5 hash of the workflow for integrity verification",
    version: "Current version of the workflow",
    publishedDate: "Date when the workflow was published",
    publishHash: "Blockchain hash of the published workflow",
    chain: "Blockchain network on which the workflow is deployed",
    chainId: "Unique identifier of the blockchain network",
    chainStatus: "Current status of the blockchain network",
    chainExplorer: "Link to the blockchain explorer for the network",
    contractName: "Name of the smart contract associated with the workflow",
    contractVersion: "Version of the smart contract",
    contractId: "Unique identifier of the smart contract",
    nftId: "Identifier of the NFT associated with the workflow",
    nftMintHash: "Blockchain hash of the NFT minting transaction",
    myAccess: "Your access level to the workflow",
    noOfAccess: "Number of users with access to the workflow",
    monetization: "Monetization status or strategy of the workflow",
  };

  const data = flowDetails || defaultFlowData;

  const handleHover = (itemKey) => {
    if (onHoverItem) {
      onHoverItem(itemKey);
    }
  };

  const handleLeave = () => {
    if (onLeaveItem) {
      onLeaveItem();
    }
  };

  // Helper function to render field with tooltip
  const renderField = (key, label) => (
    <Flex
      w="100%"
      align="start"
      key={key}
      onMouseEnter={() => handleHover(key)}
      onMouseLeave={handleLeave}
    >
      <Flex align="center" w="180px">
        {tooltips[key] && (
          <Tooltip
            label={tooltips[key]}
            placement="top"
            maxW="200px"
            hasArrow
            fontSize="xs"
            bg="gray.700"
            color="white"
          >
            <InfoIcon
              boxSize="14px"
              color={mutedTextColor}
              cursor="help"
              opacity={0.7}
              mr={2}
              _hover={{ opacity: 1 }}
            />
          </Tooltip>
        )}
        <Text fontWeight="medium" color={mutedTextColor}>
          {label}
        </Text>
      </Flex>
      <Text color={textColor}>{data[key]}</Text>
    </Flex>
  );

  return (
    <Box>
      <Heading
        as="h1"
        size="xl"
        color={textColor}
        mb={4}
        onMouseEnter={() => handleHover("flowName")}
        onMouseLeave={handleLeave}
      >
        {data.name}
      </Heading>

      <Heading
        as="h2"
        size="md"
        color={sectionTitleColor}
        mb={3}
        onMouseEnter={() => handleHover("generalWorkflow")}
        onMouseLeave={handleLeave}
      >
        Workflow Summary
      </Heading>

      <VStack align="start" spacing={3} mb={4}>
        <Flex
          w="100%"
          onMouseEnter={() => handleHover("description")}
          onMouseLeave={handleLeave}
        >
          <Text fontWeight="medium" mr={2} color={mutedTextColor}>
            Description:
          </Text>
          <Text color={textColor}>{data.description}</Text>
        </Flex>

        <Flex
          w="100%"
          onMouseEnter={() => handleHover("tags")}
          onMouseLeave={handleLeave}
          align="center"
        >
          <Text fontWeight="medium" mr={2} color={mutedTextColor}>
            Tags:
          </Text>
          <Flex gap={2} wrap="wrap">
            {data.tags && Array.isArray(data.tags) && data.tags.length > 0 ? (
              data.tags.map((tag, index) => (
                <Badge
                  key={index}
                  bg={tagBgColor}
                  color="white"
                  px={2}
                  py={1}
                  borderRadius="md"
                  textTransform="uppercase"
                  fontSize="xs"
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <Text color={mutedTextColor} fontSize="sm">No tags</Text>
            )}
          </Flex>
        </Flex>
      </VStack>

      {/* Creation & Related Info Section */}
      <Box w="100%" py={3} px={4} bg={rowBgColor} borderRadius="md" mb={3}>
        <VStack align="start" spacing={4}>
          {/* Creation Details */}
          <VStack align="start" spacing={2} w="100%">
            {renderField("creationDate", "Creation Date:")}
            {renderField("owner", "Owner:")}
            {renderField("lastEdited", "Last Edited:")}
          </VStack>

          <Divider borderColor={colors.gray[600]} />

          {/* License Info */}
          <VStack align="start" spacing={2} w="100%">
            {renderField("license", "License:")}
            {renderField("fork", "Fork of:")}
          </VStack>

          <Divider borderColor={colors.gray[600]} />

          {/* Socials */}
          {renderField("socials", "Socials:")}

          <Divider borderColor={colors.gray[600]} />

          {/* Actions */}
          {renderField("actions", "Actions:")}
        </VStack>
      </Box>

      <Divider my={4} borderColor={colors.gray[600]} />

      {/* Deployment Summary Section */}
      <Heading
        as="h2"
        size="md"
        color={sectionTitleColor}
        mb={3}
        onMouseEnter={() => handleHover("deploymentSummary")}
        onMouseLeave={handleLeave}
      >
        Deployment Summary
      </Heading>

      <Box w="100%" py={3} px={4} bg={rowBgColor} borderRadius="md" mb={3}>
        <VStack align="start" spacing={4}>
          {/* Deployment Details */}
          <VStack align="start" spacing={2} w="100%">
            {renderField("deploymentStatus", "Status:")}
            {renderField("md5", "MD5:")}
            {renderField("version", "Version:")}
            {renderField("publishedDate", "Published Date:")}
            {renderField("publishHash", "Publish Hash:")}
          </VStack>

          <Divider borderColor={colors.gray[600]} />

          {/* Chain Info */}
          <VStack align="start" spacing={2} w="100%">
            {renderField("chain", "Chain:")}
            {renderField("chainId", "Chain ID:")}
            {renderField("chainStatus", "Chain Status:")}
            {renderField("chainExplorer", "Chain Explorer:")}
          </VStack>

          <Divider borderColor={colors.gray[600]} />

          {/* Contract Info */}
          <VStack align="start" spacing={2} w="100%">
            {renderField("contractName", "Contract Name:")}
            {renderField("contractVersion", "Contract Version:")}
            {renderField("contractId", "Contract ID:")}
          </VStack>

          <Divider borderColor={colors.gray[600]} />

          {/* NFT Info */}
          <VStack align="start" spacing={2} w="100%">
            {renderField("nftId", "NFT ID:")}
            {renderField("nftMintHash", "NFT Mint Hash:")}
            {renderField("myAccess", "My Access:")}
            {renderField("noOfAccess", "No of Access:")}
          </VStack>

          <Divider borderColor={colors.gray[600]} />

          {/* Monetization */}
          {renderField("monetization", "Monetization:")}
        </VStack>
      </Box>
    </Box>
  );
};

export default FlowDetailComponent;