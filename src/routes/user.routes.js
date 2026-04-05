const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { authenticate }             = require('../middleware/auth');
const { authorize }                = require('../middleware/rbac');
const { validate }                 = require('../middleware/validate');
const { updateUserRules, idRule }  = require('../validators/user.validators');

// All user management routes require authentication
router.use(authenticate);

// GET  /api/users          — admin only: list all users
router.get('/',     authorize('admin'), ctrl.listUsers);

// GET  /api/users/:id      — admin can see any user; others only themselves
router.get('/:id',  idRule, validate, (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
}, ctrl.getUser);

// PATCH /api/users/:id     — admin: any field; self: name + password
router.patch('/:id', idRule, updateUserRules, validate, ctrl.updateUser);

// DELETE /api/users/:id    — admin only
router.delete('/:id', authorize('admin'), idRule, validate, ctrl.deleteUser);

module.exports = router;