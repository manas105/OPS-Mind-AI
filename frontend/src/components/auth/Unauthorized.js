import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';

const Unauthorized = ({ onNavigate }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
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
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 4,
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.35)',
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
            color: 'rgba(255, 255, 255, 0.92)',
            mb: 2,
          }}
        >
          Access Denied
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #8b5cf6 0%, #667eea 100%)',
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
