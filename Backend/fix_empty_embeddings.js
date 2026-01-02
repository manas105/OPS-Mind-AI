require('dotenv').config();
const mongoose = require('mongoose');
const DocumentChunk = require('./src/models/DocumentChunk');
const { embedText } = require('./src/services/embedding');

/**
 * Fix empty embeddings by generating proper ones
 */
async function fixEmptyEmbeddings() {
  try {
    console.log('🔧 FIXING EMPTY EMBEDDINGS');
    console.log('==========================');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    
    console.log('✅ Database connected');

    // Find documents with empty embeddings
    const documents = await DocumentChunk.find({
      embedding: { $size: 0 }
    });
    
    console.log(`📄 Found ${documents.length} documents with empty embeddings`);
    
    if (documents.length === 0) {
      console.log('✅ No documents need fixing');
      await mongoose.disconnect();
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process documents one by one
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      console.log(`🔍 Processing ${i + 1}/${documents.length}: ${doc.chunkId}`);
      
      try {
        // Generate proper embedding
        const newEmbedding = await embedText(doc.content);
        
        // Update the document
        await DocumentChunk.updateOne(
          { _id: doc._id },
          { $set: { embedding: newEmbedding } }
        );
        
        updatedCount++;
        console.log(`✅ Fixed ${doc.chunkId} (${updatedCount}/${documents.length})`);
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error fixing ${doc.chunkId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`🎉 Fix complete! Updated: ${updatedCount}, Errors: ${errorCount}`);
    
    // Verify the fix
    const properEmbeddings = await DocumentChunk.countDocuments({
      embedding: { 
        $exists: true, 
        $type: 'array',
        $not: { $size: 0 }
      }
    });
    console.log(`📊 Documents with proper embeddings: ${properEmbeddings}`);
    
    await mongoose.disconnect();
    console.log('🔚 Database disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixEmptyEmbeddings();
