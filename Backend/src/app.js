require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const connectDB = require('./config/database');

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'https://opsmind-ai.vercel.app',
  'https://ops-mind-ai.vercel.app',
  'https://ops-mind-ai-eozhdddir-manas-projects-8179c84e.vercel.app'
];

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [...defaultCorsOrigins, ...corsOrigins];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/', routes);

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit, but for dev, just log
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, exit gracefully
  // process.exit(1);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
