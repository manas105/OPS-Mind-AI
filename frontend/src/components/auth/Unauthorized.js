import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';

const Unauthorized = ({ onNavigate }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        sx={{
          p: 6,
          maxWidth: 500,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '4rem',
            fontWeight: 700,
            color: '#dc2626',
            mb: 2,
          }}
        >
          403
        </Typography>
        
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: '#1e293b',
            mb: 2,
          }}
        >
          Access Denied
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            color: '#64748b',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => onNavigate('landing')}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              },
            }}
          >
            Go Home
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Unauthorized;
