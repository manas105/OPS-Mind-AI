const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const uploadRoute = require('./uploadRoute');
const uploadStatusRoute = require('./uploadStatus');
const searchRoute = require('./searchRoute');
const retrieveRoute = require('./retrieveRoute');
const chatRoute = require('./chat');
const chatHistoryRoute = require('./chatHistory');
const authRoute = require('./auth');
const adminRoute = require('./admin');
const analyticsRoute = require('./analytics');
const DocumentChunk = require('../models/DocumentChunk');

// Create a sub-router for all API routes
const apiRouter = express.Router();

// Debug endpoint to inspect MongoDB connection and data
apiRouter.get('/debug/db', async (req, res) => {
  try {
    const connection = mongoose.connection;

    const debugInfo = {
      connection: {
        host: connection.host,
        name: connection.name,
        port: connection.port,
        readyState: connection.readyState,
        readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][connection.readyState]
      },
      env: {
        MONGODB_URI: process.env.MONGODB_URI ? 'MongoDB Atlas (URI hidden)' : process.env.MONGO_URI || 'none',
        MONGODB_DBNAME: process.env.MONGODB_DBNAME || 'none (using default)'
      }
    };

    // Get sample document with embedding
    const totalDocs = await DocumentChunk.countDocuments();
    const docsWithEmbeddings = await DocumentChunk.countDocuments({ embedding: { $exists: true, $ne: null } });

    debugInfo.documents = {
      total: totalDocs,
      withEmbeddings: docsWithEmbeddings
    };

    // Get a sample document with embedding to inspect format
    const sampleDocWithEmbedding = await DocumentChunk.findOne({ embedding: { $exists: true, $ne: null } })
      .select('+embedding')
      .lean();
    if (sampleDocWithEmbedding) {
      debugInfo.sampleDocument = {
        chunkId: sampleDocWithEmbedding.chunkId,
        content: sampleDocWithEmbedding.content?.substring(0, 100) + '...',
        hasEmbedding: !!sampleDocWithEmbedding.embedding,
        embeddingType: typeof sampleDocWithEmbedding.embedding,
        embeddingIsArray: Array.isArray(sampleDocWithEmbedding.embedding),
        embeddingLength: sampleDocWithEmbedding.embedding?.length || 0,
        embeddingFirst3: sampleDocWithEmbedding.embedding?.slice(0, 3) || null,
        embeddingLast3: sampleDocWithEmbedding.embedding?.slice(-3) || null,
        allKeys: Object.keys(sampleDocWithEmbedding)
      };
    }

    // Also get a document without embedding for comparison
    const sampleDocWithoutEmbedding = await DocumentChunk.findOne({ embedding: { $exists: false } }).lean();
    if (sampleDocWithoutEmbedding) {
      debugInfo.sampleDocumentWithoutEmbedding = {
        chunkId: sampleDocWithoutEmbedding.chunkId,
        content: sampleDocWithoutEmbedding.content?.substring(0, 100) + '...',
        hasEmbedding: !!sampleDocWithoutEmbedding.embedding,
        allKeys: Object.keys(sampleDocWithoutEmbedding)
      };
    }

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'OpsMind API is running',
    timestamp: new Date().toISOString()
  });
});

// Handle both /api/upload and /api/upload/
apiRouter.use('/upload', uploadRoute);
apiRouter.use('/upload/', uploadRoute);

// Handle upload status routes
apiRouter.use('/upload-status', uploadStatusRoute);
apiRouter.use('/upload-status/', uploadStatusRoute);

// Handle both /api/search and /api/search/
apiRouter.use('/search', searchRoute);
apiRouter.use('/search/', searchRoute);

// Handle both /api/retrieve and /api/retrieve/
apiRouter.use('/retrieve', retrieveRoute);
apiRouter.use('/retrieve/', retrieveRoute);

// Handle chat routes
apiRouter.use('/chat', chatRoute);
apiRouter.use('/chat/', chatRoute);

// Handle chat history routes
apiRouter.use('/chat/history', chatHistoryRoute);
apiRouter.use('/chat/history/', chatHistoryRoute);

// Handle auth routes
apiRouter.use('/auth', authRoute);
apiRouter.use('/auth/', authRoute);

// Handle admin routes
apiRouter.use('/admin', adminRoute);
apiRouter.use('/admin/', adminRoute);

// Handle analytics routes
apiRouter.use('/analytics', analyticsRoute);
apiRouter.use('/analytics/', analyticsRoute);

// Mount all API routes under /api
router.use('/api', apiRouter);

module.exports = router;
