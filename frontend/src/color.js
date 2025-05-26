
const colors = {
  // Primary palette - Core neutral colors
  neutral: {
    0: "#FFFFFF",
    50: "#FDFDFD",
    100: "#F9F9FA",
    200: "#F2F3F4",
    300: "#E6E7E9",
    400: "#D3D6D9",
    500: "#ABB2B7",
    600: "#848E95",
    700: "#5E6C74",
    800: "#4C5B64",
    900: "#3E4045",
    950: "#2B2D2F",
  },

  // Dark theme base colors with blue tint
  dark: {
    50: "#242629",
    100: "#212325",
    200: "#1E2024",
    300: "#1B1D21",
    400: "#191B1F",
    500: "#16181C",
    600: "#131417",
    700: "#101114",
    800: "#0D0E11",
    900: "#0A0C0F",
    950: "#070809",
  },

  // System grays (for backwards compatibility)
  gray: {
    50: "#F9F9F9",
    100: "#EBEBEB",
    200: "#D9D9D9",
    300: "#C4C4C4",
    400: "#9D9D9D",
    500: "#7B7B7B",
    600: "#555555",
    700: "#333333",
    800: "#1F1F1F",
    900: "#141414",
    950: "#161619",
    1000: "#222121"
  },

  // Blue - Primary accent & data nodes
  blue: {
    50: "#E9F2FF",
    100: "#D4E6FF",
    200: "#A8CCFF",
    300: "#63B3ED",
    400: "#5290FF",
    500: "#3182CE",
    600: "#2C5282",
    700: "#1E63EA",
    800: "#0084B2",
    900: "#005C7D",
  },

  // Green - Success & task nodes
  green: {
    50: "#E6FFED",
    100: "#B8FFD0",
    200: "#68D391",
    300: "#4ADE80",
    400: "#38A169",
    500: "#31E27B",
    600: "#276749",
    700: "#229E56",
    800: "#186F3C",
    900: "#16A34A",
  },

  // Purple - Parameter nodes
  purple: {
    50: "#F5E6FF",
    100: "#E9CCFF",
    200: "#DA11FF",
    300: "#B794F4",
    400: "#A000BC",
    500: "#805AD5",
    600: "#700084",
    700: "#553C9A",
    800: "#4E005C",
    900: "#3D1A5F",
  },

  // Yellow - Warnings & highlights
  yellow: {
    50: "#FFFBE6",
    100: "#FFF4CC",
    200: "#FFE300",
    300: "#F6E05E",
    400: "#FFBC00",
    500: "#D69E2E",
    600: "#B28400",
    700: "#975A16",
    800: "#7D5C00",
    900: "#5F4300",
  },

  // Red - Errors & destructive actions
  red: {
    50: "#FFE6E6",
    100: "#FFCCCC",
    200: "#FF9999",
    300: "#FC8181",
    400: "#F03B3A",
    500: "#E53E3E",
    600: "#DC3938",
    700: "#9B2C2C",
    800: "#7A1F1F",
    900: "#5A1212",
  },

  // Ocean - Secondary accent
  ocean: {
    50: "#E6F4F9",
    100: "#CFE7F1",
    200: "#ACCCDA",
    300: "#97BAC9",
    400: "#82A8B8",
    500: "#598395",
    600: "#2F5F73",
    700: "#063B51",
    800: "#052F41",
    900: "#021820",
  },

  // Component-specific color mappings
  navbar: {
    body: {
      dark: "#0A0C0F",
      light: "#F9F9FA",
    },
    border: {
      dark: "#1B1D21",
      light: "#E6E7E9",
    },
    selected: {
      dark: "#1B1D21",
      light: "#FFFFFF",
    },
    icon: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    hover: {
      dark: "#16181C",
      light: "#F2F3F4",
    },
    text: {
      dark: "#FFFFFF",
      light: "#333333",
    },
  },

  // format is useColorModeValue('light', 'dark')
  // const borderColor = useColorModeValue('gray.200', 'gray.700');
  // const itemBgColor = useColorModeValue('white', '#131313');
  // const headingColor = useColorModeValue('gray.800', 'white');
  // const textColor = useColorModeValue('gray.600', 'gray.300');
  // const tagColor = useColorModeValue('black', 'white');
  // const tagTextColor = useColorModeValue('white', 'black');
  // const activeTabColor = useColorModeValue('black', 'white');
  // const activeTabBorderColor = useColorModeValue('black', 'white');

  marketplace: {
    body: {
      dark: "#0A0C0F",
      light: "#F2F3F4",
    },
    border: {
      dark: "#3E4045",
      light: "#E6E7E9",
    },
    item: {
      dark: "#131417",
      light: "#FFFFFF",
    },
    heading: {
      dark: "#FFFFFF",
      light: "#333333",
    },
    text: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    tag: {
      dark: "#1B1D21",
      light: "#F2F3F4",
    },
    tagText: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    activeTab: {
      dark: "#FFFFFF",
      light: "#333333",
    },
    activeTabBorder: {
      dark: "#5290FF",
      light: "#3182CE",
    },
    hoverBorder: {
      dark: "#3E4045",
      light: "#D3D6D9",
    },
    marketplaceCardbg: {
      dark: "#16181C",
      light: "#FFFFFF",
    },
  },



  vizpanel: {
    body: {
      dark: "#131417",
      light: "#FFFFFF",
    },
    border: {
      dark: "#1B1D21",
      light: "#E6E7E9",
    },
    selected: {
      dark: "#1B1D21",
      light: "#F2F3F4",
    },
    icon: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    hover: {
      dark: "#16181C",
      light: "#F9F9FA",
    },
  },

  blockpanel: {
    icon: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    itemBg: {
      dark: "#131417",
      light: "#FFFFFF",
    },
    layerHeader: {
      dark: "#FFFFFF",
      light: "#333333",
    },
    layerHeadertext: {
      dark: "#FFFFFF",
      light: "#333333",
    },
    listhoverBg: {
      dark: "#1B1D21",
      light: "#FFFFFF",
    },
    selected_category: {
      dark: "#5290FF",
      light: "#3182CE",
    },
  },

  sidepanel: {
    body: {
      dark: "#16181C",
      light: "#F9F9FA",
    },
    itemBgColor: {
      dark: "#131417",
      light: "#FFFFFF",
    },
    border: {
      dark: "#3E4045",
      light: "#E6E7E9",
    },
    headingColor: {
      dark: "#FFFFFF",
      light: "#333333",
    },
    accordionBgColor: {
      dark: "#131417",
      light: "#F9F9FA",
    },
    layerHeaderBg: {
      dark: "#131417",
      light: "#F2F3F4",
    },
    layerHeaderColor: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    emptyStateIconColor: {
      dark: "#5E6C74",
      light: "#ABB2B7",
    },
    selected: {
      dark: "#1B1D21",
      light: "#E9F2FF",
    },
    icon: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    hover: {
      dark: "#1B1D21",
      light: "#F2F3F4",
    },
    text: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
  },

  detailpanel: {
    body: {
      dark: "#16181C",
      light: "#F9F9FA",
    },
    border: {
      dark: "#3E4045",
      light: "#E6E7E9",
    },
    inputbg: {
      dark: "#131417",
      light: "#FFFFFF",
    },
    selected: {
      dark: "#1B1D21",
      light: "#F2F3F4",
    },
    icon: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    hover: {
      dark: "#1B1D21",
      light: "#F9F9FA",
    },
    text: {
      dark: "#FFFFFF",
      light: "#333333",
    },
  },

  accessManagement: {
    sidebar: {
      bg: {
        light: "#F9F9FA",
        dark: "#16181C",
      },
      border: {
        light: "#E6E7E9",
        dark: "#3E4045",
      },
      itemHover: {
        light: "#F2F3F4",
        dark: "#1B1D21",
      },
      selected: {
        light: "#E9F2FF",
        dark: "#1B1D21",
      },
      selectedText: {
        light: "#3182CE",
        dark: "#5290FF",
      },
      icon: {
        light: "#5E6C74",
        dark: "#ABB2B7",
      },
    },
    mainContent: {
      bg: {
        light: "#F2F3F4",
        dark: "#0A0C0F",
      },
      heading: {
        light: "#333333",
        dark: "#FFFFFF",
      },
    },
    flowCard: {
      bg: {
        light: "#FFFFFF",
        dark: "#16181C",
      },
      border: {
        light: "#E6E7E9",
        dark: "#3E4045",
      },
      iconBg: {
        dark: "#333333",
        light: "#ABB2B7",
      },
      iconText: {
        light: "#16181C",
        dark: "#FFFFFF",
      },
    },
    detailPanel: {
      bg: {
        light: "#FFFFFF",
        dark: "#16181C",
      },
      border: {
        light: "#E6E7E9",
        dark: "#3E4045",
      },
      addressBg: {
        light: "#F9F9FA",
        dark: "#131417",
      },
      levelBadge: {
        light: "#805AD5",
        dark: "#B794F4",
      },
    },
  },

  canvas: {
    body: {
      dark: "#0A0C0F",
      light: "#F2F3F4",
    },
    grid: {
      dark: "rgba(255, 255, 255, 0.15)",
      light: "#E6E7E9",
    },
    controls: {
      dark: "#16181C",
      light: "#FFFFFF",
    },
    controlsIcon: {
      dark: "#ABB2B7",
      light: "#5E6C74",
    },
    edge: {
      dark: "#3E4045",
      light: "#D3D6D9",
    },
    node: {
      dark: "#16181C",
      light: "#FFFFFF",
    },
    nodeBorder: {
      dark: "#3E4045",
      light: "#E6E7E9",
    },
    nodeSelected: {
      dark: "#63B3ED",
      light: "#3182CE",
    },
    nodeActive: {
      dark: "#005C7D",
      light: "#82A8B8",
    },
    nodeActiveFill: {
      dark: "#0D0E11", 
      light: "#ACCCDA",
    },
    nodeSelectedFill: {
      dark: "#0D0E11",
      light: "#ACCCDA",
    },
  },
  chat: {
    bgPrimary: {
      light: "#FFFFFF",
      dark: "#0A0C0F",
    },
    bgSecondary: {
      light: "#F9F9FA",
      dark: "#16181C",
    },
    bgTertiary: {
      light: "#F2F3F4",
      dark: "#131417",
    },
    bgInput: {
      light: "#FFFFFF",
      dark: "#16181C",
    },
    bgHover: {
      light: "#F9F9FA",
      dark: "#1B1D21",
    },
    bgSelected: {
      light: "#E9F2FF",
      dark: "#1B1D21",
    },
    bgSource: {
      light: "#F9F9FA",
      dark: "#131417",
    },
    bgButton: {
      light: "#FFFFFF",
      dark: "#1B1D21",
    },
    bgButtonHover: {
      light: "#F2F3F4",
      dark: "#212325",
    },
    textPrimary: {
      light: "#333333",
      dark: "#FFFFFF",
    },
    textSecondary: {
      light: "#5E6C74",
      dark: "#ABB2B7",
    },
    textMuted: {
      light: "#ABB2B7",
      dark: "#5E6C74",
    },
    borderColor: {
      light: "#E6E7E9",
      dark: "gray.700",
    },
    borderLight: {
      light: "#F2F3F4",
      dark: "#1E1F21",
    },
    iconColor: {
      light: "#5E6C74",
      dark: "#ABB2B7",
    },
    linkColor: {
      light: "#3182CE",
      dark: "#5290FF",
    },
    checkmarkBgColor: {
      light: "#38A169",
      dark: "#4ADE80",
    },
    spinnerBgColor: {
      light: "#E6E7E9",
      dark: "#3E4045",
    },
    spinnerColor: {
      light: "#5E6C74",
      dark: "#ABB2B7",
    },
    userMessageBg: {
      light: "#F2F3F4",
      dark: "#16181C",
    },
    assistantMessageBg: {
      light: "#FFFFFF",
      dark: "#131417",
    },
  },

  // UI States and effects
  states: {
    focus: {
      light: "#3182CE",
      dark: "#5290FF",
    },
    error: {
      light: "#E53E3E",
      dark: "#FC8181",
    },
    warning: {
      light: "#D69E2E",
      dark: "#F6E05E",
    },
    success: {
      light: "#38A169",
      dark: "#68D391",
    },
    info: {
      light: "#3182CE",
      dark: "#63B3ED",
    },
  },

  // Shadows and overlays
  shadows: {
    small: {
      light: "rgba(0, 0, 0, 0.05)",
      dark: "rgba(0, 0, 0, 0.2)",
    },
    medium: {
      light: "rgba(0, 0, 0, 0.1)",
      dark: "rgba(0, 0, 0, 0.3)",
    },
    large: {
      light: "rgba(0, 0, 0, 0.15)",
      dark: "rgba(0, 0, 0, 0.4)",
    },
    overlay: {
      light: "rgba(0, 0, 0, 0.4)",
      dark: "rgba(0, 0, 0, 0.7)",
    },
  },

  // Port colors for flow nodes
  ports: {
    default: {
      light: "#D3D6D9",
      dark: "#3E4045",
    },
    connected: {
      light: "#38A169",
      dark: "#4ADE80",
    },
    hover: {
      light: "#3182CE",
      dark: "#5290FF",
    },
    active: {
      light: "#16A34A",
      dark: "#31E27B",
    },
  }
};


export default colors;