const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { processPDF } = require("../services/pdfService");
const { embedBatch } = require("../services/embedding");
const DocumentChunk = require("../models/DocumentChunk");
const crypto = require('crypto');

const router = express.Router();

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

// POST /upload
router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      console.log("No file was uploaded");
      return res.status(400).json({
        status: "error",
        message: "No file uploaded"
      });
    }

    console.log(`Processing file: ${req.file.path}`);
    
    try {
      const chunks = await processPDF(req.file.path);
      console.log(`Successfully processed PDF into ${chunks.length} chunks`);
      
      // Generate embeddings for the chunks using Xenova (384-dim)
      let embeddings;
      try {
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

        // Clear existing documents for this file
        await DocumentChunk.deleteMany({ fileId: req.file.filename });
        
        // Insert new documents
        const insertedDocs = await DocumentChunk.insertMany(documents);
        console.log(`Successfully stored ${insertedDocs.length} chunks in MongoDB`);
        
      } catch (dbError) {
        console.error("Error storing in MongoDB:", dbError);
        return res.status(500).json({
          status: "error",
          message: `Error storing in database: ${dbError.message}`
        });
      }
      
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
    res.status(500).json({
      status: "error",
      message: error.message || "Upload error"
    });
  }
});

module.exports = router;
