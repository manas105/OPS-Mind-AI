const { pipeline } = require("@xenova/transformers");

let embedder;

/**
 * Initialize the embedding model - call this at server startup
 * @returns {Promise<void>}
 */
async function initializeEmbedder() {
  if (!embedder) {
    console.log('Initializing MiniLM embedding model at startup...');
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log('MiniLM model loaded successfully at startup');
  }
}

/**
 * Generate embeddings for text using MiniLM model
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} - The embedding vector
 */
async function embedText(text) {
  if (!embedder) {
    throw new Error('Embedding model not initialized. Call initializeEmbedder() first.');
  }

  const output = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  const embedding = Array.from(output.data);
  console.log(`Generated embedding with ${embedding.length} dimensions for text length ${text.length}`);
  
  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
async function embedBatch(texts) {
  const embeddings = [];
  for (const text of texts) {
    const embedding = await embedText(text);
    embeddings.push(embedding);
  }
  return embeddings;
}

module.exports = { initializeEmbedder, embedText, embedBatch };
