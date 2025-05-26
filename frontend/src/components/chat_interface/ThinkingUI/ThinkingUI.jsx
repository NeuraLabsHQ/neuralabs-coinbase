
import { SearchIcon } from "@chakra-ui/icons";
import {
    Box,
    Flex,
    List,
    ListItem,
    Spinner,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from 'react';
import { FiCheck } from "react-icons/fi";
import colors from "../../../color";
import thinkingStepTemplates from "../../../utils/thinkingStepTemplates.json";
import thinkresponse from "../../../utils/thinkresponse.json";


const ThinkingUI = ({ thinkingState, query = "", shouldPersist = true }) => {
  const { isThinking, steps = [], currentStep, searchResults, timeElapsed, onTypingComplete, executionSteps = [] } = thinkingState;
  
  console.log('ThinkingUI render - isThinking:', isThinking, 'executionSteps:', executionSteps.length, 'thinkingState:', thinkingState);

  const [responseData, setResponseData] = useState(null);
  const [wasThinking, setWasThinking] = useState(false);
  const scrollableRef = useRef(null);

  // Typing effect states
  const [previousStep, setPreviousStep] = useState(null);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textToType = useRef("");
  const typingSpeed = 30; // milliseconds per character

  // Color variables
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);
  const bgColor = useColorModeValue(colors.chat.bgPrimary.light, colors.chat.bgSecondary.dark);
  const textColor = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const secondaryColor = useColorModeValue(colors.chat.textSecondary.light, colors.chat.textSecondary.dark);
  const sourceBgColor = useColorModeValue(colors.chat.bgSource.light, colors.chat.bgSource.dark);
  const checkmarkBgColor = useColorModeValue(colors.gray[900], colors.gray[900]);
  const spinnerBgColor = useColorModeValue(colors.chat.spinnerBgColor.light, colors.chat.spinnerBgColor.dark);
  const spinnerColor = useColorModeValue(colors.chat.spinnerColor.light, colors.chat.spinnerColor.dark);
  const linkColor = useColorModeValue(colors.chat.linkColor.light, colors.chat.linkColor.dark);
  const scrollbarColor = useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)');
  const scrollbarTrackColor = useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.2)');

  useEffect(() => {
    if (isThinking) {
      setWasThinking(true);
    }
  }, [isThinking]);

  // Auto-scroll to bottom when new execution steps are added
  useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
    }
  }, [executionSteps]);

  // useEffect(() => {
  //   if (currentStep && currentStep !== previousStep) {
  //     console.log("Current step changed to:", currentStep.name);
  //     setPreviousStep(currentStep);

  //     if (currentStep.name === "Thinking") {
  //       textToType.current = `• Analyzing your query: "${query}"\n
  //     • Breaking down the core components of your request\n
  //     • Identifying key information needed to provide an accurate answer\n
  //     • Determining relevant context and potential ambiguities\n
  //     • Preparing to search for the most up-to-date information\n
  //     • Establishing parameters for comprehensive analysis\n
  //     • Identifying potential knowledge domains relevant to your query\n
  //     • Considering multiple interpretations to ensure accuracy\n
  //     • Planning approach for information synthesis and response generation`;
  //     }

  //     else if (currentStep.name === "Clarifying the request") {
  //       textToType.current = `• Analyzing your query: "${query}"\n
  //     • Breaking down the core components of your request\n
  //     • Identifying key information needed to provide an accurate answer\n
  //     • Determining relevant context and potential ambiguities\n
  //     • Preparing to search for the most up-to-date information\n
  //     • Establishing parameters for comprehensive analysis\n
  //     • Identifying potential knowledge domains relevant to your query\n
  //     • Considering multiple interpretations to ensure accuracy\n
  //     • Planning approach for information synthesis and response generation`;
  //     } else if (currentStep.name === "Searching") {
  //       textToType.current = `Searching for information related to: "${query}"\n
  //     • Accessing specialized knowledge databases\n
  //     • Retrieving recent developments and publications\n
  //     • Cross-referencing multiple authoritative sources\n
  //     • Evaluating source credibility and information relevance\n
  //     • Identifying consensus views and notable exceptions\n
  //     • Collecting technical specifications and supporting data\n
  //     • Gathering contextual information to enhance understanding\n
  //     • Prioritizing sources based on recency and authority`;
  //     } else if (currentStep.name === "Analyzing results") {
  //       textToType.current = `Analyzing gathered information to provide a comprehensive response...\n
  //     • Synthesizing data from multiple sources\n
  //     • Resolving potential contradictions between sources\n
  //     • Organizing information in a logical structure\n
  //     • Prioritizing the most relevant facts for your query\n
  //     • Identifying key insights and practical applications\n
  //     • Formulating explanations at appropriate technical depth\n
  //     • Preparing examples to illustrate complex concepts\n
  //     • Generating analogies to enhance understanding\n
  //     • Checking for completeness and accuracy\n
  //     • Finalizing response with the most valuable information`;
  //     }

  //     setTypedText("");
  //     setIsTyping(true);
  //   }
  // }, [currentStep, previousStep, query]);
  useEffect(() => {
    if (currentStep && currentStep !== previousStep) {
      console.log("Current step changed to:", currentStep.name);
      setPreviousStep(currentStep);

      // Get the step template from the JSON file
      const stepTemplate = thinkingStepTemplates.steps[currentStep.name];
      
      if (stepTemplate) {
        // Replace any placeholders in the template
        let templateText = stepTemplate.text;
        templateText = templateText.replace(/\{\{query\}\}/g, query);
        
        textToType.current = templateText;
      } else {
        // Fallback if step name not found in templates
        textToType.current = `Processing ${currentStep.name} for: "${query}"`;
      }

      setTypedText("");
      setIsTyping(true);
    }
  }, [currentStep, previousStep, query]);


  useEffect(() => {
    if (scrollableRef.current && isTyping) {
      const scrollElement = scrollableRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [typedText, isTyping]);

  useEffect(() => {
    if (!isTyping) return;

    let i = 0;
    const text = textToType.current;
    console.log("Starting typing effect for text:", text);

    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setTypedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        console.log("Typing complete for step:", currentStep?.name);
        if (onTypingComplete) {
          console.log("Calling onTypingComplete");
          onTypingComplete();
        }
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [isTyping, onTypingComplete, currentStep]);

  useEffect(() => {
    if (!query) return;

    const lowerQuery = query.toLowerCase();
    let matchedResponse = null;

    for (const response of thinkresponse.responses) {
      if (
        response.keywords.some((keyword) =>
          lowerQuery.includes(keyword.toLowerCase())
        )
      ) {
        matchedResponse = response;
        break;
      }
    }

    if (!matchedResponse) {
      matchedResponse = thinkresponse.responses.find(
        (r) => r.keywords.length === 0
      ) || {
        response: "I'm thinking about how to respond to your query.",
      };
    }

    let responseText = matchedResponse.response;
    responseText = responseText.replace("{{query}}", query);
    responseText = responseText.replace("{{modelId}}", "Claude 3.7 Sonnet");

    setResponseData({
      ...matchedResponse,
      response: responseText,
    });
  }, [query]);

  // Always show if we have execution steps or if currently thinking
  if (!isThinking && executionSteps.length === 0) return null;
  if (!isThinking && !shouldPersist && executionSteps.length === 0) return null;

  // Helper function to render output values
  const renderOutput = (output) => {
    if (typeof output === 'string') {
      return output;
    } else if (Array.isArray(output)) {
      return output.join(', ');
    } else if (typeof output === 'object') {
      return JSON.stringify(output, null, 2);
    }
    return String(output);
  };

  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      border="1px solid"
      borderColor={borderColor}
      bg={bgColor}
      maxW="900px"
      mx="auto"
      mb={8}
    >
      <Flex>
        <Box w="250px" p={4} borderRight="1px solid" borderColor={borderColor}>
          <Flex align="center" mb={4}>
            <SearchIcon mr={2} />
            <Text fontWeight="medium" color={textColor}>
              {executionSteps.length > 0 && executionSteps.some(step => step.status === 'completed' && step.elementName === 'End Block')
                ? "Completed"
                : "Thinking"}
            </Text>
            <Text fontSize="sm" color={secondaryColor} ml={2}>
              {timeElapsed}s
            </Text>
          </Flex>

          <List spacing={3}>
            {executionSteps.map((step, index) => {
              return (
                <motion.div
                  key={`${step.elementId}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ListItem display="flex" alignItems="center">
                    <Box
                      borderRadius="full"
                      width="24px"
                      height="24px"
                      display="flex"
                      bg={step.status === 'completed' ? checkmarkBgColor : spinnerBgColor}
                      p={1}
                      mr={3}
                      alignItems="center"
                      justifyContent="center"
                    >
                      {step.status === 'completed' ? (
                        <FiCheck color="white" size={14} />
                      ) : (
                        <Spinner size="xs" color={spinnerColor} />
                      )}
                    </Box>
                    <Text color={textColor} fontSize="sm">{step.elementName}</Text>
                  </ListItem>
                </motion.div>
              );
            })}
          </List>
        </Box>

        <Box 
          flex="1" 
          p={4} 
          color={textColor}
          position="relative"
          display="flex"
          flexDirection="column"
        >
          <Text fontSize="lg" fontWeight="medium" mb={4}>
            {!isThinking && wasThinking
              ? "Analysis Complete"
              : executionSteps.length > 0 && executionSteps[executionSteps.length - 1]?.elementName || "Thinking"}
          </Text>

          <Box
            overflow="auto"
            maxHeight="400px"
            position="relative"
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                width: '10px',
                background: scrollbarColor,
              },
              '&::-webkit-scrollbar-thumb': {
                background: scrollbarTrackColor,
                borderRadius: '24px',
              },
            }}
            ref={scrollableRef}
          >
            <VStack align="start" spacing={4} w="100%">
              {executionSteps.map((step, index) => (
                <motion.div
                  key={`content-${step.elementId}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: "100%" }}
                >
                  <Box w="100%">
                    <Text fontSize="sm" fontWeight="medium" color={secondaryColor} mb={1}>
                      {step.description}
                    </Text>
                    
                    {/* Show outputs if available and step is completed */}
                    {step.status === 'completed' && step.outputs && Object.keys(step.outputs).length > 0 && (
                      <Box bg={sourceBgColor} p={3} borderRadius="md" mt={2}>
                        {Object.entries(step.outputs).map(([key, value]) => (
                          <Box key={key} mb={2}>
                            <Text fontSize="xs" fontWeight="bold" color={secondaryColor} mb={1}>
                              {key}:
                            </Text>
                            <Text fontSize="sm" whiteSpace="pre-wrap">
                              {renderOutput(value)}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {/* Show execution time if available */}
                    {step.status === 'completed' && step.executionTime && (
                      <Text fontSize="xs" color={secondaryColor} mt={1}>
                        Completed in {step.executionTime.toFixed(3)}s
                      </Text>
                    )}
                  </Box>
                </motion.div>
              ))}
              
              {/* Show final message when analysis is complete */}
              {!isThinking && wasThinking && executionSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ width: "100%" }}
                >
                  <Box bg={sourceBgColor} p={3} borderRadius="md" w="100%">
                    <Text fontSize="sm">Analysis completed for: "{query}"</Text>
                  </Box>
                </motion.div>
              )}
            </VStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default ThinkingUI;