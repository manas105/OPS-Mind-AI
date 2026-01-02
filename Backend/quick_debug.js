require('dotenv').config();
const mongoose = require('mongoose');
const DocumentChunk = require('./src/models/DocumentChunk');
const { embedText } = require('./src/services/embedding');

async function quickDebug() {
  try {
    console.log('🔍 QUICK VECTOR SEARCH DEBUG');
    console.log('=============================');

    // Connect to database
    console.log('\n1. Connecting to database...');
    const mongoUri = process.env.MONGODB_URI;
    console.log(`Using URI: ${mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 30000, // 30 second timeout
    });
    
    console.log('✅ Database connected successfully');

    // Quick document count
    console.log('\n2. Checking documents...');
    const totalDocs = await DocumentChunk.countDocuments();
    console.log(`✅ Total documents: ${totalDocs}`);
    
    if (totalDocs === 0) {
      console.log('❌ No documents found');
      await mongoose.disconnect();
      return;
    }

    // Check a sample document
    console.log('\n3. Sample document check...');
    const sampleDoc = await DocumentChunk.findOne().limit(1).lean();
    
    if (!sampleDoc) {
      console.log('❌ No sample document found');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Found document: ${sampleDoc.chunkId}`);
    console.log(`✅ Content: "${sampleDoc.content.substring(0, 100)}..."`);
    console.log(`✅ Has embedding: ${!!sampleDoc.embedding}`);
    
    if (sampleDoc.embedding) {
      console.log(`✅ Embedding dimensions: ${sampleDoc.embedding.length}`);
    }

    // Test embedding generation
    console.log('\n4. Testing embedding generation...');
    const testQuery = "test"; // Simple test query
    const embedding = await embedText(testQuery);
    console.log(`✅ Generated embedding: ${embedding.length} dimensions`);

    // Test direct MongoDB aggregation
    console.log('\n5. Testing direct MongoDB aggregation...');
    try {
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: 10,
            limit: 5
          }
        },
        {
          $addFields: {
            score: { $meta: "vectorSearchScore" }
          }
        },
        {
          $limit: 5
        }
      ];

      console.log('🔍 Running aggregation pipeline...');
      const results = await DocumentChunk.aggregate(pipeline);
      console.log(`✅ Aggregation results: ${results.length} documents found`);
      
      if (results.length > 0) {
        results.forEach((doc, i) => {
          console.log(`${i + 1}. Score: ${doc.score?.toFixed(4) || 'N/A'} - "${doc.content.substring(0, 50)}..."`);
        });
      } else {
        console.log('❌ No aggregation results found');
      }
      
    } catch (aggError) {
      console.error('❌ Aggregation error:', aggError.message);
      
      // Try to list indexes
      console.log('\n6. Checking available indexes...');
      try {
        const indexes = await DocumentChunk.aggregate([{ $listSearchIndexes: {} }]);
        console.log(`✅ Available indexes: ${indexes.map(idx => idx.name).join(', ')}`);
      } catch (indexError) {
        console.error('❌ Index listing error:', indexError.message);
      }
    }

    // Test simple text search as fallback
    console.log('\n7. Testing simple text search...');
    const textResults = await DocumentChunk.find({
      content: { $regex: testQuery, $options: 'i' }
    }).limit(3);
    
    console.log(`✅ Text search results: ${textResults.length} documents found`);
    textResults.forEach((doc, i) => {
      console.log(`${i + 1}. "${doc.content.substring(0, 50)}..."`);
    });

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Database disconnected');
  }
}

quickDebug();
