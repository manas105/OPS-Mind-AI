const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/analytics/knowledge-graph
 * @desc    Get knowledge graph data for admin dashboard
 * @access  Admin only
 * @query   {string} timeRange - Time range for analytics ('1d', '7d', '30d', '90d')
 */
router.get('/knowledge-graph', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    if (!['1d', '7d', '30d', '90d'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Use 1d, 7d, 30d, or 90d'
      });
    }
    
    const graphData = await analyticsService.getKnowledgeGraphData(timeRange);
    
    res.json({
      success: true,
      data: graphData,
      timeRange
    });
  } catch (error) {
    console.error('Error getting knowledge graph data:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving knowledge graph data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/documents
 * @desc    Get document analytics for admin dashboard
 * @access  Admin only
 * @query   {string} timeRange - Time range for analytics
 */
router.get('/documents', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    if (!['1d', '7d', '30d', '90d'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Use 1d, 7d, 30d, or 90d'
      });
    }
    
    const documentAnalytics = await analyticsService.getDocumentAnalytics(timeRange);
    
    res.json({
      success: true,
      data: documentAnalytics,
      timeRange
    });
  } catch (error) {
    console.error('Error getting document analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving document analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/topics
 * @desc    Get topic analytics for admin dashboard
 * @access  Admin only
 * @query   {string} timeRange - Time range for analytics
 */
router.get('/topics', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    if (!['1d', '7d', '30d', '90d'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Use 1d, 7d, 30d, or 90d'
      });
    }
    
    const topicAnalytics = await analyticsService.getTopicAnalytics(timeRange);
    
    res.json({
      success: true,
      data: topicAnalytics,
      timeRange
    });
  } catch (error) {
    console.error('Error getting topic analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving topic analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/usage
 * @desc    Get usage analytics for admin dashboard (alias for /metrics)
 * @access  Admin only
 * @query   {string} timeRange - Time range for analytics
 */
router.get('/usage', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    if (!['1d', '7d', '30d', '90d'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Use 1d, 7d, 30d, or 90d'
      });
    }

    const usageMetrics = await analyticsService.getUsageMetrics(timeRange);

    res.json({
      success: true,
      data: usageMetrics,
      timeRange
    });
  } catch (error) {
    console.error('Error getting usage metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving usage metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/metrics
 * @desc    Get general metrics for admin dashboard
 * @access  Admin only
 * @query   {string} timeRange - Time range for analytics
 */
router.get('/metrics', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    if (!['1d', '7d', '30d', '90d'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Use 1d, 7d, 30d, or 90d'
      });
    }

    const usageMetrics = await analyticsService.getUsageMetrics(timeRange);

    res.json({
      success: true,
      data: usageMetrics,
      timeRange
    });
  } catch (error) {
    console.error('Error getting usage metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving usage metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/hourly
 * @desc    Get hourly usage analytics for admin dashboard (alias for /hourly-usage)
 * @access  Admin only
 * @query   {string} timeRange - Time range for analytics
 */
router.get('/hourly', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    if (!['1d', '7d', '30d', '90d'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Use 1d, 7d, 30d, or 90d'
      });
    }

    const hourlyUsage = await analyticsService.getHourlyUsage(timeRange);

    res.json({
      success: true,
      data: hourlyUsage,
      timeRange
    });
  } catch (error) {
    console.error('Error getting hourly usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hourly usage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/hourly-usage
 * @desc    Get hourly usage analytics for admin dashboard
 * @access  Admin only
 * @query   {string} timeRange - Time range for analytics
 */
router.get('/hourly-usage', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    if (!['1d', '7d', '30d', '90d'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Use 1d, 7d, 30d, or 90d'
      });
    }

    const hourlyUsage = await analyticsService.getHourlyUsage(timeRange);

    res.json({
      success: true,
      data: hourlyUsage,
      timeRange
    });
  } catch (error) {
    console.error('Error getting hourly usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hourly usage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/analytics/satisfaction
 * @desc    Record user satisfaction rating
 * @access  Private (user and admin)
 * @body    {sessionId: string, rating: number}
 */
router.post('/satisfaction', auth.required, auth.hasRole(['user', 'admin']), async (req, res) => {
  try {
    const { sessionId, rating } = req.body;
    
    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and rating are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const updatedAnalytics = await analyticsService.updateSatisfactionRating(sessionId, rating);
    
    res.json({
      success: true,
      message: 'Satisfaction rating updated successfully',
      data: updatedAnalytics
    });
  } catch (error) {
    console.error('Error updating satisfaction rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating satisfaction rating',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/test/metrics
 * @desc    Public test endpoint for metrics (no auth required)
 * @access  Public
 */
router.get('/test/metrics', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Mock data for testing
    const mockMetrics = {
      totalQueries: 156,
      uniqueUsers: 23,
      avgResponseTime: 1.2,
      satisfactionScore: 4.3,
      recentQueries: [
        { user: 'User1', query: 'HR policy questions', timestamp: new Date() },
        { user: 'User2', query: 'Module 1 content', timestamp: new Date() }
      ]
    };
    
    res.json({
      success: true,
      data: mockMetrics,
      timeRange,
      message: 'Test endpoint - no authentication required'
    });
  } catch (error) {
    console.error('Error in test metrics endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving test metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analytics/test/documents
 * @desc    Public test endpoint for documents (no auth required)
 * @access  Public
 */
router.get('/test/documents', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Mock data for testing
    const mockDocuments = {
      totalDocuments: 8,
      documentTypes: [
        { type: 'PDF', count: 5 },
        { type: 'DOC', count: 2 },
        { type: 'TXT', count: 1 }
      ],
      recentUploads: [
        { name: 'hr-policy.pdf', uploadDate: new Date() },
        { name: 'Module_1.pdf', uploadDate: new Date() }
      ]
    };
    
    res.json({
      success: true,
      data: mockDocuments,
      timeRange,
      message: 'Test endpoint - no authentication required'
    });
  } catch (error) {
    console.error('Error in test documents endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving test documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
