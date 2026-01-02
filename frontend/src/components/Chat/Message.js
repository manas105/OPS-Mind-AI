import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Tooltip, 
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const StyledMessage = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'isError' && prop !== 'isStreaming',
})(({ theme, isUser, isError, isStreaming }) => ({
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  maxWidth: '75%',
  marginLeft: isUser ? 'auto' : theme.spacing(2),
  marginRight: isUser ? theme.spacing(2) : 'auto',
  backgroundColor: isError 
    ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
    : isUser 
      ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' // Light blue background
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  color: isError 
    ? theme.palette.error.main
    : isUser 
      ? '#000000 !important' // Black text for user messages
      : '#1e293b', // Dark text for assistant messages
  borderRadius: 16,
  wordBreak: 'break-word',
  border: isError 
    ? `1px solid ${theme.palette.error.main}` 
    : isUser 
      ? '1px solid transparent'
      : `1px solid ${theme.palette.grey[200]}`,
  opacity: isStreaming ? 0.85 : 1,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: isUser 
    ? '0 4px 12px rgba(37, 99, 235, 0.15)'
    : isError
      ? '0 4px 12px rgba(239, 68, 68, 0.15)'
      : '0 2px 8px rgba(0, 0, 0, 0.04)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: isUser 
      ? '0 6px 16px rgba(37, 99, 235, 0.2)'
      : isError
        ? '0 6px 16px rgba(239, 68, 68, 0.2)'
        : '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  '&:before': isStreaming ? {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #2563eb, transparent)',
    animation: 'shimmer 2s infinite',
  } : {},
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
}));

const Message = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;
  const formattedTime = new Date(message.timestamp).toLocaleTimeString();

  console.log('📨 Message component received:', message);
  console.log('👤 Is user message:', isUser);
  console.log('📝 Message content:', message.content);
  console.log('🎨 Message role:', message.role);
  console.log('🔍 Message content length:', message.content?.length);
  console.log('🔍 Message content type:', typeof message.content);
  
  // Force visible content for user messages during debugging
  if (isUser) {
    console.log('🔧 DEBUG: Forcing visible content for user message');
    return (
      <Box 
        display="flex" 
        flexDirection={isUser ? 'row-reverse' : 'row'} 
        alignItems="flex-start" 
        mb={2}
      >
        <Avatar 
          sx={{ 
            bgcolor: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            width: 36,
            height: 36,
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '2px solid #ffffff',
          }}
        >
          U
        </Avatar>
        
        <Box ml={isUser ? 0 : 1} mr={isUser ? 1 : 0} minWidth={0} flex={1}>
          <StyledMessage 
            elevation={3} 
            isUser={isUser}
            isError={false}
            isStreaming={false}
          >
            <Typography 
              variant="body1" 
              sx={{
                color: '#1e293b !important', // Dark text for user messages
                fontWeight: 400,
                lineHeight: 1.6,
                fontSize: '16px',
                wordBreak: 'break-word'
              }}
            >
              {message.content || 'No content - this is a debug message'}
            </Typography>
          </StyledMessage>
        </Box>
      </Box>
    );
  }

  // Add a subtle typing indicator when message is streaming
  const renderContent = () => {
    if (isError) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <ErrorOutlineIcon fontSize="small" />
          <Typography 
            variant="body1"
            sx={{ color: 'error.main' }}
          >
            {message.content || 'Error occurred'}
          </Typography>
        </Box>
      );
    }

    if (isStreaming && !message.content) {
      return (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box 
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                animation: 'bounce 1.4s infinite ease-in-out both',
                '&:nth-of-type(1)': { animationDelay: '-0.32s' },
                '&:nth-of-type(2)': { animationDelay: '-0.16s' },
                '@keyframes bounce': {
                  '0%, 80%, 100%': { transform: 'scale(0)' },
                  '40%': { transform: 'scale(1)' },
                },
              }}
            />
            <Box 
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '-0.16s',
              }}
            />
            <Box 
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                animation: 'bounce 1.4s infinite ease-in-out both',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Thinking...
          </Typography>
        </Box>
      );
    }

    return (
      <Typography 
        variant="body1" 
        component="div"
        sx={{
          color: isUser 
            ? '#1e293b !important' // Dark text for user messages
            : isError 
              ? 'error.main' 
              : '#1e293b', // Dark text for assistant messages
          fontWeight: 400,
          lineHeight: 1.6,
          fontSize: '16px',
          wordBreak: 'break-word'
        }}
      >
        {/* No debug indicator for user messages */}
        {message.content || ''}
        {isStreaming && (
          <Box 
            component="span" 
            sx={{
              display: 'inline-block',
              width: '8px',
              height: '16px',
              ml: 0.5,
              bgcolor: isUser ? 'white' : '#1e293b',
              animation: 'blink 1s step-end infinite',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0 },
              },
            }}
          />
        )}
      </Typography>
    );
  };

  return (
    <Box 
      display="flex" 
      flexDirection={isUser ? 'row-reverse' : 'row'} 
      alignItems="flex-start" 
      mb={2}
      sx={{
        opacity: isStreaming ? 0.9 : 1,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <Avatar 
        sx={{ 
          bgcolor: isError 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : isUser 
              ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
          width: 36,
          height: 36,
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '2px solid #ffffff',
        }}
      >
        {isError ? '!' : isUser ? 'U' : '🤖'}
      </Avatar>
      
      <Box ml={isUser ? 0 : 1} mr={isUser ? 1 : 0} minWidth={0} flex={1}>
        <Tooltip 
          title={formattedTime} 
          arrow 
          placement={isUser ? 'left' : 'right'}
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: '0.75rem',
                bgcolor: 'rgba(97, 97, 97, 0.9)',
              },
            },
          }}
        >
          <StyledMessage 
            elevation={isError ? 2 : 3} 
            isUser={isUser}
            isError={isError}
            isStreaming={isStreaming}
          >
            {renderContent()}
            
            {message.chunks && message.chunks.length > 0 && (
              <Box mt={1}>
                <Typography 
                  variant="caption" 
                  display="block" 
                  color={isUser || isError ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}
                  sx={{ fontWeight: 500 }}
                >
                  Sources:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                  {message.chunks.map((chunk, index) => (
                    <Chip
                      key={index}
                      label={chunk.source || 'Document'}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: isUser || isError ? 'rgba(255, 255, 255, 0.7)' : 'inherit',
                        borderColor: isUser || isError ? 'rgba(255, 255, 255, 0.3)' : 'inherit',
                        fontSize: '0.7rem',
                        height: '20px',
                        maxWidth: '100%',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      }}
                      title={chunk.source || 'Document source'}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </StyledMessage>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Message;
