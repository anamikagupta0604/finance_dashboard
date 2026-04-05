const { body, query, param } = require('express-validator');

const VALID_CATEGORIES = [
  'Salary', 'Freelance', 'Investments', 'Rental Income', 'Consulting', 'Bonus',
  'Rent', 'Utilities', 'Groceries', 'Travel', 'Software', 'Marketing',
  'Salaries', 'Office Supplies', 'Healthcare', 'Other',
];

const createRules = [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.')
    .toFloat(),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be "income" or "expense".'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Category is required (max 80 chars).'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate(),
  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage('Notes must be under 500 characters.'),
];

const updateRules = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.')
    .toFloat(),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be "income" or "expense".'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Category must be 1–80 characters.'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date.')
    .toDate(),
  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage('Notes must be under 500 characters.'),
];

const listRules = [
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type filter.'),
  query('category').optional().trim().isLength({ max: 80 }),
  query('start_date').optional().isISO8601().withMessage('start_date must be YYYY-MM-DD.'),
  query('end_date').optional().isISO8601().withMessage('end_date must be YYYY-MM-DD.'),
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be ≥ 1.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be 1–100.'),
  query('sort').optional().isIn(['date', 'amount', 'created_at']).withMessage('Invalid sort field.'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc.'),
];

const idRule = [
  param('id').isUUID().withMessage('ID must be a valid UUID.'),
];

module.exports = { createRules, updateRules, listRules, idRule };