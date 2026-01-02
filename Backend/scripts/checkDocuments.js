const DocumentChunk = require('../src/models/DocumentChunk');

async function checkDocuments() {
  try {
    // Connect to MongoDB (assuming it's already connected in app.js)
    
    // Check total documents
    const totalCount = await DocumentChunk.countDocuments();
    console.log(`Total documents in DB: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('No documents found. You need to upload PDFs first.');
      return;
    }
    
    // Get a sample document to check embedding dimensions
    const sampleDoc = await DocumentChunk.findOne({});
    if (sampleDoc && sampleDoc.embedding) {
      console.log(`Sample embedding dimensions: ${sampleDoc.embedding.length}`);
      console.log(`Sample content preview: ${sampleDoc.content.substring(0, 100)}...`);
    }
    
    // Try a simple text search as fallback
    const leaveDocs = await DocumentChunk.find({ 
      content: { $regex: 'leave', $options: 'i' } 
    }).limit(3);
    
    console.log(`Found ${leaveDocs.length} documents containing 'leave':`);
    leaveDocs.forEach((doc, i) => {
      console.log(`${i+1}. ${doc.content.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('Error checking documents:', error);
  }
}

// Run if called directly
if (require.main === module) {
  checkDocuments()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDocuments };
