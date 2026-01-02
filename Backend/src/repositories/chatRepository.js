const ChatMessage = require('../models/ChatMessage');

class ChatRepository {
  // Save a new message
  async createMessage({ userId, sessionId, content, role, metadata = {} }) {
    try {
      const message = new ChatMessage({
        userId,
        sessionId,
        content,
        role,
        metadata
      });
      
      await message.save();
      return message;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw new Error('Failed to save message');
    }
  }

  // Get paginated chat history for a session
  async getChatHistory({ userId, sessionId, limit = 20, before = null }) {
    try {
      const query = { userId, sessionId };
      
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }
      
      const messages = await ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1) // Get one extra to check if there are more
        .lean();
      
      const hasMore = messages.length > limit;
      const result = hasMore ? messages.slice(0, -1) : messages;
      
      return {
        messages: result.reverse(), // Return in chronological order
        hasMore,
        nextCursor: hasMore ? messages[messages.length - 2].createdAt : null
      };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  // Get all sessions for a user
  async getUserSessions(userId, limit = 10) {
    try {
      return await ChatMessage.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$sessionId',
            lastMessage: { $first: '$$ROOT' },
            messageCount: { $sum: 1 }
          }
        },
        { $sort: { 'lastMessage.createdAt': -1 } },
        { $limit: limit }
      ]);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw new Error('Failed to fetch user sessions');
    }
  }

  // Delete a session
  async deleteSession(userId, sessionId) {
    try {
      const result = await ChatMessage.deleteMany({ userId, sessionId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  // Clear all user's chat history
  async clearUserHistory(userId) {
    try {
      const result = await ChatMessage.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error('Failed to clear chat history');
    }
  }

  // Get conversation context (last N messages)
  async getConversationContext(userId, sessionId, limit = 5) {
    try {
      return await ChatMessage.find({ userId, sessionId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .sort({ createdAt: 1 }) // Return in chronological order
        .lean();
    } catch (error) {
      console.error('Error getting conversation context:', error);
      throw new Error('Failed to get conversation context');
    }
  }
}

module.exports = new ChatRepository();
