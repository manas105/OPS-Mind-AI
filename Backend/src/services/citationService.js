/**
 * Citation Service - Enhanced citation management and formatting
 * Provides precise page numbers, source document references, and validation
 */

class CitationService {
  constructor() {
    this.citationFormats = {
      apa: this.getAPAFormat,
      mla: this.getMLAFormat,
      chicago: this.getChicagoFormat,
      simple: this.getSimpleFormat
    };
  }

  /**
   * Format citation for a chunk with page information
   * @param {Object} chunk - Document chunk with citation metadata
   * @param {string} format - Citation format (apa, mla, chicago, simple)
   * @returns {Object} Formatted citation object
   */
  formatCitation(chunk, format = 'simple') {
    if (!chunk.pages || chunk.pages.length === 0) {
      return {
        source: chunk.fileName || 'Unknown Document',
        pages: [],
        citation: `[${chunk.fileName || 'Unknown Document'}]`
      };
    }

    // Extract unique page numbers
    const pageNumbers = [...new Set(chunk.pages.map(p => p.page))].sort((a, b) => a - b);
    
    // Format page ranges
    let pageText = '';
    if (pageNumbers.length === 1) {
      pageText = `p. ${pageNumbers[0]}`;
    } else {
      // Check for consecutive pages to create ranges
      const ranges = [];
      let start = pageNumbers[0];
      let prev = pageNumbers[0];
      
      for (let i = 1; i < pageNumbers.length; i++) {
        if (pageNumbers[i] === prev + 1) {
          prev = pageNumbers[i];
        } else {
          if (start === prev) {
            ranges.push(`${start}`);
          } else {
            ranges.push(`${start}-${prev}`);
          }
          start = pageNumbers[i];
          prev = pageNumbers[i];
        }
      }
      
      // Add the last range
      if (start === prev) {
        ranges.push(`${start}`);
      } else {
        ranges.push(`${start}-${prev}`);
      }
      
      pageText = `pp. ${ranges.join(', ')}`;
    }

    return {
      source: chunk.fileName || 'Unknown Document',
      pages: pageNumbers,
      pageText,
      citation: `[${chunk.fileName || 'Unknown Document'}, ${pageText}]`
    };
  }

  /**
   * Simple citation format [Source: filename, Page X]
   * @param {Object} chunk - Document chunk
   * @returns {string} Formatted citation
   */
  getSimpleFormat(chunk) {
    const formatted = this.formatCitation(chunk, 'simple');
    return formatted.citation;
  }

  /**
   * Generate inline citations for response text
   * @param {Array} chunks - Array of document chunks used in response
   * @returns {Object} Citation information and formatted text
   */
  generateInlineCitations(chunks) {
    const citations = [];
    const citationMap = new Map();
    
    chunks.forEach((chunk, index) => {
      const citation = this.formatCitation(chunk);
      const citationKey = `${citation.source}_${citation.pages.join('_')}`;
      
      if (!citationMap.has(citationKey)) {
        citationMap.set(citationKey, {
          ...citation,
          index: citations.length + 1,
          chunkReferences: [index]
        });
        citations.push(citation);
      } else {
        citationMap.get(citationKey).chunkReferences.push(index);
      }
    });

    return {
      citations: Array.from(citationMap.values()),
      citationText: citations.length > 0 
        ? '\n\nSources: ' + citations.map((c, i) => `${i + 1}. ${c.citation}`).join('\n')
        : ''
    };
  }

  /**
   * Add citations to AI response
   * @param {string} response - The AI-generated response
   * @param {Array} chunks - The chunks used to generate response
   * @returns {string} Response with citations appended
   */
  addCitationsToResponse(response, chunks) {
    const { citationText } = this.generateInlineCitations(chunks);
    
    if (!citationText) {
      return response;
    }

    return response + citationText;
  }

  /**
   * Create citation metadata for frontend display
   * @param {Array} chunks - Array of chunks with citation data
   * @returns {Array} Formatted citation metadata for UI
   */
  createCitationMetadata(chunks) {
    // Deduplicate chunks by chunkId to avoid duplicate citations
    const uniqueChunks = new Map();
    
    chunks.forEach(chunk => {
      if (!uniqueChunks.has(chunk.chunkId)) {
        uniqueChunks.set(chunk.chunkId, chunk);
      }
    });
    
    return Array.from(uniqueChunks.values()).map((chunk, index) => {
      const citation = this.formatCitation(chunk);
      return {
        // Create a unique key that combines chunkId with index
        id: `${chunk.chunkId}_${index}`,
        chunkId: chunk.chunkId,
        source: citation.source,
        pages: citation.pages,
        pageText: citation.pageText,
        citation: citation.citation,
        confidence: chunk.relevanceScore || chunk.score || 0.0
      };
    });
  }

  /**
   * Validate citation data integrity
   * @param {Object} chunk - Chunk to validate
   * @returns {boolean} True if citation data is valid
   */
  validateCitationData(chunk) {
    if (!chunk.fileName || typeof chunk.fileName !== 'string') {
      return false;
    }
    
    if (!chunk.pages || !Array.isArray(chunk.pages)) {
      return false;
    }
    
    return chunk.pages.every(page => 
      typeof page.page === 'number' && 
      page.page > 0 &&
      typeof page.startChar === 'number' &&
      typeof page.endChar === 'number' &&
      page.startChar >= 0 &&
      page.endChar >= page.startChar
    );
  }

  /**
   * Extract citations from response text
   * @param {string} text - Response text
   * @returns {Array} Extracted citations
   */
  extractCitationsFromText(text) {
    const citationRegex = /\[Source:\s*([^,\]]+),?\s*([^\]]*)\]/gi;
    const citations = [];
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const source = match[1].trim();
      const pagesText = match[2].trim();
      
      let pages = [];
      if (pagesText) {
        // Extract page numbers
        const pageRegex = /page[s]?\s*(\d+(?:-\d+)?)/gi;
        let pageMatch;
        while ((pageMatch = pageRegex.exec(pagesText)) !== null) {
          const pageRange = pageMatch[1];
          if (pageRange.includes('-')) {
            const [start, end] = pageRange.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              pages.push(i);
            }
          } else {
            pages.push(Number(pageRange));
          }
        }
      }

      citations.push({
        source,
        pages,
        fullMatch: match[0]
      });
    }

    return citations;
  }

  /**
   * Generate citation summary for analytics
   * @param {Array} citations - Array of citations
   * @returns {Object} Citation summary
   */
  generateCitationSummary(citations) {
    const summary = {
      totalCitations: citations.length,
      uniqueSources: new Set(citations.map(c => c.source)).size,
      sourceFrequency: {},
      pageDistribution: {},
      averageRelevanceScore: 0
    };

    citations.forEach(citation => {
      // Source frequency
      summary.sourceFrequency[citation.source] = 
        (summary.sourceFrequency[citation.source] || 0) + 1;

      // Page distribution
      citation.pages.forEach(page => {
        summary.pageDistribution[page] = (summary.pageDistribution[page] || 0) + 1;
      });

      // Relevance score
      summary.averageRelevanceScore += citation.relevanceScore || 0;
    });

    if (citations.length > 0) {
      summary.averageRelevanceScore /= citations.length;
    }

    return summary;
  }
}

module.exports = new CitationService();
