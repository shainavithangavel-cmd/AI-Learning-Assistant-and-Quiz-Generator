import React from 'react';//write react components
import { BrowserRouter, useLocation } from 'react-router-dom';//imports routing tools and to know current pge url
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './stores/useAuthStore';
import './styles/App.css';

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  palette: {
    primary:  { main: '#4f46e5' },
    success:  { main: '#10b981' },
    warning:  { main: '#f59e0b' },
    error:    { main: '#ef4444' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
});

function AppLayout() {
  const location = useLocation();
  const { user } = useAuthStore();

  const isPublicPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/';

  if (isPublicPage) {
    return <AppRoutes />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {user && <Sidebar />}
      <Box
  component="main"
  sx={{
    flexGrow: 1,
    p: '32px 40px',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    width: `calc(100% - 240px)`,
  }}
>
        <AppRoutes />
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}