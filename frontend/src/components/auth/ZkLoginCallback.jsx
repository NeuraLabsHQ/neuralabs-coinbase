// frontend/src/components/auth/ZkLoginCallback.jsx

import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Flex,
    Spinner,
    Text,
    useColorModeValue,
    VStack,
    useDisclosure
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZkLogin } from '../../contexts/ZkLoginContext';
import MessageSigningPopup from './MessageSigningPopup';

const ZkLoginCallback = () => {
  const navigate = useNavigate();
  const { completeZkLogin } = useZkLogin();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [signingData, setSigningData] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [idToken, setIdToken] = useState(null);
  
  const bgColor = useColorModeValue('white', '#1A202C');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    // Only run once when component mounts
    if (status !== 'loading') return;
    
    const processCallback = async () => {
      try {
        // Get id_token from URL
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const token = urlParams.get('id_token');
        
        if (!token) {
          throw new Error('No ID token found in the URL');
        }
        
        setIdToken(token);
        
        // First, prepare the login without signing
        const prepResult = await completeZkLogin(token, false);
        
        if (prepResult.needsSignature) {
          // Store the signing data and show popup
          setSigningData({
            email: prepResult.email,
            timestamp: prepResult.timestamp,
            address: prepResult.address
          });
          setStatus('awaiting-signature');
          onOpen();
        }
      } catch (err) {
        console.error('Error processing zkLogin callback:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };
    
    processCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount
  
  const handleSign = async () => {
    try {
      setStatus('signing');
      onClose();
      
      // Complete the login with signature
      await completeZkLogin(idToken, true);
      
      setStatus('success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/access-management');
      }, 1500);
    } catch (err) {
      console.error('Error during signing:', err);
      setError(err.message || 'Signing failed');
      setStatus('error');
    }
  };
  
  const handleReject = () => {
    onClose();
    setError('Authentication cancelled by user');
    setStatus('error');
  };
  
  return (
    <>
      <Flex 
        width="100%" 
        height="100vh" 
        alignItems="center" 
        justifyContent="center"
        bg={useColorModeValue('gray.50', 'gray.900')}
      >
        <Box 
          w="md" 
          p={8} 
          borderWidth="1px" 
          borderRadius="lg" 
          boxShadow="lg"
          bg={bgColor}
          borderColor={borderColor}
        >
          <VStack spacing={6}>
            {(status === 'loading' || status === 'awaiting-signature') && (
              <>
                <Spinner 
                  size="xl" 
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="blue.500"
                />
                <Text fontSize="lg" fontWeight="medium">
                  Completing Authentication...
                </Text>
                <Text fontSize="sm" color="gray.500">
                  We're setting up your zkLogin. This might take a few moments.
                </Text>
              </>
            )}
            
            {status === 'signing' && (
              <>
                <Spinner 
                  size="xl" 
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="blue.500"
                />
                <Text fontSize="lg" fontWeight="medium">
                  Signing Message...
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Please wait while we complete the authentication.
                </Text>
              </>
            )}
            
            {status === 'success' && (
              <Alert
                status="success"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                height="200px"
                borderRadius="md"
              >
                <AlertIcon boxSize="40px" mr={0} mb={4} />
                <AlertTitle mb={1} fontSize="lg">
                  Authentication Successful!
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  Your zkLogin was successful. Redirecting you to the dashboard...
                </AlertDescription>
              </Alert>
            )}
            
            {status === 'error' && (
              <Alert
                status="error"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                height="200px"
                borderRadius="md"
              >
                <AlertIcon boxSize="40px" mr={0} mb={4} />
                <AlertTitle mb={1} fontSize="lg">
                  Authentication Failed
                </AlertTitle>
                <AlertDescription maxWidth="sm" mb={4}>
                  {error || 'An error occurred during the zkLogin process.'}
                </AlertDescription>
                <Button colorScheme="red" onClick={() => navigate('/')}>
                  Return to Home
                </Button>
              </Alert>
            )}
          </VStack>
        </Box>
      </Flex>
      
      {signingData && (
        <MessageSigningPopup
          isOpen={isOpen}
          onClose={handleReject}
          onSign={handleSign}
          email={signingData.email}
          timestamp={signingData.timestamp}
        />
      )}
    </>
  );
};

export default ZkLoginCallback;