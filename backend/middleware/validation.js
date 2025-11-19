const { body, validationResult } = require('express-validator');

// Validation rules for registration
const validateRegistration = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one digit'),

  body('user_type')
    .optional()
    .isIn(['student', 'admin', 'staff'])
    .withMessage('User type must be student, admin, or staff'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
];

// Validation rules for login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Validation rules for item creation
const validateItemCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),

  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),

  body('item_type')
    .isIn(['lost', 'found'])
    .withMessage('Item type must be either lost or found'),

  body('category')
    .isIn(['gadgets', 'school_supplies', 'ids', 'wallets', 'clothes', 'other'])
    .withMessage('Please select a valid category'),

  body('last_location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

// Validation rules for claim creation
const validateClaimCreation = [
  body('item_id')
    .isUUID()
    .withMessage('Invalid item ID'),

  body('verification_answers')
    .optional()
    .isObject()
    .withMessage('Verification answers must be an object'),
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
        })),
      },
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateItemCreation,
  validateClaimCreation,
  handleValidationErrors,
};