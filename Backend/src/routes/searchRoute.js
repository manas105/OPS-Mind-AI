const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { getEmbedding } = require("../services/embeddingService");

const router = express.Router();

// Function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// GET /search - Provide usage instructions
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'info',
    message: 'Use POST /search with a query to search documents',
    example: {
      method: 'POST',
      url: '/search',
      headers: { 'Content-Type': 'application/json' },
      body: {
        query: 'your search query here',
        topK: 5  // optional, default 5
      }
    }
  });
});

// POST /search
router.post("/", async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        status: "error",
        message: "Query is required and must be a string"
      });
    }

    console.log(`Searching for: "${query}"`);
    
    // Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);
    console.log(`Generated query embedding, length: ${queryEmbedding.length}`);
    
    // Load all stored data files
    const uploadsDir = path.join(__dirname, '../../uploads');
    let files;
    try {
      files = await fs.readdir(uploadsDir);
    } catch (dirError) {
      console.error("Error reading uploads directory:", dirError);
      return res.status(500).json({
        status: "error",
        message: `Error reading uploads directory: ${dirError.message}`
      });
    }
    const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'sample.pdf.json'); // exclude sample if any
    
    const allResults = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(uploadsDir, file);
        let fileContent;
        try {
          fileContent = await fs.readFile(filePath, 'utf-8');
        } catch (readError) {
          console.error(`Error reading file ${file}:`, readError);
          continue; // skip this file
        }
        
        let data;
        try {
          data = JSON.parse(fileContent);
        } catch (parseError) {
          console.error(`Error parsing JSON in file ${file}:`, parseError);
          continue; // skip this file
        }
        
        // Calculate similarity for each chunk
        for (let i = 0; i < data.chunks.length; i++) {
          try {
            const similarity = cosineSimilarity(queryEmbedding, data.embeddings[i]);
            allResults.push({
              fileId: data.fileId,
              chunkId: data.chunks[i].chunkId,
              content: data.chunks[i].content,
              similarity: similarity
            });
          } catch (simError) {
            console.error(`Error calculating similarity for chunk ${i} in ${file}:`, simError);
            continue;
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError.message);
        continue; // skip this file
      }
    }
    
    // Sort by similarity descending and take top K
    allResults.sort((a, b) => b.similarity - a.similarity);
    const topResults = allResults.slice(0, topK);
    
    console.log(`Found ${allResults.length} total chunks, returning top ${topResults.length}`);
    
    return res.json({
      status: "success",
      query: query,
      totalResults: allResults.length,
      results: topResults
    });
    
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Search error"
    });
  }
});

module.exports = router;