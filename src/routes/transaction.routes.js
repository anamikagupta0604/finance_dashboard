const router = require('express').Router();
const ctrl   = require('../controllers/transaction.controller');
const { authenticate }          = require('../middleware/auth');
const { authorize }             = require('../middleware/rbac');
const { validate }              = require('../middleware/validate');
const {
  createRules, updateRules, listRules, idRule,
} = require('../validators/transaction.validators');

// All transaction routes require authentication
router.use(authenticate);

// GET  /api/transactions              — viewer, analyst, admin
router.get('/',    listRules, validate, ctrl.listTransactions);

// GET  /api/transactions/:id          — viewer, analyst, admin
router.get('/:id', idRule, validate, ctrl.getTransaction);

// POST /api/transactions              — admin, analyst
router.post('/',    authorize('admin', 'analyst'), createRules, validate, ctrl.createTransaction);

// PATCH /api/transactions/:id         — admin, analyst
router.patch('/:id', authorize('admin', 'analyst'), idRule, updateRules, validate, ctrl.updateTransaction);

// DELETE /api/transactions/:id        — admin only
router.delete('/:id', authorize('admin'), idRule, validate, ctrl.deleteTransaction);

module.exports = router;