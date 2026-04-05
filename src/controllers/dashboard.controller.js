const dashboardService = require('../services/dashboard.service');

async function getFullDashboard(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const data = await dashboardService.getFullDashboard({ start_date, end_date });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getSummary(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const data = await dashboardService.getSummary({ start_date, end_date });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getCategoryBreakdown(req, res, next) {
  try {
    const { type, start_date, end_date } = req.query;
    const data = await dashboardService.getCategoryBreakdown({ type, start_date, end_date });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getMonthlyTrends(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 12;
    if (months < 1 || months > 36) {
      return res.status(400).json({ success: false, message: 'months must be between 1 and 36.' });
    }
    const data = await dashboardService.getMonthlyTrends({ months });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getWeeklyTrends(req, res, next) {
  try {
    const weeks = parseInt(req.query.weeks) || 12;
    if (weeks < 1 || weeks > 52) {
      return res.status(400).json({ success: false, message: 'weeks must be between 1 and 52.' });
    }
    const data = await dashboardService.getWeeklyTrends({ weeks });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getRecentActivity(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const data  = await dashboardService.getRecentActivity({ limit });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

module.exports = {
  getFullDashboard,
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
};