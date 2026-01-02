const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { embedText } = require('../services/embedding');
const DocumentChunk = require('../models/DocumentChunk');
const documentService = require('../services/documentService');
const langchainService = require('../services/langchainService');

/**
 * @route   POST /api/retrieve
 * @desc    Retrieve relevant information based on user query
 * @access  Public
 * @body    {string} query - The search query
 */
router.post(
  '/',
  [
    body('query')
      .trim()
      .notEmpty()
      .withMessage('Query is required')
      .isString()
      .withMessage('Query must be a string'),
    body('searchType')
      .optional()
      .isIn(['hybrid', 'vector'])
      .withMessage('Search type must be either "hybrid" or "vector"'),
    body('topK')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('topK must be an integer between 1 and 10'),
    body('fileId')
      .optional()
      .isString()
      .withMessage('fileId must be a string'),
  ],
  async (req, res) => {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { query, searchType = 'hybrid', topK = 3, fileId = null } = req.body;
      
      // 1. Get embedding for the query
      const queryEmbedding = await embedText(query);
      
      // 2. Perform enhanced search based on type
      let searchResults;
      const searchOptions = { fileId, minScore: 0.3 };
      
      if (searchType === 'hybrid') {
        // Use hybrid search combining vector and text search
        searchResults = await documentService.hybridSearch(queryEmbedding, query, topK, searchOptions);
      } else if (searchType === 'vector') {
        // Use pure vector search
        searchResults = await documentService.semanticSearch(queryEmbedding, topK, searchOptions);
      } else {
        // Default to hybrid search
        searchResults = await documentService.hybridSearch(queryEmbedding, query, topK, searchOptions);
      }
      
      // 3. Format chunks for LangChain service
      const chunks = searchResults.map(result => ({ text: result.chunkText }));
      
      // If no good chunks found, try keyword search as fallback
      if (chunks.length === 0 || chunks.every(chunk => chunk.text.length < 50)) {
        console.log('🔍 Vector search returned poor chunks, trying keyword search fallback...');
        
        // Simple keyword search fallback
        const keywordResults = await DocumentChunk.find({
          $or: [
            { content: { $regex: query.split(' ').join('|'), $options: 'i' } },
            { fileName: { $regex: query.split(' ').join('|'), $options: 'i' } }
          ]
        }).limit(3).select('content fileName fileId').lean();
        
        if (keywordResults.length > 0) {
          console.log(`✅ Keyword search found ${keywordResults.length} results`);
          const fallbackChunks = keywordResults.map(doc => ({ text: doc.content }));
          const response = await langchainService.generateResponseWithCitations(query, fallbackChunks, keywordResults);
          const answer = response.content;
          
          return res.json({
            success: true,
            query,
            searchType: 'keyword_fallback',
            searchOptions: { topK, fileId, resultsFound: keywordResults.length },
            chunks: keywordResults.map(r => ({
              chunkId: r._id,
              text: r.content,
              score: 0.8,
              documentId: r.fileId,
              fileName: r.fileName
            })),
            answer,
            hasCitations: response.hasCitations || false,
            citations: response.citations || [],
            database: { engine: 'MongoDB Keyword Search', searchMethod: 'keyword_fallback' }
          });
        }
      }
      
      // 4. Generate response using LangChain
      const response = await langchainService.generateResponseWithCitations(query, chunks, searchResults);
      const answer = response.content;
      
      // 5. Return the enhanced response
      res.json({
        success: true,
        query,
        searchType,
        searchOptions: {
          topK,
          fileId,
          resultsFound: searchResults.length
        },
        chunks: searchResults.map(r => ({
          chunkId: r.chunkId,
          text: r.chunkText,
          score: r.score,
          documentId: r.documentId,
          fileName: r.fileName,
          chunkIndex: r.chunkIndex,
          ...(r.vectorScore !== undefined && { vectorScore: r.vectorScore }),
          ...(r.textScore !== undefined && { textScore: r.textScore })
        })),
        answer,
        hasCitations: response.hasCitations || false,
        citations: response.citations || [],
        database: {
          engine: 'MongoDB Atlas Vector Search',
          index: 'vector_index',
          searchMethod: searchType
        }
      });
      
    } catch (error) {
      console.error('Error in retrieval:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing your request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
