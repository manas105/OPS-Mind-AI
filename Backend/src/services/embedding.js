const { pipeline } = require("@xenova/transformers");

let embedder;

/**
 * Generate embeddings for text using MiniLM model
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} - The embedding vector
 */
async function embedText(text) {
  if (!embedder) {
    console.log('Initializing MiniLM embedding model...');
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log('MiniLM model loaded successfully');
  }

  const output = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
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

module.exports = { embedText, embedBatch };
