import { createTheme } from '@mui/material/styles';

// Color scheme
export const colors = {
    darkBlue: '#161C94', 
    lightBlue: '#BBD6F5', 
    darkGrey: '#999AA5',
    hover: '#a9c8eb', // for hovering over side tabs
    white: '#FFFFFF',
    active: '#FFFFFF', 
    black: '#000000', 
};

// Typography
export const typography = {
    fontFamily: 'Kurale, serif',
    fontSize: {
        small: 12,
        medium: 16,
        large: 20,
        extraLarge: 24,
    },
};

export const drawerStyles = {
    width: 260,
    paper: {
        width: 260,
        boxSizing: 'border-box',
        backgroundColor: colors.lightBlue, 
        padding: '10px',
    },
};

export const activePageStyles = {
    backgroundColor: colors.active,
    color: colors.darkBlue, 
};

// Global theme
export const theme = createTheme({
  typography: {
    fontFamily: '"Kurale", serif',
    allVariants: {
      fontFamily: '"Kurale", serif',  
      fontSize: typography.fontSize.medium,  
    },
    h1: { fontSize: typography.fontSize.extraLarge },
    h2: { fontSize: typography.fontSize.large },
    h3: { fontSize: typography.fontSize.large },
    h4: { fontSize: typography.fontSize.medium },
    h5: { fontSize: typography.fontSize.medium },
    h6: { fontSize: typography.fontSize.small },
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
    },
    text: {
      primary: colors.darkBlue,
      secondary: colors.darkGrey,
    },
  },
});
