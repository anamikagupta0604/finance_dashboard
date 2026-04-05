const { query } = require('../config/database');

const SAFE_COLS = `
  t.id, t.amount, t.type, t.category, t.date, t.notes,
  t.created_at, t.updated_at,
  json_build_object('id', u.id, 'name', u.name) AS created_by
`;

/**
 * Create a new financial transaction.
 */
async function createTransaction({ amount, type, category, date, notes }, userId) {
  const { rows } = await query(
    `INSERT INTO transactions (amount, type, category, date, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, amount, type, category, date, notes, created_at`,
    [amount, type, category, date, notes || null, userId]
  );
  return rows[0];
}

/**
 * List transactions with filtering, sorting, and pagination.
 * Soft-deleted records are automatically excluded.
 */
async function listTransactions({ type, category, start_date, end_date, page = 1, limit = 20, sort = 'date', order = 'desc' }) {
  const ALLOWED_SORT  = { date: 't.date', amount: 't.amount', created_at: 't.created_at' };
  const ALLOWED_ORDER = { asc: 'ASC', desc: 'DESC' };

  const sortCol   = ALLOWED_SORT[sort]   || 't.date';
  const sortOrder = ALLOWED_ORDER[order] || 'DESC';

  const conditions = ['t.deleted_at IS NULL'];
  const params = [];

  if (type) {
    params.push(type);
    conditions.push(`t.type = $${params.length}`);
  }
  if (category) {
    params.push(`%${category}%`);
    conditions.push(`t.category ILIKE $${params.length}`);
  }
  if (start_date) {
    params.push(start_date);
    conditions.push(`t.date >= $${params.length}`);
  }
  if (end_date) {
    params.push(end_date);
    conditions.push(`t.date <= $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const [countRes, dataRes] = await Promise.all([
    query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, params),
    query(
      `SELECT ${SAFE_COLS}
       FROM transactions t
       JOIN users u ON u.id = t.created_by
       WHERE ${where}
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
  ]);

  return {
    transactions: dataRes.rows,
    total:        parseInt(countRes.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
  };
}

/**
 * Get a single transaction by ID (excluding soft-deleted).
 */
async function getTransactionById(id) {
  const { rows } = await query(
    `SELECT ${SAFE_COLS}
     FROM transactions t
     JOIN users u ON u.id = t.created_by
     WHERE t.id = $1 AND t.deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Update a transaction (partial update).
 */
async function updateTransaction(id, updates, userId) {
  const existing = await getTransactionById(id);
  if (!existing) return null;

  const allowed = {};
  if (updates.amount   !== undefined) allowed.amount   = updates.amount;
  if (updates.type     !== undefined) allowed.type     = updates.type;
  if (updates.category !== undefined) allowed.category = updates.category;
  if (updates.date     !== undefined) allowed.date     = updates.date;
  if (updates.notes    !== undefined) allowed.notes    = updates.notes;

  if (!Object.keys(allowed).length) {
    const err = new Error('No valid fields provided for update.');
    err.statusCode = 400;
    throw err;
  }

  allowed.updated_by = userId;

  const setClauses = Object.keys(allowed).map((k, i) => `${k} = $${i + 1}`);
  const values     = [...Object.values(allowed), id];

  const { rows } = await query(
    `UPDATE transactions SET ${setClauses.join(', ')}
     WHERE id = $${values.length} AND deleted_at IS NULL
     RETURNING id, amount, type, category, date, notes, updated_at`,
    values
  );
  return rows[0] || null;
}

/**
 * Soft-delete a transaction.
 */
async function deleteTransaction(id) {
  const { rows } = await query(
    `UPDATE transactions SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  );
  return rows.length > 0;
}

module.exports = { createTransaction, listTransactions, getTransactionById, updateTransaction, deleteTransaction };