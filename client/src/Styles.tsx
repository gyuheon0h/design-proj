import { createTheme } from '@mui/material/styles';

// Color scheme
export const colors = {
  darkBlue: '#161C94',
  lightBlue: '#BBD6F5',
  darkGrey: '#666A75',
  hover: '#8AB8E6',
  white: '#FFFFFF',
  active: '#F5F7FB',
  black: '#000000',
};

// Typography
export const typography = {
  // fontFamily: 'Kurale, serif',
  // secondaryFontFamily: '"Annapurna SIL", serif',
  fontFamily: '"Montserrat", sans-serif',
  secondaryFontFamily: '"Nunito", sans-serif',
  fontSize: {
    small: 12,
    medium: 16,
    large: 20,
    extraLarge: 24,
  },
};

// Drawer styles
export const drawerStyles = {
  width: 260,
  paper: {
    width: 260,
    boxSizing: 'border-box',
    backgroundColor: colors.lightBlue,
    padding: '12px',
    borderRight: `2px solid ${colors.darkGrey}`,
  },
};

// Active Page styles
export const activePageStyles = {
  backgroundColor: colors.active,
  color: colors.darkBlue,
  fontWeight: 600,
};

// Global Theme
export const theme = createTheme({
  typography: {
    fontFamily: typography.fontFamily,
    allVariants: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize.medium,
    },
    h1: { fontSize: typography.fontSize.extraLarge, fontWeight: 700 },
    h2: { fontSize: typography.fontSize.large, fontWeight: 600 },
    h3: { fontSize: typography.fontSize.medium, fontWeight: 500 },
    body1: { fontSize: typography.fontSize.medium },
    body2: { fontSize: typography.fontSize.small },
  },
  palette: {
    primary: {
      main: colors.darkBlue,
    },
    secondary: {
      main: colors.lightBlue,
    },
    background: {
      default: colors.white,
      paper: '#F8FAFC',
    },
    text: {
      primary: colors.darkBlue,
      secondary: colors.darkGrey,
    },
  },
});
