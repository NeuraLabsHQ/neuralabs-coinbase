import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Text,
  useColorModeValue,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { FiArrowRight } from 'react-icons/fi';

const ConnectionsListPopup = ({ 
  isOpen, 
  onClose, 
  node,
  nodes = [],
  edges = [],
  onConnectionClick
}) => {
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const headerBg = useColorModeValue('gray.800', 'gray.800');
  const rowHoverBg = useColorModeValue('gray.800', 'gray.800');
  const textColor = useColorModeValue('white', 'white');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.400');

  if (!node) return null;

  // Find all incoming connections to this node
  const incomingConnections = edges.filter(edge => edge.target === node.id);
  
  // Map connections to include source node information
  const connectionsWithNodes = incomingConnections.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    return {
      edge,
      sourceNode,
      targetNode: node
    };
  });

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl"
      blockScrollOnMount={false}
      preserveScrollBarGap={true}
      returnFocusOnClose={false}
      isCentered
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
      <ModalContent bg={bgColor}>
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} color={textColor}>
          <Text>Incoming Connections to {node.name}</Text>
        </ModalHeader>
        
        <ModalBody py={6}>
          {connectionsWithNodes.length > 0 ? (
            <TableContainer>
              <Table variant="unstyled" size="sm">
                <Thead>
                  <Tr>
                    <Th color={mutedTextColor} fontSize="xs" textTransform="uppercase">FROM BLOCK</Th>
                    <Th></Th>
                    <Th color={mutedTextColor} fontSize="xs" textTransform="uppercase">TO BLOCK</Th>
                    <Th color={mutedTextColor} fontSize="xs" textTransform="uppercase">MAPPINGS</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {connectionsWithNodes.map(({ edge, sourceNode }) => (
                    <Tr 
                      key={edge.id}
                      cursor="pointer"
                      _hover={{ bg: rowHoverBg }}
                      onClick={() => {
                        onConnectionClick(edge);
                        onClose();
                      }}
                    >
                      <Td color={textColor}>
                        <HStack spacing={2}>
                          <Badge 
                            colorScheme="gray" 
                            variant="subtle"
                            size="sm"
                          >
                            {sourceNode?.type || 'Unknown'}
                          </Badge>
                          <Text>{sourceNode?.name || 'Unknown Node'}</Text>
                        </HStack>
                      </Td>
                      <Td width="10">
                        <FiArrowRight color={mutedTextColor} />
                      </Td>
                      <Td color={textColor}>
                        <HStack spacing={2}>
                          <Badge 
                            colorScheme="gray" 
                            variant="subtle"
                            size="sm"
                          >
                            {node.type}
                          </Badge>
                          <Text>{node.name}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={edge.mappings?.length > 0 ? 'green' : 'yellow'}
                          variant="subtle"
                        >
                          {edge.mappings?.length || 0} mapped
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={8}>
              <Text color={mutedTextColor}>
                No incoming connections to this block.
              </Text>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" onClick={onClose} color={textColor}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConnectionsListPopup;