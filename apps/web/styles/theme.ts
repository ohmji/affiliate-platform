import { createTheme } from '@mui/material/styles';

const primary = {
  main: '#0052cc',
  light: '#4c7bd9',
  dark: '#003a99'
};

const secondary = {
  main: '#ff6f00',
  light: '#ff9e40',
  dark: '#c43e00'
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary,
    secondary,
    background: {
      default: '#f5f7fb',
      paper: '#ffffff'
    }
  },
  shape: {
    borderRadius: 10
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 600
    },
    h3: {
      fontWeight: 600
    }
  }
});
