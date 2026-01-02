
const Groq = require("groq-sdk");
const citationService = require('./citationService');

class LangChainService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        if (!this.apiKey) {
            console.error('ERROR: GROQ_API_KEY is not set in environment variables');
            throw new Error('Groq API key is not configured');
        }
        console.log('Groq API Key:', this.apiKey ? '*** Key is set ***' : 'Key is MISSING');
        
        // Initialize Groq client
        this.groq = new Groq({
            apiKey: this.apiKey,
        });
        
        // Model configuration
        this.modelName = 'llama-3.1-8b-instant';
        
        this.SYSTEM_PROMPT = `You are a helpful corporate knowledge assistant. Follow these rules strictly:
1. Answer ONLY using the information from the provided context.
2. If the answer is not found in the context, say "I don't know based on the provided documents."
3. Never make up or guess information.
4. Keep responses concise and to the point.
5. Format your response in clear paragraphs.
6. If multiple pieces of information are relevant, present them in a structured way.
7. Always be precise and reference the specific information provided.`;
    }

    /**
     * Generate content using Groq API with citations
     * @param {string} query - The user's query
     * @param {Array<{text: string}>} chunks - Array of context chunks with text content
     * @param {Array} originalChunks - Original chunks with citation metadata
     * @returns {Promise<Object>} - Generated response with citations
     */
    async generateResponseWithCitations(query, chunks = [], originalChunks = []) {
        try {
            if (!chunks || chunks.length === 0) {
                return {
                    content: "I don't know based on the provided documents.",
                    citations: []
                };
            }

            // Build the prompt with context
            const context = chunks.map(chunk => chunk.text).join('\n\n');
            const prompt = `${this.SYSTEM_PROMPT}\n\nContext:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

            const response = await this.groq.chat.completions.create({
                model: this.modelName,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2048,
            });

            if (!response.choices || !response.choices[0]?.message?.content) {
                throw new Error('Unexpected response format from Groq API');
            }

            const content = response.choices[0].message.content;
            const citations = citationService.createCitationMetadata(originalChunks);
            
            return {
                content,
                citations,
                hasCitations: citations.length > 0
            };

        } catch (error) {
            console.error('Error in generateResponseWithCitations:', error);
            throw new Error(`Failed to generate response: ${error.message}`);
        }
    }

    /**
     * Generate embeddings for a given text using Xenova MiniLM
     * @param {string} text - The text to generate embeddings for
     * @returns {Promise<Array<number>>} - The embedding vector
     */
    async generateEmbedding(text) {
        const { embedText } = require('./embedding');
        return await embedText(text);
    }
}

module.exports = new LangChainService();
