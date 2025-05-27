import { Box, Code, Text, Link, UnorderedList, OrderedList, ListItem, Heading, useColorModeValue } from '@chakra-ui/react';
import { Fragment } from 'react';

const MarkdownRenderer = ({ content, textColor }) => {
  const codeBg = useColorModeValue('gray.100', 'gray.800');
  const codeColor = useColorModeValue('gray.800', 'gray.100');
  const inlineCodeBg = useColorModeValue('gray.200', 'gray.700');
  // Simple markdown parser
  const parseMarkdown = (text) => {
    const elements = [];
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';
    let listItems = [];
    let listType = null;
    let key = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        const ListComponent = listType === 'ul' ? UnorderedList : OrderedList;
        elements.push(
          <ListComponent key={key++} ml={4} mb={2}>
            {listItems}
          </ListComponent>
        );
        listItems = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = '';
        } else {
          inCodeBlock = false;
          elements.push(
            <Box key={key++} bg={codeBg} p={3} borderRadius="md" mb={2} overflowX="auto">
              <Code 
                display="block" 
                whiteSpace="pre" 
                bg="transparent" 
                color={codeColor}
                fontSize="sm"
              >
                {codeContent.trim()}
              </Code>
            </Box>
          );
          codeContent = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <Heading key={key++} as="h1" size="lg" mb={3} mt={index > 0 ? 4 : 0}>
            {line.slice(2)}
          </Heading>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <Heading key={key++} as="h2" size="md" mb={2} mt={index > 0 ? 3 : 0}>
            {line.slice(3)}
          </Heading>
        );
        return;
      }
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <Heading key={key++} as="h3" size="sm" mb={2} mt={index > 0 ? 2 : 0}>
            {line.slice(4)}
          </Heading>
        );
        return;
      }

      // Lists
      const unorderedMatch = line.match(/^[-*]\s+(.+)/);
      const orderedMatch = line.match(/^\d+\.\s+(.+)/);
      
      if (unorderedMatch) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(
          <ListItem key={key++}>
            {parseInlineMarkdown(unorderedMatch[1])}
          </ListItem>
        );
        return;
      }
      
      if (orderedMatch) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(
          <ListItem key={key++}>
            {parseInlineMarkdown(orderedMatch[1])}
          </ListItem>
        );
        return;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        if (index > 0 && index < lines.length - 1) {
          elements.push(<Box key={key++} h={2} />);
        }
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <Text key={key++} mb={2}>
          {parseInlineMarkdown(line)}
        </Text>
      );
    });

    // Flush any remaining list
    flushList();

    return elements;
  };

  // Parse inline markdown (bold, italic, code, links)
  const parseInlineMarkdown = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(
            <Fragment key={key++}>
              {parseCodeAndLinks(remaining.substring(0, boldMatch.index))}
            </Fragment>
          );
        }
        parts.push(
          <Text key={key++} as="strong" fontWeight="bold" display="inline">
            {boldMatch[1]}
          </Text>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Italic
      const italicMatch = remaining.match(/\*(.+?)\*/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(
            <Fragment key={key++}>
              {parseCodeAndLinks(remaining.substring(0, italicMatch.index))}
            </Fragment>
          );
        }
        parts.push(
          <Text key={key++} as="em" fontStyle="italic" display="inline">
            {italicMatch[1]}
          </Text>
        );
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more markdown, parse remaining text for code and links
      parts.push(
        <Fragment key={key++}>
          {parseCodeAndLinks(remaining)}
        </Fragment>
      );
      break;
    }

    return parts;
  };

  // Parse inline code and links
  const parseCodeAndLinks = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Inline code
      const codeMatch = remaining.match(/`(.+?)`/);
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(
            <Fragment key={key++}>
              {parseLinks(remaining.substring(0, codeMatch.index))}
            </Fragment>
          );
        }
        parts.push(
          <Code key={key++} bg={inlineCodeBg} px={1} py={0.5} borderRadius="sm" fontSize="sm">
            {codeMatch[1]}
          </Code>
        );
        remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
        continue;
      }

      // No more code, parse remaining for links
      parts.push(
        <Fragment key={key++}>
          {parseLinks(remaining)}
        </Fragment>
      );
      break;
    }

    return parts;
  };

  // Parse links
  const parseLinks = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Markdown links
      const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);
      if (linkMatch && linkMatch.index !== undefined) {
        if (linkMatch.index > 0) {
          parts.push(remaining.substring(0, linkMatch.index));
        }
        parts.push(
          <Link key={key++} href={linkMatch[2]} color="blue.400" isExternal>
            {linkMatch[1]}
          </Link>
        );
        remaining = remaining.substring(linkMatch.index + linkMatch[0].length);
        continue;
      }

      // No more links
      parts.push(remaining);
      break;
    }

    return parts.length === 1 ? parts[0] : parts;
  };

  return (
    <Box color={textColor}>
      {parseMarkdown(content)}
    </Box>
  );
};

export default MarkdownRenderer;