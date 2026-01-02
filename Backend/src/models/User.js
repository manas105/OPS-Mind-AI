const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return;
  }
  
  console.log('Hashing password...');
  
  try {
    const salt = await bcrypt.genSalt(10);
    console.log('Salt generated');
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully, length:', this.password.length);
  } catch (error) {
    console.log('Error hashing password:', error);
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords:');
  console.log('Candidate password length:', candidatePassword.length);
  console.log('Stored password hash exists:', !!this.password);
  console.log('Stored password hash length:', this.password ? this.password.length : 0);
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password match result:', isMatch);
  
  return isMatch;
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
  console.log('Finding user by credentials for email:', email);
  console.log('Password provided length:', password.length);
  
  const user = await User.findOne({ email }).select('+password');
  console.log('User found:', !!user);
  
  if (!user) {
    console.log('User not found in database');
    throw new Error('Invalid login credentials');
  }
  
  console.log('User found, comparing passwords...');
  const isMatch = await user.comparePassword(password);
  console.log('Password comparison result:', isMatch);
  
  if (!isMatch) {
    console.log('Password comparison failed');
    throw new Error('Invalid login credentials');
  }
  
  console.log('Login successful for user:', email);
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
