import colors from '../color';

export const getSVGThemeFilter = (colorMode) => {
  return colorMode === 'dark' ? 'invert(0.9) hue-rotate(180deg)' : 'none';
};

export const getSVGThemeStyles = (colorMode) => {
  return {
    filter: getSVGThemeFilter(colorMode),
    transition: 'filter 0.3s ease'
  };
};

export const getThemedSVGClassNames = (colorMode) => {
  return colorMode === 'dark' ? 'svg-dark-theme' : 'svg-light-theme';
};

export const getColorForMode = (lightColor, darkColor, colorMode) => {
  return colorMode === 'dark' ? darkColor : lightColor;
};

export const getAppThemeColors = (colorMode) => {
  return {
    background: getColorForMode(
      colors.accessManagement.mainContent.bg.light,
      colors.accessManagement.mainContent.bg.dark,
      colorMode
    ),
    text: getColorForMode(
      colors.gray[900],
      colors.gray[100],
      colorMode
    ),
    border: getColorForMode(
      colors.gray[200],
      colors.gray[700],
      colorMode
    ),
    cardBg: getColorForMode(
      colors.accessManagement.flowCard.bg.light,
      colors.accessManagement.flowCard.bg.dark,
      colorMode
    ),
    primary: getColorForMode(
      colors.blue[500],
      colors.blue[400],
      colorMode
    ),
    success: getColorForMode(
      colors.green[500],
      colors.green[400],
      colorMode
    ),
    error: getColorForMode(
      colors.red[500],
      colors.red[400],
      colorMode
    ),
    warning: getColorForMode(
      colors.yellow[500],
      colors.yellow[400],
      colorMode
    ),
  };
};