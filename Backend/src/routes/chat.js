const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const chatService = require('../services/chatService');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/chat
 * @desc    Chat endpoint with streaming response using Server-Sent Events
 * @access  Private (authentication required)
 * @body    {string} query - The user's message
 * @body    {string} [sessionId] - Optional session ID for chat history
 */
router.post(
  '/',
  auth.optional, // Optional auth for now, can be made required later
  [
    body('query')
      .trim()
      .notEmpty()
      .withMessage('Query is required')
      .isString()
      .withMessage('Query must be a string')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Query must be between 1 and 2000 characters'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('sessionId must be a string')
      .isUUID()
      .withMessage('sessionId must be a valid UUID')
  ],
  async (req, res) => {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { query, sessionId: clientSessionId } = req.body;
      
      // Generate or use provided session ID
      const sessionId = clientSessionId || chatService.generateSessionId();
      
      // Process chat with streaming
      await chatService.processChatWithStreaming({
        query,
        sessionId,
        options: {
          userId: req.user?.id || 'anonymous'
        }
      }, res);

    } catch (error) {
      console.error('Chat endpoint error:', error);
      
      // If headers haven't been sent yet, send JSON error
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'An error occurred while processing your request',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      // Otherwise, try to send error via SSE
      try {
        res.write(`event: error\ndata: ${JSON.stringify({
          message: 'An error occurred while processing your request'
        })}\n\n`);
        res.end();
      } catch (sseError) {
        console.error('Error sending SSE error:', sseError);
      }
    }
  }
);

/**
 * @route   GET /api/chat/history/:sessionId
 * @desc    Get chat history for a specific session
 * @access  Private
 * @query   {number} [limit=20] - Number of messages to return
 * @query   {string} [before] - Get messages before this timestamp
 */
router.get('/history/:sessionId', auth.required, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 20, before, includeContext = 'true' } = req.query;

    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid session ID is required'
      });
    }

    // Parse and validate query parameters
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    const options = {
      limit: parsedLimit,
      includeContext: includeContext === 'true'
    };

    if (before) {
      const beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid before timestamp'
        });
      }
      options.before = beforeDate;
    }

    const history = await chatService.getChatHistory(
      req.user.id, 
      sessionId, 
      options
    );

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/chat/sessions
 * @desc    Get all chat sessions for the authenticated user
 * @access  Private
 * @query   {number} [limit=50] - Number of sessions to return
 * @query   {number} [offset=0] - Number of sessions to skip
 */
router.get('/sessions', auth.required, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Parse and validate query parameters
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        success: false,
        message: 'Offset must be a non-negative number'
      });
    }

    const sessions = await chatService.getUserSessions(req.user.id, {
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Delete a chat session and all its messages
 * @access  Private
 */
router.delete('/sessions/:sessionId', auth.required, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid session ID is required'
      });
    }

    const deleted = await chatService.deleteSession(req.user.id, sessionId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or you do not have permission to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/chat/stats/:sessionId
 * @desc    Get statistics for a specific chat session
 * @access  Private
 */
router.get('/stats/:sessionId', auth.required, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid session ID is required'
      });
    }

    const stats = await chatService.getSessionStats(sessionId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Chat stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/chat/suggest
 * @desc    Get suggested follow-up questions
 * @access  Private
 * @body    {string} sessionId - The chat session ID
 * @body    {Array} [chunks] - Recent chunks used in conversation
 */
router.post('/suggest', auth.optional, [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isString()
    .withMessage('Session ID must be a string'),
  body('chunks')
    .optional()
    .isArray()
    .withMessage('Chunks must be an array')
], async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { sessionId, chunks = [] } = req.body;

    const suggestions = await chatService.getSuggestedQuestions(
      sessionId, 
      chunks
    );

    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length
      }
    });

  } catch (error) {
    console.error('Chat suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
