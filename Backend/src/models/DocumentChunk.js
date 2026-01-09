const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    index: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  chunkId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  pages: [{
    page: {
      type: Number,
      required: true
    },
    startChar: {
      type: Number,
      required: true
    },
    endChar: {
      type: Number,
      required: true
    }
  }],
  embedding: {
    type: [Number],
    required: true,
    select: false // Don't return embedding by default
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Add index for vector search
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a compound index for faster lookups
documentChunkSchema.index({ fileId: 1, chunkId: 1 }, { unique: true });

// Create a vector index for vector search
documentChunkSchema.index({ embedding: "vector" }, { name: "vector_index", dimensions: 384 });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);

module.exports = DocumentChunk;
