import { experimental_extendTheme as extendTheme } from '@mui/material/styles';

export const theme = extendTheme({
  colorSchemes: {
    dark: {
      palette: {
        mode: 'dark',
        primary: { main: '#90caf9' },
        secondary: { main: '#f48fb1' },
      },
    },
    light: {
      palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
      },
    },
  },
  defaultColorScheme: 'dark',
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});
