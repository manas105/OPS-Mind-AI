const Analytics = require('../models/Analytics');
const crypto = require('crypto');

/**
 * Analytics Service - Tracks and manages usage analytics
 * Provides insights for the Admin Knowledge Graph
 */

/**
 * Track a query and its response for analytics
 * @param {Object} analyticsData - Analytics data to track
 * @returns {Promise<Object>} - Saved analytics record
 */
const trackQuery = async (analyticsData) => {
  try {
    const analytics = new Analytics(analyticsData);
    return await analytics.save();
  } catch (error) {
    console.error('Error tracking analytics:', error);
    throw new Error('Failed to track analytics data');
  }
};

/**
 * Extract topics from query and response using simple keyword extraction
 * @param {string} query - User query
 * @param {string} response - AI response
 * @returns {Array<{topic: string, confidence: number}>} - Extracted topics
 */
const extractTopics = (query, response) => {
  const combinedText = `${query} ${response}`.toLowerCase();
  const topics = [];
  
  // Common business topics with keywords
  const topicKeywords = {
    'Leave Policy': ['leave', 'vacation', 'time off', 'absence', 'pto'],
    'HR Policy': ['hr', 'human resources', 'employee', 'staff', 'personnel'],
    'Benefits': ['benefits', 'insurance', 'health', 'medical', 'retirement', '401k'],
    'Payroll': ['payroll', 'salary', 'wage', 'payment', 'compensation', 'pay'],
    'Performance': ['performance', 'review', 'evaluation', 'appraisal', 'kpi'],
    'Training': ['training', 'learning', 'development', 'course', 'education'],
    'Compliance': ['compliance', 'regulation', 'legal', 'policy', 'procedure'],
    'IT Policy': ['it', 'technology', 'software', 'hardware', 'computer', 'system'],
    'Security': ['security', 'access', 'password', 'authentication', 'data'],
    'Workplace': ['workplace', 'office', 'remote', 'hybrid', 'location', 'facility']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matches = keywords.filter(keyword => combinedText.includes(keyword));
    if (matches.length > 0) {
      const confidence = Math.min(matches.length / keywords.length, 1.0);
      topics.push({ topic, confidence });
    }
  }
  
  return topics.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

/**
 * Create analytics record from chat interaction
 * @param {Object} chatData - Chat interaction data
 * @returns {Object} - Analytics data object
 */
const createAnalyticsRecord = (chatData) => {
  const {
    sessionId,
    query,
    response,
    chunks = [],
    responseTime = 0,
    citations = []
  } = chatData;
  
  // Extract documents accessed
  const documentsAccessed = chunks.map(chunk => ({
    fileId: chunk.documentId || chunk.fileId,
    fileName: chunk.fileName || 'Unknown Document',
    pages: chunk.pages ? chunk.pages.map(p => p.page) : [],
    relevanceScore: chunk.score || 0.0
  }));
  
  // Extract topics
  const topics = extractTopics(query, response);
  
  // Process citations
  const citationSources = citations && Array.isArray(citations) 
    ? [...new Set(citations.map(c => c.source))]
    : [];
  
  return {
    sessionId,
    query: query.trim(),
    response,
    documentsAccessed,
    responseTime,
    topics,
    citations: {
      count: citations && Array.isArray(citations) ? citations.length : 0,
      sources: citationSources
    }
  };
};

/**
 * Get document analytics for the Admin Knowledge Graph
 * @param {string} timeRange - Time range for analytics ('1d', '7d', '30d', '90d')
 * @returns {Promise<Array>} - Document analytics data
 */
const getDocumentAnalytics = async (timeRange = '7d') => {
  try {
    return await Analytics.getDocumentAnalytics(timeRange);
  } catch (error) {
    console.error('Error getting document analytics:', error);
    throw new Error('Failed to retrieve document analytics');
  }
};

/**
 * Get topic analytics for the Admin Knowledge Graph
 * @param {string} timeRange - Time range for analytics
 * @returns {Promise<Array>} - Topic analytics data
 */
const getTopicAnalytics = async (timeRange = '7d') => {
  try {
    return await Analytics.getTopicAnalytics(timeRange);
  } catch (error) {
    console.error('Error getting topic analytics:', error);
    throw new Error('Failed to retrieve topic analytics');
  }
};

/**
 * Get overall usage metrics
 * @param {string} timeRange - Time range for analytics
 * @returns {Promise<Object>} - Usage metrics
 */
const getUsageMetrics = async (timeRange = '7d') => {
  try {
    const metrics = await Analytics.getUsageMetrics(timeRange);
    return metrics[0] || {
      totalQueries: 0,
      uniqueUserCount: 0,
      avgResponseTime: 0,
      uniqueDocumentCount: 0,
      totalCitations: 0,
      avgSatisfaction: 0
    };
  } catch (error) {
    console.error('Error getting usage metrics:', error);
    throw new Error('Failed to retrieve usage metrics');
  }
};

/**
 * Get hourly usage patterns
 * @param {string} timeRange - Time range for analytics
 * @returns {Promise<Array>} - Hourly usage data
 */
const getHourlyUsage = async (timeRange = '7d') => {
  try {
    return await Analytics.getHourlyUsage(timeRange);
  } catch (error) {
    console.error('Error getting hourly usage:', error);
    throw new Error('Failed to retrieve hourly usage');
  }
};

/**
 * Get knowledge graph data for visualization
 * @param {string} timeRange - Time range for analytics
 * @returns {Promise<Object>} - Knowledge graph data
 */
const getKnowledgeGraphData = async (timeRange = '7d') => {
  try {
    const [documentAnalytics, topicAnalytics, usageMetrics] = await Promise.all([
      getDocumentAnalytics(timeRange),
      getTopicAnalytics(timeRange),
      getUsageMetrics(timeRange)
    ]);
    
    // Create nodes and links for graph visualization
    const nodes = [];
    const links = [];
    
    // Add document nodes
    documentAnalytics.forEach((doc, index) => {
      nodes.push({
        id: `doc_${doc.fileId}`,
        name: doc.fileName,
        type: 'document',
        value: doc.accessCount,
        metrics: {
          accessCount: doc.accessCount,
          avgRelevanceScore: doc.avgRelevanceScore,
          uniqueQueries: doc.uniqueQueryCount
        }
      });
    });
    
    // Add topic nodes
    topicAnalytics.forEach((topic, index) => {
      nodes.push({
        id: `topic_${topic.topic}`,
        name: topic.topic,
        type: 'topic',
        value: topic.totalMentions,
        metrics: {
          totalMentions: topic.totalMentions,
          avgConfidence: topic.avgConfidence,
          uniqueDocuments: topic.uniqueDocumentCount
        }
      });
    });
    
    // Create links between documents and topics (simplified)
    documentAnalytics.forEach(doc => {
      topicAnalytics.slice(0, 3).forEach(topic => {
        links.push({
          source: `doc_${doc.fileId}`,
          target: `topic_${topic.topic}`,
          value: Math.min(doc.accessCount, topic.totalMentions)
        });
      });
    });
    
    return {
      nodes,
      links,
      metrics: usageMetrics,
      timeRange
    };
  } catch (error) {
    console.error('Error getting knowledge graph data:', error);
    throw new Error('Failed to retrieve knowledge graph data');
  }
};

/**
 * Update user satisfaction rating
 * @param {string} sessionId - Session ID
 * @param {number} rating - Satisfaction rating (1-5)
 * @returns {Promise<Object>} - Updated analytics record
 */
const updateSatisfactionRating = async (sessionId, rating) => {
  try {
    const analytics = await Analytics.findOne({ sessionId }).sort({ timestamp: -1 });
    if (analytics) {
      analytics.userSatisfaction = rating;
      return await analytics.save();
    }
    throw new Error('Analytics record not found');
  } catch (error) {
    console.error('Error updating satisfaction rating:', error);
    throw new Error('Failed to update satisfaction rating');
  }
};

module.exports = {
  trackQuery,
  createAnalyticsRecord,
  getDocumentAnalytics,
  getTopicAnalytics,
  getUsageMetrics,
  getHourlyUsage,
  getKnowledgeGraphData,
  updateSatisfactionRating,
  extractTopics
};
