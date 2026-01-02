const { chunkText, parsePdf, processPdf } = require('../src/utils/pdfParser');
const path = require('path');

// Test chunkText with a sample text
function testChunkText() {
  const sampleText = 'This is a sample text for testing the chunking functionality. It needs to be long enough to create multiple chunks with overlap. ' +
    'The chunk size is set to 100 characters, and overlap is 20 characters. This should ensure that context is preserved between chunks. ' +
    'Repeat: This is a sample text for testing the chunking functionality. It needs to be long enough to create multiple chunks with overlap. ' +
    'The chunk size is set to 100 characters, and overlap is 20 characters. This should ensure that context is preserved between chunks.';

  console.log('Testing chunkText...');
  const chunks = chunkText(sampleText, 100, 20);

  console.log('Total chunks:', chunks.length);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}: Length ${chunk.content.length}, Content: "${chunk.content}"`);
  });

  // Check overlap: ensure last part of chunk n matches start of chunk n+1
  for (let i = 0; i < chunks.length - 1; i++) {
    const overlapText = chunks[i].content.slice(-20);
    const nextStart = chunks[i + 1].content.slice(0, 20);
    console.log(`Overlap check ${i + 1}-${i + 2}: "${overlapText}" vs "${nextStart}"`);
  }
}

// Test parsePdf and processPdf with a sample PDF (if available)
async function testPdfProcessing() {
  const samplePdfPath = path.join(__dirname, '../uploads/sample.pdf'); // Assume a sample PDF exists

  try {
    console.log('Testing parsePdf...');
    const text = await parsePdf(samplePdfPath);
    console.log('Extracted text length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));

    console.log('Testing processPdf...');
    const chunks = await processPdf(samplePdfPath);
    console.log('Number of chunks:', chunks.length);
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${chunk.chunkId}: Length ${chunk.content.length}`);
    });
  } catch (error) {
    console.log('PDF test skipped (no sample PDF):', error.message);
  }
}

// Run tests
testChunkText();
testPdfProcessing();