const DocumentChunk = require('../src/models/DocumentChunk');
const { embedText } = require('../src/services/embedding');

/**
 * Re-embed all existing documents with MiniLM
 */
async function reEmbedAllDocuments() {
  try {
    console.log('Starting to re-embed all documents...');
    
    // Get all documents
    const documents = await DocumentChunk.find({});
    console.log(`Found ${documents.length} document chunks to re-embed`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
      
      // Re-embed each document in the batch
      for (const doc of batch) {
        try {
          const newEmbedding = await embedText(doc.content);
          
          // Update the document with new embedding
          await DocumentChunk.updateOne(
            { _id: doc._id },
            { $set: { embedding: newEmbedding } }
          );
          
          updatedCount++;
          console.log(`Updated chunk ${doc.chunkId}`);
          
        } catch (error) {
          console.error(`Error re-embedding chunk ${doc.chunkId}:`, error.message);
          errorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Re-embedding complete! Updated: ${updatedCount}, Errors: ${errorCount}`);
    return { updatedCount, errorCount };
    
  } catch (error) {
    console.error('Error in re-embedding process:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  reEmbedAllDocuments()
    .then(() => {
      console.log('Re-embedding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Re-embedding failed:', error);
      process.exit(1);
    });
}

module.exports = { reEmbedAllDocuments };
