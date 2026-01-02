require('dotenv').config();
const mongoose = require('mongoose');
const DocumentChunk = require('./src/models/DocumentChunk');

async function checkEmbeddingField() {
  try {
    console.log('🔍 CHECKING EMBEDDING FIELD STRUCTURE');
    console.log('=====================================');

    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    
    console.log('✅ Database connected');

    // Check different embedding field conditions
    const conditions = [
      { name: 'embedding exists', query: { embedding: { $exists: true } } },
      { name: 'embedding not null', query: { embedding: { $ne: null } } },
      { name: 'embedding has size > 0', query: { embedding: { $not: { $size: 0 } } } },
      { name: 'embedding is array', query: { embedding: { $type: 'array' } } },
      { name: 'embedding has all conditions', query: { 
        embedding: { 
          $exists: true, 
          $ne: null, 
          $not: { $size: 0 },
          $type: 'array'
        } 
      }}
    ];

    for (const condition of conditions) {
      const count = await DocumentChunk.countDocuments(condition.query);
      console.log(`✅ ${condition.name}: ${count} documents`);
    }

    // Get a sample document and show its exact structure
    console.log('\n📄 Sample document structure:');
    const sampleDoc = await DocumentChunk.findOne().lean();
    
    console.log('Document keys:', Object.keys(sampleDoc));
    console.log('Embedding field type:', typeof sampleDoc.embedding);
    console.log('Embedding field value:', sampleDoc.embedding);
    console.log('Embedding is array:', Array.isArray(sampleDoc.embedding));
    
    if (sampleDoc.embedding) {
      console.log('Embedding length:', sampleDoc.embedding.length);
      console.log('Embedding first 3 values:', sampleDoc.embedding.slice(0, 3));
    }

    // Try to find documents that actually have proper embeddings
    console.log('\n🔍 Looking for documents with proper embeddings...');
    const properEmbeddings = await DocumentChunk.find({
      embedding: { 
        $exists: true, 
        $type: 'array',
        $not: { $size: 0 }
      }
    }).limit(3).lean();
    
    console.log(`Found ${properEmbeddings.length} documents with proper embeddings`);
    
    if (properEmbeddings.length > 0) {
      properEmbeddings.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.chunkId} - embedding length: ${doc.embedding?.length || 0}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n🔚 Database disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkEmbeddingField();
