const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { processPDF } = require("../services/pdfService");
const { embedBatch } = require("../services/embedding");
const DocumentChunk = require("../models/DocumentChunk");
const crypto = require('crypto');
const auth = require("../middleware/auth");

const router = express.Router();

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access('uploads/');
  } catch (error) {
    console.log('Creating uploads directory...');
    await fs.mkdir('uploads/', { recursive: true });
  }
};

// Initialize uploads directory
ensureUploadsDir();

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Unexpected file field'
      });
    }
  }
  
  if (error.message === 'Only PDF files are allowed!') {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
  
  next(error);
};

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// Allow only PDFs
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// GET /upload - Provide usage instructions
router.get('/', (req, res) => {
  console.log('GET /upload endpoint called');
  res.status(200).json({
    status: 'info',
    message: 'Use POST /upload with a PDF file to upload and process documents',
    example: {
      method: 'POST',
      url: '/upload',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: {
        pdf: 'your-file.pdf'  // PDF file to upload
      }
    }
  });
});

// POST /upload - Admin only
const uploadHandler = async (req, res) => {
  console.log('Upload request received at:', new Date().toISOString());
  console.log('Request headers:', req.headers);
  console.log('User from auth:', req.user);
  
  try {
    if (!req.file) {
      console.log("No file was uploaded");
      return res.status(400).json({
        status: "error",
        message: "No file uploaded"
      });
    }

    console.log(`Processing file: ${req.file.path}`);
    console.log(`File info:`, {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    try {
      // Check if file exists
      await fs.access(req.file.path);
      console.log('File confirmed to exist on disk');
      
      const chunks = await processPDF(req.file.path);
      console.log(`Successfully processed PDF into ${chunks.length} chunks`);
      
      if (chunks.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "PDF appears to be empty or could not be processed"
        });
      }
      
      // Generate embeddings for the chunks using Xenova (384-dim)
      let embeddings;
      try {
        console.log('Starting embedding generation...');
        const chunkTexts = chunks.map(chunk => chunk.content);
        embeddings = await embedBatch(chunkTexts);
        console.log(`Generated embeddings for ${embeddings.length} chunks`);
      } catch (embedError) {
        console.error("Error generating embeddings:", embedError);
        return res.status(500).json({
          status: "error",
          message: `Error generating embeddings: ${embedError.message}`
        });
      }
      
      // Store chunks in MongoDB
      try {
        console.log('Preparing documents for database storage...');
        const documents = chunks.map((chunk, index) => {
          const hash = crypto.createHash('md5').update(
            req.file.filename + chunk.content + index
          ).digest('hex');
          
          return {
            fileId: req.file.filename,
            filePath: req.file.path,
            fileName: req.file.originalname,
            chunkId: `chunk_${index + 1}`,
            content: chunk.content,
            hash: hash,
            pages: chunk.pages || [{ page: index + 1, startChar: 0, endChar: chunk.content.length }],
            embedding: embeddings[index]
          };
        });
        
        console.log(`Prepared ${documents.length} documents for storage`);
        console.log('Sample document structure:', {
          fileId: documents[0]?.fileId,
          fileName: documents[0]?.fileName,
          contentLength: documents[0]?.content?.length,
          embeddingLength: documents[0]?.embedding?.length
        });

        // Clear existing documents for this file
        console.log('Clearing existing documents for this file...');
        const deleteResult = await DocumentChunk.deleteMany({ fileId: req.file.filename });
        console.log(`Deleted ${deleteResult.deletedCount} existing documents`);
        
        // Insert new documents
        console.log('Inserting new documents into database...');
        const insertedDocs = await DocumentChunk.insertMany(documents);
        console.log(`Successfully stored ${insertedDocs.length} chunks in MongoDB`);
        
        // Verify the insertion
        const count = await DocumentChunk.countDocuments({ fileId: req.file.filename });
        console.log(`Verified: ${count} documents in database for file ${req.file.filename}`);
        
      } catch (dbError) {
        console.error("Error storing in MongoDB:", dbError);
        console.error("Database error details:", dbError.message);
        if (dbError.stack) {
          console.error("Database error stack:", dbError.stack);
        }
        return res.status(500).json({
          status: "error",
          message: `Error storing in database: ${dbError.message}`
        });
      }
      
      console.log('Upload completed successfully');
      return res.json({
        status: "success",
        fileId: req.file.filename,
        filePath: req.file.path,
        fileName: req.file.originalname,
        chunks: chunks.length,
        embeddings: embeddings.length,
        message: "PDF uploaded, processed, and stored in database successfully"
      });
    } catch (processError) {
      console.error("Error processing PDF:", processError);
      return res.status(500).json({
        status: "error",
        message: `Error processing PDF: ${processError.message}`
      });
    }

  } catch (error) {
    console.error("Upload error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      status: "error",
      message: error.message || "Upload error"
    });
  }
};

// Wrap the handler to catch synchronous errors
router.post("/", auth.required, auth.hasRole('admin'), handleMulterError, upload.single("pdf"), (req, res, next) => {
  Promise.resolve(uploadHandler(req, res)).catch(next);
});

module.exports = router;
