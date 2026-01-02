import React, { useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Link,
  Paper,
  Grid,
  Stack,
  Fade,
  Slide,
  Zoom
} from '@mui/material';
import {
  Psychology,
  Speed,
  AdminPanelSettings,
  GitHub,
  CloudUpload,
  Security,
  Analytics,
  AutoAwesome
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import SpacetimeGrid from './SpacetimeGrid';

// Animations
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const twinkleAnimation = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Styled components
const Star = styled(Box)(({ delay, size, left, top, twinkle }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: 'white',
  left: left,
  top: top,
  animation: `${twinkle ? 'twinkle' : 'float'} ${twinkle ? '3s' : '6s'} ease-in-out infinite`,
  animationDelay: delay,
  boxShadow: '0 0 4px rgba(255, 255, 255, 0.8), 0 0 8px rgba(255, 255, 255, 0.4)',
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  padding: theme.spacing(4),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-10px)',
    background: 'rgba(255, 255, 255, 0.15)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '12px 32px',
  fontSize: '1.1rem',
  fontWeight: 600,
  borderRadius: 50,
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: `${shimmerAnimation} 2s infinite`,
  },
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
  },
}));

const OutlineButton = styled(Button)(({ theme }) => ({
  borderColor: 'rgba(255, 255, 255, 0.5)',
  color: 'white',
  padding: '12px 32px',
  fontSize: '1.1rem',
  fontWeight: 600,
  borderRadius: 50,
  textTransform: 'none',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    transform: 'translateY(-3px)',
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '& svg': {
    fontSize: 32,
    color: 'white',
  },
}));

const Landing = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stars = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    twinkle: Math.random() > 0.5,
  }));

  const features = [
    {
      icon: <Psychology />,
      title: 'AI-Powered Intelligence',
      description: 'Advanced natural language processing for intelligent conversations and accurate responses'
    },
    {
      icon: <CloudUpload />,
      title: 'Document Management',
      description: 'Upload and manage PDF documents with automatic chunking and vector indexing'
    },
    {
      icon: <Speed />,
      title: 'Lightning Fast',
      description: 'Optimized performance with sub-second response times for seamless user experience'
    },
    {
      icon: <Security />,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with encrypted data storage and secure authentication'
    },
    {
      icon: <Analytics />,
      title: 'Advanced Analytics',
      description: 'Comprehensive admin dashboard with usage metrics, document analytics, and insights'
    },
    {
      icon: <AutoAwesome />,
      title: 'Smart Search',
      description: 'Vector-based semantic search that understands context and delivers relevant results'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Spacetime Grid Background */}
      <SpacetimeGrid />
      
      {/* Distant Stars */}
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}

      {/* Navigation Header */}
      <Box
        sx={{
          p: 3,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Zoom in={isVisible} timeout={800}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  OM
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    fontSize: { xs: '1.5rem', md: '2rem' },
                  }}
                >
                  OpsMind AI
                </Typography>
              </Box>
            </Zoom>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 2, flex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Slide direction="right" in={isVisible} timeout={1000}>
              <Box>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    color: 'white',
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    mb: 2,
                    lineHeight: 1.1,
                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  A Neural Brain Built for
                  <br />
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Enterprise SOP
                  </Box>
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 4 }}>
                  <Fade in={isVisible} timeout={1200}>
                    <GradientButton onClick={() => onNavigate('login')}>
                      Get Started
                    </GradientButton>
                  </Fade>
                  <Fade in={isVisible} timeout={1400}>
                    <OutlineButton onClick={() => onNavigate('register')}>
                      Create Account
                    </OutlineButton>
                  </Fade>
                </Box>
              </Box>
            </Slide>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Slide direction="left" in={isVisible} timeout={1000}>
              <Box>
                <GlassCard>
                  <Typography variant="h5" sx={{ color: 'white', mb: 4, textAlign: 'center', fontWeight: 700 }}>
                    Powerful Features
                  </Typography>
                  <Grid container spacing={3}>
                    {features.slice(0, 3).map((feature, index) => (
                      <Grid size={{ xs: 12 }} key={index}>
                        <Fade in={isVisible} timeout={1600 + index * 200}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                            <FeatureIcon>
                              {feature.icon}
                            </FeatureIcon>
                            <Box>
                              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                                {feature.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                {feature.description}
                              </Typography>
                            </Box>
                          </Box>
                        </Fade>
                      </Grid>
                    ))}
                  </Grid>
                </GlassCard>
              </Box>
            </Slide>
          </Grid>
        </Grid>

        {/* Features Grid */}
        <Box sx={{ mt: 12, mb: 8 }}>
          <Fade in={isVisible} timeout={1800}>
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                textAlign: 'center',
                mb: 6,
                fontWeight: 700,
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              Everything You Need
            </Typography>
          </Fade>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Fade in={isVisible} timeout={2000 + index * 150}>
                  <GlassCard sx={{ height: '100%' }}>
                    <FeatureIcon>
                      {feature.icon}
                    </FeatureIcon>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </GlassCard>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          py: 6,
          position: 'relative',
          zIndex: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'white',
                  }}
                >
                  OM
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                  OpsMind AI
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                © 2024 OpsMind AI. All rights reserved.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Link
                  href="https://github.com/manas105/opsmind-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textDecoration: 'none',
                    '&:hover': {
                      color: 'white',
                    },
                  }}
                >
                  <GitHub />
                  <span>GitHub</span>
                </Link>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Button
                  color="inherit"
                  sx={{
                    textTransform: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    justifyContent: 'flex-start',
                    '&:hover': { color: 'white' },
                  }}
                >
                  About Us
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    textTransform: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    justifyContent: 'flex-start',
                    '&:hover': { color: 'white' },
                  }}
                >
                  Contact
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    textTransform: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    justifyContent: 'flex-start',
                    '&:hover': { color: 'white' },
                  }}
                >
                  Privacy Policy
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
              Built with ❤️ by OpsMind Team
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
