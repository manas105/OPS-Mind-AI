const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  // Reference to the user who sent the message
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Will be implemented with authentication
    required: true
  },
  
  // Session ID to group messages in a conversation
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Message content
  content: {
    type: String,
    required: true
  },
  
  // Role: 'user' or 'assistant'
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional metadata
  metadata: {
    // Any additional data like tokens used, model version, etc.
    tokens: Number,
    model: String
  }
}, {
  timestamps: true
});

// Index for faster querying of user sessions
chatMessageSchema.index({ userId: 1, sessionId: 1 });

// Index for retrieving conversation history
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

// Add text index for search functionality
chatMessageSchema.index({ content: 'text' });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
