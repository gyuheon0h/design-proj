import { createTheme } from '@mui/material/styles';

// Updated color scheme based on the provided screenshot
export const colors = {
  // Sidebar colors
  sidebarBackground: '#1E1E1E',  // Dark sidebar background
  sidebarText: '#FFFFFF',        // White text in sidebar
  sidebarHover: '#333333',       // Slightly lighter for hover states
  sidebarActive: '#444444',      // Active item background
  
  // Main content colors
  mainBackground: '#F6F8FA',     // Light gray background for main content
  cardBackground: '#FFFFFF',     // White background for cards/items
  
  // Text colors
  textPrimary: '#333333',        // Main text color
  textSecondary: '#6E7582',      // Secondary text (dates, descriptions)
  
  // UI element colors
  folderBlue: '#62B0F6',         // Blue folder color
  accentBlue: '#4285F4',         // Accent color for buttons, links
  
  // File type colors
  fileGray: '#A4AABA',           // Default file icon
  fileDocument: '#4285F4',       // Document files (blue)
  fileImage: '#4ECDC4',          // Image files (teal)
  fileSpreadsheet: '#A8D97F',    // Spreadsheet files (green)
  fileVideo: '#FF6B6B',          // Video files (red)
  
  // Other UI colors
  divider: '#E1E4E8',           // Divider color
  border: '#E1E4E8',            // Border color
  avatar: '#8884FF',            // Avatar background
  avatarText: '#FFFFFF',        // Avatar text
};

// Typography settings
export const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    extraLarge: 20,
    heading: 24,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  }
};

// Drawer styles
export const drawerStyles = {
  width: 240,
  paper: {
    width: 240,
    boxSizing: 'border-box',
    backgroundColor: colors.sidebarBackground,
    padding: '0px',
    borderRight: 'none',
    borderRadius: 0,
    color: colors.sidebarText,
  },
};

// Active Page styles
export const activePageStyles = {
  backgroundColor: colors.sidebarActive,
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: colors.sidebarActive,
  },
};

// File list styles
export const fileListStyles = {
  tableContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    borderBottom: `1px solid ${colors.divider}`,
  },
  tableCell: {
    padding: '12px 16px',
    fontSize: typography.fontSize.medium,
  },
  tableHeader: {
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    backgroundColor: colors.cardBackground,
  },
};

// Folder styles
export const folderStyles = {
  container: {
    width: 150,
    height: 'auto',
    transition: 'transform 0.2s',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  folder: {
    backgroundColor: colors.folderBlue,
    borderRadius: '8px',
    width: '100%',
    height: 90,
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '15%',
      width: '70%',
      height: '15px',
      backgroundColor: colors.folderBlue,
      borderRadius: '8px 8px 0 0',
    },
  },
  folderName: {
    marginTop: '8px',
    padding: '4px',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    fontWeight: 500,
  },
};

// Avatar styles
export const avatarStyles = {
  small: {
    width: 24, 
    height: 24,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
  },
  standard: {
    width: 32,
    height: 32,
    fontSize: typography.fontSize.medium,
    fontWeight: typography.fontWeight.medium,
  },
  large: {
    width: 40,
    height: 40,
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.medium,
  },
};

// Search bar styles
export const searchBarStyles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '50px',
    padding: '4px 16px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    width: '100%',
  },
  input: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: typography.fontSize.medium,
    color: colors.textPrimary,
    padding: '8px 0',
    backgroundColor: 'transparent',
    '&::placeholder': {
      color: colors.textSecondary,
    },
  },
  icon: {
    color: colors.textSecondary,
    marginRight: '8px',
  },
};

// Global Theme
export const theme = createTheme({
  palette: {
    primary: {
      main: colors.accentBlue,
    },
    secondary: {
      main: colors.folderBlue,
    },
    background: {
      default: colors.mainBackground,
      paper: colors.cardBackground,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
  },
  typography: {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.medium,
    fontWeightRegular: typography.fontWeight.regular,
    fontWeightMedium: typography.fontWeight.medium,
    fontWeightBold: typography.fontWeight.bold,
    h1: {
      fontSize: typography.fontSize.heading,
      fontWeight: typography.fontWeight.bold,
    },
    h2: {
      fontSize: typography.fontSize.extraLarge,
      fontWeight: typography.fontWeight.semiBold,
    },
    h3: {
      fontSize: typography.fontSize.large,
      fontWeight: typography.fontWeight.medium,
    },
    body1: {
      fontSize: typography.fontSize.medium,
    },
    body2: {
      fontSize: typography.fontSize.small,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: typography.fontWeight.medium,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});