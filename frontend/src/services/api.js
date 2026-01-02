import axios from 'axios';
import { getToken } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

console.log('API Base URL:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📤 Request data:', config.data);
    console.log('🔗 Full URL:', config.baseURL + config.url);
    
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    console.log('📥 Response data:', response.data);
    return response;
  },
  async (error) => {
    console.error('❌ Response Error:', error.config?.method?.toUpperCase(), error.config?.url);
    console.error('🔥 Error status:', error.response?.status);
    console.error('📄 Error data:', error.response?.data);
    console.error('💬 Full error:', error.message);
    
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token if refresh token is available
        // const response = await apiClient.post('/auth/refresh-token');
        // const { token } = response.data;
        // localStorage.setItem('token', token);
        // originalRequest.headers.Authorization = `Bearer ${token}`;
        // return apiClient(originalRequest);
      } catch (error) {
        // If refresh fails, clear auth and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Simple EventSource implementation that works with POST requests
class PostEventSource {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.onmessage = null;
    this.onerror = null;
    this.controller = null;
  }

  connect() {
    const controller = new AbortController();
    this.controller = controller;
    
    const { headers = {}, body, ...fetchOptions } = this.options;
    
    fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...headers,
      },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
      ...fetchOptions,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const processStream = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            if (this.onclose) this.onclose();
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete events
          const events = buffer.split('\n\n');
          buffer = events.pop(); // Keep incomplete event in buffer
          
          for (const event of events) {
            if (!event.trim()) continue;
            
            let data = '';
            event.split('\n').forEach(line => {
              if (line.startsWith('data: ')) {
                data += line.substring(6);
              }
            });
            
            try {
              // Handle [DONE] message
              if (data.trim() === '[DONE]') {
                if (this.ondone) {
                  this.ondone();
                }
                return;
              }
              
              const parsedData = JSON.parse(data);
              if (this.onmessage) {
                this.onmessage({ data: JSON.stringify(parsedData) });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, 'Data:', data);
            }
          }
          
          processStream();
        }).catch(error => {
          if (error.name !== 'AbortError' && this.onerror) {
            this.onerror(error);
          }
        });
      };
      
      processStream();
    })
    .catch(error => {
      if (this.onerror) this.onerror(error);
    });
  }
  
  close() {
    if (this.controller) {
      this.controller.abort();
    }
  }
}

// Auth API
const auth = {
  // Register a new user
  register: (userData) => apiClient.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => apiClient.post('/auth/login', credentials),
  
  // Get current user profile
  getProfile: () => apiClient.get('/auth/me'),
  
  // Update user profile
  updateProfile: (userData) => apiClient.put('/auth/me', userData)
};

// Chat API
const chat = {
  // Send a new message with streaming support
  sendMessage: async (message, sessionId, onChunk, onComplete) => {
    // Use streaming chat endpoint (now public)
    try {
      // Use custom EventSource implementation for POST request
      const eventSource = new PostEventSource(`${API_BASE_URL}/chat`, {
        headers: {
          'Accept': 'text/event-stream',
        },
        body: {
          query: message,
          sessionId: sessionId || ''
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      // Start the connection
      eventSource.connect();

      let fullResponse = '';
      let receivedSessionId = null;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'sessionId') {
            receivedSessionId = data.data;
            if (onComplete) {
              onComplete({ sessionId: receivedSessionId });
            }
            return;
          }
          
          const text = data.data || event.data;
          if (text) {
            fullResponse += text;
            onChunk(text);
          }
        } catch (e) {
          console.error('Error parsing SSE message:', e, 'Data:', event.data);
          // Try to handle as plain text if JSON parsing fails
          if (event.data && event.data !== '[DONE]') {
            fullResponse += event.data;
            onChunk(event.data);
          }
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        if (onComplete) {
          onComplete({ 
            content: fullResponse,
            sessionId: receivedSessionId || sessionId,
            error: 'Connection error occurred'
          });
        }
      };

      // Handle stream completion
      eventSource.ondone = () => {
        if (onComplete) {
          onComplete({
            content: fullResponse,
            sessionId: receivedSessionId || sessionId,
            isComplete: true
          });
        }
      };
      
      // Store the cleanup function and return it
      return () => {
        eventSource.close();
      };
    } catch (error) {
      console.error('Error setting up SSE:', error);
      throw error;
    }
  },

  // Get chat history with pagination
  getChatHistory: (sessionId, options = {}) => {
    const { limit = 20, before } = options;
    return apiClient.get(`/chat/history/${sessionId}`, {
      params: { limit, before, includeContext: true }
    });
  },
  
  // Get recent chat sessions
  getChatSessions: (limit = 10) => {
    return apiClient.get('/chat/history/sessions', { params: { limit } });
  },
  
  // Delete a chat session
  deleteChatSession: (sessionId) => {
    return apiClient.delete(`/chat/history/${sessionId}`);
  },
  
  // Clear all chat history
  clearAllChats: () => {
    return apiClient.post('/chat/history/clear-all');
  },

  // Analytics methods for admin dashboard
  getAnalyticsData: (endpoint, timeRange = '7d') => {
    return apiClient.get(`/analytics/${endpoint}`, {
      params: { timeRange }
    });
  },

  // Submit feedback
  submitFeedback: (sessionId, rating, comment = '') => {
    return apiClient.post('/feedback', {
      sessionId,
      rating,
      comment
    });
  },

  // Generate a unique session ID
  generateSessionId: () => {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Combine all API modules
const api = {
  // Auth methods
  register: auth.register,
  login: auth.login,
  getProfile: auth.getProfile,
  updateProfile: auth.updateProfile,
  
  // Chat methods
  sendMessage: chat.sendMessage,
  getChatHistory: chat.getChatHistory,
  getChatSessions: chat.getChatSessions,
  deleteChatSession: chat.deleteChatSession,
  clearAllChats: chat.clearAllChats,
  getAnalyticsData: chat.getAnalyticsData,
  submitFeedback: chat.submitFeedback,
  generateSessionId: chat.generateSessionId,
  
  // Direct axios client for advanced usage
  client: apiClient,
  
  // Generic HTTP methods
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
  
  // Set default headers
  setHeader: (name, value) => {
    apiClient.defaults.headers.common[name] = value;
  },
  removeHeader: (name) => {
    delete apiClient.defaults.headers.common[name];
  }
};

export default api;
