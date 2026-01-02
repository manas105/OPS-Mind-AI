const fs = require('fs');
// Import pdf-parse with proper error handling
let PDFParse;
try {
  PDFParse = require('pdf-parse').PDFParse;
} catch (error) {
  console.error('Error importing pdf-parse:', error);
  throw new Error('Failed to load pdf-parse. Make sure it is installed.');
}

/**
 * Parses a PDF file and extracts the full text content.
 * Cleans up excessive whitespace and newlines.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<string>} The extracted and cleaned text.
 */
async function parsePdf(filePath) {
  try {
    const pages = await parsePdfWithPages(filePath);
    return pages.map(p => p.text).join(' ');
  } catch (error) {
    throw new Error(`Error parsing PDF: ${error.message}`);
  }
}

/**
 * Parses a PDF file and extracts text content with page numbers.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<Array<{page: number, text: string}>>} Array of page objects with text.
 */
async function parsePdfWithPages(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ 
      data: dataBuffer,
      // Enable page parsing
      normalizeWhitespace: false,
      disableCombineTextItems: false
    });
    const data = await parser.getText();
    await parser.destroy();
    
    // Split text by pages and track page numbers
    const pages = [];
    const pageTexts = data.text.split('\n\n'); // Simple page split
    
    for (let i = 0; i < pageTexts.length; i++) {
      let text = pageTexts[i];
      
      // Clean up text: remove excessive newlines and spaces
      text = text.replace(/\n+/g, ' '); // Replace multiple newlines with space
      text = text.replace(/\s+/g, ' '); // Replace multiple spaces with single space
      text = text.trim(); // Trim leading/trailing whitespace
      
      if (text.length > 0) {
        pages.push({
          page: i + 1,
          text: text
        });
      }
    }

    return pages;
  } catch (error) {
    throw new Error(`Error parsing PDF: ${error.message}`);
  }
}

/**
 * Splits text into chunks of approximately chunkSize characters with overlap.
 * @param {string} text - The full text to chunk.
 * @param {number} chunkSize - Approximate size of each chunk (default 800).
 * @param {number} overlap - Number of characters to overlap between chunks (default 100).
 * @returns {Array<{chunkId: string, content: string}>} Array of chunk objects.
 */
function chunkText(text, chunkSize = 800, overlap = 100) {
  return chunkTextWithPages([{ page: 1, text }], chunkSize, overlap).map(chunk => ({
    chunkId: chunk.chunkId,
    content: chunk.content
  }));
}

/**
 * Splits text into chunks of approximately chunkSize characters with overlap and page tracking.
 * @param {Array<{page: number, text: string}>} pages - Array of page objects.
 * @param {number} chunkSize - Approximate size of each chunk (default 800).
 * @param {number} overlap - Number of characters to overlap between chunks (default 100).
 * @returns {Array<{chunkId: string, content: string, pages: Array<{page: number, startChar: number, endChar: number}>}>} Array of chunk objects with page metadata.
 */
function chunkTextWithPages(pages, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let fullText = '';
  let pageMap = [];
  
  // Combine all text and create character-to-page mapping
  pages.forEach(page => {
    const startChar = fullText.length;
    fullText += page.text + ' ';
    const endChar = fullText.length;
    pageMap.push({
      page: page.page,
      startChar,
      endChar
    });
  });
  
  // Create chunks with page tracking
  for (let i = 0; ; i++) {
    const start = i * (chunkSize - overlap);
    if (start >= fullText.length) break;
    const end = Math.min(start + chunkSize, fullText.length);
    const content = fullText.slice(start, end).trim();
    
    // Find which pages this chunk spans
    const chunkPages = [];
    for (const pageInfo of pageMap) {
      if (pageInfo.startChar < end && pageInfo.endChar > start) {
        const chunkStart = Math.max(start, pageInfo.startChar);
        const chunkEnd = Math.min(end, pageInfo.endChar);
        chunkPages.push({
          page: pageInfo.page,
          startChar: chunkStart - start,
          endChar: chunkEnd - start
        });
      }
    }
    
    chunks.push({
      chunkId: `chunk_${i + 1}`,
      content: content,
      pages: chunkPages
    });
  }
  return chunks;
}

/**
 * Processes a PDF file: parses it and chunks the text.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<Array<{chunkId: string, content: string}>>} Array of text chunks.
 */
async function processPDF(filePath) {
  try {
    const text = await parsePdf(filePath);
    const chunks = chunkText(text);
    return chunks;
  } catch (error) {
    throw new Error(`Error processing PDF: ${error.message}`);
  }
}

/**
 * Processes a PDF file: parses it and chunks the text with page tracking.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<Array<{chunkId: string, content: string, pages: Array<{page: number, startChar: number, endChar: number}>}>>} Array of text chunks with page metadata.
 */
async function processPDFWithCitations(filePath) {
  try {
    const pages = await parsePdfWithPages(filePath);
    const chunks = chunkTextWithPages(pages);
    return chunks;
  } catch (error) {
    throw new Error(`Error processing PDF: ${error.message}`);
  }
}

module.exports = { parsePdf, parsePdfWithPages, chunkText, chunkTextWithPages, processPDF, processPDFWithCitations };