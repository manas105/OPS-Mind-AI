import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Fade,
  Slide,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  Security,
  Shield,
  Lock,
  Visibility,
  Gavel,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const GlassCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  padding: theme.spacing(4),
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(3),
  '&:hover': {
    transform: 'translateY(-5px)',
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

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px !important',
  marginBottom: theme.spacing(2),
  '&:before': {
    display: 'none',
  },
  '& .MuiAccordionSummary-root': {
    color: 'white',
    '& .MuiSvgIcon-root': {
      color: 'white',
    },
  },
  '& .MuiAccordionDetails-root': {
    color: 'rgba(255, 255, 255, 0.8)',
  },
}));

const PrivacyPolicy = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const privacySections = [
    {
      title: 'Information We Collect',
      icon: <Visibility />,
      content: [
        'Personal Information: Name, email address, and contact details when you register for our services',
        'Usage Data: Information about how you interact with our platform, including features used and time spent',
        'Document Content: PDF documents and other files you upload for processing and analysis',
        'Technical Data: IP address, browser type, device information, and access logs',
        'Communication Data: Messages and interactions with our AI assistant',
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: <Security />,
      content: [
        'Provide and maintain our AI-powered SOP management services',
        'Process and analyze uploaded documents to generate intelligent responses',
        'Improve our services through usage analytics and feedback',
        'Communicate with you regarding service updates and support',
        'Ensure platform security and prevent unauthorized access',
        'Comply with legal obligations and protect our rights',
      ],
    },
    {
      title: 'Data Security and Protection',
      icon: <Shield />,
      content: [
        'Encryption: All data is encrypted both in transit and at rest using industry-standard protocols',
        'Access Controls: Strict authentication and authorization mechanisms to protect user data',
        'Regular Audits: Security assessments and penetration testing to identify vulnerabilities',
        'Data Minimization: We collect only the information necessary to provide our services',
        'Secure Storage: Documents are stored in secure cloud infrastructure with redundancy',
      ],
    },
    {
      title: 'Data Sharing and Third Parties',
      icon: <Lock />,
      content: [
        'We do not sell your personal information to third parties',
        'Service Providers: We may share data with trusted service providers for infrastructure and support',
        'Legal Requirements: We may disclose information if required by law or to protect our rights',
        'Business Transfers: In case of merger, acquisition, or sale of assets, user data may be transferred',
        'Analytics: We use anonymized, aggregated data for service improvement and analytics',
      ],
    },
    {
      title: 'Your Rights and Choices',
      icon: <Gavel />,
      content: [
        'Access: Request access to your personal data and information about how it\'s used',
        'Correction: Update or correct inaccurate personal information',
        'Deletion: Request deletion of your account and associated data',
        'Portability: Request a copy of your data in a machine-readable format',
        'Opt-out: Unsubscribe from marketing communications and certain data processing activities',
      ],
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
              Privacy Policy
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 2 }}>
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Fade>

        {/* Introduction */}
        <Slide direction="up" in={isVisible} timeout={1000}>
          <GlassCard>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Our Commitment to Privacy
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
              At OpsMind AI, we are committed to protecting your privacy and ensuring the security of your data. 
              This Privacy Policy explains how we collect, use, store, and protect your information when you use 
              our AI-powered SOP management platform.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              By using OpsMind AI, you agree to the collection and use of information in accordance with this policy. 
              We are dedicated to transparency and giving you control over your personal information.
            </Typography>
          </GlassCard>
        </Slide>

        {/* Privacy Sections */}
        <Box sx={{ mt: 6 }}>
          {privacySections.map((section, index) => (
            <Fade in={isVisible} timeout={1200 + index * 200} key={index}>
              <StyledAccordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {section.title}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {section.content.map((item, itemIndex) => (
                      <Typography
                        key={itemIndex}
                        component="li"
                        variant="body2"
                        sx={{ mb: 1, lineHeight: 1.6 }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </AccordionDetails>
              </StyledAccordion>
            </Fade>
          ))}
        </Box>

        {/* Additional Information */}
        <Slide direction="up" in={isVisible} timeout={2000}>
          <GlassCard>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Important Notes
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
              <strong>Data Retention:</strong> We retain your information only as long as necessary to provide our services 
              and comply with legal obligations. You can request deletion of your account and data at any time.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
              <strong>International Transfers:</strong> Your data may be processed and stored in secure data centers 
              outside your country. We ensure appropriate safeguards are in place for international data transfers.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 3 }}>
              <strong>Children's Privacy:</strong> Our services are not intended for children under 13. We do not 
              knowingly collect personal information from children under 13.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              <strong>Policy Updates:</strong> We may update this Privacy Policy from time to time. We will notify 
              you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </Typography>
          </GlassCard>
        </Slide>

        {/* Contact Section */}
        <Slide direction="up" in={isVisible} timeout={2200}>
          <GlassCard>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Questions About Your Privacy?
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 4 }}>
              If you have any questions about this Privacy Policy or how we handle your data, 
              please don't hesitate to contact us. We're here to help and will respond to your inquiries promptly.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <GradientButton onClick={() => onNavigate('contact')}>
                Contact Us
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
          </GlassCard>
        </Slide>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
