const { body, param } = require('express-validator');

const updateUserRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Name must be 2–120 characters.'),
  body('role')
    .optional()
    .isIn(['admin', 'analyst', 'viewer'])
    .withMessage('Role must be admin, analyst, or viewer.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
];

const idRule = [
  param('id').isUUID().withMessage('ID must be a valid UUID.'),
];

module.exports = { updateUserRules, idRule };