const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const { v4: uuidv4 } = require('uuid');
const vectorSearchService = require('./vectorSearchService');
const promptService = require('./promptService');
const citationService = require('./citationService');
const llmService = require('./llmService');
const analyticsService = require('./analyticsService');

class ChatService {
  constructor() {
    this.activeStreams = new Map(); // Track active SSE streams
  }

  /**
   * Generate a unique session ID
   * @returns {string} Unique session identifier (UUID v4)
   */
  generateSessionId() {
    return uuidv4();
  }

  /**
   * Validate if a string is a valid UUID v4
   * @param {string} sessionId - Session ID to validate
   * @returns {boolean} True if valid UUID v4
   */
  isValidSessionId(sessionId) {
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv4Regex.test(sessionId);
  }

  /**
   * Send Server-Sent Event
   * @param {Object} res - Express response object
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  sendSSEEvent(res, event, data) {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE event:', error);
    }
  }

  /**
   * Save a chat message to the database
   * @param {Object} message - The message to save
   * @param {string} message.userId - The ID of user who sent the message
   * @param {string} message.sessionId - The chat session ID
   * @param {string} message.role - 'user' or 'assistant'
   * @param {string} message.content - The message content
   * @param {Array<Object>} [message.chunks] - Array of context chunks used for the response
   * @param {Object} [metadata] - Additional metadata about the message
   * @returns {Promise<Object>} The saved message
   */
  async saveMessage({ userId, sessionId, role, content, chunks = [], metadata = {} }) {
    try {
      const message = new ChatMessage({
        userId,
        sessionId,
        role,
        content,
        chunks: chunks.map(chunk => ({
          chunkId: chunk.chunkId,
          text: chunk.content || chunk.text || '',
          source: chunk.fileName || chunk.source || '',
          score: chunk.relevanceScore || chunk.score || 0,
          pages: chunk.pageReferences || chunk.pages || []
        })),
        metadata: {
          tokens: metadata.tokens,
          model: metadata.model,
          responseTime: metadata.responseTime,
          citations: metadata.citations,
          ...metadata
        }
      });
      
      return await message.save();
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw new Error('Failed to save chat message');
    }
  }

