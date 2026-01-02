require('dotenv').config();
const { getEmbedding } = require('../src/services/embeddingService');

async function testEmbedding() {
  try {
    console.log('Testing embedding generation...');
    const embedding = await getEmbedding('Hello world, this is a test for embedding generation.');
    console.log('Embedding generated successfully!');
    console.log('Embedding length:', embedding.length);
    console.log('First 10 values:', embedding.slice(0, 10));
  } catch (error) {
    console.error('Embedding test failed:', error.message);
  }
}

testEmbedding();