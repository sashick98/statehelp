const User = require('../models/User');

/**
 * Auth Controller
 * 
 * Educational Concept:
 * 1. User Registration:
 *    - Validates inputs via express-validator.
 *    - Checks for existing email or mobile in MongoDB.
 *    - Creates User (User.js pre-save hook handles bcrypt password hashing).
 *    - Generates JWT token and sends safe user profile (excluding password).
 * 
 * 2. User Login:
 *    - Queries user including password (`.select('+password')`).
 *    - Invokes `user.comparePassword(password)`.
 *    - Returns signed JWT token.
 */

// @desc    Register new citizen
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, mobile, email, password, district } = req.body;

    // Check if email or mobile is already in use
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: 'An account with this mobile number already exists.',
      });
    }

    // Create user (default role: 'citizen')
    const user = await User.create({
      name,
      mobile,
      email,
      password,
      district: district || '',
      role: 'citizen',
    });

    // Generate JWT
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        district: user.district,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select hidden password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact portal administration.',
      });
    }

    // Validate password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        district: user.district,
        role: user.role,
        departmentId: user.departmentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('departmentId', 'name nameTamil code');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        district: user.district,
        role: user.role,
        department: user.departmentId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (stateless JWT acknowledgment)
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear client-side token.',
  });
};

module.exports = { register, login, getMe, logout };
