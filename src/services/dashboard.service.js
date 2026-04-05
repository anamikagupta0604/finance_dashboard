const { query } = require('../config/database');

/**
 * Base WHERE clause reused across all aggregation queries.
 * Accepts optional date range filters.
 */
function buildDateFilter(params, start_date, end_date) {
  const conds = ['deleted_at IS NULL'];
  if (start_date) { params.push(start_date); conds.push(`date >= $${params.length}`); }
  if (end_date)   { params.push(end_date);   conds.push(`date <= $${params.length}`); }
  return conds.join(' AND ');
}

/**
 * Top-level summary: total income, total expenses, net balance.
 */
async function getSummary({ start_date, end_date } = {}) {
  const params = [];
  const where  = buildDateFilter(params, start_date, end_date);

  const { rows } = await query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0) AS total_income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expenses,
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0)
         - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS net_balance,
       COUNT(*)                                                     AS total_transactions,
       COUNT(*) FILTER (WHERE type = 'income')                      AS income_count,
       COUNT(*) FILTER (WHERE type = 'expense')                     AS expense_count
     FROM transactions
     WHERE ${where}`,
    params
  );
  return rows[0];
}

/**
 * Category-wise breakdown, sorted by total descending.
 */
async function getCategoryBreakdown({ type, start_date, end_date } = {}) {
  const params = [];
  const conds  = ['deleted_at IS NULL'];
  if (type)       { params.push(type);       conds.push(`type = $${params.length}`); }
  if (start_date) { params.push(start_date); conds.push(`date >= $${params.length}`); }
  if (end_date)   { params.push(end_date);   conds.push(`date <= $${params.length}`); }

  const { rows } = await query(
    `SELECT
       category,
       type,
       COUNT(*)       AS transaction_count,
       SUM(amount)    AS total,
       AVG(amount)    AS average,
       MIN(amount)    AS min_amount,
       MAX(amount)    AS max_amount
     FROM transactions
     WHERE ${conds.join(' AND ')}
     GROUP BY category, type
     ORDER BY total DESC`,
    params
  );
  return rows;
}

/**
 * Monthly trend — income vs expenses per month for the last N months.
 */
async function getMonthlyTrends({ months = 12 } = {}) {
  const { rows } = await query(
    `SELECT
       TO_CHAR(date, 'YYYY-MM')                                      AS month,
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0)      AS income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)      AS expenses,
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0)
         - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)  AS net
     FROM transactions
     WHERE deleted_at IS NULL
       AND date >= DATE_TRUNC('month', NOW()) - INTERVAL '${parseInt(months) - 1} months'
     GROUP BY month
     ORDER BY month ASC`,
    []
  );
  return rows;
}

/**
 * Weekly trend — last N weeks.
 */
async function getWeeklyTrends({ weeks = 12 } = {}) {
  const { rows } = await query(
    `SELECT
       TO_CHAR(DATE_TRUNC('week', date), 'YYYY-MM-DD')               AS week_start,
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0)      AS income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)      AS expenses,
       COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0)
         - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)  AS net
     FROM transactions
     WHERE deleted_at IS NULL
       AND date >= DATE_TRUNC('week', NOW()) - INTERVAL '${parseInt(weeks) - 1} weeks'
     GROUP BY week_start
     ORDER BY week_start ASC`,
    []
  );
  return rows;
}

/**
 * Recent activity — last N transactions.
 */
async function getRecentActivity({ limit = 10 } = {}) {
  const { rows } = await query(
    `SELECT
       t.id, t.amount, t.type, t.category, t.date, t.notes, t.created_at,
       json_build_object('id', u.id, 'name', u.name) AS created_by
     FROM transactions t
     JOIN users u ON u.id = t.created_by
     WHERE t.deleted_at IS NULL
     ORDER BY t.created_at DESC
     LIMIT $1`,
    [Math.min(parseInt(limit), 50)]
  );
  return rows;
}

/**
 * Full dashboard payload combining all key metrics.
 */
async function getFullDashboard({ start_date, end_date } = {}) {
  const [summary, categoryBreakdown, monthlyTrends, recentActivity] = await Promise.all([
    getSummary({ start_date, end_date }),
    getCategoryBreakdown({ start_date, end_date }),
    getMonthlyTrends({ months: 6 }),
    getRecentActivity({ limit: 5 }),
  ]);

  return { summary, categoryBreakdown, monthlyTrends, recentActivity };
}

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getFullDashboard,
};