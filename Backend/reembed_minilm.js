require('dotenv').config();
const mongoose = require('mongoose');
const DocumentChunk = require('./src/models/DocumentChunk');
const { embedText } = require('./src/services/embedding');

/**
 * Re-embed all documents with MiniLM (384 dimensions) to match the vector index
 */
async function reEmbedAllWithMiniLM() {
  try {
    console.log('🔄 RE-EMBEDDING ALL DOCUMENTS WITH MINILM');
    console.log('==========================================');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    
    console.log('✅ Database connected');

    // Get ALL documents (regardless of current embedding)
    const documents = await DocumentChunk.find({});
    console.log(`📄 Found ${documents.length} documents to re-embed`);
    
    if (documents.length === 0) {
      console.log('✅ No documents found');
      await mongoose.disconnect();
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process documents in small batches
    const batchSize = 3;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)} (${batch.length} documents)`);
      
      for (const doc of batch) {
        try {
          console.log(`🔍 Re-embedding: ${doc.chunkId}`);
          
          // Generate new 384-dimensional embedding with MiniLM
          const newEmbedding = await embedText(doc.content);
          
          // Verify dimensions
          if (newEmbedding.length !== 384) {
            throw new Error(`Expected 384 dimensions, got ${newEmbedding.length}`);
          }
          
          // Update the document
          await DocumentChunk.updateOne(
            { _id: doc._id },
            { $set: { embedding: newEmbedding } }
          );
          
          updatedCount++;
          console.log(`✅ Updated ${doc.chunkId} (${updatedCount}/${documents.length}) - 384 dimensions`);
          
          // Delay between documents
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error re-embedding ${doc.chunkId}:`, error.message);
          errorCount++;
        }
      }
      
      // Longer delay between batches
      console.log('⏳ Waiting before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`🎉 Re-embedding complete! Updated: ${updatedCount}, Errors: ${errorCount}`);
    
    // Verify the results
    const docsWith384Embeddings = await DocumentChunk.countDocuments({
      embedding: { 
        $exists: true, 
        $type: 'array',
        $size: 384  // Check for exactly 384 dimensions
      }
    });
    console.log(`📊 Documents with 384-dimensional embeddings: ${docsWith384Embeddings}`);
    
    await mongoose.disconnect();
    console.log('🔚 Database disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

reEmbedAllWithMiniLM();
