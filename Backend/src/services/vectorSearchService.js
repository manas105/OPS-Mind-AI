const DocumentChunk = require('../models/DocumentChunk');
const { embedText } = require('./embedding');

/**
 * Vector Search Service for MongoDB Atlas Vector Search
 * Provides semantic search capabilities with relevance scoring
 */
class VectorSearchService {
  /**
   * Perform semantic search on document chunks
   * @param {string} query - User query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of relevant chunks with scores
   */
  async search(query, options = {}) {
    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query must be a non-empty string');
    }

    const {
      limit = 10,
      minScore = 0.02,  // Realistic threshold for MiniLM cosine similarity
      fileId = null,
      includeMetadata = true
    } = options;

    // Validate options
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (minScore < 0 || minScore > 1) {
      throw new Error('Minimum score must be between 0 and 1');
    }

    const startTime = Date.now();

    try {
      // Debug: Check if collection has documents
      const totalDocs = await DocumentChunk.countDocuments();
      console.log(`📊 Total documents in DocumentChunk: ${totalDocs}`);
      
      if (totalDocs === 0) {
        console.warn('⚠️ No documents found in DocumentChunk collection');
        return [];
      }
      
      // Debug: Check if documents have embeddings
      const docsWithEmbeddings = await DocumentChunk.countDocuments({ embedding: { $exists: true, $ne: null } });
      console.log(`📊 Documents with embeddings: ${docsWithEmbeddings}`);
      
      if (docsWithEmbeddings === 0) {
        console.warn('⚠️ No documents with embeddings found');
        return [];
      }
      
      // Generate embedding for query with error handling
      let queryEmbedding;
      try {
        queryEmbedding = await embedText(query.trim());
        console.log(`🔍 Query embedding generated: ${queryEmbedding.length} dimensions`);
      } catch (embeddingError) {
        console.error('❌ Failed to generate query embedding:', embeddingError);
        throw new Error(`Failed to process query: ${embeddingError.message}`);
      }
      
      // Validate embedding dimensions
      if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new Error('Invalid embedding generated');
      }
      
      // Debug: List available search indexes
      let availableIndexes = [];
      try {
        const indexes = await DocumentChunk.aggregate([{ $listSearchIndexes: {} }]);
        availableIndexes = indexes.map(idx => idx.name);
        console.log('📋 Available search indexes:', availableIndexes);
        
        // Try to get index details and validate dimensions
        for (const index of indexes) {
          console.log(`🔍 Index details for "${index.name}":`, JSON.stringify(index, null, 2));
          
          // Check if this index has the right dimensions
          if (index.latestDefinition && index.latestDefinition.fields) {
            const vectorField = index.latestDefinition.fields.find(f => f.type === 'vector');
            if (vectorField) {
              console.log(`📏 Index "${index.name}" dimensions: ${vectorField.numDimensions}`);
              console.log(`📏 Query dimensions: ${queryEmbedding.length}`);
              
              if (vectorField.numDimensions !== queryEmbedding.length) {
                console.log(`⚠️ Dimension mismatch for index "${index.name}": ${vectorField.numDimensions} vs ${queryEmbedding.length}`);
              } else {
                console.log(`✅ Dimensions match for index "${index.name}"`);
              }
            }
          }
        }
      } catch (indexError) {
        console.log('⚠️ Could not list search indexes:', indexError.message);
      }
      
      // Try different index names with fallback
      const indexNames = ['vector_index', 'default', 'vectorSearch'];
      let results = [];
      let lastError = null;
      
