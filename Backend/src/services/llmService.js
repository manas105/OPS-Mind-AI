const { embedText } = require('./embedding');
const langchainService = require('./langchainService');

class LLMService {
    constructor() {
        // Use embedding service for embeddings
    }

    /**
     * Generate an embedding for the given text
     * @param {string} text - The text to generate embedding for
     * @returns {Promise<Array<number>>} - The embedding vector
     */
    async getEmbedding(text) {
        return await embedText(text);
    }

    /**
     * Generate a response using the provided prompt
     * @param {string} systemPrompt - The system prompt with context and instructions
     * @returns {Promise<string>} - The generated response
     */
    async generateAnswer(systemPrompt) {
        try {
            // Extract context chunks from the combined prompt
            const contextMatch = systemPrompt.match(/Available Document Context:\n([\s\S]*?)\n\nUser Question:/);
            const contextText = contextMatch ? contextMatch[1] : '';
            
            // Split into individual documents
            const documentSections = contextText.split(/---\n/).filter(section => section.trim());
            const chunks = documentSections.map(section => ({ 
                text: section.replace(/DOCUMENT \d+:\nSource: [^\n]+\nPages: [^\n]+\nContent: /, '').trim()
            })).filter(chunk => chunk.text.length > 0);
            
            // Extract user question
            const questionMatch = systemPrompt.match(/User Question: ([^\n]+)/);
            const query = questionMatch ? questionMatch[1] : systemPrompt;
            
            return await langchainService.generateResponseWithCitations(query, chunks, []);
        } catch (error) {
            console.error('Error generating answer:', error);
            throw new Error('Failed to generate response from LLM');
        }
    }

    /**
     * Generate a streaming response using the provided prompts
     * @param {string} systemPrompt - The system prompt with context and instructions
     * @param {string} userPrompt - The user question
     * @returns {Promise<AsyncIterable>} - Streaming response chunks
     */
    async* generateStreamingResponse(systemPrompt, userPrompt) {
        try {
            // Extract context chunks from the combined prompt
            // The promptService creates a format like "Available Document Context:\nDOCUMENT 1:..."
            const contextMatch = userPrompt.match(/Available Document Context:\n([\s\S]*?)\n\nUser Question:/);
            const contextText = contextMatch ? contextMatch[1] : '';
            
            // Split into individual documents
            const documentSections = contextText.split(/---\n/).filter(section => section.trim());
            const chunks = documentSections.map(section => ({ 
                text: section.replace(/DOCUMENT \d+:\nSource: [^\n]+\nPages: [^\n]+\nContent: /, '').trim()
            })).filter(chunk => chunk.text.length > 0);
            
            console.log(`🔍 Extracted ${chunks.length} context chunks from prompt`);
            
            // Use the full user prompt for the LLM
            const response = await langchainService.generateResponseWithCitations(userPrompt, chunks, []);
            const content = response.content || response;
            
            console.log(`🤖 LLM Response: "${content}"`);
            
            // Simulate streaming by yielding words/chunks
            const words = content.split(' ');
            let currentChunk = '';
            
            for (let i = 0; i < words.length; i++) {
                currentChunk += words[i] + (i < words.length - 1 ? ' ' : '');
                
                // Yield every 5 words or at the end
                if ((i + 1) % 5 === 0 || i === words.length - 1) {
                    yield { content: currentChunk };
                    currentChunk = '';
                }
            }
            
        } catch (error) {
            console.error('Error generating streaming response:', error);
            yield { content: 'I apologize, but I encountered an error generating the response.' };
        }
    }
}

module.exports = new LLMService();
