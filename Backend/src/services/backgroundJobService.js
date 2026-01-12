const { processPDF } = require('./pdfService');
const { embedBatch } = require('./embedding');
const DocumentChunk = require('../models/DocumentChunk');
const crypto = require('crypto');
const fs = require('fs').promises;

// In-memory job status store (in production, use Redis or database)
const jobStatus = new Map();

/**
 * Create a new background job for PDF processing
 * @param {Object} file - Uploaded file object
 * @returns {string} Job ID
 */
function createJob(file) {
  const jobId = crypto.randomUUID();
  jobStatus.set(jobId, {
    id: jobId,
    status: 'pending',
    progress: 0,
    fileId: file.filename,
    fileName: file.originalname,
    filePath: file.path,
    message: 'Job created, waiting to start processing...',
    createdAt: new Date(),
    error: null,
    result: null
  });
  
  // Start processing in background
  processPDFInBackground(jobId, file);
  
  return jobId;
}

/**
 * Get job status by ID
 * @param {string} jobId - Job ID
 * @returns {Object|null} Job status or null if not found
 */
function getJobStatus(jobId) {
  return jobStatus.get(jobId) || null;
}

/**
 * Process PDF in background
 * @param {string} jobId - Job ID
 * @param {Object} file - File object
 */
async function processPDFInBackground(jobId, file) {
  const job = jobStatus.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.message = 'Starting PDF processing...';
    job.progress = 10;

    // Check if file exists
    await fs.access(file.path);
    job.message = 'File confirmed, extracting text...';
    job.progress = 20;

    // Process PDF
    const chunks = await processPDF(file.path);
    job.message = `PDF parsed into ${chunks.length} chunks, generating embeddings...`;
    job.progress = 40;

    if (chunks.length === 0) {
      throw new Error('PDF appears to be empty or could not be processed');
    }

    // Generate embeddings in batches
    const chunkTexts = chunks.map(chunk => chunk.content);
    const embeddings = await embedBatch(chunkTexts);
    job.message = 'Embeddings generated, storing in database...';
    job.progress = 70;

    // Prepare documents for database
    const documents = chunks.map((chunk, index) => {
      const hash = crypto.createHash('md5').update(
        file.filename + chunk.content + index
      ).digest('hex');
      
      return {
        fileId: file.filename,
        filePath: file.path,
        fileName: file.originalname,
        chunkId: `chunk_${index + 1}`,
        content: chunk.content,
        hash: hash,
        pages: chunk.pages || [{ page: index + 1, startChar: 0, endChar: chunk.content.length }],
        embedding: embeddings[index]
      };
    });

    // Clear existing documents for this file
    await DocumentChunk.deleteMany({ fileId: file.filename });
    
    // Insert new documents
    await DocumentChunk.insertMany(documents);
    
    // Verify insertion
    const count = await DocumentChunk.countDocuments({ fileId: file.filename });
    
    job.status = 'completed';
    job.progress = 100;
    job.message = `Successfully processed and stored ${count} chunks`;
    job.result = {
      fileId: file.filename,
      fileName: file.originalname,
      chunks: chunks.length,
      embeddings: embeddings.length
    };

    console.log(`Background job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Background job ${jobId} failed:`, error);
    job.status = 'failed';
    job.error = error.message;
    job.message = `Processing failed: ${error.message}`;
  }
}

/**
 * Clean up old jobs (optional - call periodically)
 * @param {number} maxAge - Maximum age in milliseconds (default 24 hours)
 */
function cleanupOldJobs(maxAge = 24 * 60 * 60 * 1000) {
  const now = new Date();
  for (const [jobId, job] of jobStatus.entries()) {
    if (now - job.createdAt > maxAge) {
      jobStatus.delete(jobId);
    }
  }
}

module.exports = {
  createJob,
  getJobStatus,
  cleanupOldJobs
};
