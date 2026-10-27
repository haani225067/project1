const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates the JWT Bearer token and attaches the authenticated user to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1].trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
        data: null,
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Fetch user from DB to verify account still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
        data: null,
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired. Please log in again.',
        data: null,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      data: null,
    });
  }
};

module.exports = {
  protect,
};
