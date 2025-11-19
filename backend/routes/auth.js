const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const knex = require('../config/database');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Helper function to generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Register a new user
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
  const { full_name, email, password, phone, user_type = 'student' } = req.body;

  try {
    // Check if user already exists
    const existingUser = await knex('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'AUTH_004',
          message: 'Email already registered',
        },
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await knex('users')
      .insert({
        id: uuidv4(),
        full_name,
        email,
        password_hash,
        phone,
        user_type,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'full_name', 'email', 'user_type', 'profile_photo_url']);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // Store refresh token
    await knex('refresh_tokens').insert({
      id: uuidv4(),
      user_id: newUser.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: new Date(),
    });

    // Remove sensitive data from response
    const { id, full_name: name, email: userEmail, user_type: type, profile_photo_url } = newUser;

    res.status(201).json({
      success: true,
      data: {
        user: {
          id,
          full_name: name,
          email: userEmail,
          user_type: type,
          profile_photo_url,
        },
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
      },
    });
  }
});

// Login user
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'AUTH_001',
          message: 'Invalid credentials',
        },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'AUTH_001',
          message: 'Invalid credentials',
        },
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    await knex('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: new Date(),
    });

    // Remove sensitive data from response
    const { id, full_name, user_type, profile_photo_url } = user;

    res.json({
      success: true,
      data: {
        user: {
          id,
          full_name,
          email,
          user_type,
          profile_photo_url,
        },
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
      },
    });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      error: {
        code: 'AUTH_005',
        message: 'Refresh token required',
      },
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists and is not revoked
    const tokenRecord = await knex('refresh_tokens')
      .where({
        token: refreshToken,
        user_id: decoded.userId,
        is_revoked: false,
      })
      .andWhere('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      return res.status(401).json({
        error: {
          code: 'AUTH_006',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    // Get user
    const user = await knex('users').where({ id: decoded.userId }).first();
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'AUTH_002',
          message: 'User not found',
        },
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    // Revoke old refresh token
    await knex('refresh_tokens')
      .where({ id: tokenRecord.id })
      .update({
        is_revoked: true,
        revoked_at: new Date(),
        updated_at: new Date(),
      });

    // Store new refresh token
    await knex('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: newRefreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: new Date(),
    });

    const { id, full_name, email, user_type, profile_photo_url } = user;

    res.json({
      success: true,
      data: {
        user: {
          id,
          full_name,
          email,
          user_type,
          profile_photo_url,
        },
        token: accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: {
        code: 'AUTH_006',
        message: 'Invalid or expired refresh token',
      },
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      // Revoke refresh token
      await knex('refresh_tokens')
        .where({ token: refreshToken })
        .update({
          is_revoked: true,
          revoked_at: new Date(),
          updated_at: new Date(),
        });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;