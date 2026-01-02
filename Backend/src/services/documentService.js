const DocumentChunk = require('../models/DocumentChunk');
const crypto = require('crypto');

/**
 * Generate SHA-256 hash for text content
 * @param {String} text - The text to hash
 * @returns {String} - The SHA-256 hash
 */
const hashText = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Perform semantic search using vector similarity with enhanced database querying
 * @param {Array} queryEmbedding - The query embedding vector
 * @param {Number} topK - Number of results to return (default: 3)
 * @param {Object} options - Additional search options
 * @returns {Promise<Array>} - Array of matching document chunks with scores
 */
const semanticSearch = async (queryEmbedding, topK = 3, options = {}) => {
  try {
    console.log(`🔍 Performing enhanced semantic search with topK=${topK}`);
    console.log(`🔍 Query embedding dimensions: ${queryEmbedding.length}`);
    
    const {
      fileId = null,
      minScore = 0.02,  // Realistic threshold for MiniLM cosine similarity
      includeMetadata = true,
      filterText = null
    } = options;
    
    // Build the vector search pipeline with enhanced filtering
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 150,  // Increased for better recall
          limit: topK * 2,    // Get more candidates for filtering
          ...(fileId && { filter: { fileId } })
        }
      }
    ];

    // Add text filtering if specified
    if (filterText) {
      pipeline.push({
        $match: {
          content: { $regex: filterText, $options: 'i' }
        }
      });
    }

    // Project the results with enhanced metadata
    pipeline.push({
      $project: {
        _id: 0,
        chunkId: 1,
        chunkText: '$content',
        documentId: '$fileId',
        fileName: '$fileName',
        filePath: 1,
        chunkIndex: { $toInt: { $substr: [{ $arrayElemAt: [{ $split: ['$chunkId', '_'] }, 1] }, 0, -1] } },
        score: { $meta: 'vectorSearchScore' },
        ...(includeMetadata && {
          pages: '$pages',
          hash: 1,
          createdAt: 1
        })
      }
    });

    // Sort by score (no filtering - let LLM decide relevance)
    pipeline.push(
      { $sort: { score: -1 } }
    );

    const results = await DocumentChunk.aggregate(pipeline);
    console.log(`🔍 Vector search returned ${results.length} results`);
    if (results.length > 0) {
      console.log(`🔍 First result score: ${results[0].score}`);
      console.log(`🔍 First result preview: ${results[0].chunkText.substring(0, 100)}...`);
    }

    // Filter out duplicate content
    const seen = new Set();
    const uniqueResults = [];
    
    for (const result of results) {
      if (!seen.has(result.chunkText)) {
        seen.add(result.chunkText);
        uniqueResults.push(result);
      }
    }
    
    // Ensure we still have the requested number of results
    const finalResults = uniqueResults.slice(0, topK);

    // Log the search results for debugging
    console.log(`Found ${results.length} total results, ${uniqueResults.length} unique results, returning ${finalResults.length} final results`);
    finalResults.forEach((result, index) => {
      console.log(`Result ${index + 1} (Score: ${result.score.toFixed(4)}): ${result.chunkText.substring(0, 100)}...`);
    });

    return finalResults;
  } catch (error) {
    console.error('Error in semantic search:', error);
    // Fallback to basic similarity search if vector search fails
    console.log('Falling back to basic similarity search');
    return findSimilarChunks(queryEmbedding, topK);
  }
};

/**
 * Hybrid search combining vector similarity and text search
 * @param {Array} queryEmbedding - The query embedding vector
 * @param {String} queryText - The original query text for text search
 * @param {Number} topK - Number of results to return (default: 3)
 * @param {Object} options - Additional search options
 * @returns {Promise<Array>} - Array of matching document chunks with combined scores
 */
