import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
  Avatar
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  People as PeopleIcon,
  Description as DocumentIcon,
  QuestionAnswer as QuestionIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  SmartToy as BotIcon,
  UploadFile as UploadFileIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import api from '../../services/api';
import UserManagement from './UserManagement';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const KnowledgeGraph = () => {
  const { user, isAuthenticated } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    setUploading(true);
    setUploadSuccess(null);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Get text response (likely HTML error page)
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 200)}...`);
      }

      if (response.ok) {
        setUploadSuccess(`File uploaded successfully! Processed ${data.chunks} chunks.`);
        loadAnalyticsData();
      } else {
        setError(`Upload failed: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all analytics data in parallel
      const [usageMetrics, documentAnalytics, topicAnalytics, hourlyUsage] = await Promise.all([
        // Get usage metrics
        api.get('/analytics/usage', { params: { timeRange } }),
        // Get document analytics
        api.get('/analytics/documents', { params: { timeRange } }),
        // Get topic analytics
        api.get('/analytics/topics', { params: { timeRange } }),
        // Get hourly usage
        api.get('/analytics/hourly', { params: { timeRange } })
      ]);

      setAnalyticsData({
        usageMetrics: usageMetrics.data?.data || {},
        documentAnalytics: documentAnalytics.data?.data || [],
        topicAnalytics: topicAnalytics.data?.data || [],
        hourlyUsage: hourlyUsage.data?.data || []
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadAnalyticsData();
    }
  }, [isAuthenticated, user, loadAnalyticsData]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (autoRefresh && isAuthenticated && user?.role === 'admin') {
      // Set up polling interval (every 30 seconds)
      pollingIntervalRef.current = setInterval(() => {
        loadAnalyticsData();
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, isAuthenticated, user, loadAnalyticsData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/analytics/export', { 
        params: { timeRange },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export analytics data');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  
  const renderOverviewCards = () => {
    if (!analyticsData?.usageMetrics) return null;

    const { totalQueries, uniqueUserCount, avgResponseTime, totalCitations } = analyticsData.usageMetrics;

    return (
      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Queries
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatNumber(totalQueries || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <QuestionIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatNumber(uniqueUserCount || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4" component="div">
                    {avgResponseTime ? `${avgResponseTime}ms` : '0ms'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light' }}>
                  <SpeedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Citations
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatNumber(totalCitations || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderUsageChart = () => {
    if (!analyticsData?.hourlyUsage) return null;

    return (
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usage Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.hourlyUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.7)' }}
              />
              <YAxis tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.7)' }} />
              <ChartTooltip />
              <Area
                type="monotone"
                dataKey="queryCount"
                stroke="#667eea"
                fill="#667eea"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderDocumentAnalytics = () => {
    if (!analyticsData?.documentAnalytics) return null;

    return (
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Document Analytics
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.documentAnalytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="fileName"
                tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.7)' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.7)' }} />
              <ChartTooltip />
              <Bar dataKey="accessCount" fill="#764ba2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderTopicAnalytics = () => {
    if (!analyticsData?.topicAnalytics) return null;

    return (
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Topic Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.topicAnalytics}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalMentions"
                label={{ fill: 'rgba(255, 255, 255, 0.7)' }}
              >
                {analyticsData.topicAnalytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderRecentActivity = () => {
    // Mock recent activity data
    const recentActivity = [
      { id: 1, type: 'query', user: 'John Doe', query: 'What are the company policies?', time: '2 mins ago' },
      { id: 2, type: 'document', user: 'Jane Smith', document: 'HR-Policy-2024.pdf', time: '5 mins ago' },
      { id: 3, type: 'query', user: 'Bob Johnson', query: 'How to request time off?', time: '8 mins ago' },
      { id: 4, type: 'system', user: 'System', message: 'New document uploaded: Employee-Handbook.pdf', time: '12 mins ago' },
    ];

    return (
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List>
            {recentActivity.map((activity) => (
              <ListItem key={activity.id}>
                <ListItemIcon>
                  {activity.type === 'query' && <QuestionIcon color="primary" />}
                  {activity.type === 'document' && <DocumentIcon color="success" />}
                  {activity.type === 'system' && <BotIcon color="info" />}
                </ListItemIcon>
                <ListItemText
                  primary={activity.query || activity.document || activity.message}
                  secondary={`${activity.user} • ${activity.time}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Alert severity="error">
          You need to be logged in as an administrator to access this page.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Alert 
          severity="error" 
          action={
            <Button onClick={handleRefresh} variant="outlined">
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 3,
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography
          variant="h4"
          component="div"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Admin Dashboard
        </Typography>
        
        <Box display="flex" gap={2}>
          {/* File Upload Button */}
          <Tooltip title="Upload PDF Document">
            <Button
              variant="contained"
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                },
              }}
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
            </Button>
          </Tooltip>

          {/* Time Range Selector */}
          <Box>
            <Button
              size="small"
              variant={timeRange === '1d' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('1d')}
            >
              1D
            </Button>
            <Button
              size="small"
              variant={timeRange === '7d' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('7d')}
            >
              7D
            </Button>
            <Button
              size="small"
              variant={timeRange === '30d' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('30d')}
            >
              30D
            </Button>
          </Box>

          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}>
            <IconButton 
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? "primary" : "default"}
            >
              <SyncIcon sx={{ 
                animation: autoRefresh ? 'spin 2s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export Analytics">
            <IconButton onClick={handleExportData}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Last Updated Display */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {autoRefresh && " (Auto-refresh enabled)"}
          </Typography>
        </Box>
      </Box>

      {/* Upload Success Message */}
      {uploadSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setUploadSuccess(null)}
        >
          {uploadSuccess}
        </Alert>
      )}

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid xs={12} md={8}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Usage Trends" />
            <Tab label="Document Analytics" />
            <Tab label="Topic Distribution" />
          </Tabs>
          
          <Box sx={{ mt: 2 }}>
            {currentTab === 0 && renderUsageChart()}
            {currentTab === 1 && renderDocumentAnalytics()}
            {currentTab === 2 && renderTopicAnalytics()}
          </Box>
        </Grid>

        <Grid xs={12} md={4}>
          {renderRecentActivity()}
        </Grid>
      </Grid>

      {/* User Management Section */}
      <Box sx={{ mt: 4 }}>
        <UserManagement />
      </Box>
    </Box>
  );
};

export default KnowledgeGraph;
