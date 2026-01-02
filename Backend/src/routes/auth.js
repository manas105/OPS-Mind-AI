const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail()
      .withMessage('Please include a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { name, email, password } = req.body;
      console.log('Registration attempt for:', { email, name });

      try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
          console.log('Registration failed - user already exists:', email);
          return res.status(400).json({
            success: false,
            error: 'User already exists'
          });
        }

        // Create new user
        const isFirstUser = (await User.countDocuments({})) === 0;
        user = new User({
          name,
          email,
          password,
          role: isFirstUser ? 'admin' : 'user' // First user is admin
        });

        await user.save();
        console.log('User created successfully:', { 
          userId: user._id, 
          email: user.email,
          role: user.role 
        });

        // Generate token
        const token = user.generateAuthToken();
        console.log('Auth token generated for user:', user.email);

        return res.status(201).json({
          success: true,
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });

      } catch (error) {
        console.error('Error during registration:', {
          message: error.message,
          name: error.name,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        
        // Handle specific errors
        if (error.name === 'ValidationError') {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: Object.values(error.errors).map(e => e.message)
          });
        }
        
        if (error.code === 11000) { // Duplicate key error
          return res.status(400).json({
            success: false,
            error: 'Email already exists'
          });
        }
        
        // Generic error response
        throw error; // Will be caught by the outer catch
      }
    } catch (error) {
      console.error('Registration failed with error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message
        })
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please include a valid email')
      .normalizeEmail(),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Find user by credentials
      const user = await User.findByCredentials(email, password);
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = user.generateAuthToken();

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferences: user.preferences
        }
      });
    } catch (error) {
      console.error('Error in user login:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Invalid credentials'
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth.required, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

/**
 * @route   PUT /api/auth/me
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/me',
  auth.required,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please include a valid email')
      .normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const updates = Object.keys(req.body);
      const allowedUpdates = ['name', 'email', 'password', 'preferences'];
      const isValidOperation = updates.every(update => 
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          error: 'Invalid updates!'
        });
      }

      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Update user fields
      updates.forEach(update => {
        if (update === 'password' && req.body.password) {
          // Password will be hashed by the pre-save hook
          user[update] = req.body[update];
        } else if (update === 'preferences' && req.body.preferences) {
          // Merge preferences
          user.preferences = { ...user.preferences, ...req.body.preferences };
        } else if (update !== 'password') {
          user[update] = req.body[update];
        }
      });

      await user.save();
      
      // Generate new token if email was changed
      const token = updates.includes('email') ? user.generateAuthToken() : undefined;

      const response = {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferences: user.preferences
        }
      };

      if (token) {
        response.token = token;
      }

      res.json(response);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(400).json({
        success: false,
        error: 'Error updating profile'
      });
    }
  }
);

module.exports = router;
