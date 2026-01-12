const express = require('express');
const router = express.Router();
const { getJobStatus } = require('../services/backgroundJobService');

// GET /upload-status/:jobId - Get upload job status
router.get('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const jobStatus = getJobStatus(jobId);
  
  if (!jobStatus) {
    return res.status(404).json({
      status: 'error',
      message: 'Job not found'
    });
  }
  
  res.json({
    status: 'success',
    job: jobStatus
  });
});

module.exports = router;
