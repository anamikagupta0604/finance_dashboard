const router = require('express').Router();
const ctrl   = require('../controllers/dashboard.controller');
const { authenticate }    = require('../middleware/auth');
const { authorizeMinRole } = require('../middleware/rbac');

// All dashboard routes: viewer and above
router.use(authenticate, authorizeMinRole('viewer'));

// GET /api/dashboard                  — full combined payload
router.get('/',           ctrl.getFullDashboard);

// GET /api/dashboard/summary          — income / expenses / net balance
router.get('/summary',    ctrl.getSummary);

// GET /api/dashboard/categories       — category-wise totals
router.get('/categories', ctrl.getCategoryBreakdown);

// GET /api/dashboard/trends/monthly   — monthly income vs expenses
router.get('/trends/monthly', ctrl.getMonthlyTrends);

// GET /api/dashboard/trends/weekly    — weekly income vs expenses
router.get('/trends/weekly',  ctrl.getWeeklyTrends);

// GET /api/dashboard/recent           — recent transactions
router.get('/recent',     ctrl.getRecentActivity);

module.exports = router;