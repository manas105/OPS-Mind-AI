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
    
    // Connect to database with proper settings
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      socketTimeoutMS: 60000, // 60 second timeout
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
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
    
    // Process in smaller batches to avoid memory issues
    const batchSize = 5; // Reduced batch size
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)} (${batch.length} documents)`);
      
      // Re-embed each document in the batch
      for (const doc of batch) {
        try {
          console.log(`🔍 Processing chunk: ${doc.chunkId}`);
          
          const newEmbedding = await embedText(doc.content);
          
          // Update the document with new embedding
          await DocumentChunk.updateOne(
            { _id: doc._id },
            { $set: { embedding: newEmbedding } }
          );
          
          updatedCount++;
          console.log(`✅ Updated chunk ${doc.chunkId} (${updatedCount}/${documents.length})`);
          
        } catch (error) {
          console.error(`❌ Error re-embedding chunk ${doc.chunkId}:`, error.message);
          errorCount++;
        }
      }
      
      // Longer delay between batches to avoid overwhelming the system
      console.log('⏳ Waiting before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
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