  /**
   * Get chat history for a session with pagination
   * @param {string} userId - The ID of user
   * @param {string} sessionId - The chat session ID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=20] - Maximum number of messages to return
   * @param {Date} [options.before] - Get messages before this date
   * @param {boolean} [options.includeContext=true] - Whether to include context chunks
   * @returns {Promise<Object>} Object containing messages and pagination info
   */
  async getChatHistory(userId, sessionId, options = {}) {
    const {
      limit = 20,
      before,
      includeContext = true
    } = options;

    try {
      const query = {
        userId,
        sessionId
      };

      if (before) {
        query.createdAt = { $lt: before };
      }

      const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      // Reverse to get chronological order
      const chronologicalMessages = messages.reverse();

      // Remove context chunks if not requested
      if (!includeContext) {
        chronologicalMessages.forEach(msg => {
          delete msg.chunks;
        });
      }

      return {
        messages: chronologicalMessages,
        hasMore: messages.length === limit,
        totalCount: await ChatMessage.countDocuments({ userId, sessionId })
      };

    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  /**
   * Process a chat message with streaming response
   * @param {Object} params - Chat parameters
   * @param {string} params.query - User's query
   * @param {string} params.sessionId - Chat session ID
   * @param {Object} [params.options] - Additional options
   * @param {Object} res - Express response object for SSE
   * @returns {Promise<void>}
   */
  async processChatWithStreaming(params, res) {
    const { query, sessionId, options = {} } = params;
    const startTime = Date.now();

    try {
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial event
      this.sendSSEEvent(res, 'start', { 
        sessionId, 
        timestamp: new Date().toISOString() 
      });

      // Save user message
      await this.saveMessage({
        userId: options.userId,
        sessionId,
        role: 'user',
        content: query
      });

      // Send search status
      this.sendSSEEvent(res, 'status', { 
        message: 'Searching documents...' 
      });

      // Perform vector search
      const relevantChunks = await vectorSearchService.search(query, {
        limit: 5,  // Reduced from 10 to 5 to stay within token limits
        minScore: 0.02  // Realistic threshold for MiniLM cosine similarity
      });

      // Send search results
      this.sendSSEEvent(res, 'search_results', {
        chunksFound: relevantChunks?.length || 0,
        chunks: (relevantChunks || []).map(chunk => ({
          chunkId: chunk.chunkId,
          fileName: chunk.fileName,
          relevanceScore: chunk.relevanceScore,
          preview: chunk.content?.substring(0, 100) + '...' || 'No preview available'
        }))
      });

      if (!relevantChunks || relevantChunks.length === 0) {
        // No relevant chunks found
        const fallbackResponse = promptService.fallbackPrompt;
        this.sendSSEEvent(res, 'content', { content: fallbackResponse });
        this.sendSSEEvent(res, 'complete', { 
          citations: [],
          responseTime: Date.now() - startTime 
        });
        
        await this.saveMessage({
          userId: options.userId,
          sessionId,
          role: 'assistant',
          content: fallbackResponse,
          chunks: [],
          metadata: { responseTime: Date.now() - startTime }
        });
        
        return;
      }

      // Send generation status
      this.sendSSEEvent(res, 'status', { 
        message: 'Generating response...' 
      });

      // Create prompt with context
      const promptData = promptService.createChatPrompt(relevantChunks, query, {
        sessionId,
        previousMessages: await this.getRecentMessages(options.userId, sessionId, 6)
      });

      // Generate response with streaming
      let fullResponse = '';
      const stream = await llmService.generateStreamingResponse(
        promptData.systemPrompt,
        promptData.userPrompt
      );

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.content || chunk;
        fullResponse += content;
        
        this.sendSSEEvent(res, 'content', { 
          content,
          partial: fullResponse 
        });
      }

      // Generate and validate citations
      const citationData = citationService.generateInlineCitations(relevantChunks);
      const citations = citationData.citations;
      const citationSummary = citationService.generateCitationSummary(citations);
      
      // Add citations to response
      const responseWithCitations = citationService.addCitationsToResponse(
        fullResponse, 
        relevantChunks
      );

      // Send final response content with citations
      this.sendSSEEvent(res, 'content', { 
        content: responseWithCitations,
        final: true 
      });

      // Send citations metadata
      this.sendSSEEvent(res, 'citations', {
        citations: citationService.createCitationMetadata(relevantChunks),
        summary: citationSummary
      });

      this.sendSSEEvent(res, 'complete', { 
        responseTime: Date.now() - startTime,
        totalTokens: this.estimateTokens(responseWithCitations)
      });

      // Save assistant message
      await this.saveMessage({
        userId: options.userId,
        sessionId,
        role: 'assistant',
        content: responseWithCitations,
        chunks: relevantChunks,
        metadata: {
          responseTime: Date.now() - startTime,
          citations: citationSummary,
          model: 'groq-llama3-70b-8192'
        }
      });

      // Record analytics
      const analyticsData = analyticsService.createAnalyticsRecord({
        sessionId,
        query,
        response: responseWithCitations,
        chunks: relevantChunks,
        responseTime: Date.now() - startTime,
        citations: citationSummary
      });
      
      // Track query asynchronously (don't wait for it)
      analyticsService.trackQuery(analyticsData).catch(err => {
        console.error('Analytics tracking failed:', err);
      });

    } catch (error) {
      console.error('Chat processing error:', error);
      this.sendSSEEvent(res, 'error', { 
        message: 'An error occurred while processing your request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      res.end();
    }
  }

  /**
   * Send Server-Sent Event
   * @param {Object} res - Express response object
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  sendSSEvent(res, event, data) {
    try {
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(eventData);
    } catch (error) {
      console.error('SSE write error:', error);
    }
  }

  /**
   * Get recent messages for context
   * @param {string} sessionId - Session ID
   * @param {number} limit - Number of recent messages
   * @returns {Promise<Array>} Recent messages
   */
  async getRecentMessages(userId, sessionId, limit = 6) {
    try {
      const messages = await ChatMessage.find({ userId, sessionId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('role content')
        .lean();

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return [];
    }
  }

  /**
   * Get all sessions for a user
   * @param {string} userId - User ID
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} Array of session summaries
   */
  async getUserSessions(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const sessions = await ChatMessage.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: '$sessionId',
            lastMessage: { $last: '$content' },
            lastMessageTime: { $max: '$createdAt' },
            messageCount: { $sum: 1 }
          }
        },
        { $sort: { lastMessageTime: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
          $project: {
            sessionId: '$_id',
            lastMessage: 1,
            lastMessageTime: 1,
            messageCount: 1,
            preview: { $substr: ['$lastMessage', 0, 100] }
          }
        }
      ]);

      return sessions;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw new Error('Failed to fetch user sessions');
    }
  }

  async getRecentSessions(userId, limit = 10) {
    return this.getUserSessions(userId, { limit, offset: 0 });
  }

  /**
   * Delete a chat session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteSession(userId, sessionId) {
    try {
      return await ChatMessage.deleteMany({ userId, sessionId });
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  async deleteAllUserSessions(userId) {
    try {
      return await ChatMessage.deleteMany({ userId });
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error('Failed to clear chat history');
    }
  }

  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats(userId, sessionId) {
    try {
      const stats = await ChatMessage.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), sessionId } },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            userMessages: {
              $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
            },
            assistantMessages: {
              $sum: { $cond: [{ $eq: ['$role', 'assistant'] }, 1, 0] }
            },
            totalChunks: { $sum: { $size: { $ifNull: ['$chunks', []] } } },
            avgResponseTime: { $avg: '$metadata.responseTime' },
            firstMessage: { $min: '$createdAt' },
            lastMessage: { $max: '$createdAt' }
          }
        }
      ]);

      return stats[0] || {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        totalChunks: 0,
        avgResponseTime: 0,
        duration: 0
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw new Error('Failed to get session statistics');
    }
  }

  /**
   * Estimate token count (rough approximation)
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get suggested follow-up questions
   * @param {string} sessionId - Session ID
   * @param {Array} recentChunks - Recent chunks used
   * @returns {Promise<Array>} Suggested questions
   */
  async getSuggestedQuestions(userId, sessionId, recentChunks) {
    try {
      // Get recent queries from the session
      const recentMessages = await this.getRecentMessages(userId, sessionId, 10);
      const lastQuery = recentMessages
        .filter(msg => msg.role === 'user')
        .pop()?.content || '';

      return promptService.getSuggestedQuestions(lastQuery, recentChunks);
    } catch (error) {
      console.error('Error getting suggested questions:', error);
      return [];
    }
  }
}

module.exports = new ChatService();
