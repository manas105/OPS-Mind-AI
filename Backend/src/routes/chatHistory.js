const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const chatService = require('../services/chatService');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/chat/history/sessions
 * @desc    Get recent chat sessions for the authenticated user
 * @access  Private
 * @query   {number} [limit=10] - Maximum number of sessions to return
 */
router.get(
  '/sessions',
  auth.required,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
      .toInt()
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { limit = 10 } = req.query;
      const userId = req.user.id;

      // Get recent chat sessions
      const sessions = await chatService.getRecentSessions(userId, limit);
      
      res.json({
        success: true,
        data: sessions,
        count: sessions.length
      });
      
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chat sessions',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      });
    }
  }
);

/**
 * @route   GET /api/chat/history/:sessionId
 * @desc    Get chat history for a specific session
 * @access  Private
 * @param   {string} sessionId - The chat session ID
 * @query   {number} [limit=20] - Maximum number of messages to return
 * @query   {string} [before] - ISO date string to get messages before this date (for pagination)
 */
router.get(
  '/:sessionId',
  auth.required,
  [
    param('sessionId')
      .trim()
      .notEmpty()
      .withMessage('Session ID is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('before')
      .optional()
      .isISO8601()
      .withMessage('Before must be a valid ISO date string')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;
      const { limit = 20, before } = req.query;
      const userId = req.user.id;

      // Get chat history with pagination
      const { messages, hasMore, nextCursor } = await chatService.getChatHistory(
        userId,
        sessionId,
        { 
          limit: parseInt(limit),
          before,
          includeContext: req.query.includeContext !== 'false'
        }
      );
      
      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            hasMore,
            nextCursor,
            count: messages.length
          }
        },
        sessionId
      });
      
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch chat history',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      });
    }
  }
);

/**
 * @route   DELETE /api/chat/history/:sessionId
 * @desc    Delete a chat session and all its messages
 * @access  Private
 * @param   {string} sessionId - The chat session ID to delete
 */
router.delete(
  '/:sessionId',
  auth.required,
  [
    param('sessionId')
      .trim()
      .notEmpty()
      .withMessage('Session ID is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;
      const userId = req.user.id;

      // Delete the chat session
      const result = await chatService.deleteSession(userId, sessionId);
      
      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found or already deleted'
        });
      }
      
      res.json({
        success: true,
        message: 'Chat session deleted successfully',
        data: {
          sessionId,
          deletedCount: result.deletedCount
        }
      });
      
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete chat session',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      });
    }
  }
);

/**
 * @route   POST /api/chat/history/clear-all
 * @desc    Delete all chat history for the authenticated user
 * @access  Private
 */
router.post(
  '/clear-all',
  auth.required,
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Delete all chat sessions for the user
      const result = await chatService.deleteAllUserSessions(userId);
      
      res.json({
        success: true,
        message: 'All chat history cleared successfully',
        data: {
          deletedCount: result.deletedCount
        }
      });
      
    } catch (error) {
      console.error('Error clearing chat history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear chat history',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      });
    }
  }
);

module.exports = router;
