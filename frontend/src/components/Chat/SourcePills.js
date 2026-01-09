import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DocumentIcon,
  Bookmark as BookmarkIcon,
  Score as ScoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SourcePillContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  paddingTop: theme.spacing(1),
  borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
}));

const SourcePill = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  fontSize: '0.75rem',
  height: '28px',
  backgroundColor: 'rgba(102, 126, 234, 0.15)',
  color: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(102, 126, 234, 0.3)',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(102, 126, 234, 0.25)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
  '& .MuiChip-label': {
    fontWeight: 500,
  },
}));

const ConfidenceIndicator = styled(Box)(({ theme, confidence }) => {
  let color = theme.palette.grey[500];
  if (confidence >= 0.8) {
    color = theme.palette.success.main;
  } else if (confidence >= 0.6) {
    color = theme.palette.warning.main;
  } else if (confidence >= 0.4) {
    color = theme.palette.info.main;
  }
  
  return {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: color,
    marginLeft: theme.spacing(0.5),
  };
});

const SourcePills = ({ citations, onCitationClick }) => {
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const formatConfidence = (confidence) => {
    return Math.round((confidence || 0) * 100);
  };

  const formatPages = (pages) => {
    if (!pages || pages.length === 0) return '';
    if (pages.length === 1) return `p${pages[0]}`;
    
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
    
    return `p${ranges.join(', ')}`;
  };

  const getSourceDisplayName = (citation) => {
    const source = citation.source || 'Document';
    // Extract filename from path if it's a file path
    if (source.includes('/')) {
      return source.split('/').pop().replace('.pdf', '');
    }
    return source.replace('.pdf', '');
  };

  const handlePillClick = (citation) => {
    setSelectedCitation(citation);
    setDetailsOpen(true);
    onCitationClick?.(citation);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedCitation(null);
  };

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <>
      <SourcePillContainer>
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 600, 
            mb: 1, 
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'block',
            fontSize: '0.75rem'
          }}
        >
          Sources:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {citations.map((citation, index) => (
            <SourcePill
              key={citation.id || `${citation.chunkId}_${index}`}
              label={`${getSourceDisplayName(citation)} – ${formatPages(citation.pages)}`}
              onClick={() => handlePillClick(citation)}
              deleteIcon={<ConfidenceIndicator confidence={citation.confidence} />}
              onDelete={(e) => e.stopPropagation()} // Prevent deletion, just show indicator
              size="small"
            />
          ))}
        </Box>
      </SourcePillContainer>

      {/* Citation Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <DocumentIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedCitation ? getSourceDisplayName(selectedCitation) : 'Source Details'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} size="small">
            <CloseIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          {selectedCitation && (
            <Box>
              {/* Metadata */}
              <Box sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    size="small"
                    label={`${formatConfidence(selectedCitation.confidence)}% match`}
                    sx={{
                      backgroundColor: selectedCitation.confidence >= 0.8 
                        ? 'rgba(76, 175, 80, 0.2)'
                        : selectedCitation.confidence >= 0.6
                        ? 'rgba(255, 152, 0, 0.2)'
                        : 'rgba(33, 150, 243, 0.2)',
                      color: selectedCitation.confidence >= 0.8
                        ? '#4caf50'
                        : selectedCitation.confidence >= 0.6
                        ? '#ff9800'
                        : '#2196f3',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={formatPages(selectedCitation.pages)}
                    icon={<ScoreIcon fontSize="small" />}
                    sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                  />
                </Box>
              </Box>

              {/* Citation Text */}
              {selectedCitation.citation && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Citation Text:
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {selectedCitation.citation}
                  </Box>
                </Box>
              )}

              {/* Additional Details */}
              <List dense sx={{ p: 0 }}>
                {selectedCitation.chunkId && (
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon>
                      <BookmarkIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Chunk ID"
                      secondary={selectedCitation.chunkId}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                )}
                
                {selectedCitation.pageText && (
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon>
                      <ScoreIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Page Reference"
                      secondary={selectedCitation.pageText}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseDetails} variant="outlined" size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SourcePills;
