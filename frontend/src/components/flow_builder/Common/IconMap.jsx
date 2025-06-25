import React from 'react';

// Import SVG icons
import AWSIconSVG from '../../../assets/icons/blocks/aws-svgrepo-com (1).svg';
import CoinbaseIconSVG from '../../../assets/icons/blocks/coinbase-v2-svgrepo-com.svg';
import AkashIconSVG from '../../../assets/icons/blocks/akash-network-akt-logo.svg';

// Create React components for SVG icons
const AWSIcon = ({ size = 24 }) => (
  <img src={AWSIconSVG} alt="AWS" style={{ width: `${size}px`, height: `${size}px` }} />
);

const CoinbaseIcon = ({ size = 24 }) => (
  <img src={CoinbaseIconSVG} alt="Coinbase" style={{ width: `${size}px`, height: `${size}px` }} />
);

const AkashIcon = ({ size = 24 }) => (
  <img src={AkashIconSVG} alt="Akash" style={{ width: `${size}px`, height: `${size}px` }} />
);

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
    FiType
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
    'FiInfo': MdInfo,
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
    // Custom SVG icons
    'AWSIcon': AWSIcon,
    'CoinbaseIcon': CoinbaseIcon,
    'AkashIcon': AkashIcon,
};

export default ICON_MAP;