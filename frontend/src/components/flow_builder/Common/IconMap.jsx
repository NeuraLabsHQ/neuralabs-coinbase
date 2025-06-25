import React from 'react';
import { useColorMode } from '@chakra-ui/react';

// Import SVG icons - Light versions
import AWSIconLight from '../../../assets/icons/blocks/aws_icon_light.svg';
import CoinbaseIconLight from '../../../assets/icons/blocks/coinbase_icon_light.svg';
import AkashIconLight from '../../../assets/icons/blocks/akash_icon_light.svg';

// Import SVG icons - Dark versions
import AWSIconDark from '../../../assets/icons/blocks/aws_icon_dark.svg';
import CoinbaseIconDark from '../../../assets/icons/blocks/coinbase_icon_dark.svg';
import AkashIconDark from '../../../assets/icons/blocks/akash_icon_dark.svg';

// Create React components for SVG icons
const AWSIcon = ({ size = 24 }) => {
  const { colorMode } = useColorMode();
  const iconSrc = colorMode === 'dark' ? AWSIconDark : AWSIconLight;
  return <img src={iconSrc} alt="AWS" style={{ width: `${size}px`, height: `${size}px` }} />;
};

const CoinbaseIcon = ({ size = 24 }) => {
  const { colorMode } = useColorMode();
  const iconSrc = colorMode === 'dark' ? CoinbaseIconDark : CoinbaseIconLight;
  return <img src={iconSrc} alt="Coinbase" style={{ width: `${size}px`, height: `${size}px` }} />;
};

const AkashIcon = ({ size = 24 }) => {
  const { colorMode } = useColorMode();
  const iconSrc = colorMode === 'dark' ? AkashIconDark : AkashIconLight;
  return <img src={iconSrc} alt="Akash" style={{ width: `${size}px`, height: `${size}px` }} />;
};

import { 
    FiX, 
    FiActivity, 
    FiEdit2,
    FiLayers,
    FiMaximize2,
    FiAlertCircle,
    FiDatabase, 
    FiSliders, 
    FiExternalLink, 
    FiRepeat, 
    FiGitBranch,
    FiPlayCircle,
    FiXCircle,
    FiMessageCircle,
    FiBookOpen,
    FiServer,
    FiGlobe,
    FiLink,
    FiFileText,
    FiFilter,
    FiGitMerge,
    FiShuffle,
    FiClock,
    FiCpu,
    FiLayout,
    FiCode,
    FiChevronRight,
    FiChevronDown,
    FiSearch,
    FiCloud,
    FiShield,
    FiType,
    FiBox,
    FiLock,
    FiTerminal,
    FiRefreshCw,
    FiPlay,
    FiSquare,
    FiInfo
} from 'react-icons/fi';

import { 
    BiBrain 
} from 'react-icons/bi';


import {
    MdInfo} from 'react-icons/md';

// Map icon strings to React icons
const ICON_MAP = {
    'database': FiDatabase,
    'activity': FiActivity,
    'sliders': FiSliders,
    'external-link': FiExternalLink,
    'repeat': FiRepeat,
    'git-branch': FiGitBranch,
    'play-circle': FiPlayCircle,
    'x-circle': FiXCircle,
    'message-circle': FiMessageCircle,
    'book-open': FiBookOpen,
    'server': FiServer,
    'globe': FiGlobe,
    'link': FiLink,
    'file-text': FiFileText,
    'filter': FiFilter,
    'git-merge': FiGitMerge,
    'shuffle': FiShuffle,
    'clock': FiClock,
    'cpu': FiCpu,
    'layout': FiLayout,
    'code': FiCode,
    'md-info': MdInfo,
    // Additional icons from API
    'FiCode': FiCode,
    'FiFileText': FiFileText,
    'FiPlayCircle': FiPlayCircle,
    'FiXCircle': FiXCircle,
    'FiGitBranch': FiGitBranch,
    'FiMessageCircle': FiMessageCircle,
    'FiBookOpen': FiBookOpen,
    'FiDatabase': FiDatabase,
    'FiServer': FiServer,
    'FiGlobe': FiGlobe,
    'FiInfo': FiInfo,
    'FiLink': FiLink,
    'FiDollarSign': FiExternalLink,
    'FiFilter': FiFilter,
    'FiGitMerge': FiGitMerge,
    'FiShuffle': FiShuffle,
    'FiClock': FiClock,
    'FiCpu': FiCpu,
    'FiSearch': FiSearch,
    'FiCloud': FiCloud,
    'FiShield': FiShield,
    'FiType': FiType,
    'FiBrain': BiBrain,
    // Additional missing icons
    'FiBox': FiBox,
    'FiLock': FiLock,
    'FiTerminal': FiTerminal,
    'FiRefreshCw': FiRefreshCw,
    'FiPlay': FiPlay,
    'FiSquare': FiSquare,
    'FiInfo': FiInfo,
    // Custom SVG icons
    'AWSIcon': AWSIcon,
    'CoinbaseIcon': CoinbaseIcon,
    'AkashIcon': AkashIcon,
};

// Type to Icon mapping based on database blocks
export const TYPE_TO_ICON_MAP = {
    // AWS blocks
    'Titan': AWSIcon,
    'Nova': AWSIcon,
    'Guardrails': AWSIcon,
    
    // Akash Network blocks
    'ChatAPI': AkashIcon,
    
    // Coinbase CDP blocks
    'ReadContract': CoinbaseIcon,
    'FetchBalance': CoinbaseIcon,
    
    // Flow Control blocks
    'Start': FiPlay,
    'End': FiSquare,
    'Case': FiGitBranch,
    'FlowSelect': FiShuffle,
    
    // Input blocks
    'ChatInput': FiMessageCircle,
    'Constants': FiLock,
    'ContextHistory': FiClock,
    'Datablock': FiBox,
    'Metadata': FiInfo,
    'RestAPI': FiGlobe,
    
    // AI blocks
    'LLMText': FiType,
    'LLMStructured': FiCode,
    
    // Utility blocks
    'Selector': FiFilter,
    'Merger': FiGitMerge,
    'RandomGenerator': FiRefreshCw,
    
    // Custom blocks
    'Custom': FiTerminal,
    
    // Blockchain blocks
    'BuildTransaction': FiLink,
    
    // MCP blocks
    'Search': FiSearch,
    
    // Default fallback
    'default': FiActivity
};

export default ICON_MAP;