      for (const indexName of indexNames) {
        // Skip if index is not available
        if (availableIndexes.length > 0 && !availableIndexes.includes(indexName)) {
          console.log(`⏭️ Skipping unavailable index: ${indexName}`);
          continue;
        }
        
        try {
          console.log(`🔍 Trying index: ${indexName}`);
          
          // Use $vectorSearch for vector_index, $search for others
          const searchStage = indexName === 'vector_index' ? {
            $vectorSearch: {
              index: indexName,
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: Math.min(300, totalDocs),
              limit: limit,
              ...(fileId && { filter: { fileId } })
            }
          } : {
            $search: {
              index: indexName,
              knnBeta: {
                vector: queryEmbedding,
                path: 'embedding',
                k: limit,
                filter: fileId ? { fileId } : undefined
              }
            }
          };
          
          const pipeline = [
            searchStage,
            {
              $addFields: {
                score: indexName === 'vector_index' ? { $meta: 'vectorSearchScore' } : { $meta: 'searchScore' }
              }
            },
            {
              $match: {
                score: { $gte: minScore }
              }
            },
            {
              $sort: { score: -1 }
            },
            {
              $limit: limit
            }
          ];

          // Add metadata fields if requested
          if (includeMetadata) {
            pipeline.push({
              $project: {
                chunkId: 1,
                content: 1,
                fileId: 1,
                fileName: 1,
                pages: 1,
                score: 1,
                metadata: 1
              }
            });
          }

          console.log(`🔍 Executing vector search pipeline with index: ${indexName}...`);
          
          results = await DocumentChunk.aggregate(pipeline);
          console.log(`✅ Success with index ${indexName}: Found ${results.length} results`);
          
          if (results.length > 0) {
            break; // Success, exit loop
          }
          
        } catch (error) {
          console.log(`❌ Failed with index ${indexName}: ${error.message}`);
          lastError = error;
          continue; // Try next index
        }
      }
      
      if (results.length === 0) {
        if (lastError) {
          throw lastError;
        }
        console.warn(`⚠️ No results found for query: "${query}"`);
        return [];
      }
      
      console.log(`📊 Final results: ${results.length} items (took ${Date.now() - startTime}ms)`);
      
      // Validate and format results
      const formattedResults = results.filter(chunk => {
        if (!chunk.chunkId || !chunk.content) {
          console.warn('⚠️ Invalid chunk found:', chunk.chunkId);
          return false;
        }
        return true;
      }).map(chunk => ({
        ...chunk,
        relevanceScore: chunk.score || 0,
        // Format pages for better readability
        pageReferences: chunk.pages?.map(p => p.page || p).filter(Boolean) || []
      }));
      
      console.log(`✅ Returning ${formattedResults.length} valid results`);
      return formattedResults;

    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error(`Vector search error (took ${searchTime}ms):`, error);
      
