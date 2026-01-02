const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/admin/assign-role
 * @desc    Assign role to user (admin only)
 * @access  Admin only
 * @body    {string} email - User email
 * @body    {string} role - New role ('user' or 'admin')
 */
router.post(
  '/assign-role',
  auth.required,
  auth.hasRole('admin'),
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')
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

      const { email, role } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Update role
      const oldRole = user.role;
      user.role = role;
      await user.save();

      res.json({
        success: true,
        message: `Role updated from ${oldRole} to ${role} for ${email}`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign role'
      });
    }
  }
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with their roles (admin only)
 * @access  Admin only
 */
router.get('/users', auth.required, auth.hasRole('admin'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role createdAt lastLogin isActive')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * @route   POST /api/admin/toggle-user-status
 * @desc    Activate/deactivate user (admin only)
 * @access  Admin only
 * @body    {string} email - User email
 */
router.post(
  '/toggle-user-status',
  auth.required,
  auth.hasRole('admin'),
  [body('email').isEmail().withMessage('Valid email required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (req.user.email === email) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account'
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.json({
        success: true,
        message: `User ${email} ${user.isActive ? 'activated' : 'deactivated'}`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle user status'
      });
    }
  }
);

module.exports = router;
