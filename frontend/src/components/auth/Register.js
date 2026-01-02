import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Alert, 
  Paper,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Register = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { register, user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Register form submitted with:', { 
      name: formData.name, 
      email: formData.email, 
      password: '***',
      confirmPassword: '***'
    });
    
    // Frontend validation
    if (!formData.name.trim()) {
      console.log('❌ Name is required');
      return setError('Name is required');
    }
    
    if (!formData.email.trim()) {
      console.log('❌ Email is required');
      return setError('Email is required');
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('❌ Invalid email format');
      return setError('Please include a valid email');
    }
    
    if (formData.password.length < 8) {
      console.log('❌ Password too short');
      return setError('Password must be at least 8 characters long');
    }
    
    if (formData.password !== formData.confirmPassword) {
      console.log('❌ Passwords do not match');
      return setError('Passwords do not match');
    }
    
    if (!termsAccepted) {
      console.log('❌ Terms not accepted');
      return setError('You must accept the terms and conditions');
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('📞 Calling register function...');
      await register(formData.name, formData.email, formData.password);
      console.log('✅ Registration successful, navigating based on role...');
      
      // Redirect based on user role
      if (user?.role === 'admin') {
        onNavigate('admin');
      } else {
        onNavigate('chat');
      }
    } catch (err) {
      console.error('❌ Register form error:', err);
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create an Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              helperText="Password must be at least 8 characters long"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControlLabel
              control={
                <Checkbox 
                  value="terms" 
                  color="primary"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link 
                    component="button"
                    type="button"
                    onClick={() => alert('Terms of Service coming soon!')}
                    sx={{ cursor: 'pointer' }}
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link 
                    component="button"
                    type="button"
                    onClick={() => alert('Privacy Policy coming soon!')}
                    sx={{ cursor: 'pointer' }}
                  >
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mt: 2 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !termsAccepted}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => onNavigate('login')}
                  sx={{ cursor: 'pointer' }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link 
                component="button"
                type="button"
                variant="body2"
                onClick={() => onNavigate('landing')}
                sx={{ cursor: 'pointer' }}
              >
                ← Back to Home
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
