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
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import BotIcon from '@mui/icons-material/SmartToy';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';

// Import components
import MessageList from './MessageList';
import InputArea from './InputArea';
import CitationPanel from './CitationPanel';

// Normalize API base: allow REACT_APP_API_URL to be either http://host or http://host/api
// and tolerate accidental leading "hhttps"/"hhttp"
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const CLEAN_API_URL = RAW_API_URL
  .replace(/^hhttps:/i, 'https:')
  .replace(/^hhttp:/i, 'http:');
const API_BASE = CLEAN_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
const API_URL = `${API_BASE}/api`;

const ChatContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  maxWidth: '1400px',
  margin: '0 auto',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 0,
  background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
  boxShadow: 'none',
}));

const HeaderAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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

const SidebarDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
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

  // Validate UUID v4 format
  const isValidSessionId = (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') return false;
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv4Regex.test(sessionId);
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
    const init = async () => {
      const token = localStorage.getItem('token');
      const persistedSessionId = localStorage.getItem('chatSessionId');

      try {
        if (token) {
          // Prefer restoring the last used session first
          const candidateSessionId = persistedSessionId;

          if (candidateSessionId) {
            setSessionId(candidateSessionId);
            const historyRes = await fetch(`${API_BASE_URL}/api/chat/history/${candidateSessionId}?limit=100&includeContext=true`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (historyRes.ok) {
              const historyJson = await historyRes.json();
              const loaded = historyJson?.data?.messages || historyJson?.data?.data?.messages || [];
              if (Array.isArray(loaded) && loaded.length > 0) {
                setMessages(loaded.map(m => ({
                  id: m._id || `${m.role}_${m.createdAt}`,
                  role: m.role,
                  content: m.content,
                  timestamp: m.createdAt || m.updatedAt || new Date().toISOString(),
                  chunks: m.chunks || [],
                  metadata: m.metadata || {}
                })));
              }
            }
          } else {
            // Otherwise, load latest session from server
            const sessionsRes = await fetch(`${API_BASE_URL}/api/chat/history/sessions?limit=1`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (sessionsRes.ok) {
              const sessionsJson = await sessionsRes.json();
              const sessions = sessionsJson?.data || [];
              const latest = sessions?.[0];
              if (latest?.sessionId) {
                setSessionId(latest.sessionId);
                localStorage.setItem('chatSessionId', latest.sessionId);
                const historyRes = await fetch(`${API_BASE_URL}/api/chat/history/${latest.sessionId}?limit=100&includeContext=true`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (historyRes.ok) {
                  const historyJson = await historyRes.json();
                  const loaded = historyJson?.data?.messages || historyJson?.data?.data?.messages || [];
                  if (Array.isArray(loaded)) {
                    setMessages(loaded.map(m => ({
                      id: m._id || `${m.role}_${m.createdAt}`,
                      role: m.role,
                      content: m.content,
                      timestamp: m.createdAt || m.updatedAt || new Date().toISOString(),
                      chunks: m.chunks || [],
                      metadata: m.metadata || {}
                    })));
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        // Fall back to new session
      }

      setSessionId(prev => {
        const finalId = prev || generateSessionId();
        localStorage.setItem('chatSessionId', finalId);
        return finalId;
      });
      setIsLoading(false);
      setConnectionStatus('connected');
    };

    init();
    
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/chat/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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

    // Validate and fix sessionId if needed
    if (sessionId && !isValidSessionId(sessionId)) {
      const newId = generateSessionId();
      console.warn('Invalid sessionId, regenerating:', newId);
      setSessionId(newId);
      localStorage.setItem('chatSessionId', newId);
      return;
    }

    if (sessionId) {
      localStorage.setItem('chatSessionId', sessionId);
    }

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
      const token = localStorage.getItem('token');
      const effectiveSessionId = sessionId || generateSessionId();
      console.log('📤 Sending chat message:', { message: message.substring(0, 50), sessionId: effectiveSessionId, hasToken: !!token });

      // Send the message and handle streaming response
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: message,
          sessionId: effectiveSessionId,
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

  // Fetch chat sessions
  const fetchChatSessions = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Handle selecting a session
  const handleSelectSession = useCallback(async (selectedSessionId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSessionId(selectedSessionId);
    localStorage.setItem('chatSessionId', selectedSessionId);
    setMessages([]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/history/${selectedSessionId}?limit=100&includeContext=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const loaded = data?.data?.messages || data?.data?.data?.messages || [];
        if (Array.isArray(loaded)) {
          setMessages(loaded.map(m => ({
            id: m._id || `${m.role}_${m.createdAt}`,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt || m.updatedAt || new Date().toISOString(),
            chunks: m.chunks || [],
            metadata: m.metadata || {}
          })));
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
      setSidebarOpen(false);
    }
  }, []);

  // Handle creating new chat
  const handleNewChat = useCallback(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);
    setMessages([]);
    setSidebarOpen(false);
  }, []);

  // Handle deleting a session
  const handleDeleteSession = useCallback(async (e, sessionIdToDelete) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionIdToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setChatSessions(prev => prev.filter(s => s.sessionId !== sessionIdToDelete));
        if (sessionId === sessionIdToDelete) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [sessionId, handleNewChat]);

  // Format date for session display
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  // Fetch chat sessions when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      fetchChatSessions();
    }
  }, [sidebarOpen, fetchChatSessions]);

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
            <Tooltip title="Chat History">
              <IconButton
                size="small"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
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
              <IconButton
                size="small"
                onClick={() => setSidebarOpen(true)}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </HeaderAppBar>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Chat History
          </Typography>
          <ListItemButton
            onClick={handleNewChat}
            sx={{
              mb: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #8b5cf6 0%, #667eea 100%)',
              },
            }}
          >
            <ListItemIcon>
              <AddIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="New Chat" />
          </ListItemButton>
          <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          {isLoadingSessions ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : chatSessions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No chat history yet
            </Typography>
          ) : (
            <List>
              {chatSessions.map((session) => (
                <ListItem
                  key={session.sessionId}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleDeleteSession(e, session.sessionId)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    selected={session.sessionId === sessionId}
                    onClick={() => handleSelectSession(session.sessionId)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        background: 'rgba(102, 126, 234, 0.15)',
                      },
                      '&.Mui-selected:hover': {
                        background: 'rgba(102, 126, 234, 0.2)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={session.title || 'New Chat'}
                      primaryTypographyProps={{
                        noWrap: true,
                        variant: 'body2',
                      }}
                      secondary={formatDate(session.lastMessageAt || session.createdAt)}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </SidebarDrawer>

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
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.02)'
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
          <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
