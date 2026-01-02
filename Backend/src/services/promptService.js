/**
 * Prompt Engineering Service
 * Handles prompt templates, system prompts, and response formatting
 */

class PromptService {
  constructor() {
    this.systemPrompt = this.getSystemPrompt();
    this.fallbackPrompt = this.getFallbackPrompt();
  }

  /**
   * Get the main system prompt for the AI assistant
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are OpsMind AI, a document assistant. Help users find information from uploaded documents.

CORE PRINCIPLES:
1. ACCURACY: Only use information from provided chunks
2. TRANSPARENCY: Cite sources using [Source: filename.pdf, Page X]
3. HELPFULNESS: Be concise and direct
4. HONESTY: State when information isn't found
5. RESPONSE: Direct answers with bullets, include citations

RESPONSE GUIDELINES:
- Start with direct answer
- Use bullet points for complex info
- Include citations after factual statements
- Never invent information
- If insufficient docs: "Based on available documents, I cannot find specific information about [topic]."

CONTEXT:
You have access to document chunks that may contain the answer. Use only the information from these chunks.`;
  }

  /**
   * Get fallback prompt for when no relevant chunks are found
   * @returns {string} Fallback prompt
   */
  getFallbackPrompt() {
    return `I apologize, but I couldn't find specific information about your query in the available documents. 

Here are some suggestions:
1. Try rephrasing your question with different keywords
2. Check if the topic might be covered under a different term
3. Verify that the relevant documents have been uploaded

If you believe the information should be available, please:
- Check the document upload status
- Try searching for related terms
- Contact your administrator if needed

Is there anything else I can help you with?`;
  }

  /**
   * Create chat prompt with context and user query
   * @param {Array} relevantChunks - Relevant document chunks
   * @param {string} userQuery - User's question
   * @param {Object} options - Additional options
   * @returns {Object} Formatted prompt with metadata
   */
  createChatPrompt(relevantChunks, userQuery, options = {}) {
    const { sessionId, previousMessages = [] } = options;

    // Check if we have relevant chunks
    if (!relevantChunks || relevantChunks.length === 0) {
      return {
        systemPrompt: this.systemPrompt,
        userPrompt: userQuery,
        hasContext: false,
        fallbackResponse: this.fallbackPrompt
      };
    }

    // Format context from chunks
    const context = this.formatContext(relevantChunks);
    
    // Build conversation history
    const conversationHistory = this.formatConversationHistory(previousMessages);

    // Create the complete prompt
    const userPrompt = this.buildUserPrompt(userQuery, context, conversationHistory);

    return {
      systemPrompt: this.systemPrompt,
      userPrompt,
      hasContext: true,
      contextMetadata: {
        chunkCount: relevantChunks.length,
        sources: [...new Set(relevantChunks.map(c => c.fileName))],
        pages: [...new Set(relevantChunks.flatMap(c => c.pageReferences))]
      }
    };
  }

  /**
   * Format document chunks into context
   * @param {Array} chunks - Document chunks
   * @returns {string} Formatted context
   */
  formatContext(chunks) {
    const contextSections = chunks.map((chunk, index) => {
      const citation = this.createCitation(chunk, index);
      return `DOCUMENT ${index + 1}:
Source: ${chunk.fileName}
Pages: ${chunk.pageReferences.join(', ')}
Content: ${chunk.content}

${citation}`;
    });

    return contextSections.join('\n---\n');
  }

  /**
   * Create citation for a chunk
   * @param {Object} chunk - Document chunk
   * @param {number} index - Chunk index
   * @returns {string} Citation string
   */
  createCitation(chunk, index) {
    const pages = chunk.pageReferences.length > 1 
      ? `Pages ${Math.min(...chunk.pageReferences)}-${Math.max(...chunk.pageReferences)}`
      : `Page ${chunk.pageReferences[0]}`;
    
    return `Citation ${index + 1}: [Source: ${chunk.fileName}, ${pages}]`;
  }

  /**
   * Format conversation history
   * @param {Array} messages - Previous messages
   * @returns {string} Formatted history
   */
  formatConversationHistory(messages) {
    if (!messages || messages.length === 0) {
      return '';
    }

    const recentMessages = messages.slice(-3); // Reduced from 6 to 3 for token efficiency
    
    return recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n');
  }

  /**
   * Build the complete user prompt
   * @param {string} userQuery - User's question
   * @param {string} context - Document context
   * @param {string} conversationHistory - Previous conversation
   * @returns {string} Complete user prompt
   */
  buildUserPrompt(userQuery, context, conversationHistory) {
    let prompt = '';

    if (conversationHistory) {
      prompt += `Previous Conversation:\n${conversationHistory}\n\n`;
    }

    prompt += `Available Document Context:\n${context}\n\n`;
    prompt += `User Question: ${userQuery}\n\n`;
    prompt += `Please provide a comprehensive answer based on the documents above. Include citations for each factual statement.`;

    return prompt;
  }

