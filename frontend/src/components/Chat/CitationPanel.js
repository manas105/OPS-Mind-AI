import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DocumentIcon from '@mui/icons-material/Description';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ScoreIcon from '@mui/icons-material/Score';
import { styled } from '@mui/material/styles';

const CitationPanelContainer = styled(Paper)(({ theme }) => ({
  width: 350,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)',
  borderLeft: `3px solid ${theme.palette.primary.main}`,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: 'rgba(37, 99, 235, 0.05)',
}));

const ContentBox = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const CitationItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[2],
    transform: 'translateY(-1px)',
  },
}));

const ConfidenceChip = styled(Chip)(({ theme, confidence }) => {
  let color = theme.palette.grey[500];
  let backgroundColor = theme.palette.grey[100];
  
  if (confidence >= 0.8) {
    color = theme.palette.success.dark;
    backgroundColor = theme.palette.success.light + '30';
  } else if (confidence >= 0.6) {
    color = theme.palette.warning.dark;
    backgroundColor = theme.palette.warning.light + '30';
  } else if (confidence >= 0.4) {
    color = theme.palette.info.dark;
    backgroundColor = theme.palette.info.light + '30';
  }
  
  return {
    color,
    backgroundColor,
    fontWeight: 500,
    fontSize: '0.75rem',
  };
});

const CitationPanel = ({ citations, onClose }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const handleToggleExpansion = (citationId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(citationId)) {
      newExpanded.delete(citationId);
    } else {
      newExpanded.add(citationId);
    }
    setExpandedItems(newExpanded);
  };

  const formatConfidence = (confidence) => {
    return Math.round((confidence || 0) * 100);
  };

  const formatPages = (pages) => {
    if (!pages || pages.length === 0) return 'No pages';
    if (pages.length === 1) return `Page ${pages[0]}`;
    
    // Group consecutive pages
    const ranges = [];
    let start = pages[0];
    let prev = pages[0];
    
    for (let i = 1; i < pages.length; i++) {
      if (pages[i] === prev + 1) {
        prev = pages[i];
      } else {
        if (start === prev) {
          ranges.push(`${start}`);
        } else {
          ranges.push(`${start}-${prev}`);
        }
        start = pages[i];
        prev = pages[i];
      }
    }
    
    // Add the last range
    if (start === prev) {
      ranges.push(`${start}`);
    } else {
      ranges.push(`${start}-${prev}`);
    }
    
    return `Pages ${ranges.join(', ')}`;
  };

  if (!citations || citations.length === 0) {
    return (
      <CitationPanelContainer elevation={1}>
        <HeaderBox>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sources
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </HeaderBox>
        <ContentBox>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center"
            py={4}
          >
            <DocumentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" align="center">
              No citations available for this response
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Citations will appear here when the assistant references specific documents
            </Typography>
          </Box>
        </ContentBox>
      </CitationPanelContainer>
    );
  }

  return (
    <CitationPanelContainer elevation={1}>
      <HeaderBox>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sources
          </Typography>
          <Badge 
            badgeContent={citations.length} 
            color="primary"
            showZero
          >
            <BookmarkIcon fontSize="small" />
          </Badge>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </HeaderBox>

      <ContentBox>
        {citations.map((citation, index) => (
          <CitationItem key={citation.id || `${citation.chunkId}_${index}`}>
            {/* Citation Header */}
            <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
              <DocumentIcon sx={{ fontSize: 20, color: 'primary.main', mt: 0.5 }} />
              <Box flex={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {citation.source}
                </Typography>
                
                {/* Metadata */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ConfidenceChip
                    size="small"
                    confidence={citation.confidence}
                    label={`${formatConfidence(citation.confidence)}% match`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={formatPages(citation.pages)}
                    icon={<ScoreIcon fontSize="small" />}
                  />
                </Box>
              </Box>
            </Box>

            {/* Expandable Content */}
            <Accordion 
              expanded={expandedItems.has(citation.id || `${citation.chunkId}_${index}`)}
              onChange={() => handleToggleExpansion(citation.id || `${citation.chunkId}_${index}`)}
              elevation={0}
              sx={{ 
                '&:before': { display: 'none' },
                boxShadow: 'none',
                background: 'transparent',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  minHeight: 36,
                  '& .MuiAccordionSummary-content': { margin: 0 }
                }}
              >
                <Typography variant="body2" color="primary">
                  View citation details
                </Typography>
              </AccordionSummary>
              
              <AccordionDetails sx={{ p: 0, mt: 1 }}>
                <Box>
                  {/* Citation Text */}
                  {citation.citation && (
                    <Box mb={2}>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace',
                        background: 'rgba(37, 99, 235, 0.05)',
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.8rem'
                      }}>
                        {citation.citation}
                      </Typography>
                    </Box>
                  )}

                  {/* Additional Details */}
                  <List dense>
                    {citation.chunkId && (
                      <ListItem>
                        <ListItemIcon>
                          <BookmarkIcon fontSize="small" color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Chunk ID" 
                          secondary={citation.chunkId}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    )}
                    
                    {citation.pageText && (
                      <ListItem>
                        <ListItemIcon>
                          <ScoreIcon fontSize="small" color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Page Reference" 
                          secondary={citation.pageText}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </AccordionDetails>
            </Accordion>
          </CitationItem>
        ))}

        {/* Summary Statistics */}
        <Box mt={3} p={2} sx={{ 
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
          borderRadius: 2,
          border: `1px solid rgba(37, 99, 235, 0.1)`
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Citation Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Sources:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {citations.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Avg Confidence:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {citations.length > 0 
                  ? Math.round(citations.reduce((sum, c) => sum + (c.confidence || 0), 0) / citations.length * 100)
                  : 0}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </ContentBox>
    </CitationPanelContainer>
  );
};

export default CitationPanel;