      // Provide more specific error messages
      if (error.message.includes('index')) {
        throw new Error(`Search index configuration error: ${error.message}`);
      } else if (error.message.includes('embedding')) {
        throw new Error(`Embedding service error: ${error.message}`);
      } else if (error.message.includes('connection')) {
        throw new Error(`Database connection error: ${error.message}`);
      } else {
        throw new Error(`Vector search failed: ${error.message}`);
      }
    }
  }

  /**
   * Hybrid search combining vector and keyword search
   * @param {string} query - User query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Combined search results
   */
  async hybridSearch(query, options = {}) {
    const { vectorWeight = 0.7, keywordWeight = 0.3 } = options;

    try {
      // Get vector search results
      const vectorResults = await this.search(query, {
        ...options,
        limit: Math.ceil(options.limit * 1.5) || 15
      });

      // Get keyword search results
      const keywordResults = await this.keywordSearch(query, {
        ...options,
        limit: Math.ceil(options.limit * 1.5) || 15
      });

      // Combine and deduplicate results
      const combinedResults = this.combineResults(
        vectorResults,
        keywordResults,
        vectorWeight,
        keywordWeight
      );

      return combinedResults.slice(0, options.limit || 10);

    } catch (error) {
      console.error('Hybrid search error:', error);
      throw new Error(`Hybrid search failed: ${error.message}`);
    }
  }

  /**
   * Keyword-based search fallback
   * @param {string} query - User query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Keyword search results
   */
  async keywordSearch(query, options = {}) {
    const { limit = 10, fileId = null } = options;

    try {
      const searchRegex = new RegExp(query.split(' ').join('|'), 'i');
      
      const matchStage = {
        $or: [
          { content: { $regex: searchRegex } },
          { 'metadata.title': { $regex: searchRegex } },
          { fileName: { $regex: searchRegex } }
        ]
      };

      if (fileId) {
        matchStage.fileId = fileId;
      }

      const results = await DocumentChunk.find(matchStage)
        .select('chunkId content fileId fileName pages metadata')
        .limit(limit)
        .lean();

      return results.map(chunk => ({
        ...chunk,
        relevanceScore: this.calculateKeywordScore(chunk.content, query),
        pageReferences: chunk.pages?.map(p => p.page) || []
      }));

    } catch (error) {
      console.error('Keyword search error:', error);
      throw new Error(`Keyword search failed: ${error.message}`);
    }
  }

  /**
   * Calculate keyword relevance score
   * @param {string} content - Document content
   * @param {string} query - Search query
   * @returns {number} Relevance score (0-1)
   */
  calculateKeywordScore(content, query) {
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    let totalTerms = queryTerms.length;

    queryTerms.forEach(term => {
      const regex = new RegExp(term, 'g');
      const termMatches = (contentLower.match(regex) || []).length;
      matches += Math.min(termMatches, 3); // Cap at 3 matches per term
    });

    return Math.min(matches / (totalTerms * 2), 1);
  }

  /**
   * Combine vector and keyword search results
   * @param {Array} vectorResults - Vector search results
   * @param {Array} keywordResults - Keyword search results
   * @param {number} vectorWeight - Weight for vector results
   * @param {number} keywordWeight - Weight for keyword results
   * @returns {Array} Combined and ranked results
   */
  combineResults(vectorResults, keywordResults, vectorWeight, keywordWeight) {
    const combinedMap = new Map();

    // Add vector results
    vectorResults.forEach(result => {
      const key = result.chunkId;
      combinedMap.set(key, {
        ...result,
        combinedScore: result.relevanceScore * vectorWeight
      });
    });

    // Add or update with keyword results
    keywordResults.forEach(result => {
      const key = result.chunkId;
      const keywordScore = result.relevanceScore * keywordWeight;
      
      if (combinedMap.has(key)) {
        const existing = combinedMap.get(key);
        existing.combinedScore += keywordScore;
      } else {
        combinedMap.set(key, {
          ...result,
          combinedScore: keywordScore
        });
      }
    });

    // Convert to array and sort by combined score
    return Array.from(combinedMap.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .map(result => ({
        ...result,
        relevanceScore: result.combinedScore
      }));
  }

  /**
   * Get search suggestions based on partial query
   * @param {string} partialQuery - Partial user query
   * @param {number} limit - Number of suggestions to return
   * @returns {Promise<Array>} Search suggestions
   */
  async getSuggestions(partialQuery, limit = 5) {
    try {
      const searchRegex = new RegExp(partialQuery, 'i');
      
      const results = await DocumentChunk.aggregate([
        {
          $match: {
            $or: [
              { content: { $regex: searchRegex } },
              { 'metadata.title': { $regex: searchRegex } }
            ]
          }
        },
        {
          $project: {
            suggestion: {
              $cond: {
                if: { $gt: [{ $strLenCP: '$metadata.title' }, 0] },
                then: '$metadata.title',
                else: { $substrCP: ['$content', 0, 100] }
              }
            },
            score: { $meta: 'searchScore' }
          }
        },
        { $limit: limit * 3 },
        { $group: { _id: '$suggestion', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return results.map(r => r._id);

    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Get document statistics for analytics
   * @param {string} fileId - Optional file ID filter
   * @returns {Promise<Object>} Document statistics
   */
  async getDocumentStats(fileId = null) {
    try {
      const matchStage = fileId ? { fileId } : {};
      
      const stats = await DocumentChunk.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$fileId',
            totalChunks: { $sum: 1 },
            avgChunkLength: { $avg: { $strLenCP: '$content' } },
            uniquePages: { $addToSet: '$pages.page' },
            fileNames: { $addToSet: '$fileName' }
          }
        },
        {
          $project: {
            fileId: '$_id',
            totalChunks: 1,
            avgChunkLength: { $round: ['$avgChunkLength', 0] },
            totalPages: { $size: '$uniquePages' },
            fileName: { $arrayElemAt: ['$fileNames', 0] }
          }
        }
      ]);

      return fileId ? stats[0] || null : stats;

    } catch (error) {
      console.error('Document stats error:', error);
      throw new Error(`Failed to get document stats: ${error.message}`);
    }
  }
}

module.exports = new VectorSearchService();
