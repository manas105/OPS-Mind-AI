const DocumentChunk = require('./src/models/DocumentChunk');
const { embedText } = require('./src/services/embedding');
const vectorSearchService = require('./src/services/vectorSearchService');

async function debugVectorSearch() {
  try {
    console.log('🔍 DEBUGGING VECTOR SEARCH');
    console.log('================================');

    // 1. Check database connection
    console.log('\n1. Checking database connection...');
    try {
      const totalDocs = await DocumentChunk.countDocuments();
      console.log(`✅ Total documents: ${totalDocs}`);
      
      if (totalDocs === 0) {
        console.log('❌ No documents found in database');
        return;
      }
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError.message);
      return;
    }

    // 2. Check documents with embeddings
    console.log('\n2. Checking documents with embeddings...');
    const docsWithEmbeddings = await DocumentChunk.countDocuments({ 
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } } 
    });
    console.log(`✅ Documents with embeddings: ${docsWithEmbeddings}`);
    
    if (docsWithEmbeddings === 0) {
      console.log('❌ No documents with embeddings found');
      return;
    }

    // 3. Get a sample document and its content
    console.log('\n3. Getting sample document...');
    const sampleDoc = await DocumentChunk.findOne({ 
      embedding: { $exists: true, $ne: null } 
    }).lean();
    
    if (!sampleDoc) {
      console.log('❌ No sample document found');
      return;
    }
    
    console.log(`✅ Sample document ID: ${sampleDoc.chunkId}`);
    console.log(`✅ Content preview: "${sampleDoc.content.substring(0, 100)}..."`);
    console.log(`✅ Embedding dimensions: ${sampleDoc.embedding ? sampleDoc.embedding.length : 'none'}`);

    // 4. Test embedding generation
    console.log('\n4. Testing embedding generation...');
    const testQuery = sampleDoc.content.substring(0, 50); // Use first 50 chars of document
    console.log(`🔍 Test query: "${testQuery}"`);
    
    const queryEmbedding = await embedText(testQuery);
    console.log(`✅ Query embedding dimensions: ${queryEmbedding.length}`);

    // 5. Check search indexes
    console.log('\n5. Checking search indexes...');
    try {
      const indexes = await DocumentChunk.aggregate([{ $listSearchIndexes: {} }]);
      console.log(`✅ Available indexes: ${indexes.map(idx => idx.name).join(', ')}`);
      
      if (indexes.length === 0) {
        console.log('❌ No search indexes found');
        return;
      }
      
      // Check index details
      for (const index of indexes) {
        console.log(`📋 Index "${index.name}":`);
        if (index.latestDefinition && index.latestDefinition.fields) {
          const vectorField = index.latestDefinition.fields.find(f => f.type === 'vector');
          if (vectorField) {
            console.log(`   - Dimensions: ${vectorField.numDimensions}`);
            console.log(`   - Path: ${vectorField.path}`);
            console.log(`   - Similarity: ${vectorField.similarity}`);
          }
        }
      }
    } catch (indexError) {
      console.error('❌ Index check error:', indexError.message);
    }

    // 6. Test vector search with exact match
    console.log('\n6. Testing vector search...');
    try {
      const results = await vectorSearchService.search(testQuery, {
        limit: 5,
        minScore: 0.01 // Lower threshold for testing
      });
      
      console.log(`✅ Search results: ${results.length} found`);
      
      if (results.length > 0) {
        console.log('\n📊 Top results:');
        results.forEach((result, i) => {
          console.log(`${i + 1}. Score: ${result.relevanceScore.toFixed(4)} - "${result.content.substring(0, 50)}..."`);
        });
      } else {
        console.log('❌ No results found even with exact content match');
        
        // Try keyword search as fallback
        console.log('\n7. Testing keyword search fallback...');
        const keywordResults = await vectorSearchService.keywordSearch(testQuery, {
          limit: 5
        });
        console.log(`✅ Keyword search results: ${keywordResults.length} found`);
        
        if (keywordResults.length > 0) {
          console.log('\n📊 Keyword results:');
          keywordResults.forEach((result, i) => {
            console.log(`${i + 1}. Score: ${result.relevanceScore.toFixed(4)} - "${result.content.substring(0, 50)}..."`);
          });
        }
      }
    } catch (searchError) {
      console.error('❌ Vector search error:', searchError.message);
      console.error('Stack:', searchError.stack);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugVectorSearch();
