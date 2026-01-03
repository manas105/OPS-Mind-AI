import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

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
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
      }}
    >
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
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.22)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
            },
            '&.Mui-focused': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.18)',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '12px 16px',
            fontSize: '0.95rem',
          },
          '& .MuiInputBase-input::placeholder': {
            opacity: 0.7,
          },
        }}
        multiline
        maxRows={4}
        disabled={isSending || disabled}
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
            ? 'rgba(255, 255, 255, 0.08)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: !message.trim() || isSending || disabled ? 'rgba(255, 255, 255, 0.55)' : 'white',
          boxShadow: !message.trim() || isSending || disabled
            ? 'none'
            : '0 10px 30px rgba(102, 126, 234, 0.25)',
          transition: 'all 0.2s ease-in-out',
          '&:hover:not(:disabled)': {
            background: 'linear-gradient(135deg, #8b5cf6 0%, #667eea 100%)',
            transform: 'scale(1.05)',
            boxShadow: '0 14px 40px rgba(102, 126, 234, 0.3)',
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
