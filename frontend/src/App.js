import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Button, Typography } from '@mui/material';
import Chat from './components/Chat/Chat';
import KnowledgeGraph from './components/Admin/KnowledgeGraph';
import Landing from './components/Landing/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Unauthorized from './components/auth/Unauthorized';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
      light: '#8b5cf6',
      dark: '#764ba2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#8b5cf6',
      dark: '#667eea',
      contrastText: '#ffffff',
    },
    background: {
      default: '#000000',
      paper: 'rgba(255, 255, 255, 0.1)',
    },
    grey: {
      50: '#1a1a2e',
      100: '#16213e',
      200: '#1f2937',
      300: '#374151',
      400: '#4b5563',
      500: '#6b7280',
      600: '#9ca3af',
      700: '#d1d5db',
      800: '#e5e7eb',
      900: '#f3f4f6',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
      fontSize: '1.75rem',
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 500,
          padding: '8px 16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
          },
        },
      },
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('landing');

  const handleNavigate = (view) => {
    console.log('🧭 Navigating to:', view);
    setCurrentView(view);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent currentView={currentView} onNavigate={handleNavigate} />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Separate component to use AuthContext properly
function AppContent({ currentView, onNavigate }) {
  const auth = useAuth();
  const user = auth?.user;

  // Show loading state while auth is initializing
  if (auth?.loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)'
      }}>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {currentView === 'landing' ? (
        <Landing onNavigate={onNavigate} />
      ) : currentView === 'login' ? (
        <Login onNavigate={onNavigate} />
      ) : currentView === 'register' ? (
        <Register onNavigate={onNavigate} />
      ) : currentView === 'unauthorized' ? (
        <Unauthorized onNavigate={onNavigate} />
      ) : (
        <>
          {/* Navigation Header */}
          <Box sx={{ 
            p: 2, 
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
            borderBottom: '1px solid rgba(37, 99, 235, 0.1)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                OpsMind AI
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant={currentView === 'chat' ? 'contained' : 'outlined'}
                  onClick={() => onNavigate('chat')}
                  size="small"
                >
                  Chat
                </Button>
                {user?.role === 'admin' && (
                  <Button 
                    variant={currentView === 'admin' ? 'contained' : 'outlined'}
                    onClick={() => onNavigate('admin')}
                    size="small"
                    color="secondary"
                  >
                    Admin Dashboard
                  </Button>
                )}
                <Button 
                  variant="outlined"
                  onClick={() => onNavigate('landing')}
                  size="small"
                  color="inherit"
                >
                  Back to Home
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Main Content with RBAC Protection */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {currentView === 'chat' ? (
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <Chat />
              </ProtectedRoute>
            ) : currentView === 'admin' ? (
              <ProtectedRoute allowedRoles={['admin']}>
                <KnowledgeGraph />
              </ProtectedRoute>
            ) : null}
          </Box>
        </>
      )}
    </div>
  );
}

export default App;
