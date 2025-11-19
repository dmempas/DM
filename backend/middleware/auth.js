const jwt = require('jsonwebtoken');
const knex = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication token required');
      error.statusCode = 401;
      error.code = 'AUTH_001';
      throw error;
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await knex('users')
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      error.code = 'AUTH_002';
      throw error;
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      profile_photo_url: user.profile_photo_url,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.code = 'AUTH_001';
      error.message = 'Invalid authentication token';
    } else if (error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.code = 'AUTH_003';
      error.message = 'Authentication token has expired';
    }

    return res.status(error.statusCode || 500).json({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Authentication failed',
      },
    });
  }
};

// Admin authorization middleware
const adminAuth = (req, res, next) => {
  if (!req.user || !['admin', 'staff'].includes(req.user.user_type)) {
    return res.status(403).json({
      error: {
        code: 'PERMISSION_001',
        message: 'Access denied. Admin privileges required.',
      },
    });
  }
  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await knex('users')
      .where({ id: decoded.userId })
      .first();

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        profile_photo_url: user.profile_photo_url,
      };
    }

    next();
  } catch (error) {
    // Optional auth - we don't fail if token is invalid
    next();
  }
};

module.exports = {
  authMiddleware,
  adminAuth,
  optionalAuth,
};