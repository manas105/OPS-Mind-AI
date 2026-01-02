const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try MongoDB Atlas first, then fallback to local
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/opsmind_ai';
    const dbName = process.env.MONGODB_DBNAME || 'opswisemind';

    console.log('=== MONGODB CONNECTION CONFIG ===');
    console.log('MONGODB_URI:', mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas (URI hidden)' : mongoUri);
    console.log('MONGODB_DBNAME:', dbName);
    console.log('Attempting to connect to MongoDB...');

    // For MongoDB Driver v7+, we don't need to set useNewUrlParser and useUnifiedTopology
    // as they are now the default and the only options available
    const conn = await mongoose.connect(mongoUri, { dbName });

    console.log('=== CONNECTION SUCCESS ===');
    console.log(`MongoDB Host: ${conn.connection.host}`);
    console.log(`MongoDB Database: ${conn.connection.name}`);
    console.log(`MongoDB Port: ${conn.connection.port}`);
    console.log('================================');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    // If Atlas fails, try local MongoDB
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv')) {
      console.log('Atlas connection failed, trying local MongoDB...');
      try {
        const dbName = process.env.MONGODB_DBNAME || 'opswisemind';
        const conn = await mongoose.connect('mongodb://localhost:27017/opsmind_ai', { dbName });
        console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
        console.log(`MongoDB Database (Local): ${conn.connection.name}`);
        return;
      } catch (localError) {
        console.error(`Local MongoDB also failed: ${localError.message}`);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
    
    // For development, continue without database instead of exiting
    console.warn('⚠️  Running without database connection. Some features will not work.');
    return;
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = connectDB;
