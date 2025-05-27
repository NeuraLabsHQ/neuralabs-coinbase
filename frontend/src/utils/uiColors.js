// src/utils/uiColors.js
import { useColorModeValue } from '@chakra-ui/react';
import colors from '../color.js';

export const useUiColors = () => {
  // Background colors
  const bgPrimary = useColorModeValue(colors.chat.bgPrimary.light, colors.chat.bgPrimary.dark);
  const bgSecondary = useColorModeValue(colors.chat.bgSecondary.light, colors.chat.bgSecondary.dark);
  const bgTertiary = useColorModeValue(colors.chat.bgTertiary.light, colors.chat.bgTertiary.dark);
  const bgInput = useColorModeValue(colors.chat.bgInput.light, colors.chat.bgInput.dark);
  const bgHover = useColorModeValue(colors.chat.bgHover.light, colors.chat.bgHover.dark);
  const bgSelected = useColorModeValue(colors.chat.bgSelected.light, colors.chat.bgSelected.dark);
  const bgSource = useColorModeValue(colors.chat.bgSource.light, colors.chat.bgSource.dark);
  const bgButton = useColorModeValue(colors.chat.bgButton.light, colors.chat.bgButton.dark);
  const bgButtonHover = useColorModeValue(colors.chat.bgButtonHover.light, colors.chat.bgButtonHover.dark);
  
  // Text colors
  const textPrimary = useColorModeValue(colors.chat.textPrimary.light, colors.chat.textPrimary.dark);
  const textSecondary = useColorModeValue(colors.chat.textSecondary.light, colors.chat.textSecondary.dark);
  const textMuted = useColorModeValue(colors.chat.textMuted.light, colors.chat.textMuted.dark);
  
  // Border colors
  const borderColor = useColorModeValue(colors.chat.borderColor.light, colors.chat.borderColor.dark);
  const borderLight = useColorModeValue(colors.chat.borderLight.light, colors.chat.borderLight.dark);
  
  // UI element colors
  const iconColor = useColorModeValue(colors.chat.iconColor.light, colors.chat.iconColor.dark);
  const linkColor = useColorModeValue(colors.chat.linkColor.light, colors.chat.linkColor.dark);
  const checkmarkBgColor = useColorModeValue(colors.chat.checkmarkBgColor.light, colors.chat.checkmarkBgColor.dark);
  const spinnerBgColor = useColorModeValue(colors.chat.spinnerBgColor.light, colors.chat.spinnerBgColor.dark);
  const spinnerColor = useColorModeValue(colors.chat.spinnerColor.light, colors.chat.spinnerColor.dark);
  
  // Chat message colors
  const userMessageBg = useColorModeValue(colors.chat.userMessageBg.light, colors.chat.userMessageBg.dark);
  const assistantMessageBg = useColorModeValue(colors.chat.assistantMessageBg.light, colors.chat.assistantMessageBg.dark);
  
  return {
    // Backgrounds
    bgPrimary,
    bgSecondary,
    bgTertiary,
    bgInput,
    bgHover,
    bgSelected,
    bgSource,
    bgButton,
    bgButtonHover,
    
    // Text
    textPrimary,
    textSecondary,
    textMuted,
    
    // Borders
    borderColor,
    borderLight,
    
    // UI Elements
    iconColor,
    linkColor,
    checkmarkBgColor,
    spinnerBgColor,
    spinnerColor,
    
    // Chat Messages
    userMessageBg,
    assistantMessageBg
  };
};

export default useUiColors;