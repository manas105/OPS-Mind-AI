require('dotenv').config();
const mongoose = require('mongoose');

async function directMongoCheck() {
  try {
    console.log('🔍 DIRECT MONGODB CHECK');
    console.log('=====================');

    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    
    console.log('✅ Database connected');

    // Get the raw collection
    const db = mongoose.connection.db;
    const collection = db.collection('documentchunks');
    
    // Get a sample document directly from MongoDB
    const sampleDoc = await collection.findOne({});
    
    console.log('Raw document keys:', Object.keys(sampleDoc));
    console.log('Has embedding field:', 'embedding' in sampleDoc);
    console.log('Embedding field:', sampleDoc.embedding);
    console.log('Embedding type:', typeof sampleDoc.embedding);
    console.log('Embedding is array:', Array.isArray(sampleDoc.embedding));
    
    if (Array.isArray(sampleDoc.embedding)) {
      console.log('Embedding length:', sampleDoc.embedding.length);
      if (sampleDoc.embedding.length > 0) {
        console.log('First 3 values:', sampleDoc.embedding.slice(0, 3));
      }
    }
    
    // Check documents with non-empty embeddings
    const docsWithEmbeddings = await collection.countDocuments({
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    });
    console.log(`Documents with non-empty embeddings: ${docsWithEmbeddings}`);
    
    // Check documents with empty embeddings
    const docsWithEmptyEmbeddings = await collection.countDocuments({
      embedding: { $size: 0 }
    });
    console.log(`Documents with empty embeddings: ${docsWithEmptyEmbeddings}`);
    
    // Check documents without embedding field
    const docsWithoutEmbedding = await collection.countDocuments({
      embedding: { $exists: false }
    });
    console.log(`Documents without embedding field: ${docsWithoutEmbedding}`);
    
    await mongoose.disconnect();
    console.log('\n🔚 Database disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

directMongoCheck();
