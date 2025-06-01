import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import SUIToWALConverter from '../../../lib/blockchain_module/pages/SUIToWALConverter';
import colors from '../../../color';

const SwapPage = () => {
  const account = useCurrentAccount();
  
  const bgColor = useColorModeValue(colors.gray[50], colors.gray[900]);
  const cardBg = useColorModeValue('white', colors.gray[800]);
  const borderColor = useColorModeValue(colors.gray[200], colors.gray[700]);

  return (
    <Flex flex="1" h="100%" overflow="auto" direction="column">
      <Box 
        p={8} 
        bg={bgColor}
        minH="100%"
      >
        <Box
          maxW="4xl"
          mx="auto"
          bg={cardBg}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          p={8}
          boxShadow="sm"
        >
          {account ? (
            <SUIToWALConverter />
          ) : (
            <Flex 
              direction="column" 
              align="center" 
              justify="center" 
              minH="400px"
              textAlign="center"
            >
              <Text fontSize="lg" color={colors.gray[600]} mb={2}>
                Please connect your wallet to use the SUI to WAL converter.
              </Text>
              <Text fontSize="sm" color={colors.gray[500]}>
                You need to connect a wallet to swap tokens.
              </Text>
            </Flex>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default SwapPage;