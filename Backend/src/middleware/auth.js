const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware that verifies JWT token
 */
const auth = {
  // Verify token and attach user to request
  required: async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      
      // Find user and attach to request
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
  },

  // Optional authentication - attaches user if token is valid
  optional: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          req.user = user;
        }
      }
      
      next();
    } catch (error) {
      // If there's an error, just continue without user
      next();
    }
  },

  // Role-based access control
  hasRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      if (!Array.isArray(roles)) {
        roles = [roles];
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }

      next();
    };
  }
};

module.exports = auth;
