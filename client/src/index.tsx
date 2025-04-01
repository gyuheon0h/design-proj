import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './Styles';
import App from './App';
import { UserProvider } from './context/UserContext';
import { StorageProvider } from './context/StorageContext';

import './index.css';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <UserProvider>
            <StorageProvider>
              <App />
            </StorageProvider>
          </UserProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
