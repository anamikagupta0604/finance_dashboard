const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate }               = require('../middleware/auth');
const { authorize }                  = require('../middleware/rbac');
const { validate }                   = require('../middleware/validate');
const { loginRules, registerRules }  = require('../validators/auth.validators');

// POST /api/auth/login
router.post('/login', loginRules, validate, ctrl.login);

// POST /api/auth/register  — admin only
router.post('/register', authenticate, authorize('admin'), registerRules, validate, ctrl.register);

// GET  /api/auth/me
router.get('/me', authenticate, ctrl.getProfile);

module.exports = router;