const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.EMBEDDING_API_KEY;
const modelName = process.env.EMBEDDING_MODEL || 'text-embedding-004';

if (!apiKey) {
  throw new Error('EMBEDDING_API_KEY is required in environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: modelName });

/**
 * Generates an embedding vector for the given text using Google AI.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} The embedding vector.
 */
async function getEmbedding(text) {
  try {
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    throw new Error(`Error generating embedding: ${error.message}`);
  }
}

/**
 * Generates embeddings for an array of text chunks.
 * Processes in batches to avoid rate limits.
 * @param {string[]} chunks - Array of text chunks.
 * @param {number} batchSize - Number of chunks to process concurrently (default 10).
 * @returns {Promise<number[][]>} Array of embedding vectors.
 */
async function embedChunks(chunks, batchSize = 10) {
  try {
    const embeddings = [];
    
    // Process in batches
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      const batchEmbeddings = await Promise.all(batch.map(chunk => getEmbedding(chunk)));
      embeddings.push(...batchEmbeddings);
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return embeddings;
  } catch (error) {
    throw new Error(`Error embedding chunks: ${error.message}`);
  }
}

module.exports = { getEmbedding, embedChunks };