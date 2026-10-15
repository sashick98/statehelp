const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * 
 * Verifies the JSON Web Token (JWT) sent by the frontend in the
 * 'Authorization: Bearer <token>' header.
 * 
 * Pedagogical Data Flow:
 * React (Axios with Bearer Token)
 *  -> Express Route
 *  -> authMiddleware
 *      -> Verifies JWT signature
 *      -> Fetches active user record from MongoDB
 *      -> Attaches user to `req.user`
 *      -> Calls `next()` to hand off to controller
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_prototype_key';
    const decoded = jwt.verify(token, secret);

    // Fetch user and ensure account is still active
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated.',
      });
    }

    // Attach authenticated user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(`[Auth Middleware Error]: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

module.exports = { protect };
