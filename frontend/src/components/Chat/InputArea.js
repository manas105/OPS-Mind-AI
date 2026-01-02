import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const InputArea = ({ onSendMessage, isSending, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1.5,
        padding: 2,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
      }}
    >
      <IconButton 
        size="small"
        sx={{
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <AttachFileIcon fontSize="small" />
      </IconButton>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Ask anything about your documents..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid',
            borderColor: 'grey.200',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
            '&.Mui-focused': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '12px 16px',
            fontSize: '0.95rem',
          },
        }}
        multiline
        maxRows={4}
        disabled={isSending || disabled}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <MicIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <IconButton 
        type="submit" 
        color="primary" 
        disabled={!message.trim() || isSending || disabled}
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: !message.trim() || isSending || disabled 
            ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
            : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
          color: !message.trim() || isSending || disabled ? 'text.secondary' : 'white',
          boxShadow: !message.trim() || isSending || disabled 
            ? 'none'
            : '0 4px 12px rgba(37, 99, 235, 0.3)',
          transition: 'all 0.2s ease-in-out',
          '&:hover:not(:disabled)': {
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            transform: 'scale(1.05)',
            boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
          },
          '&:active:not(:disabled)': {
            transform: 'scale(0.95)',
          },
        }}
      >
        {isSending ? (
          <CircularProgress size={20} color="inherit" thickness={2} />
        ) : (
          <SendIcon />
        )}
      </IconButton>
    </Box>
  );
};

export default InputArea;
