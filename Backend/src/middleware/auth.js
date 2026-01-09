const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware that verifies JWT token
 */
const auth = {
  // Verify token and attach user to request
  required: async (req, res, next) => {
    try {
      console.log('Auth middleware - checking token');
      // Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        console.log('Auth middleware - no token found');
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      console.log('Auth middleware - token found, verifying');
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      console.log('Auth middleware - token verified, user ID:', decoded.userId);
      
      // Find user and attach to request
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('Auth middleware - user not found');
        return res.status(401).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      console.log('Auth middleware - user found:', user.email, 'role:', user.role);
      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      console.error('Auth error stack:', error.stack);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
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
      try {
        console.log('Role check - user role:', req.user?.role, 'required roles:', roles);
        
        if (!req.user) {
          console.log('Role check - no user found');
          return res.status(401).json({ 
            success: false, 
            error: 'Authentication required' 
          });
        }

        if (!Array.isArray(roles)) {
          roles = [roles];
        }

        if (!roles.includes(req.user.role)) {
          console.log('Role check - insufficient permissions');
          return res.status(403).json({ 
            success: false, 
            error: 'Insufficient permissions' 
          });
        }

        console.log('Role check - passed');
        next();
      } catch (error) {
        console.error('Role check error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Error checking permissions' 
        });
      }
    };
  }
};

module.exports = auth;
