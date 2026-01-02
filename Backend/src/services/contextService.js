const chatRepository = require('../repositories/chatRepository');

class ContextService {
  constructor() {
    this.maxContextLength = 10; // Maximum number of messages to keep in context
    this.maxTokenLimit = 4000; // Maximum tokens for the context window
  }

  /**
   * Get conversation context for a session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of messages in the conversation context
   */
  async getConversationContext(userId, sessionId) {
    try {
      // Get recent messages
      const recentMessages = await chatRepository.getConversationContext(
        userId, 
        sessionId, 
        this.maxContextLength
      );

      // Check token count and trim if needed
      return this.trimToTokenLimit(recentMessages);
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }

  /**
   * Trim messages to fit within token limit
   * @param {Array} messages - Array of message objects
   * @returns {Array} Trimmed array of messages
   */
  trimToTokenLimit(messages) {
    let totalTokens = 0;
    const result = [];
    
    // Process messages in reverse order (oldest first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokenCount(message.content);
      
      if (totalTokens + messageTokens > this.maxTokenLimit) {
        break;
      }
      
      result.unshift(message); // Add to beginning to maintain order
      totalTokens += messageTokens;
    }
    
    return result;
  }

  /**
   * Estimate token count for a string (approximate)
   * @param {string} text - Input text
   * @returns {number} Estimated token count
   */
  estimateTokenCount(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is an approximation, actual tokenization depends on the model
    return Math.ceil((text || '').length / 4);
  }

  /**
   * Format context for LLM prompt
   * @param {Array} messages - Array of message objects
   * @returns {string} Formatted context string
   */
  formatContextForPrompt(messages) {
    return messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Generate a summary of the conversation
   * @param {Array} messages - Array of message objects
   * @returns {string} Generated summary
   */
  async generateSummary(messages) {
    // This is a placeholder - in a real implementation, you would use an LLM
    // to generate a summary of the conversation
    const recentMessages = messages
      .slice(-5) // Last 5 messages
      .map(msg => msg.content.substring(0, 100)) // Take first 100 chars of each
      .join('... ');
    
    return `Conversation about: ${recentMessages}...`;
  }
}

module.exports = new ContextService();
