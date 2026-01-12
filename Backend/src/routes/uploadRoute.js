const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { createJob } = require("../services/backgroundJobService");
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

    console.log(`Received file: ${req.file.originalname}`);
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
      
      // Create background job
      const jobId = createJob(req.file);
      
      console.log(`Created background job ${jobId} for file ${req.file.originalname}`);
      
      return res.json({
        status: "success",
        fileId: req.file.filename,
        fileName: req.file.originalname,
        jobId: jobId,
        message: "PDF uploaded successfully. Processing started in background."
      });
      
    } catch (processError) {
      console.error("Error creating background job:", processError);
      return res.status(500).json({
        status: "error",
        message: `Error creating background job: ${processError.message}`
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
