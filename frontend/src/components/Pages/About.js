import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  Fade,
  Slide,
} from '@mui/material';
import {
  LinkedIn,
  GitHub,
  Email,
  Code,
  Lightbulb,
  Psychology,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const GlassCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  padding: theme.spacing(4),
  transition: 'all 0.3s ease',
  height: '100%',
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
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
  },
}));

const About = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const skills = [
    {
      icon: <Code />,
      title: 'Full-Stack Development',
      description: 'React, Node.js, Python, and modern web technologies'
    },
    {
      icon: <Psychology />,
      title: 'AI & Machine Learning',
      description: 'Natural Language Processing, Vector Databases, and LLMs'
    },
    {
      icon: <Lightbulb />,
      title: 'Problem Solving',
      description: 'Creative solutions for complex technical challenges'
    },
  ];

  const experiences = [
    {
      title: 'OpsMind AI Founder & Lead Developer',
      period: '2026 - Present',
      description: 'Architecting and developing an AI-powered SOP management platform using React, Node.js, and vector databases'
    },
    {
      title: 'Full-Stack Developer',
      period: '2022 - 2026',
      description: 'Built scalable web applications with React, Node.js, and Python. Integrated AI/ML solutions for enterprise clients'
    },
    {
      title: 'B.Tech in Computer Science',
      period: '2022 - 2026',
      description: 'Graduated with specialization in Artificial Intelligence and Software Engineering from Assam Engineering College'
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
        color: 'white',
        py: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Fade in={isVisible} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              About Me
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Passionate about building intelligent solutions that make a difference
            </Typography>
          </Box>
        </Fade>

        {/* Profile Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Slide direction="left" in={isVisible} timeout={1000}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 200,
                    height: 200,
                    mx: 'auto',
                    mb: 3,
                    border: '4px solid rgba(102, 126, 234, 0.5)',
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                  }}
                  src="/profile.jpg"
                />
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Manas
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  Founder & Full-Stack Developer
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    href="https://linkedin.com/in/manash-seal-3b1a25207/"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'white' } }}
                  >
                    <LinkedIn />
                  </Button>
                  <Button
                    href="https://github.com/manas105/OPS-Mind-AI.git"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'white' } }}
                  >
                    <GitHub />
                  </Button>
                  <Button
                    href="mailto:manashseal115@gmail.com"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'white' } }}
                  >
                    <Email />
                  </Button>
                </Box>
              </Box>
            </Slide>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Slide direction="right" in={isVisible} timeout={1000}>
              <GlassCard>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Hello! I'm Manas 👋
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
                  I'm a passionate full-stack developer and AI enthusiast with a strong focus on building 
                  intelligent solutions that solve real-world problems. My journey in tech started with a 
                  curiosity about how things work and evolved into a career dedicated to creating innovative 
                  applications that leverage the power of artificial intelligence.
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
                  Currently, I'm building OpsMind AI, an AI-powered platform designed to revolutionize 
                  how organizations manage their Standard Operating Procedures (SOPs). The platform combines 
                  advanced natural language processing, vector databases, and modern web technologies to 
                  create an intelligent knowledge management system.
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  When I'm not coding, you can find me exploring new AI technologies, contributing to 
                  open-source projects, or sharing my knowledge with the developer community.
                </Typography>
              </GlassCard>
            </Slide>
          </Grid>
        </Grid>

        {/* Skills Section */}
        <Box sx={{ mb: 8 }}>
          <Fade in={isVisible} timeout={1200}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                fontWeight: 700,
                mb: 6,
                background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Skills & Expertise
            </Typography>
          </Fade>
          <Grid container spacing={4}>
            {skills.map((skill, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Fade in={isVisible} timeout={1400 + index * 200}>
                  <GlassCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        {skill.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {skill.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {skill.description}
                    </Typography>
                  </GlassCard>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Experience Section */}
        <Box sx={{ mb: 8 }}>
          <Fade in={isVisible} timeout={1600}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                fontWeight: 700,
                mb: 6,
                background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Experience & Education
            </Typography>
          </Fade>
          <Grid container spacing={4}>
            {experiences.map((exp, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Fade in={isVisible} timeout={1800 + index * 200}>
                  <GlassCard>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {exp.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(102, 126, 234, 0.8)', mb: 2 }}>
                      {exp.period}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {exp.description}
                    </Typography>
                  </GlassCard>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center' }}>
          <Fade in={isVisible} timeout={2000}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Let's Connect!
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
                I'm always open to discussing new opportunities, collaborations, or just having a chat about technology.
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                <GradientButton onClick={() => onNavigate('contact')}>
                  Get in Touch
                </GradientButton>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  onClick={() => onNavigate('landing')}
                >
                  Back to Home
                </Button>
              </Box>
            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
};

export default About;
