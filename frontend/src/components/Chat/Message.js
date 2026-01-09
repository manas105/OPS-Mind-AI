import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Tooltip, 
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SourcePills from './SourcePills';

const StyledMessage = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'isError' && prop !== 'isStreaming',
})(({ theme, isUser, isError, isStreaming }) => ({
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  maxWidth: '75%',
  marginLeft: isUser ? 'auto' : theme.spacing(2),
  marginRight: isUser ? theme.spacing(2) : 'auto',
  background: isError
    ? 'rgba(239, 68, 68, 0.12)'
    : isUser
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'rgba(255, 255, 255, 0.06)',
  backdropFilter: isUser ? 'none' : 'blur(18px)',
  color: isError
    ? theme.palette.error.light
    : theme.palette.text.primary,
  borderRadius: 16,
  wordBreak: 'break-word',
  border: isError 
    ? `1px solid rgba(239, 68, 68, 0.4)` 
    : isUser 
      ? '1px solid rgba(255, 255, 255, 0.12)'
      : '1px solid rgba(255, 255, 255, 0.12)',
  opacity: isStreaming ? 0.85 : 1,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: isUser 
    ? '0 10px 30px rgba(102, 126, 234, 0.25)'
    : isError
      ? '0 4px 12px rgba(239, 68, 68, 0.15)'
      : '0 8px 24px rgba(0, 0, 0, 0.25)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: isUser 
      ? '0 14px 40px rgba(102, 126, 234, 0.3)'
      : isError
        ? '0 6px 16px rgba(239, 68, 68, 0.2)'
        : '0 12px 34px rgba(0, 0, 0, 0.32)',
  },
  '&:before': isStreaming ? {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #667eea, transparent)',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: 36,
            height: 36,
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
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
                color: 'rgba(255, 255, 255, 0.92)',
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
          color: isError ? 'error.light' : 'rgba(255, 255, 255, 0.92)',
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
              bgcolor: 'rgba(255, 255, 255, 0.9)',
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
          background: isError 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : isUser 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #764ba2 0%, #8b5cf6 100%)',
          width: 36,
          height: 36,
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
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
            
            {/* Show SourcePills for assistant messages on mobile, regular chips on desktop */}
            {!isUser && !isError && message.citations && message.citations.length > 0 && (
              isMobile ? (
                <SourcePills 
                  citations={message.citations}
                  onCitationClick={(citation) => {
                    console.log('Citation clicked:', citation);
                    // You can add additional handling here if needed
                  }}
                />
              ) : (
                <Box mt={1}>
                  <Typography 
                    variant="caption" 
                    display="block" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Sources:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {message.citations.map((citation, index) => (
                      <Chip
                        key={index}
                        label={citation.source || 'Document'}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                          height: '20px',
                          maxWidth: '100%',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          },
                        }}
                        title={citation.source || 'Document source'}
                      />
                    ))}
                  </Box>
                </Box>
              )
            )}
          </StyledMessage>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Message;
