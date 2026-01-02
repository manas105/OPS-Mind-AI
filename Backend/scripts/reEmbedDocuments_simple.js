require('dotenv').config();
const mongoose = require('mongoose');
const DocumentChunk = require('../src/models/DocumentChunk');
const { embedText } = require('../src/services/embedding');

/**
 * Re-embed all existing documents with MiniLM
 */
async function reEmbedAllDocuments() {
  try {
    console.log('🔧 Starting to re-embed all documents...');
    
    // Connect to database with simpler settings
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    
    console.log('✅ Database connected');
    
    // Get all documents that don't have embeddings
    const documents = await DocumentChunk.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: { $size: 0 } }
      ]
    });
    
    console.log(`📄 Found ${documents.length} document chunks to re-embed`);
    
    if (documents.length === 0) {
      console.log('✅ All documents already have embeddings');
      await mongoose.disconnect();
      return { updatedCount: 0, errorCount: 0 };
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process one by one to avoid overwhelming the system
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      console.log(`🔍 Processing chunk ${i + 1}/${documents.length}: ${doc.chunkId}`);
      
      try {
        const newEmbedding = await embedText(doc.content);
        
        // Update the document with new embedding
        await DocumentChunk.updateOne(
          { _id: doc._id },
          { $set: { embedding: newEmbedding } }
        );
        
        updatedCount++;
        console.log(`✅ Updated chunk ${doc.chunkId} (${updatedCount}/${documents.length})`);
        
        // Delay between each document
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error re-embedding chunk ${doc.chunkId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`🎉 Re-embedding complete! Updated: ${updatedCount}, Errors: ${errorCount}`);
    
    // Verify the results
    const docsWithEmbeddings = await DocumentChunk.countDocuments({ 
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } } 
    });
    console.log(`📊 Total documents with embeddings: ${docsWithEmbeddings}`);
    
    await mongoose.disconnect();
    console.log('🔚 Database disconnected');
    
    return { updatedCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error in re-embedding process:', error);
    await mongoose.disconnect();
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  reEmbedAllDocuments()
    .then(() => {
      console.log('🎊 Re-embedding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Re-embedding failed:', error);
      process.exit(1);
    });
}

module.exports = { reEmbedAllDocuments };