const hybridSearch = async (queryEmbedding, queryText, topK = 3, options = {}) => {
  try {
    console.log(`Performing hybrid search with topK=${topK}`);
    
    const { fileId = null, vectorWeight = 0.7, textWeight = 0.3 } = options;
    
    // 1. Perform vector search
    const vectorResults = await semanticSearch(queryEmbedding, topK * 2, { 
      fileId, 
      minScore: 0,  // No threshold - let LLM decide relevance
      includeMetadata: false 
    });
    
    // 2. Perform text search
    const textPipeline = [
      {
        $match: {
          content: { $regex: queryText, $options: 'i' },
          ...(fileId && { fileId })
        }
      },
      {
        $addFields: {
          textScore: { $cond: {
            if: { $regexMatch: { input: '$content', regex: queryText, options: 'i' } },
            then: { $divide: [
              { $strLenCP: { $arrayElemAt: [{ $split: ['$content', queryText] }, 0] } },
              { $strLenCP: '$content' }
            ]},
            else: 0
          }}
        }
      },
      {
        $project: {
          _id: 0,
          chunkId: 1,
          chunkText: '$content',
          documentId: '$fileId',
          fileName: '$fileName',
          filePath: 1,
          chunkIndex: { $toInt: { $substr: [{ $arrayElemAt: [{ $split: ['$chunkId', '_'] }, 1] }, 0, -1] } },
          textScore: 1,
          score: 0
        }
      },
      { $sort: { textScore: 1 } },
      { $limit: topK * 2 }
    ];
    
    const textResults = await DocumentChunk.aggregate(textPipeline);
    
    // 3. Combine and re-score results
    const combinedResults = [];
    const resultMap = new Map();
    
    // Add vector results
    vectorResults.forEach(result => {
      resultMap.set(result.chunkId, {
        ...result,
        vectorScore: result.score,
        textScore: 0,
        combinedScore: result.score * vectorWeight
      });
    });
    
    // Add text results and combine scores
    textResults.forEach(result => {
      const existing = resultMap.get(result.chunkId);
      if (existing) {
        existing.textScore = result.textScore;
        existing.combinedScore += result.textScore * textWeight;
      } else {
        resultMap.set(result.chunkId, {
          ...result,
          vectorScore: 0,
          textScore: result.textScore,
          combinedScore: result.textScore * textWeight
        });
      }
    });
    
    // Convert to array, sort by combined score, and limit
    const finalResults = Array.from(resultMap.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK)
      .map(result => ({
        ...result,
        score: result.combinedScore
      }));
    
    console.log(`Hybrid search: ${vectorResults.length} vector results, ${textResults.length} text results, ${finalResults.length} combined results`);
    
    return finalResults;
  } catch (error) {
    console.error('Error in hybrid search:', error);
    // Fallback to vector search only
    return semanticSearch(queryEmbedding, topK, options);
  }
};

/**
 * Save document chunks to the database (legacy function for backward compatibility)
 * @param {String} fileId - The ID of the file
 * @param {String} filePath - The path to the file
 * @param {Array} chunks - Array of chunks with content and embeddings
 * @returns {Promise<Array>} - Array of saved document chunks
 */
const saveDocumentChunks = async (fileId, filePath, chunks) => {
  try {
    const savedChunks = [];
    
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const contentHash = hashText(chunk.content);
      
      // Check if chunk with this content already exists
      const existingChunk = await DocumentChunk.findOne({ hash: contentHash });
      if (existingChunk) {
        console.log(`Skipping duplicate chunk (hash: ${contentHash.substring(0, 8)}...)`);
        continue;
      }
      
      const docChunk = new DocumentChunk({
        fileId,
        filePath,
        fileName: filePath.split('/').pop() || 'Unknown Document',
        chunkId: chunk.chunkId || `chunk_${index + 1}`,
        content: chunk.content,
        hash: contentHash,
        pages: chunk.pages || [],
        embedding: chunk.embedding || []
      });
      
      try {
        const savedChunk = await docChunk.save();
        savedChunks.push(savedChunk);
      } catch (saveError) {
        // Handle duplicate key error (MongoDB error code 11000)
        if (saveError.code === 11000) {
          console.log(`Skipping duplicate chunk due to unique constraint (hash: ${contentHash.substring(0, 8)}...)`);
          continue;
        }
        throw saveError;
      }
    }

    console.log(`Successfully saved ${savedChunks.length} out of ${chunks.length} chunks`);
    return savedChunks;
  } catch (error) {
    console.error('Error saving document chunks:', error);
    throw new Error('Failed to save document chunks to database');
  }
};

