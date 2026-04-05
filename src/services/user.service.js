const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const SAFE_COLUMNS = 'id, name, email, role, status, created_at, updated_at';

/**
 * List all users (admin only). Supports role/status filter.
 */
async function listUsers({ role, status, page = 1, limit = 20 }) {
  const conditions = ['1=1'];
  const params = [];

  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const [countRes, dataRes] = await Promise.all([
    query(`SELECT COUNT(*) FROM users WHERE ${conditions.join(' AND ')}`, params.slice(0, -2)),
    query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    ),
  ]);

  return {
    users: dataRes.rows,
    total: parseInt(countRes.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
  };
}

/**
 * Get a single user by ID.
 */
async function getUserById(id) {
  const { rows } = await query(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Update user fields. Admin can change role/status; users can change own name/password.
 */
async function updateUser(id, updates, requestingUser) {
  const allowed = {};

  // Admins can update role and status
  if (requestingUser.role === 'admin') {
    if (updates.role   !== undefined) allowed.role   = updates.role;
    if (updates.status !== undefined) allowed.status = updates.status;
  }

  // Name can be updated by the user themselves or admin
  if (updates.name !== undefined && (requestingUser.id === id || requestingUser.role === 'admin')) {
    allowed.name = updates.name;
  }

  // Password can be updated by the user themselves
  if (updates.password !== undefined && requestingUser.id === id) {
    allowed.password_hash = await bcrypt.hash(updates.password, 10);
  }

  if (!Object.keys(allowed).length) {
    const err = new Error('No valid fields to update.');
    err.statusCode = 400;
    throw err;
  }

  const setClauses = Object.keys(allowed).map((k, i) => `${k} = $${i + 1}`);
  const values     = [...Object.values(allowed), id];

  const { rows } = await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING ${SAFE_COLUMNS}`,
    values
  );
  return rows[0] || null;
}

/**
 * Delete a user (hard delete — admin only).
 * Prevents self-deletion.
 */
async function deleteUser(id, requestingUser) {
  if (id === requestingUser.id) {
    const err = new Error('You cannot delete your own account.');
    err.statusCode = 400;
    throw err;
  }
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listUsers, getUserById, updateUser, deleteUser };