  /**
   * Extract citations from AI response
   * @param {string} response - AI response text
   * @returns {Array} Array of citations
   */
  extractCitations(response) {
    const citationRegex = /\[Source:\s*([^,]+),\s*(Page\s*\d+(?:-\d+)?)/gi;
    const citations = [];
    let match;

    while ((match = citationRegex.exec(response)) !== null) {
      citations.push({
        source: match[1].trim(),
        reference: match[2].trim(),
        fullCitation: match[0]
      });
    }

    return citations;
  }

  /**
   * Validate response quality
   * @param {string} response - AI response
   * @param {Array} relevantChunks - Original chunks
   * @returns {Object} Validation result
   */
  validateResponse(response, relevantChunks) {
    const citations = this.extractCitations(response);
    const hasCitations = citations.length > 0;
    const hasContext = relevantChunks && relevantChunks.length > 0;

    // Check if response contains hallucination indicators
    const hallucinationIndicators = [
      'I believe',
      'I think',
      'Probably',
      'Might be',
      'Could be',
      'It seems',
      'I\'m not sure',
      'I don\'t have access'
    ];

    const hasIndicators = hallucinationIndicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );

    return {
      isValid: hasContext ? hasCitations && !hasIndicators : true,
      hasCitations,
      citationCount: citations.length,
      hasHallucinationIndicators: hasIndicators,
      quality: this.calculateQualityScore(response, citations, hasContext)
    };
  }

  /**
   * Calculate response quality score
   * @param {string} response - AI response
   * @param {Array} citations - Extracted citations
   * @param {boolean} hasContext - Whether context was available
   * @returns {number} Quality score (0-1)
   */
  calculateQualityScore(response, citations, hasContext) {
    let score = 0.5; // Base score

    // Length appropriateness (not too short, not too long)
    const responseLength = response.length;
    if (responseLength >= 50 && responseLength <= 1000) {
      score += 0.2;
    }

    // Citation quality
    if (hasContext) {
      const citationRatio = citations.length / Math.max(responseLength / 200, 1);
      if (citationRatio >= 0.5 && citationRatio <= 2) {
        score += 0.2;
      }
    }

    // Professional tone (simple heuristic)
    const professionalWords = ['according', 'based', 'document', 'source', 'reference'];
    const professionalCount = professionalWords.filter(word => 
      response.toLowerCase().includes(word)
    ).length;
    score += Math.min(professionalCount * 0.05, 0.1);

    return Math.min(score, 1);
  }

  /**
   * Refine response if needed
   * @param {string} response - Original response
   * @param {Object} validation - Validation result
   * @param {Array} relevantChunks - Original chunks
   * @returns {string} Refined response
   */
  refineResponse(response, validation, relevantChunks) {
    if (validation.isValid) {
      return response;
    }

    let refinedResponse = response;

    // Add citations if missing
    if (validation.hasContext && !validation.hasCitations) {
      const sources = [...new Set(relevantChunks.map(c => c.fileName))];
      const citationText = sources.length > 1 
        ? `[Sources: ${sources.join(', ')}]`
        : `[Source: ${sources[0]}]`;
      
      refinedResponse += `\n\n${citationText}`;
    }

    // Add disclaimer for uncertain responses
    if (validation.hasHallucinationIndicators) {
      refinedResponse += `\n\nNote: This response is based on limited information from the available documents. Please verify the information independently.`;
    }

    return refinedResponse;
  }

  /**
   * Get suggested follow-up questions
   * @param {string} userQuery - Original query
   * @param {Array} relevantChunks - Relevant chunks
   * @returns {Array} Suggested follow-up questions
   */
  getSuggestedQuestions(userQuery, relevantChunks) {
    if (!relevantChunks || relevantChunks.length === 0) {
      return [
        "What documents are available for search?",
        "How can I upload new documents?",
        "Can you help me refine my search query?"
      ];
    }

    const topics = this.extractTopics(relevantChunks);
    const suggestions = [];

    topics.forEach(topic => {
      suggestions.push(`Tell me more about ${topic}`);
      suggestions.push(`What are the key points about ${topic}?`);
    });

    // Add general suggestions
    suggestions.push("Can you summarize the key findings?");
    suggestions.push("What other documents might be relevant?");

    return suggestions.slice(0, 5);
  }

  /**
   * Extract topics from document chunks
   * @param {Array} chunks - Document chunks
   * @returns {Array} Extracted topics
   */
  extractTopics(chunks) {
    const topicKeywords = {};
    
    chunks.forEach(chunk => {
      if (!chunk || !chunk.content) return; // Add null check
      const words = chunk.content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      words.forEach(word => {
        topicKeywords[word] = (topicKeywords[word] || 0) + 1;
      });
    });
    
    return Object.entries(topicKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }
}

module.exports = new PromptService();