/**
 * Save document chunks to the database with citation support
 * @param {String} fileId - The ID of the file
 * @param {String} filePath - The path to the file
 * @param {String} fileName - The name of the file
 * @param {Array} chunks - Array of chunks with content, embeddings, and page metadata
 * @returns {Promise<Array>} - Array of saved document chunks
 */
const saveDocumentChunksWithCitations = async (fileId, filePath, fileName, chunks) => {
  try {
    const savedChunks = [];
    
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const contentHash = hashText(chunk.content);
      
      // Check if chunk with this content already exists
      const existingChunk = await DocumentChunk.findOne({ hash: contentHash });
      if (existingChunk) {
        console.log(`Skipping duplicate chunk (hash: ${contentHash.substring(0, 8)}...)`);
        continue;
      }
      
      const docChunk = new DocumentChunk({
        fileId,
        filePath,
        fileName,
        chunkId: chunk.chunkId,
        content: chunk.content,
        hash: contentHash,
        pages: chunk.pages || [],
        embedding: chunk.embedding || []
      });
      
      try {
        const savedChunk = await docChunk.save();
        savedChunks.push(savedChunk);
      } catch (saveError) {
        // Handle duplicate key error (MongoDB error code 11000)
        if (saveError.code === 11000) {
          console.log(`Skipping duplicate chunk due to unique constraint (hash: ${contentHash.substring(0, 8)}...)`);
          continue;
        }
        throw saveError;
      }
    }

    console.log(`Successfully saved ${savedChunks.length} out of ${chunks.length} chunks`);
    return savedChunks;
  } catch (error) {
    console.error('Error saving document chunks:', error);
    throw new Error('Failed to save document chunks to database');
  }
};

/**
 * Find similar document chunks using vector similarity search
 * @param {Array} embedding - The query embedding vector
 * @param {Number} limit - Maximum number of results to return
 * @param {String} fileId - Optional file ID to filter results
 * @returns {Promise<Array>} - Array of matching document chunks
 */
const findSimilarChunks = async (embedding, limit = 5, fileId = null) => {
  try {
    const query = {};
    if (fileId) {
      query.fileId = fileId;
    }

    // Using MongoDB's vector search with the vector index
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit: limit,
          ...(fileId ? { filter: { fileId } } : {})
        }
      },
      {
        $project: {
          _id: 0,
          chunkId: 1,
          content: 1,
          fileId: 1,
          filePath: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      },
      { $sort: { score: -1 } }
    ];

    const results = await DocumentChunk.aggregate(pipeline);

    return results;
  } catch (error) {
    console.error('Error finding similar chunks:', error);
    throw new Error('Failed to perform vector similarity search');
  }
};

/**
 * Get all chunks for a specific file
 * @param {String} fileId - The ID of the file
 * @returns {Promise<Array>} - Array of document chunks
 */
const getChunksByFileId = async (fileId) => {
  try {
    return await DocumentChunk.find({ fileId }, { _id: 0, embedding: 0 }).sort({ chunkId: 1 });
  } catch (error) {
    console.error('Error getting chunks by file ID:', error);
    throw new Error('Failed to retrieve document chunks');
  }
};

/**
 * Delete all chunks for a specific file
 * @param {String} fileId - The ID of the file
 * @returns {Promise<Object>} - Deletion result
 */
const deleteChunksByFileId = async (fileId) => {
  try {
    return await DocumentChunk.deleteMany({ fileId });
  } catch (error) {
    console.error('Error deleting chunks by file ID:', error);
    throw new Error('Failed to delete document chunks');
  }
};

module.exports = {
  saveDocumentChunks,
  saveDocumentChunksWithCitations,
  findSimilarChunks,
  semanticSearch,
  hybridSearch,
  getChunksByFileId,
  deleteChunksByFileId
};
