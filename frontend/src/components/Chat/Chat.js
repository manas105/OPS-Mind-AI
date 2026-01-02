import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Snackbar, 
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  AppBar,
  Toolbar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import BotIcon from '@mui/icons-material/SmartToy';
import { styled } from '@mui/material/styles';

// Import components
import MessageList from './MessageList';
import InputArea from './InputArea';
import CitationPanel from './CitationPanel';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ChatContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  maxWidth: '1400px',
  margin: '0 auto',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 0,
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  boxShadow: 'none',
}));

const HeaderAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  boxShadow: 'none',
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 500,
  backgroundColor: status === 'connected' 
    ? theme.palette.success.light + '20'
    : status === 'searching'
    ? theme.palette.warning.light + '20'
    : theme.palette.grey[100],
  color: status === 'connected' 
    ? theme.palette.success.dark
    : status === 'searching'
    ? theme.palette.warning.dark
    : theme.palette.text.secondary,
  '& .MuiChip-label': {
    fontWeight: 500,
  },
}));

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [currentCitations, setCurrentCitations] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [showCitations, setShowCitations] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  const streamingContentRef = useRef('');
  const currentCitationsRef = useRef([]);
  const fetchSuggestionsRef = useRef(null);

  // Generate session ID
  const generateSessionId = () => {
    // Generate a proper UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Clean up event source
  const cleanupStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    // Don't call streamCleanupRef.current here to avoid circular reference
  }, []);

  // Initialize session on component mount
  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setIsLoading(false);
    setConnectionStatus('connected');
    
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  // Optimized scroll to bottom with throttling
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Throttled scroll effect to reduce performance impact
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, streamingContent, scrollToBottom]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (chunks = []) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chunks
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💡 Suggestions fetched:', suggestions);
        setSuggestions(data.data.suggestions || []);
      } else {
        console.error('Error fetching suggestions:', response.status);
        // Don't fail silently - provide fallback
        setSuggestions([
          "What documents are available for search?",
          "How can I help you refine your search query?",
          "Can you tell me more about the uploaded documents?"
        ]);
        setShowSuggestions(true); // Show suggestions even on error
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Don't fail silently - provide fallback
      setSuggestions([
        "What documents are available for search?",
        "How can I help you refine your search query?",
        "Can you tell me more about the uploaded documents?"
      ]);
      setShowSuggestions(true); // Show suggestions even on error
    }
  }, [sessionId, suggestions]);

  // Update refs when state changes
  useEffect(() => {
    streamingContentRef.current = streamingContent;
  }, [streamingContent]);

  useEffect(() => {
    currentCitationsRef.current = currentCitations;
  }, [currentCitations]);

  useEffect(() => {
    fetchSuggestionsRef.current = fetchSuggestions;
  }, [fetchSuggestions]);

  // Handle streaming events - optimized for performance
  const handleStreamingEvent = useCallback((data) => {
    if (!data?.event) return;
    
    // Use requestAnimationFrame for non-critical updates
    const updateUI = (updater) => {
      try {
        updater();
      } catch (error) {
        console.error('UI update error:', error);
      }
    };
    
    switch (data.event) {
      case 'start':
        updateUI(() => setConnectionStatus('connected'));
        break;
        
      case 'status':
        updateUI(() => setConnectionStatus(data.message?.includes('Searching') ? 'searching' : 'generating'));
        break;
        
      case 'search_results':
        // Only log if chunks found to reduce noise
        if (data.chunksFound > 0) {
          console.log('🔍 Search results:', data.chunksFound, 'chunks found');
        }
        break;
        
      case 'content':
        // Only log final content events to reduce noise
        if (data.final) {
          console.log('📝 Final content event:', { content: data.content?.substring(0, 100) + '...' });
        }
        // Batch content updates for better performance
        updateUI(() => {
          if (data.final) {
            // Replace streaming content with final content (includes citations)
            setStreamingContent(data.content || '');
            streamingContentRef.current = data.content || ''; // Update ref immediately
            console.log('✅ Final content set:', data.content?.substring(0, 100) + '...');
          } else {
            // Append streaming content
            const newContent = streamingContent + (data.content || '');
            setStreamingContent(newContent);
            streamingContentRef.current = newContent; // Update ref immediately
          }
        });
        break;
        
      case 'citations':
        updateUI(() => {
          setCurrentCitations(data.citations || []);
          if (data.citations?.length > 0) {
            setShowCitations(true);
          }
        });
        break;
        
      case 'complete':
        console.log('🏁 Complete event received');
        console.log('📊 streamingContentRef.current:', streamingContentRef.current?.substring(0, 100) + '...');
        // Batch all final updates
        updateUI(() => {
          // Store the content before clearing streaming content
          const finalContent = streamingContentRef.current;
          
          const assistantMessage = {
            id: Date.now(),
            role: 'assistant',
            content: finalContent,
            timestamp: new Date().toISOString(),
            citations: currentCitationsRef.current,
            metadata: {
              responseTime: data.responseTime,
              totalTokens: data.totalTokens,
            }
          };
          
          console.log('💬 Creating assistant message:', assistantMessage.content?.substring(0, 100) + '...');
          setMessages(prev => {
            const newMessages = [...prev, assistantMessage];
            console.log('📨 Messages state updated:', newMessages.length, 'messages');
            return newMessages;
          });
          
          // Clear streaming content and update status
          setStreamingContent('');
          setConnectionStatus('connected');
          setIsSending(false);
          
          // Clear ref after a small delay to ensure state updates are processed
          setTimeout(() => {
            streamingContentRef.current = '';
            console.log('🧹 Ref cleared after delay');
          }, 0);
        });
        
        // Defer suggestions to next frame to reduce blocking
        requestAnimationFrame(() => {
          fetchSuggestionsRef.current?.();
        });
        break;
        
      case 'error':
        updateUI(() => {
          setError(data.message || 'An error occurred');
          setConnectionStatus('error');
          setIsSending(false);
        });
        break;
        
      default:
        // Reduce console noise for unknown events
        if (process.env.NODE_ENV === 'development' && data.event !== 'ping') {
          console.log('Unknown event:', data.event);
        }
        break;
    }
  }, [streamingContent]);

  // Optimized SSE parsing with error recovery
  const parseSSELine = useCallback((line) => {
    try {
      if (line.startsWith('event:')) {
        const eventValue = line.replace('event:', '').trim();
        return { type: 'event', value: eventValue || 'message' };
      }
      
      if (line.startsWith('data:')) {
        const dataStr = line.replace('data:', '').trim();
        if (dataStr) {
          const data = JSON.parse(dataStr);
          // Only log important events to reduce noise
          if (data.event && ['content', 'complete', 'search_results'].includes(data.event)) {
            console.log('🔍 SSE Data parsed:', { event: data.event, type: typeof data.event });
          }
          return { type: 'data', value: data };
        }
      }
      return null;
    } catch (error) {
      console.error('SSE parse error:', error, 'Line:', line);
      return null;
    }
  }, []);

  // Optimized streaming response handler
  const handleStreamingResponse = useCallback(async (reader) => {
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    let parseCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        // Process lines in batches to reduce overhead
        const validLines = lines.filter(line => line.trim());
        
        for (const line of validLines) {
          const parsed = parseSSELine(line);
          if (!parsed) continue;

          if (parsed.type === 'event') {
            currentEvent = parsed.value;
          } else if (parsed.type === 'data') {
            const data = parsed.value;
            if (currentEvent) {
              data.event = currentEvent;
              currentEvent = '';
            }
            
            // Throttle event processing to prevent UI blocking
            if (parseCount % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
            
            handleStreamingEvent(data);
            parseCount++;
          }
        }
      }
    } catch (error) {
      console.error('Streaming response error:', error);
      setError('Connection interrupted');
      setConnectionStatus('error');
      setIsSending(false);
    }
  }, [parseSSELine, handleStreamingEvent]);

  // Handle sending message with streaming
  const handleSendMessage = useCallback(async (message) => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    setStreamingContent('');
    setCurrentCitations([]);
    setShowSuggestions(false);

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send the message and handle streaming response
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      await handleStreamingResponse(reader);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setIsSending(false);
      setConnectionStatus('error');
    }
  }, [sessionId, isSending, handleStreamingResponse]);

  // Clear chat
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setCurrentCitations([]);
    setStreamingContent('');
    setShowSuggestions(false);
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
  }, []);

  // Retry last message
  const handleRetry = useCallback(() => {
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  }, [messages, handleSendMessage]);

  // Get status color and text
  const getStatusInfo = useCallback(() => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'success', text: 'Connected', icon: '🟢' };
      case 'searching':
        return { color: 'warning', text: 'Searching...', icon: '🔍' };
      case 'generating':
        return { color: 'info', text: 'Generating...', icon: '⚡' };
      case 'error':
        return { color: 'error', text: 'Error', icon: '❌' };
      default:
        return { color: 'default', text: 'Disconnected', icon: '⚫' };
    }
  }, [connectionStatus]);

  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <ChatContainer>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100vh"
        >
          <Box textAlign="center">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
              Initializing OpsMind AI...
            </Typography>
          </Box>
        </Box>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer elevation={0}>
      {/* Header */}
      <HeaderAppBar position="static" elevation={0}>
        <Toolbar>
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <BotIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              OpsMind AI Chat
            </Typography>
            <StatusChip 
              size="small"
              status={connectionStatus}
              label={`${statusInfo.icon} ${statusInfo.text}`}
            />
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Clear Chat">
              <IconButton 
                onClick={handleClearChat}
                disabled={isSending}
                size="small"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chat History">
              <IconButton size="small">
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </HeaderAppBar>

      {/* Main Content */}
      <Box display="flex" flex={1} overflow="hidden">
        {/* Messages Area */}
        <Box flex={1} display="flex" flexDirection="column" position="relative">
          <MessageList 
            messages={messages}
            streamingContent={streamingContent}
            isSending={isSending}
          />
          
          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <Box 
              sx={{ 
                p: 2, 
                borderTop: '1px solid',
                borderColor: 'divider',
                background: 'rgba(37, 99, 235, 0.02)'
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Suggested Questions:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    variant="outlined"
                    size="small"
                    clickable
                    onClick={() => handleSendMessage(suggestion)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Input Area */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <InputArea
              onSendMessage={handleSendMessage}
              disabled={isSending || connectionStatus === 'error'}
              placeholder={connectionStatus === 'error' ? "Retry or type a new message..." : "Ask about your documents..."}
            />
          </Box>
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Citations Panel */}
        {showCitations && currentCitations.length > 0 && (
          <>
            <Divider orientation="vertical" flexItem />
            <CitationPanel 
              citations={currentCitations}
              onClose={() => setShowCitations(false)}
            />
          </>
        )}
      </Box>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
          action={
            <IconButton 
              size="small" 
              aria-label="retry" 
              onClick={handleRetry}
              color="inherit"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Snackbar>
    </ChatContainer>
  );
};

export default Chat;
